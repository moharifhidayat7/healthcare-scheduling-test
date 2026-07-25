# Repository Guidelines

## Project Overview

**Auth Service** — NestJS v11 GraphQL + REST API with Prisma ORM (PostgreSQL), JWT auth, and bcrypt password hashing. A standalone auth service handling user registration, login, and token validation.

## Architecture & Data Flow

```
HTTP (Express) ──► AppModule
                      ├─► GlobalInterceptors (Logging, Response wrapper, Cacheable)
                      ├─► GlobalFilters (PrismaClientExceptionFilter)
                      │
                      ├─► AuthModule (auth) ──► Guards
                      │    │                       └─ InternalAuthGuard ← InternalJwtValidator (JwtService.verify, INTERNAL_JWT_SECRET)
                      │    │
                      │    ├─► UserTokenService ──► JWT (JWT_SECRET) for user auth
                      │    └─► UserJwtValidator ──► validates user tokens
                      │
                      ├─► AuthModule (feature) ──► GraphQL resolver ──► use-cases
                      │    ├─ RegisterUseCase       (bcrypt hash + Prisma create)
                      │    ├─ LoginUseCase          (bcrypt compare + token)
                      │    └─ ValidateTokenUseCase  (JWT verify → user info)
                      │
                      ├─► HealthModule ──► GET /health (empty check — server reachability)
                      │
                      ├─► GraphqlModule ──► Apollo Driver, autoSchemaFile
                      │                       formatError includes validation detail messages
                      │
                      ├─► CacheModule ──► CacheService (Redis-backed with JSON date reviver)
                      │
                      ├─► PrismaModule ──► PrismaClient (PostgreSQL via @prisma/adapter-pg)
                      ├─► RedisModule ──► ioredis (lazy connect, lifecycle hooks)
                      ├─► BullMqModule ──► Global BullMQ config (reuses redis.* config)
                      └─► MailModule ──► MailService / MailProcessor (BullMQ + nodemailer)
                                           ├─ Handlebars.render(template, context)
                                           └─ Nodemailer.sendMail(SMTP)
```

**Config flow**: `src/config/env-vars.schema.ts` (Zod-validated) → `ConfigModule.forRoot<Env>()` → `ConfigService<Env, true>.get('KEY', { infer: true })` anywhere in DI.

**Auth flow** (user-facing): `register` mutation → `RegisterUseCase` → bcrypt hash → Prisma create → `UserTokenService.generate()` → JWT (signed with `JWT_SECRET`).

**Auth flow** (service-to-service): `@UseGuards(InternalAuthGuard)` → `AuthGuard.canActivate` extracts Bearer token → `InternalJwtValidator.validate(token)` → attaches `request.user: JwtPayload`.

## Key Directories

| Path | Purpose |
|---|---|
| `src/config/` | Zod env var schema + inferred `Env` type |
| `src/integrations/` | Infrastructure modules: Prisma, Redis, BullMQ, GraphQL |
| `src/common/cache/` | `CacheService` (Redis-backed with JSON date reviver), `CacheModule` |
| `src/common/auth/` | Auth guards, JWT validators (internal + user), token services, decorator |
| `src/common/mail/` | Mail queue (BullMQ) + nodemailer transport |
| `src/common/interceptors/` | Logging interceptor, response wrapper interceptor, cacheable interceptor |
| `src/common/filters/` | `PrismaClientExceptionFilter` (P2001/P2002/P2025 mapping) |
| `src/common/pagination/` | `normalizePagination` util, `PaginatedType` factory, interfaces, DTO |
| `src/common/decorators/` | `@Cacheable`, `@SkipResponseWrap`, `@Paginated` |
| `src/modules/` | Feature modules: auth, health |
| `src/integrations/prisma/` | PrismaClient wrapper (v7, driver adapter pattern) |
| `test/` | E2E tests, mocks, jest configs |
| `prisma/` | Schema, migrations, seed |
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
├── module-name.service.ts       ← @Injectable() business logic
├── graphql/                     ← @Resolver(), @ObjectType, @InputType
├── use-cases/                   ← @Injectable() application logic
└── *.spec.ts                    ← Tests alongside source
```

### Imports

- **No path aliases** — all imports are relative (`../../integrations/...`)
- Organize: NestJS decorators first, then project modules, then 3rd-party

### Config Validation

Zod schema in `src/config/env-vars.schema.ts`. Injects as `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('JWT_SECRET', { infer: true })  // typed, no fallback
this.config.get('MAIL_USER', { infer: true })          // string | undefined for optional keys
```

### Service Lifecycle

- **PrismaService**: Extends `PrismaClient`, constructs driver adapter in constructor, no explicit connect (PrismaClient connects lazily)
- **RedisService**: Extends `Redis` (ioredis), `lazyConnect: true`, connects in `onModuleInit`, quits in `onModuleDestroy`
- **MailProcessor**: `@Processor('mail')` extends `WorkerHost`, implements `process(job)`

### Auth Guards

- `AuthGuard` (abstract, not `@Injectable()`) implements `CanActivate` — takes `TokenValidator` via constructor
- `InternalAuthGuard` is the `@Injectable()` subclass for service-to-service JWT validation
- Supports both REST and GraphQL contexts (checks `context.getType() === 'graphql'`)
- `@CurrentUser()` decorator extracts `request.user`

### User Auth (GraphQL)

- `register(email, password)` → bcrypt hash → Prisma create → user JWT
- `login(email, password)` → bcrypt compare → user JWT
- `validateToken(token)` → verify user JWT → user info payload
- User tokens signed with `JWT_SECRET` (24h expiry), service-to-service tokens use `INTERNAL_JWT_SECRET` (5m expiry)
- Business logic in `use-cases/` classes, resolver delegates directly to them

### Exception Handling

- `PrismaClientExceptionFilter` catches `PrismaClientKnownRequestError`
  - P2001 / P2025 → `NotFoundException`
  - P2002 (unique constraint) → `ConflictException` with field names from `meta.target`
- Unknown Prisma codes re-thrown
- Registered via `APP_FILTER` provider token

### Response Format

- All HTTP responses wrapped in: `{ statusCode, message, data, meta }`
- `@SkipResponseWrap()` decorator on handler/class to opt out
- Paginated responses detected by `{ data, meta: { pagination } }` shape

### Validation

- **Config**: Zod schema in `src/config/` (validated at startup, `z.infer` provides `Env` type)
- **Runtime**: `class-validator` + `class-transformer` via NestJS `ValidationPipe` (global, `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)

### BullMQ Queues

- Global connection configured in `BullMqModule` (reads `redis.*` config)
- Register queues via `BullModule.registerQueue({ name })` in feature modules
- Consumers extend `WorkerHost` with `@Processor(name)` decorator

### Caching Pattern

- `@Cacheable(keyFn, ttl?)` on read methods
- Direct `this.cache.del(key)` / `this.cache.delByPattern(pattern)` in write methods
- JSON date reviver in `CacheService.get()` converts ISO strings back to `Date` objects

### Pagination (future use)

- `normalizePagination(page?, limit?)` → clamps page ≥ 1, limit 1-100
- `buildPaginatedResult(data, total, { page, limit })` → `{ data, meta: { pagination: ... } }`
- GraphQL types: `PaginatedType(EntityType)` → `meta { pagination { ... } }`

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
| `src/common/interceptors/logging.interceptor.ts` | Request logging with input args and error stacks |
| `src/common/interceptors/response.interceptor.ts` | Response envelope wrapper |
| `src/common/auth/auth.guard.ts` | Base auth guard — token extraction, delegation |
| `src/common/auth/token-validator.ts` | Abstract validator + `JwtPayload` interface |
| `src/common/auth/user-token.service.ts` | Generates user-facing JWTs (`JWT_SECRET`) |
| `src/integrations/prisma/prisma.service.ts` | PrismaClient wrapper (v7 driver adapter) |
| `src/integrations/graphql/graphql.module.ts` | Apollo driver config with validation error format |
| `src/modules/auth/` | GraphQL auth module — resolver + use-cases |
| `src/modules/health/health.controller.ts` | `GET /health` endpoint |
| `prisma/schema.prisma` | `User` model with bcrypt-hashed password |
| `prisma/seed/index.ts` | Seed script using bcrypt for password hash |
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

### E2E Tests

- Custom config at `test/jest-e2e.json`
- PrismaClient mocked via `moduleNameMapper` → `test/__mocks__/prisma-client.ts`
- App bootstrapped fresh per test via `Test.createTestingModule`

### Current Coverage

14 unit tests across 4 test suites (resolver + 3 use-cases).

### Mock Pattern (E2E)

```ts
// test/__mocks__/prisma-client.ts — class stub mapped via moduleNameMapper
class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
  user = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  };
}
```
