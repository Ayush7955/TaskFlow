# Security Policy — TaskFlow SaaS

## OWASP Top-10 Mapping

| # | Risk | Mitigation |
|---|------|------------|
| A01 | **Broken Access Control** | RBAC via `permissions.js` + `authorize()` middleware. All resources check workspace membership. 404 returned (not 403) for unauthorized tenant resources. Owner-only operations (workspace delete, transfer) enforced at service layer. |
| A02 | **Cryptographic Failures** | Passwords hashed with bcrypt (12 rounds). JWT access tokens (15m TTL) + refresh tokens (7d TTL, SHA-256 hashed in DB, rotation on use). All secrets validated via Joi schema at startup. HTTPS enforced in production. |
| A03 | **Injection** | Sequelize parameterized queries — no raw string concatenation. `sanitize-html` strips all HTML from request bodies. Joi validates all input schemas. `hpp` prevents HTTP Parameter Pollution. |
| A04 | **Insecure Design** | Layered architecture: routes → controllers → services → models. No business logic in controllers. Audit log for every mutation. Soft-delete (paranoid) prevents accidental data loss. |
| A05 | **Security Misconfiguration** | `helmet` sets 15 security headers. CORS whitelist validated. `.env.example` shows no real secrets. Non-root Docker user. Node.js only binds to `0.0.0.0:PORT`. |
| A06 | **Vulnerable and Outdated Components** | Dependabot weekly updates. `sanitize-html@2.12.1` pinned (ESM compat). `npm audit` in CI pipeline. |
| A07 | **Identification and Authentication Failures** | JWT reuse detection (token_version increment on password change). Refresh token rotation with reuse attack detection (revoke all on reuse). Rate limiting on auth endpoints (10 req/15m). Email verification required. |
| A08 | **Software and Data Integrity Failures** | Magic-byte verification on file uploads (not trusting MIME type header). GitHub Actions CI enforces tests before merge. CODEOWNERS review required. |
| A09 | **Security Logging and Monitoring Failures** | `pino` structured logging with request IDs. Audit log table (append-only, no FK on workspace_id). Sensitive fields redacted from logs (`password`, `token`, `secret`). |
| A10 | **Server-Side Request Forgery** | No server-initiated HTTP requests to user-supplied URLs. Cloudinary SDK used for uploads (no proxy). |

## Security Headers (via Helmet)

```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-XSS-Protection: 0 (using CSP instead)
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

## Rate Limiting

| Endpoint Group | Window | Limit |
|---------------|--------|-------|
| Global | 15 min | 300 req |
| Auth (/auth/*) | 15 min | 10 req |
| File upload | 1 min | 20 files |

## Password Policy

- Minimum 8 characters
- Must contain: uppercase, lowercase, digit
- bcrypt hashed (12 rounds)
- Enforced via Joi regex on register + change-password

## File Upload Security

1. Multer file filter: reject disallowed MIME types
2. Magic byte verification: match buffer header to claimed MIME
3. Max file size: 10 MB (configurable via `MAX_UPLOAD_MB`)
4. Files stored on Cloudinary — not served from API server

## Token Security

- Access tokens: HS256, 15m expiry, `publicId + tokenVersion` payload
- Refresh tokens: SHA-256 hashed in DB, raw token only in HttpOnly cookie
- Refresh rotation: new token on each use, old token revoked
- Reuse detection: if revoked token used → revoke ALL user tokens (session hijack assumed)
- `tokenVersion` field: incremented on password change, invalidating all existing tokens

## Reporting a Vulnerability

Please report security vulnerabilities to: security@taskflow.dev

We follow a 90-day responsible disclosure policy.

