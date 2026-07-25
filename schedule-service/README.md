# Schedule Service

NestJS v11 GraphQL microservice for managing customer appointments. Prisma ORM (PostgreSQL), Redis cache/queues, BullMQ mail queue, and JWT-based auth.

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
│   │   ├── auth.guard.ts          ← base guard
│   │   ├── internal.guard.ts      ← validates internal JWT
│   │   ├── external.guard.ts      ← calls Auth Service
│   │   ├── internal-token.service.ts
│   │   ├── token-validator.ts
│   │   └── strategies/
│   ├── cache/
│   │   ├── cache.module.ts        ← Global module
│   │   └── cache.service.ts       ← Redis-backed with JSON date reviver
│   ├── decorators/
│   │   ├── cacheable.decorator.ts ← @Cacheable(keyFn, ttl?)
│   │   └── skip-response-wrap.decorator.ts
│   ├── filters/
│   │   └── prisma-client-exception.filter.ts  ← P2001/P2002/P2025 mapping
│   ├── interceptors/
│   │   ├── logging.interceptor.ts ← request logging with input/error details
│   │   ├── response.interceptor.ts
│   │   └── cacheable.interceptor.ts
│   ├── pagination/
│   │   ├── pagination.type.ts     ← PaginatedType factory, PaginationMetaWrapper
│   │   ├── pagination.util.ts     ← normalizePagination, buildPaginatedResult
│   │   ├── pagination.interface.ts
│   │   └── pagination.dto.ts
│   └── mail/
│       ├── mail.service.ts        ← adds jobs to BullMQ 'mail' queue
│       ├── mail.processor.ts      ← WorkerHost + nodemailer
│       └── mail.constants.ts
│
├── modules/
│   ├── customer/               ← CRUD + paginated list
│   ├── doctor/                 ← CRUD + paginated list
│   ├── schedule/               ← CRUD (orchestrates customer/doctor lookups + email)
│   └── health/                 ← GET /health (server reachability)
│
└── prisma/
    ├── schema.prisma           ← Customer, Doctor, Schedule models
    └── migrations/
```

## Layers

| Layer | Responsibility | Examples |
|---|---|---|
| **Resolver** | GraphQL decorators, args, guards | `@Query(() => CustomerType)` |
| **Use Case** | Orchestration across services | Lookup customer/doctor, validate, create, send email |
| **Service** | Data access + cache | Prisma queries, `@Cacheable` on reads, direct cache invalidation on writes |

## Configuration

All env vars validated at startup via Zod schema. Injects as `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('MAIL_HOST', { infer: true })  // typed, no fallback
```

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL
- Redis

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
pnpm test          # unit (Jest) — 45 tests across 17 suites
pnpm test:e2e      # e2e (supertest)
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

### GraphQL — Customers

```graphql
# List customers (paginated)
query Customers($page: Int, $limit: Int) {
  customers(page: $page, limit: $limit) {
    data { id name email createdAt }
    meta {
      pagination { page limit total totalPages }
    }
  }
}

# Get customer by ID
query Customer($id: ID!) {
  customer(id: $id) { id name email createdAt }
}

# Create customer
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) { id name email }
}

# Update customer
mutation UpdateCustomer($input: UpdateCustomerInput!) {
  updateCustomer(input: $input) { id name email }
}

# Delete customer
mutation DeleteCustomer($id: ID!) {
  deleteCustomer(id: $id) { id }
}
```

### GraphQL — Doctors

```graphql
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
```

### GraphQL — Schedules

```graphql
query Schedules($page: Int, $limit: Int) {
  schedules(page: $page, limit: $limit) {
    data { id objective customerId doctorId scheduledAt }
    meta { pagination { page limit total totalPages } }
  }
}

query Schedule($id: ID!) { schedule(id: $id) { id objective customerId doctorId scheduledAt } }

mutation CreateSchedule($input: CreateScheduleInput!) {
  createSchedule(input: $input) { id objective customerId doctorId scheduledAt }
}

mutation DeleteSchedule($id: ID!) { deleteSchedule(id: $id) { id } }
```

### REST

```
GET /health    ← server reachability
```

All REST responses wrapped in: `{ statusCode, message, data, meta: { timestamp } }`

## Docker

```bash
# Build
podman compose build schedule-service

# Run with dependencies
podman compose up -d postgresql redis auth-service schedule-service

# Migrations
podman compose run --rm migrate-schedule-service
```

## Auth

Endpoints protected by `ExternalAuthGuard` — include a valid JWT from the Auth Service:

```http
Authorization: Bearer <token>
```
