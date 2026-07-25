# Auth Service

NestJS v11 GraphQL + REST API with Prisma ORM (PostgreSQL), JWT auth, and bcrypt password hashing.

[🇮🇩 Bahasa Indonesia](./README-ID.md)

## Structure

```
src/
├── app.module.ts              ← root module
├── main.ts                    ← bootstrap with CORS, ValidationPipe, shutdown hooks
│
├── config/
│   └── env-vars.schema.ts     ← Zod validation schema + Env type
│
├── integrations/
│   ├── prisma/                ← PrismaClient wrapper (v7 driver adapter)
│   ├── redis/                 ← ioredis (lazy connect, lifecycle hooks)
│   ├── bullmq/                ← Global BullMQ config
│   └── graphql/               ← Apollo driver with validation error format
│
├── common/
│   ├── auth/
│   │   ├── auth.guard.ts              ← base guard
│   │   ├── internal.guard.ts          ← validates internal JWT (INTERNAL_JWT_SECRET)
│   │   ├── internal-token.service.ts  ← generates service-to-service JWTs
│   │   ├── user-token.service.ts      ← generates user auth JWTs (JWT_SECRET)
│   │   ├── token-validator.ts         ← abstract class + JwtPayload type
│   │   └── strategies/
│   │       ├── internal-jwt.validator.ts
│   │       └── user-jwt.validator.ts
│   ├── cache/
│   │   ├── cache.module.ts            ← Global module (Redis-backed)
│   │   └── cache.service.ts
│   ├── decorators/
│   │   ├── cacheable.decorator.ts     ← @Cacheable(keyFn, ttl?)
│   │   └── skip-response-wrap.decorator.ts
│   ├── filters/
│   │   └── prisma-client-exception.filter.ts  ← P2001/P2002/P2025 mapping
│   ├── interceptors/
│   │   ├── logging.interceptor.ts     ← request logging with input/error details
│   │   ├── response.interceptor.ts
│   │   └── cacheable.interceptor.ts
│   ├── pagination/
│   │   ├── pagination.type.ts         ← PaginatedType factory
│   │   ├── pagination.util.ts
│   │   ├── pagination.interface.ts
│   │   └── pagination.dto.ts
│   └── mail/
│       ├── mail.service.ts
│       ├── mail.processor.ts
│       └── interfaces/
│
├── modules/
│   ├── auth/                   ← register, login, validateToken
│   └── health/                 ← GET /health (server reachability)
│
└── prisma/
    ├── schema.prisma           ← User model
    ├── seed/
    └── migrations/
```

## Configuration

All env vars validated at startup via Zod schema. Injects as `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('JWT_SECRET', { infer: true })  // typed, no fallback
```

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL

## Setup

```bash
pnpm install
pnpm prisma generate
cp .env.example .env
```

## Running

```bash
pnpm start:dev      # development
pnpm start:prod     # production
```

## Tests

```bash
pnpm test          # unit (Jest) — 14 tests across 4 suites
pnpm test:e2e      # e2e (supertest)
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

## Auth

### Service-to-Service

`InternalAuthGuard` verifies short-lived JWTs (5 min, `INTERNAL_JWT_SECRET`) between services.

```ts
// Service A — sending
const token = this.internalTokenService.generate();
await fetch('http://other-service/internal/endpoint', {
  headers: { Authorization: `Bearer ${token}` },
});

// Service B — receiving (applies to any service using InternalAuthGuard)
@UseGuards(InternalAuthGuard)
@Post('internal/endpoint')
async handle(@CurrentUser() user: JwtPayload) {
  console.log(user.sub); // identifies the caller service
}
```

### User Auth (GraphQL)

Available at `POST /graphql`. Open the Apollo Sandbox at `http://localhost:3000/graphql`.

#### register

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) { token }
}
```

**Variables:** `{ "input": { "email": "user@example.com", "password": "securePassword123" } }`

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

**Response:** `{ "data": { "validateToken": { "sub": "uuid", "email": "user@example.com", "roles": ["user"] } } }`

**Errors:** `401 Unauthorized` — invalid or expired token.

#### Using the token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Docker

```bash
podman compose build auth-service
podman compose up -d postgresql auth-service
podman compose run --rm migrate-auth-service
```
