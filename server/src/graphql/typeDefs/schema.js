'use strict';

const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ─── Enums ──────────────────────────────────────────────────────────────────

  enum BoardVisibility {
    private
    workspace
    public
  }

  enum BoardStatus {
    active
    archived
  }

  enum CardPriority {
    low
    medium
    high
    urgent
  }

  enum WorkspaceRole {
    owner
    admin
    member
  }

  # ─── Types ──────────────────────────────────────────────────────────────────

  type User {
    publicId: ID!
    name: String!
    email: String!
    avatarUrl: String
    isVerified: Boolean!
    createdAt: DateTime!
  }

  type Workspace {
    publicId: ID!
    name: String!
    slug: String!
    description: String
    logoUrl: String
    plan: String!
    owner: User!
    members: [WorkspaceMember!]!
    boards: [Board!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WorkspaceMember {
    user: User!
    role: WorkspaceRole!
    joinedAt: DateTime!
  }

  type Board {
    publicId: ID!
    name: String!
    description: String
    visibility: BoardVisibility!
    status: BoardStatus!
    backgroundColor: String
    coverImageUrl: String
    workspace: Workspace!
    creator: User!
    lists: [List!]!
    labels: [Label!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type List {
    publicId: ID!
    name: String!
    position: Float!
    color: String
    isArchived: Boolean!
    board: Board!
    cards: [Card!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Card {
    publicId: ID!
    title: String!
    description: String
    position: Float!
    priority: CardPriority!
    dueDate: DateTime
    startDate: DateTime
    isComplete: Boolean!
    isArchived: Boolean!
    estimatedHours: Int
    actualHours: Int
    list: List!
    board: Board!
    creator: User!
    assignees: [User!]!
    labels: [Label!]!
    checklists: [Checklist!]!
    attachments: [Attachment!]!
    comments: [Comment!]!
    checklistProgress: ChecklistProgress!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChecklistProgress {
    total: Int!
    completed: Int!
    percentage: Float!
  }

  type Label {
    publicId: ID!
    name: String!
    color: String!
    board: Board!
  }

  type Checklist {
    publicId: ID!
    title: String!
    position: Float!
    items: [ChecklistItem!]!
    card: Card!
    createdAt: DateTime!
  }

  type ChecklistItem {
    publicId: ID!
    content: String!
    isChecked: Boolean!
    position: Float!
    dueDate: DateTime
    assignee: User
    createdAt: DateTime!
  }

  type Attachment {
    publicId: ID!
    filename: String!
    originalName: String!
    mimeType: String!
    fileSize: Int!
    url: String!
    provider: String!
    uploadedBy: User!
    createdAt: DateTime!
  }

  type Comment {
    publicId: ID!
    content: String!
    isEdited: Boolean!
    author: User!
    card: Card!
    parent: Comment
    replies: [Comment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Notification {
    publicId: ID!
    type: String!
    title: String!
    body: String!
    data: JSON
    isRead: Boolean!
    readAt: DateTime
    createdAt: DateTime!
  }

  type AuditLog {
    id: ID!
    action: String!
    entityType: String!
    entityId: Int!
    actor: User!
    beforeState: JSON
    afterState: JSON
    createdAt: DateTime!
  }

  # ─── Pagination ──────────────────────────────────────────────────────────────

  type PageInfo {
    page: Int!
    perPage: Int!
    total: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type CardConnection {
    data: [Card!]!
    meta: PageInfo!
  }

  type NotificationConnection {
    data: [Notification!]!
    meta: PageInfo!
  }

  type AuditLogConnection {
    data: [AuditLog!]!
    meta: PageInfo!
  }

  # ─── Queries ─────────────────────────────────────────────────────────────────

  type Query {
    # Auth
    me: User!

    # Workspaces
    workspaces: [Workspace!]!
    workspace(slug: String!): Workspace!

    # Boards
    board(boardId: ID!): Board!
    boardPayload(boardId: ID!): Board!

    # Cards
    card(cardId: ID!): Card!
    cards(listId: ID!, page: Int, perPage: Int): CardConnection!

    # Notifications
    notifications(page: Int, perPage: Int): NotificationConnection!
    unreadNotificationCount: Int!

    # Audit
    auditLogs(workspaceId: ID!, page: Int, perPage: Int): AuditLogConnection!
  }

  # ─── Mutations ───────────────────────────────────────────────────────────────

  type Mutation {
    # Workspace
    createWorkspace(name: String!, description: String): Workspace!
    updateWorkspace(workspaceId: ID!, name: String, description: String): Workspace!
    deleteWorkspace(workspaceId: ID!, password: String!): Boolean!

    # Board
    createBoard(workspaceId: ID!, name: String!, description: String, visibility: BoardVisibility): Board!
    updateBoard(boardId: ID!, name: String, description: String, visibility: BoardVisibility, backgroundColor: String): Board!
    archiveBoard(boardId: ID!): Board!
    restoreBoard(boardId: ID!): Board!
    deleteBoard(boardId: ID!): Boolean!

    # List
    createList(boardId: ID!, name: String!, color: String): List!
    updateList(listId: ID!, name: String, color: String): List!
    archiveList(listId: ID!): List!
    unarchiveList(listId: ID!): List!
    deleteList(listId: ID!): Boolean!

    # Card
    createCard(listId: ID!, title: String!, description: String, priority: CardPriority, dueDate: DateTime, estimatedHours: Int): Card!
    updateCard(cardId: ID!, title: String, description: String, priority: CardPriority, dueDate: DateTime, isComplete: Boolean, estimatedHours: Int, actualHours: Int): Card!
    moveCard(cardId: ID!, listId: ID, position: Float!): Card!
    archiveCard(cardId: ID!): Card!
    unarchiveCard(cardId: ID!): Card!
    deleteCard(cardId: ID!): Boolean!

    # Card members
    assignMember(cardId: ID!, userId: ID!): Boolean!
    unassignMember(cardId: ID!, userId: ID!): Boolean!

    # Labels
    createLabel(boardId: ID!, name: String!, color: String!): Label!
    updateLabel(labelId: ID!, name: String, color: String): Label!
    deleteLabel(labelId: ID!): Boolean!
    addLabelToCard(cardId: ID!, labelId: ID!): Boolean!
    removeLabelFromCard(cardId: ID!, labelId: ID!): Boolean!

    # Checklists
    createChecklist(cardId: ID!, title: String!): Checklist!
    updateChecklist(checklistId: ID!, title: String!): Checklist!
    deleteChecklist(checklistId: ID!): Boolean!

    # Checklist items
    createChecklistItem(checklistId: ID!, content: String!, dueDate: DateTime): ChecklistItem!
    updateChecklistItem(itemId: ID!, content: String, isChecked: Boolean, dueDate: DateTime): ChecklistItem!
    deleteChecklistItem(itemId: ID!): Boolean!

    # Comments
    createComment(cardId: ID!, content: String!, parentId: ID): Comment!
    updateComment(commentId: ID!, content: String!): Comment!
    deleteComment(commentId: ID!): Boolean!

    # Notifications
    markNotificationRead(notificationId: ID!): Notification!
    markAllNotificationsRead: Boolean!
  }

  # ─── Subscriptions (via Socket.io, not WS subscription) ──────────────────
`;

module.exports = typeDefs;

