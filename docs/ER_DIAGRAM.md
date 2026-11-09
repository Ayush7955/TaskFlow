# Database Schema — Entity Relationship Diagram

TaskFlow uses **MySQL 8** with **Sequelize 6**. All tables use `BIGINT UNSIGNED AUTO_INCREMENT` as internal primary key and `CHAR(36)` UUID v4 as the public-facing identifier.

## ER Diagram

```mermaid
erDiagram
    users {
        BIGINT id PK
        CHAR(36) public_id UK
        VARCHAR(100) name
        VARCHAR(255) email UK
        VARCHAR(255) password_hash
        VARCHAR(20) role
        BOOLEAN is_verified
        VARCHAR(255) verification_token
        VARCHAR(255) reset_password_token
        DATETIME reset_password_expires
        INT token_version
        VARCHAR(500) avatar_url
        TINYINT(1) is_active
        DATETIME created_at
        DATETIME updated_at
    }

    refresh_tokens {
        BIGINT id PK
        BIGINT user_id FK
        TEXT token_hash
        BOOLEAN is_revoked
        DATETIME expires_at
        VARCHAR(45) created_by_ip
        DATETIME created_at
        DATETIME updated_at
    }

    workspaces {
        BIGINT id PK
        CHAR(36) public_id UK
        VARCHAR(100) name
        VARCHAR(100) slug UK
        TEXT description
        VARCHAR(500) logo_url
        VARCHAR(20) plan
        BIGINT owner_id FK
        DATETIME deleted_at
        DATETIME created_at
        DATETIME updated_at
    }

    workspace_members {
        BIGINT id PK
        BIGINT workspace_id FK
        BIGINT user_id FK
        VARCHAR(20) role
        DATETIME joined_at
        DATETIME created_at
        DATETIME updated_at
    }

    workspace_invites {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT workspace_id FK
        BIGINT inviter_id FK
        VARCHAR(255) email
        VARCHAR(20) role
        VARCHAR(255) token UK
        VARCHAR(20) status
        DATETIME expires_at
        DATETIME created_at
        DATETIME updated_at
    }

    boards {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT workspace_id FK
        VARCHAR(150) name
        TEXT description
        VARCHAR(500) cover_image_url
        VARCHAR(10) background_color
        VARCHAR(20) visibility
        VARCHAR(20) status
        BIGINT created_by FK
        INT version
        DATETIME deleted_at
        DATETIME created_at
        DATETIME updated_at
    }

    lists {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT board_id FK
        VARCHAR(150) name
        DOUBLE position
        VARCHAR(10) color
        BOOLEAN is_archived
        DATETIME deleted_at
        DATETIME created_at
        DATETIME updated_at
    }

    cards {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT list_id FK
        BIGINT board_id FK
        VARCHAR(255) title
        TEXT description
        DOUBLE position
        VARCHAR(10) priority
        DATETIME due_date
        DATETIME start_date
        BOOLEAN is_complete
        BOOLEAN is_archived
        BIGINT created_by FK
        BIGINT cover_attachment_id FK
        INT estimated_hours
        INT actual_hours
        DATETIME deleted_at
        DATETIME created_at
        DATETIME updated_at
    }

    card_members {
        BIGINT id PK
        BIGINT card_id FK
        BIGINT user_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    labels {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT board_id FK
        VARCHAR(50) name
        VARCHAR(10) color
        DATETIME created_at
        DATETIME updated_at
    }

    card_labels {
        BIGINT id PK
        BIGINT card_id FK
        BIGINT label_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    checklists {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT card_id FK
        VARCHAR(255) title
        DOUBLE position
        DATETIME created_at
        DATETIME updated_at
    }

    checklist_items {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT checklist_id FK
        VARCHAR(500) content
        BOOLEAN is_checked
        BIGINT assignee_id FK
        DATETIME due_date
        DOUBLE position
        DATETIME created_at
        DATETIME updated_at
    }

    attachments {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT card_id FK
        BIGINT uploaded_by FK
        VARCHAR(255) filename
        VARCHAR(255) original_name
        VARCHAR(100) mime_type
        BIGINT file_size
        TEXT url
        VARCHAR(50) provider
        VARCHAR(255) provider_public_id
        DATETIME created_at
        DATETIME updated_at
    }

    comments {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT card_id FK
        BIGINT user_id FK
        TEXT content
        BOOLEAN is_edited
        BIGINT parent_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    notifications {
        BIGINT id PK
        CHAR(36) public_id UK
        BIGINT user_id FK
        VARCHAR(50) type
        VARCHAR(255) title
        TEXT body
        JSON data
        BOOLEAN is_read
        DATETIME read_at
        DATETIME created_at
        DATETIME updated_at
    }

    audit_logs {
        BIGINT id PK
        BIGINT workspace_id
        BIGINT actor_id FK
        BIGINT target_user_id
        VARCHAR(50) action
        VARCHAR(50) entity_type
        BIGINT entity_id
        JSON before_state
        JSON after_state
        VARCHAR(45) ip_address
        TEXT user_agent
        DATETIME created_at
    }

    users ||--o{ refresh_tokens : "has"
    users ||--o{ workspaces : "owns"
    users ||--o{ workspace_members : "belongs_to"
    users ||--o{ workspace_invites : "sends"
    users ||--o{ cards : "creates"
    users ||--o{ card_members : "assigned_to"
    users ||--o{ comments : "writes"
    users ||--o{ attachments : "uploads"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "performs"
    users ||--o{ checklist_items : "assigned_to"

    workspaces ||--o{ workspace_members : "has"
    workspaces ||--o{ workspace_invites : "has"
    workspaces ||--o{ boards : "contains"

    boards ||--o{ lists : "contains"
    boards ||--o{ labels : "has"
    boards ||--o{ cards : "contains"

    lists ||--o{ cards : "contains"

    cards ||--o{ card_members : "has"
    cards ||--o{ card_labels : "has"
    cards ||--o{ checklists : "has"
    cards ||--o{ attachments : "has"
    cards ||--o{ comments : "has"

    labels ||--o{ card_labels : "applied_to"

    checklists ||--o{ checklist_items : "has"

    comments ||--o{ comments : "parent_of"
```

## Table Descriptions

| Table | Rows Est. | Description |
|-------|-----------|-------------|
| `users` | 10K+ | App users. `role` = `user` or `admin`. Soft-delete via `is_active`. |
| `refresh_tokens` | 50K+ | JWT refresh token store. `token_hash` = SHA-256 of raw token. Reuse detection: revoke all on reuse. |
| `workspaces` | 1K+ | Multi-tenant root. Paranoid (soft delete). `slug` auto-generated from name. |
| `workspace_members` | 20K+ | Pivot: user ↔ workspace. `role` = `owner`/`admin`/`member`. |
| `workspace_invites` | 5K+ | Email invites. `status` = `pending`/`accepted`/`declined`/`expired`. |
| `boards` | 10K+ | Kanban board. Paranoid. `visibility` = `private`/`workspace`/`public`. |
| `lists` | 100K+ | Columns within a board. Float-rank `position`. Paranoid. |
| `cards` | 1M+ | Tasks/tickets. Float-rank `position` within list. Paranoid. |
| `card_members` | 5M+ | Assignees pivot. |
| `labels` | 50K+ | Board-scoped labels. |
| `card_labels` | 500K+ | Label ↔ card pivot. |
| `checklists` | 500K+ | Sublists within a card. Float-rank `position`. |
| `checklist_items` | 5M+ | Individual checklist todos. |
| `attachments` | 2M+ | File uploads (Cloudinary/S3). `provider_public_id` for CDN management. |
| `comments` | 10M+ | Threaded comments. `parent_id` = NULL for top-level. |
| `notifications` | 100M+ | In-app notifications. `data` = JSON payload for deep links. |
| `audit_logs` | 500M+ | Append-only audit trail. No FK on `workspace_id` (allows workspace_id=0 for bootstrap). |

## Indexes

### High-Priority Indexes (covering queries from the app)

```sql
-- users
CREATE UNIQUE INDEX idx_users_public_id ON users(public_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- workspaces
CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);

-- workspace_members
CREATE UNIQUE INDEX idx_wm_workspace_user ON workspace_members(workspace_id, user_id);
CREATE INDEX idx_wm_user_id ON workspace_members(user_id);

-- boards
CREATE INDEX idx_boards_workspace_id ON boards(workspace_id);
CREATE INDEX idx_boards_created_by ON boards(created_by);

-- lists
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_lists_position ON lists(board_id, position);

-- cards
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_board_id ON cards(board_id);
CREATE INDEX idx_cards_position ON cards(list_id, position);
CREATE INDEX idx_cards_due_date ON cards(due_date, is_complete);
CREATE INDEX idx_cards_created_by ON cards(created_by);

-- card_members
CREATE UNIQUE INDEX idx_cm_card_user ON card_members(card_id, user_id);
CREATE INDEX idx_cm_user_id ON card_members(user_id);

-- labels
CREATE INDEX idx_labels_board_id ON labels(board_id);

-- card_labels
CREATE UNIQUE INDEX idx_cl_card_label ON card_labels(card_id, label_id);

-- checklists
CREATE INDEX idx_checklists_card_id ON checklists(card_id);

-- checklist_items
CREATE INDEX idx_ci_checklist_id ON checklist_items(checklist_id);

-- attachments
CREATE INDEX idx_attachments_card_id ON attachments(card_id);

-- comments
CREATE INDEX idx_comments_card_id ON comments(card_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, created_at);

-- audit_logs
CREATE INDEX idx_audit_workspace ON audit_logs(workspace_id, created_at);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

