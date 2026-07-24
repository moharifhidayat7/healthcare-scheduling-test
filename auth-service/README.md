# Nest Microservice

NestJS microservice boilerplate with GraphQL + REST, Prisma ORM, and pluggable auth.

## Structure

```
src/
├── app.module.ts              ← root module
├── main.ts                    ← bootstrap with CORS, ValidationPipe, shutdown hooks
│
├── config/
│   └── env-vars.schema.ts     ← Joi validation schema for all env vars
│
├── integrations/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── redis/
│   │   ├── redis.module.ts
│   │   ├── redis.service.ts
│   │   └── redis.health.ts
│   ├── bullmq/
│   │   └── bullmq.module.ts
│   └── graphql/
│       └── graphql.module.ts  ← Apollo driver config
│
├── common/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.guard.ts          ← base guard
│   │   ├── internal.guard.ts      ← validates internal JWT
│   │   ├── current-user.decorator.ts
│   │   ├── internal-token.service.ts  ← generates outgoing JWTs
│   │   ├── token-validator.ts     ← abstract class + JwtPayload type
│   │   └── strategies/
│   │       └── internal-jwt.validator.ts
│   ├── decorators/
│   │   └── skip-response-wrap.decorator.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── response.interceptor.ts
│   └── pagination/
│       ├── pagination.dto.ts
│       └── pagination.interface.ts
│
├── modules/
│   ├── empty/
│   │   ├── empty.module.ts
│   │   ├── empty.service.ts
│   │   ├── rest/web/
│   │   │   ├── empty.controller.ts
│   │   │   └── dto/
│   │   │       └── create-empty.request.ts
│   │   ├── rest/mobile/
│   │   │   ├── empty.controller.ts
│   │   │   └── dto/
│   │   │       └── create-empty.request.ts
│   │   ├── graphql/
│   │   │   ├── empty.resolver.ts
│   │   │   ├── types/
│   │   │   │   └── empty.type.ts
│   │   │   └── inputs/
│   │   │       ├── create-empty.input.ts
│   │   │       └── update-empty.input.ts
│   │   └── use-cases/
│   │       ├── create-empty.use-case.ts
│   │       ├── get-empty.use-case.ts
│   │       ├── get-empties.use-case.ts
│   │       ├── update-empty.use-case.ts
│   │       └── delete-empty.use-case.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── mail/
│       ├── mail.module.ts
│       ├── mail.service.ts
│       ├── mail.processor.ts
│       ├── mail.constants.ts
│       ├── interfaces/
│       │   └── mail.interface.ts
│       └── templates/
│
└── prisma/
    ├── schema.prisma
    └── seed/
        └── index.ts
```

## Configuration

All environment variables are validated at startup via a Joi schema in `src/config/env-vars.schema.ts`.
No config factories, no `registerAs`, no namespacing — values are accessed directly by their env var name
through NestJS `ConfigService`:

```ts
constructor(private config: ConfigService) {
  const host = config.get<string>('REDIS_HOST');
  const port = config.get<number>('REDIS_PORT');
}
```

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL (or Prisma Postgres)

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
pnpm test          # unit (Jest)
pnpm test:e2e      # e2e (supertest)
```

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` | HTTP port |
| `SERVICE_NAME` | no | `unknown` | Identity used when generating internal tokens |
| `NODE_ENV` | no | `development` | `development`, `production`, `test` |
| `DB_HOST` | no | `localhost` | PostgreSQL host |
| `DB_PORT` | no | `5432` | PostgreSQL port |
| `DB_USER` | no | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | no | `postgres` | PostgreSQL password |
| `DB_NAME` | no | `auth_service` | PostgreSQL database name |
| `DATABASE_URL` | yes | — | Full connection string (used by Prisma CLI) |
| `INTERNAL_JWT_SECRET` | yes | — | Shared secret for signing/verifying internal JWTs |
| `JWT_SECRET` | yes | — | Secret for signing/verifying user-facing auth JWTs |
| `REDIS_HOST` | no | `localhost` | Redis host |
| `REDIS_PORT` | no | `6379` | Redis port |
| `REDIS_PASSWORD` | no | — | Redis password |
| `REDIS_DB` | no | `0` | Redis database index |
| `MAIL_HOST` | yes | — | SMTP host |
| `MAIL_PORT` | no | `587` | SMTP port |
| `MAIL_USER` | no | — | SMTP user |
| `MAIL_PASSWORD` | no | — | SMTP password |
| `MAIL_FROM` | no | `noreply@example.com` | Default sender address |
| `MAIL_TEMPLATE_DIR` | no | `./templates/mail` | Handlebars template directory |

## Auth

One guard available per endpoint:

| Guard | Validator | Use case |
|---|---|---|
| `InternalAuthGuard` | `InternalJwtValidator` — verifies short-lived JWT with shared secret | Service-to-service |
Service A generates a fresh JWT (5 min expiry), Service B verifies it.
## API

### REST

```
GET    /health              ← health check (prisma ping)
GET    /web/empty           ← template endpoints
POST   /web/empty
PATCH  /web/empty/:id
DELETE /web/empty/:id
```

All responses wrapped in:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "meta": { "timestamp": "..." }
}
```

### GraphQL

```
POST /graphql
```

## Docker

### Build

```bash
podman build -t nest-ms-boilerplate:latest .
# or
docker build -t nest-ms-boilerplate:latest .
```

### docker-compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth_service
      POSTGRES_PASSWORD: postgres
    ports: [5432:5432]
    healthcheck:
      test: pg_isready -U postgres

  redis:
    image: redis:7-alpine
    ports: [6379:6379]

  app:
    build: .
    env_file: .env
    ports: [3000:3000]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
```

### Migrations

```bash
# Connect to running container and apply pending migrations
docker-compose exec app prisma migrate deploy
# or
podman exec -it <container> prisma migrate deploy
```

## Creating a new module

```bash
cp -r src/modules/empty src/modules/orders
# Rename files Empty → Order
# Add use-cases, inject guards, register in AppModule
```
