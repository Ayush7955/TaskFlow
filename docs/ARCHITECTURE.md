# Architecture — TaskFlow SaaS

## System Overview

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        UI["React 18 + Vite\nElevenLabs Design System"]
        SW["Socket.io Client"]
    end

    subgraph Gateway["API Gateway"]
        NGINX["Nginx (reverse proxy)\nSSL termination + rate limiting"]
    end

    subgraph API["API Layer (Node.js / Express)"]
        REST["REST API\n/api/v1/*"]
        GQL["GraphQL\n/graphql (Apollo Server 4)"]
        WS["Socket.io\nws://*"]
    end

    subgraph Services["Business Logic"]
        AUTH["Auth Service\nJWT + refresh rotation"]
        WS_SVC["Workspace Service"]
        BOARD["Board Service"]
        CARD["Card Service"]
        LIST["List Service"]
        RANK["Ranking Service\nFloat-rank ordering"]
        EMAIL["Email Service\nNodemailer + HBS"]
        ATTACH["Attachment Service\nCloudinary / S3"]
        NOTIF["Notification Service"]
        FIREBASE_SVC["Firebase Service\nFCM push"]
    end

    subgraph Data["Data Layer"]
        MYSQL[("MySQL 8\n18 tables")]
        REDIS[("Redis\nsession cache / pub-sub")]
    end

    subgraph External["External Services"]
        CLOUDINARY["Cloudinary CDN"]
        SENDGRID["SMTP / SendGrid"]
        FIREBASE["Firebase FCM"]
    end

    UI -->|HTTP/HTTPS| NGINX
    SW -->|WebSocket| NGINX
    NGINX --> REST
    NGINX --> GQL
    NGINX --> WS

    REST --> AUTH
    REST --> WS_SVC
    REST --> BOARD
    REST --> CARD
    REST --> LIST
    GQL --> BOARD
    GQL --> CARD
    WS --> NOTIF

    AUTH --> MYSQL
    WS_SVC --> MYSQL
    BOARD --> MYSQL
    CARD --> MYSQL
    LIST --> MYSQL
    RANK --> MYSQL
    NOTIF --> REDIS

    EMAIL --> SENDGRID
    ATTACH --> CLOUDINARY
    FIREBASE_SVC --> FIREBASE
```

## Directory Structure

```
p16-saas-task-manager/
├── .github/                    # GitHub Actions, templates, Dependabot
├── .husky/                     # Git hooks (pre-commit, commit-msg)
├── docs/                       # Architecture, ER diagram, security docs
├── server/                     # Node.js / Express API
│   ├── src/
│   │   ├── config/             # env, database, logger, mailer, cloudinary
│   │   ├── constants/          # roles, events, actions enums
│   │   ├── controllers/        # HTTP handlers (thin layer)
│   │   ├── graphql/            # Apollo Server, typeDefs, resolvers, loaders
│   │   ├── jobs/               # node-cron background jobs
│   │   ├── middleware/         # auth, validate, sanitize, rate-limit, upload
│   │   ├── migrations/         # Sequelize migrations (11 files)
│   │   ├── models/             # Sequelize models (18 tables)
│   │   ├── permissions/        # RBAC permission map + authorize middleware
│   │   ├── realtime/           # Socket.io handlers + emitter
│   │   ├── routes/             # Express routers
│   │   ├── seeders/            # Demo data seeds
│   │   ├── services/           # All business logic
│   │   ├── storage/            # Cloudinary / S3 adapters
│   │   ├── templates/          # Handlebars email templates
│   │   ├── utils/              # AppError, asyncHandler, jwt, hash, pagination
│   │   ├── validators/         # Joi schemas
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # HTTP server + graceful shutdown
│   ├── tests/
│   │   ├── integration/        # Supertest API tests
│   │   ├── unit/               # Unit tests for services/utils
│   │   └── security/           # SQLi, rate-limit, upload-spoof tests
│   ├── Dockerfile              # Multi-stage production image
│   ├── package.json
│   └── .env.example
├── client/                     # React 18 + Vite frontend (Phase 15)
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Shared UI components
│   │   ├── features/           # Feature-based modules
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route-level page components
│   │   ├── stores/             # Zustand state stores
│   │   ├── styles/             # Global styles + design tokens
│   │   └── utils/              # Frontend utilities
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml          # Dev environment (MySQL + Redis + API + Client)
├── docker-compose.test.yml     # Test environment
└── README.md
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware
    participant Ctrl as Controller
    participant Svc as Service
    participant DB as MySQL
    participant RT as Socket.io

    C->>MW: HTTP Request
    MW->>MW: rateLimiter → sanitize → authenticate → validate
    MW->>Ctrl: req, res, next
    Ctrl->>Svc: service.method(params)
    Svc->>DB: Sequelize query (transaction)
    DB-->>Svc: result
    Svc->>DB: auditLog.create() [same tx]
    DB-->>Svc: ok
    Svc-->>Ctrl: data
    Ctrl-->>C: JSON response
    Ctrl->>RT: emitToBoard() [after commit]
    RT-->>C: socket event
```

## API Versioning

All REST endpoints are under `/api/v1/`. GraphQL is at `/graphql`. Socket.io at root WebSocket upgrade.

## Error Response Envelope

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [],
  "requestId": "uuid"
}
```

## Success Response Envelope

```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
