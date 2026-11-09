'use strict';

const { Attachment, Card, List, Board, WorkspaceMember, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { ROLES, isAtLeast } = require('../constants/roles');
const { uploadFile, deleteFile } = require('../storage');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');

class AttachmentService {
  async _resolveCard(cardPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const card = await Card.findOne({
      where: { public_id: cardPublicId, deleted_at: null },
      include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
    });
    if (!card) throw AppError.notFound('Card not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: card.list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Card not found');

    return { card, board: card.list.board, user, membership };
  }

  /**
   * GET /cards/:cardId/attachments
   */
  async findAllInCard(cardPublicId, userPublicId) {
    const { card } = await this._resolveCard(cardPublicId, userPublicId);
    return Attachment.findAll({
      where: { card_id: card.id },
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'uploadedBy', attributes: ['public_id', 'name', 'avatar_url'] }],
    });
  }

  /**
   * POST /cards/:cardId/attachments
   * @param {Buffer} buffer - file buffer from multer
   * @param {object} fileInfo - { originalname, mimetype, size }
   */
  async upload(cardPublicId, userPublicId, buffer, fileInfo) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    // Upload to storage provider
    const { url, providerPublicId, provider } = await uploadFile(
      buffer,
      fileInfo.originalname,
      fileInfo.mimetype
    );

    const result = await sequelize.transaction(async (t) => {
      const attachment = await Attachment.create(
        {
          card_id: card.id,
          uploaded_by: user.id,
          filename: providerPublicId.split('/').pop(),
          original_name: fileInfo.originalname,
          mime_type: fileInfo.mimetype,
          file_size: fileInfo.size,
          url,
          provider,
          provider_public_id: providerPublicId,
        },
        { transaction: t }
      );

      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.ATTACHMENT_UPLOADED,
          entity_type: 'attachment',
          entity_id: attachment.id,
          after_state: { original_name: fileInfo.originalname, file_size: fileInfo.size, url },
        },
        { transaction: t }
      );

      return attachment;
    });

    return result;
  }

  /**
   * DELETE /attachments/:attachmentId
   */
  async delete(attachmentPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const attachment = await Attachment.findOne({
      where: { public_id: attachmentPublicId },
      include: [
        {
          model: Card,
          as: 'card',
          include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
        },
      ],
    });
    if (!attachment) throw AppError.notFound('Attachment not found');

    const board = attachment.card.list.board;
    const membership = await WorkspaceMember.findOne({ where: { workspace_id: board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Attachment not found');

    // Only uploader or admin can delete
    const isOwner = attachment.uploaded_by === user.id;
    const isAdmin = isAtLeast(membership.role, ROLES.ADMIN);
    if (!isOwner && !isAdmin) throw AppError.forbidden('Not authorized to delete this attachment');

    await sequelize.transaction(async (t) => {
      // Delete from storage first (best-effort)
      await deleteFile(attachment.provider_public_id, attachment.mime_type, attachment.provider);

      await attachment.destroy({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.ATTACHMENT_DELETED,
          entity_type: 'attachment',
          entity_id: attachment.id,
          before_state: { original_name: attachment.original_name },
        },
        { transaction: t }
      );
    });
  }
}

module.exports = new AttachmentService();
