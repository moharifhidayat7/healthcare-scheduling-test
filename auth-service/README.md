# Auth Service

NestJS v11 GraphQL + REST API with Prisma ORM (PostgreSQL), JWT auth, and bcrypt password hashing.

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
│   ├── redis/                  ← (commented out — optional)
│   ├── bullmq/                 ← (commented out — optional)
│   └── graphql/
│       └── graphql.module.ts  ← Apollo driver config (POST /graphql)
│
├── common/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.guard.ts              ← base guard
│   │   ├── internal.guard.ts          ← validates internal JWT (INTERNAL_JWT_SECRET)
│   │   ├── current-user.decorator.ts
│   │   ├── token-validator.ts         ← abstract class + JwtPayload type
│   │   ├── internal-token.service.ts  ← generates service-to-service JWTs
│   │   ├── user-token.service.ts      ← generates user auth JWTs (JWT_SECRET)
│   │   └── strategies/
│   │       ├── internal-jwt.validator.ts
│   │       └── user-jwt.validator.ts
│   ├── mail/                  ← (commented out — optional)
│   │   ├── mail.module.ts
│   │   ├── mail.service.ts
│   │   ├── mail.processor.ts
│   │   └── interfaces/
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
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── graphql/
│   │   │   ├── auth.resolver.ts
│   │   │   ├── types/
│   │   │   │   ├── auth-token.type.ts
│   │   │   │   └── user-info.type.ts
│   │   │   └── inputs/
│   │   │       ├── register.input.ts
│   │   │       └── login.input.ts
│   │   └── use-cases/
│   │       ├── register.use-case.ts
│   │       ├── login.use-case.ts
│   │       └── validate-token.use-case.ts
│   ├── empty/                  ← scaffold module
│   └── health/
│       ├── health.controller.ts
│       └── health.module.ts
│
└── prisma/
    ├── schema.prisma
    └── seed/
        └── index.ts
```

## Configuration

All environment variables are validated at startup via a Joi schema in `src/config/env-vars.schema.ts`.
Values are accessed directly by their env var name through NestJS `ConfigService`:

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
pnpm test          # unit (Jest) — 14 tests across 4 suites
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
| `INTERNAL_JWT_SECRET` | yes | — | Shared secret for signing/verifying service-to-service JWTs |
| `JWT_SECRET` | yes | — | Shared secret for signing/verifying user auth JWTs |
| `REDIS_HOST` | no | `localhost` | Redis host (optional) |
| `REDIS_PORT` | no | `6379` | Redis port (optional) |
| `REDIS_PASSWORD` | no | — | Redis password |
| `REDIS_DB` | no | `0` | Redis database index |
| `MAIL_HOST` | no | — | SMTP host (optional) |
| `MAIL_PORT` | no | `587` | SMTP port (optional) |
| `MAIL_USER` | no | — | SMTP user |
| `MAIL_PASSWORD` | no | — | SMTP password |
| `MAIL_FROM` | no | `noreply@example.com` | Default sender address |

## Auth

### Service-to-Service

`InternalAuthGuard` verifies short-lived JWTs (5 min, `INTERNAL_JWT_SECRET`) between services.

**Service A — sending:**

```ts
import { InternalTokenService } from './common/auth/internal-token.service';

@Injectable()
export class NotificationClient {
  constructor(private readonly tokenService: InternalTokenService) {}

  async notify(userId: string) {
    const token = this.tokenService.generate();
    await fetch('http://notification-service/internal/send', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
```

**Service B — receiving:**

```ts
@UseGuards(InternalAuthGuard)
@Post('internal/send')
async send(@Body() body: SendDto, @CurrentUser() user: JwtPayload) {
  console.log(user.sub); // 'schedule-service' — identifies the caller
}
```

### User Auth (GraphQL)

Available at `POST /graphql`. Open the Apollo Sandbox at `http://localhost:3000/graphql` in your browser.

#### register

Creates a new user account. Password hashed with bcrypt (10 rounds) before storage.

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "securePassword123"
  }
}
```

**Response:**
```json
{
  "data": {
    "register": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Errors:** `409 Conflict` — email already registered.

---

#### login

Authenticates with email and password. Returns a JWT on success.

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "securePassword123"
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Errors:** `401 Unauthorized` — invalid email or password.

---

#### validateToken

Validates a user JWT and returns decoded user info.

```graphql
query ValidateToken($token: String!) {
  validateToken(token: $token) {
    id
    email
    roles
  }
}
```

**Variables:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "data": {
    "validateToken": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "roles": ["user"]
    }
  }
}
```

**Errors:** `401 Unauthorized` — invalid or expired token.

---

#### Using the token

Include the JWT in the `Authorization` header for authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## REST

### Scaffold (empty module)

```
GET    /web/empty
POST   /web/empty
PATCH  /web/empty/:id
DELETE /web/empty/:id
```

### Health

```
GET /health
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

## Docker

### Build

```bash
podman build -t auth-service:latest .
# or
docker build -t auth-service:latest .
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

  app:
    build: .
    env_file: .env
    ports: [3000:3000]
    depends_on:
      postgres:
        condition: service_healthy
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
