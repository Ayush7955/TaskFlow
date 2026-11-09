module.exports = {
  // Client → Server
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  CARD_MOVE: 'card:move',
  CARD_CREATE: 'card:create',
  CARD_UPDATE: 'card:update',
  LIST_MOVE: 'list:move',
  LIST_CREATE: 'list:create',
  LIST_UPDATE: 'list:update',
  CARD_TYPING: 'card:typing',

  // Server → Client
  CARD_MOVED: 'card:moved',
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_DELETED: 'card:deleted',
  CARD_ARCHIVED: 'card:archived',
  LIST_CREATED: 'list:created',
  LIST_UPDATED: 'list:updated',
  LIST_MOVED: 'list:moved',
  LIST_DELETED: 'list:deleted',
  LIST_REBALANCED: 'list:rebalanced',
  BOARD_UPDATED: 'board:updated',
  BOARD_ARCHIVED: 'board:archived',
  PRESENCE_UPDATE: 'presence:update',
  NOTIFICATION_NEW: 'notification:new',
  SESSION_REVOKED: 'session:revoked',
  MEMBER_REMOVED: 'member:removed',
};

