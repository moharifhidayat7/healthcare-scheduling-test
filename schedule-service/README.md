# Schedule Service

NestJS v11 GraphQL microservice for managing customer appointments. Prisma ORM (PostgreSQL), Redis cache/queues, BullMQ mail queue, and JWT-based auth.

[🇮🇩 Bahasa Indonesia](./README-ID.md)

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 17 (running)
- Redis 7 (running)
- Auth Service running and accessible

## Project Structure

```
src/
├── config/
│   └── env-vars.schema.ts         ← Zod validation + Env type
├── integrations/
│   ├── prisma/                    ← PrismaClient (PostgreSQL)
│   ├── redis/                     ← ioredis
│   ├── bullmq/                    ← BullMQ config
│   └── graphql/                   ← Apollo driver
├── common/
│   ├── auth/                      ← Guards, validators, token service
│   ├── cache/                     ← Redis-backed CacheService
│   ├── decorators/                ← @Cacheable, @SkipResponseWrap
│   ├── filters/                   ← PrismaClientExceptionFilter
│   ├── interceptors/              ← Logging, response wrapper, cacheable
│   └── pagination/                ← PaginatedType, normalizePagination
├── modules/
│   └── <module-name>/
│       ├── <module-name>.module.ts ← @Module definition
│       ├── <module-name>.service.ts ← Data access + cache
│       ├── graphql/
│       │   ├── <module-name>.resolver.ts
│       │   ├── inputs/              ← @InputType classes
│       │   └── types/               ← @ObjectType classes
│       ├── rest/
│       │   ├── <module-name>.controller.ts
│       │   └── dto/                 ← Request/response DTOs
│       └── use-cases/               ← Orchestration logic
└── prisma/
    └── schema.prisma              ← Customer, Doctor, Schedule models
```

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

The GraphQL endpoint is at `POST /graphql` on the configured port (default 3002).

## Docker

```bash
# Build
docker build -t schedule-service:latest .

# Run (requires PostgreSQL and Redis accessible via ENV config)
docker run -d \
  --name schedule-service \
  --env-file .env \
  -p 3002:3000 \
  schedule-service:latest
```

## Tests

```bash
pnpm test          # unit (Jest) — 45 tests across 17 suites
pnpm test:e2e      # e2e (supertest)
pnpm test:cov      # with coverage
```

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` | HTTP port |
| `SERVICE_NAME` | no | `schedule_service` | Identity for internal JWT |
| `NODE_ENV` | no | `development` | `development`, `production`, `test` |
| `DB_HOST` | no | `localhost` | PostgreSQL host |
| `DB_PORT` | no | `5432` | PostgreSQL port |
| `DB_USER` | no | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | no | `postgres` | PostgreSQL password |
| `DB_NAME` | no | `schedule_service` | PostgreSQL database name |
| `DATABASE_URL` | yes | — | Full connection string |
| `INTERNAL_JWT_SECRET` | yes | — | Shared secret for internal JWTs |
| `AUTH_SERVICE_URL` | yes | — | Auth service GraphQL endpoint |
| `REDIS_HOST` | yes | — | Redis host |
| `REDIS_PORT` | no | `6379` | Redis port |
| `REDIS_PASSWORD` | no | `''` | Redis password |
| `REDIS_DB` | no | `0` | Redis database index |
| `MAIL_HOST` | yes | — | SMTP host |
| `MAIL_PORT` | no | `587` | SMTP port |
| `MAIL_USER` | no | — | SMTP user (optional) |
| `MAIL_PASSWORD` | no | — | SMTP password (optional) |
| `MAIL_FROM` | no | `noreply@example.com` | Default sender address |

## API

### GraphQL

```graphql
# Customers
query Customers($page: Int, $limit: Int) {
  customers(page: $page, limit: $limit) {
    data { id name email createdAt }
    meta { pagination { page limit total totalPages } }
  }
}
query Customer($id: ID!) { customer(id: $id) { id name email createdAt } }
mutation CreateCustomer($input: CreateCustomerInput!) { createCustomer(input: $input) { id name email } }
mutation UpdateCustomer($input: UpdateCustomerInput!) { updateCustomer(input: $input) { id name email } }
mutation DeleteCustomer($id: ID!) { deleteCustomer(id: $id) { id } }

# Doctors
query Doctors($page: Int, $limit: Int) {
  doctors(page: $page, limit: $limit) {
    data { id name createdAt }
    meta { pagination { page limit total totalPages } }
  }
}
query Doctor($id: ID!) { doctor(id: $id) { id name } }
mutation CreateDoctor($input: CreateDoctorInput!) { createDoctor(input: $input) { id name } }
mutation UpdateDoctor($input: UpdateDoctorInput!) { updateDoctor(input: $input) { id name } }
mutation DeleteDoctor($id: ID!) { deleteDoctor(id: $id) { id } }

# Schedules
query Schedules($page: Int, $limit: Int) {
  schedules(page: $page, limit: $limit) {
    data { id objective customerId doctorId scheduledAt }
    meta { pagination { page limit total totalPages } }
  }
}
query Schedule($id: ID!) { schedule(id: $id) { id objective customerId doctorId scheduledAt } }
mutation CreateSchedule($input: CreateScheduleInput!) { createSchedule(input: $input) { id objective customerId doctorId scheduledAt } }
mutation DeleteSchedule($id: ID!) { deleteSchedule(id: $id) { id } }
```

### REST

```
GET /health    ← server reachability
```

## Auth

### External (user JWT)

Include the JWT returned from the Auth Service's `register` or `login` in the `Authorization` header for authenticated requests:

```http
Authorization: Bearer <token>
```

### Internal (service-to-service)

`InternalAuthGuard` verifies short-lived JWTs (5 min, `INTERNAL_JWT_SECRET`) between services.

```ts
// Caller service — generate a token
const token = this.internalTokenService.generate();
await fetch('http://schedule-service:3002/graphql', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: '...', variables: { ... } }),
});
```

The `sub` field in the JWT identifies the calling service (e.g. `"notification-service"`).
