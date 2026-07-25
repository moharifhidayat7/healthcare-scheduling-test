# Auth Service

NestJS v11 GraphQL + REST API with Prisma ORM (PostgreSQL), JWT auth, and bcrypt password hashing.

[🇮🇩 Bahasa Indonesia](./README-ID.md)

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 17 (running)

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env to match your infrastructure
pnpm prisma generate
pnpm prisma migrate deploy
```

## Running

```bash
pnpm start:dev      # development (watch mode)
pnpm start          # production
pnpm start:prod     # compiled output (node dist/src/main.js)
```

The GraphQL endpoint is at `POST /graphql` on the configured port (default 3001).

## Docker

```bash
# Build
docker build -t auth-service:latest .

# Run (requires PostgreSQL accessible via ENV config)
docker run -d \
  --name auth-service \
  --env-file .env \
  -p 3001:3000 \
  auth-service:latest
```

## Tests

```bash
pnpm test          # unit (Jest) — 14 tests across 4 suites
pnpm test:e2e      # e2e (supertest)
pnpm test:cov      # with coverage
```

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` | HTTP port |
| `SERVICE_NAME` | no | `unknown` | Identity for internal JWT |
| `NODE_ENV` | no | `development` | `development`, `production`, `test` |
| `DB_HOST` | no | `localhost` | PostgreSQL host |
| `DB_PORT` | no | `5432` | PostgreSQL port |
| `DB_USER` | no | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | no | `postgres` | PostgreSQL password |
| `DB_NAME` | no | `auth_service` | PostgreSQL database name |
| `DATABASE_URL` | yes | — | Full connection string |
| `INTERNAL_JWT_SECRET` | yes | — | Shared secret for service-to-service JWTs |
| `JWT_SECRET` | yes | — | Shared secret for user auth JWTs |
| `REDIS_HOST` | no | — | Redis host (optional) |
| `REDIS_PORT` | no | `6379` | Redis port (optional) |
| `REDIS_PASSWORD` | no | `''` | Redis password |
| `REDIS_DB` | no | `0` | Redis database index |
| `MAIL_HOST` | no | — | SMTP host (optional) |
| `MAIL_PORT` | no | `587` | SMTP port (optional) |
| `MAIL_USER` | no | — | SMTP user |
| `MAIL_PASSWORD` | no | — | SMTP password |
| `MAIL_FROM` | no | `noreply@example.com` | Default sender address |

## API

### GraphQL

All mutations/queries at `POST /graphql`.

#### register

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) { token }
}
```

**Errors:** `409 Conflict` — email already registered.

#### login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) { token }
}
```

**Errors:** `401 Unauthorized` — invalid email or password.

#### validateToken

```graphql
query ValidateToken($token: String!) {
  validateToken(token: $token) { sub email roles }
}
```

**Errors:** `401 Unauthorized` — invalid or expired token.

### Using the token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### REST

```
GET /health    ← server reachability
```

## Service-to-Service Auth

Other services authenticate to this service using `InternalAuthGuard` with short-lived JWTs (5 min).

```ts
// Generating a token
const token = this.internalTokenService.generate();
await fetch('http://auth-service:3001/graphql', {
  headers: { Authorization: `Bearer ${token}` },
});
```
