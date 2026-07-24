# Repository Guidelines

## Project Overview

**Auth Service** — NestJS v11 GraphQL + REST API with Prisma ORM (PostgreSQL), JWT auth, and bcrypt password hashing. A standalone auth service handling user registration, login, and token validation.

## Architecture & Data Flow

```
HTTP (Express) ──► AppModule
                      ├─► GlobalInterceptors (Logging, Response wrapper)
                      ├─► GlobalExceptionFilter
                      │
                      ├─► AuthModule ──► Guards
                      │    │                └─ InternalAuthGuard ← InternalJwtValidator (JwtService.verify, INTERNAL_JWT_SECRET)
                      │    │
                      │    ├─► UserTokenService ──► JWT (JWT_SECRET) for user auth
                      │    └─► UserJwtValidator ──► validates user tokens
                      │
                      ├─► AuthModule (feature) ──► GraphQL resolver ──► use-cases
                      │    ├─ RegisterUseCase       (bcrypt hash + Prisma create)
                      │    ├─ LoginUseCase          (bcrypt compare + token)
                      │    └─ ValidateTokenUseCase  (JWT verify → user info)
                      │
                      ├─► HealthModule ──► GET /health (Prisma ping)
                      │
                      ├─► GraphqlModule ──► Apollo Driver, autoSchemaFile
                      │                      Default: POST /graphql
                      │
                      ├─► EmptyModule ──► Scaffold module (REST web/mobile + GraphQL)
                      ├─► PrismaModule ──► PrismaClient (PostgreSQL via @prisma/adapter-pg)
                      ├─► RedisModule ──► ioredis (commented out — optional)
                      ├─► BullMqModule ──► BullMQ (commented out — optional)
                      └─► MailModule ──► MailService / MailProcessor (commented out — optional)
                                           ├─ Handlebars.render(template, context)
                                           └─ Nodemailer.sendMail(SMTP)
```

**Config flow**: `src/config/env-vars.schema.ts` (Joi-validated) → `ConfigModule.forRoot()` → `ConfigService.get('ENV_VAR_NAME')` anywhere in DI. No namespacing — values accessed directly by env var name.

**Auth flow** (user-facing): `register` mutation → `RegisterUseCase` → bcrypt hash → Prisma create → `UserTokenService.generate()` → JWT (signed with `JWT_SECRET`).

**Auth flow** (service-to-service): `@UseGuards(InternalAuthGuard)` → `AuthGuard.canActivate` extracts Bearer token → `InternalJwtValidator.validate(token)` → attaches `request.user: JwtPayload`.

## Key Directories

| Path | Purpose |
|---|---|
| `src/config/` | Joi env var schema (`env-vars.schema.ts`) |
| `src/integrations/` | Infrastructure modules: Prisma, GraphQL, Redis (opt), BullMQ (opt) |
| `src/common/auth/` | Auth guards, JWT validators (internal + user), token services, decorator |
| `src/common/mail/` | Mail module (commented out — optional) |
| `src/common/interceptors/` | Logging interceptor, response wrapper interceptor |
| `src/common/filters/` | Global exception filter |
| `src/common/pagination/` | Pagination DTO and interfaces |
| `src/common/decorators/` | Custom decorators (`@SkipResponseWrap`) |
| `src/modules/` | Feature modules: auth, health, empty (scaffold) |
| `src/integrations/prisma/` | PrismaClient wrapper (v7, driver adapter pattern) |
| `test/` | E2E tests, mocks, jest configs |
| `prisma/` | Schema, migrations, seed (bcrypt hashed password) |
| `scripts/` | Dev utility scripts (e.g., `generate-token.ts`) |

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
├── module-name.processor.ts     ← @Processor() BullMQ worker (if queued)
├── interfaces/                  ← TypeScript interfaces
├── use-cases/                   ← @Injectable() use-case classes
├── rest/{web,mobile}/           ← @Controller() with DTOs
├── graphql/                     ← @Resolver(), @ObjectType, @InputType
└── *.spec.ts                    ← Tests alongside source
```

### Imports

- **No path aliases** — all imports are relative (`../../integrations/...`)
- Organize: NestJS decorators first, then project modules, then 3rd-party

### Config Validation

All environment variables validated at startup via a single Joi schema in `src/config/env-vars.schema.ts`. Values accessed directly by env var name through `ConfigService`:

```ts
const host = config.get<string>('REDIS_HOST');
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

- `GlobalExceptionFilter` catches everything via `@Catch()`
- Returns: `{ statusCode, message, data: null, meta: { timestamp, path } }`
- Registered via `APP_FILTER` provider token

### Response Format

- All HTTP responses wrapped in: `{ statusCode, message, data, meta }`
- `@SkipResponseWrap()` decorator on handler/class to opt out
- Paginated responses detected by `{ data, meta: { pagination } }` shape

### Validation

- **Config**: Joi schema in `src/config/env-vars.schema.ts` (validated at startup)
- **Runtime**: `class-validator` + `class-transformer` via NestJS `ValidationPipe` (global, `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)

### BullMQ Queues

- Global connection configured in `BullMqModule` (reads `redis.*` config)
- Register queues via `BullModule.registerQueue({ name })` in feature modules
- Consumers extend `WorkerHost` with `@Processor(name)` decorator

## Important Files

| File | Role |
|---|---|
| `src/main.ts` | Bootstrap: `NestFactory.create`, CORS, ValidationPipe, shutdown hooks, listen on `PORT` |
| `src/app.module.ts` | Root module — wires all integrations, modules, global interceptors/filters |
| `src/config/env-vars.schema.ts` | Joi validation schema for all env vars |
| `src/common/auth/auth.guard.ts` | Base auth guard — token extraction, delegation |
| `src/common/auth/token-validator.ts` | Abstract validator + `JwtPayload` interface |
| `src/common/auth/user-token.service.ts` | Generates user-facing JWTs (`JWT_SECRET`) |
| `src/common/auth/strategies/user-jwt.validator.ts` | Validates user-facing JWTs |
| `src/common/auth/strategies/internal-jwt.validator.ts` | Validates service-to-service JWTs |
| `src/common/auth/internal-token.service.ts` | Generates outgoing service-to-service JWTs (`INTERNAL_JWT_SECRET`) |
| `src/common/interceptors/response.interceptor.ts` | Response envelope wrapper |
| `src/common/filters/global-exception.filter.ts` | Unified error response |
| `src/integrations/prisma/prisma.service.ts` | PrismaClient wrapper (v7 driver adapter) |
| `src/modules/auth/` | GraphQL auth module — resolver + use-cases |
| `src/modules/health/health.controller.ts` | `GET /health` endpoint |
| `src/modules/empty/` | Scaffold module (template for new features) |
| `prisma/schema.prisma` | `User` model with bcrypt-hashed password |
| `prisma/seed/index.ts` | Seed script using bcrypt for password hash |
| `prisma.config.ts` | Prisma v7 `defineConfig` |
| `test/app.e2e-spec.ts` | E2E smoke tests |
| `Dockerfile` | Multi-stage pnpm build |

## Runtime/Tooling Preferences

| Aspect | Choice |
|---|---|
| **Node version** | 22+ (Alpine in Docker) |
| **Package manager** | pnpm (frozen lockfile, offline mode in Docker) |
| **Language** | TypeScript 5.7, target ES2023, module `nodenext` |
| **Strictness** | `strictNullChecks` + `noImplicitAny` (not full `strict`) |
| **Decorators** | `experimentalDecorators` + `emitDecoratorMetadata` (NestJS requirement) |
| **Formatting** | Prettier (singleQuote, trailingComma: all, no semicolon override → required) |
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
- Place test files next to the code they test: `register.use-case.ts` → `register.use-case.spec.ts`

### E2E Tests

- Custom config at `test/jest-e2e.json`
- PrismaClient mocked via `moduleNameMapper` → `test/__mocks__/prisma-client.ts`
- DI overrides via `.overrideProvider()` for PrismaService/PrismaHealthIndicator
- App bootstrapped fresh per test via `Test.createTestingModule`

### Current Coverage

2 E2E tests (health endpoint, GraphQL hello query).
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
