# Git Workflow — TaskFlow SaaS

This project uses a **GitHub Flow** variant with protected branches and Conventional Commits.

## Branch Strategy

```mermaid
gitGraph
   commit id: "init"
   branch develop
   checkout develop
   commit id: "phase-1"

   branch feature/git-workflow-dx
   checkout feature/git-workflow-dx
   commit id: "husky + commitlint"
   checkout develop
   merge feature/git-workflow-dx id: "merge-ph2"

   branch feature/db-schema-design
   checkout feature/db-schema-design
   commit id: "ER diagram docs"
   checkout develop
   merge feature/db-schema-design id: "merge-ph3"

   branch feature/sequelize-orm-layer
   checkout feature/sequelize-orm-layer
   commit id: "seeders"
   checkout develop
   merge feature/sequelize-orm-layer id: "merge-ph4"

   branch feature/card-details-full
   checkout feature/card-details-full
   commit id: "list/card/checklist services"
   checkout develop
   merge feature/card-details-full id: "merge-ph5"

   branch feature/float-rank-ordering
   checkout feature/float-rank-ordering
   commit id: "ranking engine"
   checkout develop
   merge feature/float-rank-ordering id: "merge-ph6"

   branch feature/graphql-api
   checkout feature/graphql-api
   commit id: "Apollo + DataLoaders"
   checkout develop
   merge feature/graphql-api id: "merge-ph7"

   branch feature/socketio-realtime
   checkout feature/socketio-realtime
   commit id: "Socket.io realtime"
   checkout develop
   merge feature/socketio-realtime id: "merge-ph8"

   branch feature/cloud-attachments
   checkout feature/cloud-attachments
   commit id: "Cloudinary upload"
   checkout develop
   merge feature/cloud-attachments id: "merge-ph9"

   branch feature/auth-rbac-full
   checkout feature/auth-rbac-full
   commit id: "permissions matrix"
   checkout develop
   merge feature/auth-rbac-full id: "merge-ph10"

   branch feature/nodemailer-emails
   checkout feature/nodemailer-emails
   commit id: "email templates + cron"
   checkout develop
   merge feature/nodemailer-emails id: "merge-ph11"

   branch feature/security-hardening
   checkout feature/security-hardening
   commit id: "OWASP hardening"
   checkout develop
   merge feature/security-hardening id: "merge-ph12"

   branch feature/ci-cd-docker
   checkout feature/ci-cd-docker
   commit id: "GitHub Actions + Docker"
   checkout develop
   merge feature/ci-cd-docker id: "merge-ph13"

   branch feature/firebase-integration
   checkout feature/firebase-integration
   commit id: "FCM + Firestore presence"
   checkout develop
   merge feature/firebase-integration id: "merge-ph14"

   branch feature/frontend-dashboard-capstone
   checkout feature/frontend-dashboard-capstone
   commit id: "React + ElevenLabs UI"
   checkout develop
   merge feature/frontend-dashboard-capstone id: "merge-ph15"

   branch release/v1.0.0
   checkout release/v1.0.0
   commit id: "release prep"
   checkout main
   merge release/v1.0.0 tag: "v1.0.0"
```

## Branch Naming

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, tagged releases only |
| `develop` | Integration branch, always green |
| `feature/<name>` | New features (from develop) |
| `fix/<name>` | Bug fixes (from develop or main) |
| `hotfix/<name>` | Emergency fixes (from main) |
| `release/<version>` | Release stabilization (from develop) |
| `chore/<name>` | Maintenance tasks |

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code restructure, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build system, CI, dependencies |
| `revert` | Revert a previous commit |

### Scopes

`auth`, `workspace`, `board`, `card`, `list`, `checklist`, `label`, `comment`, `attachment`, `notification`, `graphql`, `socket`, `email`, `firebase`, `ci`, `docker`, `ui`, `deps`

### Examples

```bash
feat(card): add due date reminder notifications
fix(auth): handle expired refresh token edge case
docs(api): add GraphQL schema documentation
chore(deps): bump sanitize-html to 2.12.1
test(board): add RBAC integration tests
```

## PR Workflow

1. Branch off `develop`: `git checkout -b feature/<name>`
2. Make commits (Commitlint enforced via husky)
3. Push and open PR to `develop`
4. CI must pass (lint + tests + coverage ≥70%)
5. At least 1 review required (CODEOWNERS enforced)
6. Squash & merge (default)
7. Delete feature branch after merge

## Protected Branch Rules

### `main`
- Require PR reviews (2 minimum)
- Require status checks: `ci/test`, `ci/lint`, `ci/build`
- No force push
- No direct commits

### `develop`
- Require PR reviews (1 minimum)
- Require status checks: `ci/test`, `ci/lint`
- No force push

## Hooks (via Husky)

| Hook | Action |
|------|--------|
| `pre-commit` | `lint-staged` (ESLint + Prettier) |
| `commit-msg` | `commitlint` (enforces Conventional Commits) |

## Release Process

1. Create `release/vX.Y.Z` from `develop`
2. Bump version in `package.json`, update `CHANGELOG.md`
3. PR to `main` — requires 2 reviews
4. Tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. Push tag, GitHub Actions publishes Docker image + creates GitHub Release
6. Back-merge `main` into `develop`

