# Repository Guidelines

## Project Overview

**Schedule Service** — NestJS v11 GraphQL microservice for managing customer appointments. Prisma ORM (PostgreSQL), Redis cache/queues, BullMQ mail queue, and pluggable auth. Communicates with the Auth Service via HTTP + JWT.

## Architecture & Data Flow

```
HTTP (Express) ──► AppModule
                      ├─► GlobalInterceptors (Logging, Response wrapper, Cacheable)
                      ├─► GlobalFilters (PrismaClientExceptionFilter)
                      │
                      ├─► AuthModule ──► Guards ──► TokenValidators
                      │                    │           ├─ InternalJwtValidator (JwtService.verify)
                      │                    │           └─ RemoteAuthValidator (HTTP POST to Auth Service)
                      │                    └─► InternalTokenService (generates outgoing JWTs)
                      │
                      ├─► HealthModule ──► GET /health (empty check — server reachability)
                      │
                      ├─► GraphqlModule ──► Apollo Driver, autoSchemaFile
                      │                       formatError includes validation detail messages
                      │
                      ├─► CustomerModule ──► Resolver ──► UseCases ──► CustomerService (data + cache)
                      │                                                      exports: CustomerService
                      ├─► DoctorModule ──► Resolver ──► UseCases ──► DoctorService (data + cache)
                      │                                                    exports: DoctorService
                      ├─► ScheduleModule ──► Resolver ──► UseCases (orchestrate)
                      │                                            │  ├─ CustomerService.findById
                      │                                            │  ├─ DoctorService.findById
                      │                                            │  └─ MailService.send
                      │                                            └─► ScheduleService (data + cache)
                      │
                      ├─► PrismaModule ──► PrismaClient (PostgreSQL via @prisma/adapter-pg)
                      ├─► RedisModule ──► ioredis (lazy connect, lifecycle hooks)
                      ├─► BullMqModule ──► Global BullMQ config (reuses redis.* config)
                      │
                      └─► MailModule ──► MailService ──► BullMQ 'mail' queue ──► MailProcessor
                                                                                      ├─ Handlebars.render(template, context)
                                                                                      └─ Nodemailer.sendMail(SMTP)
```

**Config flow**: `src/config/env-vars.schema.ts` (Zod-validated) → `ConfigModule.forRoot<Env>()` → `ConfigService<Env, true>.get('KEY', { infer: true })` anywhere in DI.

**Auth flow**: `@UseGuards(InternalAuthGuard|ExternalAuthGuard)` → `AuthGuard.canActivate` extracts Bearer token → `TokenValidator.validate(token)` → attaches `request.user: JwtPayload`.

## Key Directories

| Path | Purpose |
|---|---|
| `src/config/` | Zod env var schema + inferred `Env` type |
| `src/integrations/` | Infrastructure modules: Prisma, Redis, BullMQ, GraphQL |
| `src/common/auth/` | Auth guards, validators, token service, decorator |
| `src/common/cache/` | `CacheService` (Redis-backed with JSON date reviver), `CacheModule` |
| `src/common/interceptors/` | Logging interceptor, response wrapper interceptor, cacheable interceptor |
| `src/common/filters/` | `PrismaClientExceptionFilter` (P2001/P2002/P2025 mapping) |
| `src/common/pagination/` | `normalizePagination` util, `PaginatedType` factory, interfaces, DTO |
| `src/common/decorators/` | `@Cacheable`, `@SkipResponseWrap`, `@Paginated` |
| `src/common/mail/` | Mail queue (BullMQ) + nodemailer transport |
| `src/modules/` | Feature modules: customer, doctor, schedule, health |
| `src/integrations/prisma/` | PrismaClient wrapper (v7, driver adapter pattern) |
| `test/` | E2E tests, mocks, jest configs |
| `prisma/` | Schema, migrations |
| `scripts/` | Dev utility scripts |

## Development Commands

| Command | Action | Tool |
|---|---|---|
| `pnpm build` | Compile to `dist/` | `nest build` |
| `pnpm start` | Run in production mode | `nest start` |
| `pnpm start:dev` | Watch mode | `nest start --watch` |
| `pnpm start:debug` | Debug + watch | `nest start --debug --watch` |
| `pnpm start:prod` | Run compiled output | `node dist/main` |
| `pnpm test` | Unit tests | Jest (rootDir: `src/`) |
| `pnpm test:watch` | Watch mode | `jest --watch` |
| `pnpm test:cov` | With coverage | `jest --coverage` |
| `pnpm test:e2e` | E2E tests | `jest --config ./test/jest-e2e.json` |
| `pnpm lint` | Lint + auto-fix | ESLint flat config |
| `pnpm format` | Format code | Prettier |

## Code Conventions & Common Patterns

### Module Structure

Each module follows the NestJS convention:
```
module/
├── module-name.module.ts       ← @Module({ imports, providers, controllers, exports })
├── module-name.service.ts       ← @Injectable() data access + cache (shared across modules)
├── graphql/                     ← @Resolver(), @ObjectType, @InputType
├── use-cases/                   ← @Injectable() orchestration logic
└── *.spec.ts                    ← Tests alongside source
```

### Layer Responsibilities

- **Resolver** — GraphQL-specific concerns (decorators, args, guards). Delegates to use case.
- **Use Case** — Orchestration: calls services across modules, sends emails, sequences operations.
- **Service** — Data access (Prisma) + cache (CacheService). Exported from module for cross-module injection.

### Caching Pattern

- `@Cacheable(keyFn, ttl?)` on read methods (`findAll`, `findById`)
- Direct `this.cache.del(key)` / `this.cache.delByPattern(pattern)` in write methods (`create`, `update`, `delete`)
- Cache key function receives method arguments: `@Cacheable((id) => \`entity:${id}\`)`
- JSON date reviver in `CacheService.get()` converts ISO strings back to `Date` objects

### Pagination

- `normalizePagination(page?, limit?)` → clamps page ≥ 1, limit 1-100
- `buildPaginatedResult(data, total, { page, limit })` → `{ data, meta: { pagination: { page, limit, total, totalPages } } }`
- GraphQL types: `PaginatedType(EntityType)` → `meta { pagination { ... } }`

### Config Validation

Zod schema in `src/config/env-vars.schema.ts`. Injects as `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('MAIL_HOST', { infer: true })  // typed, no fallback
this.config.get('MAIL_USER', { infer: true })         // string | undefined for optional keys
```

### Exception Handling

- `PrismaClientExceptionFilter` catches `PrismaClientKnownRequestError`
  - P2001 / P2025 → `NotFoundException`
  - P2002 (unique constraint) → `ConflictException` with field names from `meta.target`
- Unknown Prisma codes re-thrown
- Registered via `APP_FILTER` provider token

### Validation

- **Config**: Zod schema in `src/config/` (validated at startup, `z.infer` provides `Env` type)
- **Runtime**: `class-validator` + `class-transformer` via NestJS `ValidationPipe` (global, `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)

### BullMQ Queues

- Global connection configured in `BullMqModule` (reads `redis.*` config)
- Register queues via `BullModule.registerQueue({ name })` in feature modules
- Consumers extend `WorkerHost` with `@Processor(name)` decorator
- Mail queue: `MailService.send()` → BullMQ 'mail' queue → `MailProcessor.process()` → nodemailer

## Important Files

| File | Role |
|---|---|
| `src/main.ts` | Bootstrap: `NestFactory.create`, CORS, ValidationPipe, shutdown hooks, listen on `PORT` |
| `src/app.module.ts` | Root module — wires all integrations, modules, global interceptors/filters |
| `src/config/env-vars.schema.ts` | Zod validation schema + `Env` type |
| `src/common/filters/prisma-client-exception.filter.ts` | Prisma error → NestJS exception mapping |
| `src/common/cache/cache.service.ts` | Redis-backed cache with JSON date reviver |
| `src/common/decorators/cacheable.decorator.ts` | `@Cacheable(keyFn, ttl?)` decorator |
| `src/common/interceptors/cacheable.interceptor.ts` | Cache-aside interceptor |
| `src/common/pagination/pagination.util.ts` | `normalizePagination`, `buildPaginatedResult` |
| `src/common/pagination/pagination.type.ts` | `PaginationMetaType`, `PaginationMetaWrapper`, `PaginatedType` |
| `src/common/interceptors/logging.interceptor.ts` | Request logging with input args and error stacks |
| `src/common/interceptors/response.interceptor.ts` | Response envelope wrapper |
| `src/common/auth/auth.guard.ts` | Base auth guard — token extraction, delegation |
| `src/common/auth/token-validator.ts` | Abstract validator + `JwtPayload` interface |
| `src/integrations/prisma/prisma.service.ts` | PrismaClient wrapper (v7 driver adapter) |
| `src/integrations/graphql/graphql.module.ts` | Apollo driver config with validation error format |
| `src/modules/health/health.controller.ts` | `GET /health` endpoint |
| `prisma/schema.prisma` | `Customer`, `Doctor`, `Schedule` models |
| `prisma.config.ts` | Prisma v7 `defineConfig` |
| `Dockerfile` | Multi-stage pnpm build |

## Runtime/Tooling Preferences

| Aspect | Choice |
|---|---|
| **Node version** | 22+ (Alpine in Docker) |
| **Package manager** | pnpm (frozen lockfile, offline mode in Docker) |
| **Language** | TypeScript 5.7, target ES2023, module `nodenext` |
| **Strictness** | `strictNullChecks` + `noImplicitAny` (not full `strict`) |
| **Decorators** | `experimentalDecorators` + `emitDecoratorMetadata` (NestJS requirement) |
| **Formatting** | Prettier (singleQuote, trailingComma: all) |
| **Linting** | ESLint flat config, type-aware, Prettier integration |
| **DI** | Constructor-based (NestJS standard) |
| **No path aliases** | Use relative imports throughout |

## Testing & QA

### Frameworks

- **Runner**: Jest 30.x with `ts-jest` transformer
- **Config**: Embedded in `package.json` (not a separate file)
- **HTTP assertions**: `supertest` (E2E tests)
- **Test utilities**: `@nestjs/testing` (`Test.createTestingModule`)

### Running Tests

```bash
pnpm test          # Unit tests (matches src/**/*.spec.ts)
pnpm test:e2e      # E2E tests (matches test/*.e2e-spec.ts)
pnpm test:cov      # With coverage (output in /coverage)
pnpm test:watch    # Watch mode
```

### Unit Test Configuration

- **rootDir**: `src` — specs live alongside source
- **testRegex**: `.*\.spec\.ts$` — any `*.spec.ts` under `src/`
- **collectCoverageFrom**: `**/*.(t|j)s`
- Place test files next to the code they test

### Mock Pattern

Use case tests mock services directly (not Prisma):

```ts
const customerService = { findById: jest.fn() };
const module = await Test.createTestingModule({
  providers: [
    CreateScheduleUseCase,
    { provide: CustomerService, useValue: customerService },
    { provide: DoctorService, useValue: doctorService },
    { provide: ScheduleService, useValue: scheduleService },
  ],
}).compile();
```
