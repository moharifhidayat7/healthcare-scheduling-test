# Repository Guidelines

## Project Overview

**Nest Microservice Boilerplate** — NestJS microservice boilerplate with GraphQL + REST, Prisma ORM, Redis cache/queues, and pluggable auth. A single-deployment NestJS v11 app that communicates with other services via HTTP + JWT (not a microservice mesh within this repo).

## Architecture & Data Flow

```
HTTP (Express) ──► AppModule
                      ├─► GlobalInterceptors (Logging, Response wrapper)
                      ├─► GlobalExceptionFilter
                      │
                      ├─► AuthModule ──► Guards ──► TokenValidators
                      │                    │           ├─ InternalJwtValidator (JwtService.verify)
                      │                    │           └─ RemoteAuthValidator (HTTP POST to Auth Service)
                      │                    └─► InternalTokenService (generates outgoing JWTs)
                      │
                      ├─► HealthModule ──► GET /health (Prisma ping + Redis ping)
                      │
                      ├─► GraphqlModule ──► Apollo Driver, autoSchemaFile
                      │
                      ├─► EmptyModule ──► Scaffold module (REST web/mobile + GraphQL)
                      │
                      ├─► PrismaModule ──► PrismaClient (PostgreSQL via @prisma/adapter-pg)
                      ├─► RedisModule ──► ioredis (lazy connect, lifecycle hooks)
                      ├─► BullMqModule ──► Global BullMQ config (reuses redis.* config)
                      │
                      └─► MailModule ──► MailService ──► BullMQ 'mail' queue ──► MailProcessor
                                                                                      ├─ Handlebars.render(template, context)
                                                                                      └─ Nodemailer.sendMail(SMTP)
```

**Config flow**: `src/config/*.config.ts` (Zod-validated `registerAs` factories) → `env.config.ts` barrel → `AppModule` load array → `ConfigService.get('namespace.key')` anywhere in DI.

**Auth flow**: `@UseGuards(InternalAuthGuard|ExternalAuthGuard)` → `AuthGuard.canActivate` extracts Bearer token → `TokenValidator.validate(token)` → attaches `request.user: JwtPayload`.

## Key Directories

| Path | Purpose |
|---|---|
| `src/config/` | Zod-validated config factories (`registerAs`), barrel `env.config.ts` |
| `src/integrations/` | Infrastructure modules: Prisma, Redis, BullMQ, GraphQL |
| `src/common/auth/` | Auth guards, validators, token service, decorator |
| `src/common/interceptors/` | Logging interceptor, response wrapper interceptor |
| `src/common/filters/` | Global exception filter |
| `src/common/pagination/` | Pagination DTO and interfaces |
| `src/common/decorators/` | Custom decorators (`@SkipResponseWrap`) |
| `src/modules/` | Feature modules: health, empty (scaffold), mail |
| `src/integrations/prisma/` | PrismaClient wrapper (v7, driver adapter pattern) |
| `test/` | E2E tests, mocks, jest configs |
| `prisma/` | Schema, migrations, seed |
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
└── spec.ts                     ← Tests (when present)
```

### Imports

- **No path aliases** — all imports are relative (`../../integrations/...`)
- Organize: NestJS decorators first, then project modules, then 3rd-party

### Config Factories

Every config factory uses this exact pattern:

```ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({ ... });
export default registerAs('namespace', () => schema.parse({
  key: process.env.ENV_VAR,
}));
```

Access via: `config.get<string>('namespace.key')` or `config.get<number>('namespace.key')`.

Existing namespaces: `app`, `database`, `auth`, `redis`, `mail`.

### Service Lifecycle

- **PrismaService**: Extends `PrismaClient`, constructs driver adapter in constructor, no explicit connect (PrismaClient connects lazily)
- **RedisService**: Extends `Redis` (ioredis), `lazyConnect: true`, connects in `onModuleInit`, quits in `onModuleDestroy`
- **MailProcessor**: `@Processor('mail')` extends `WorkerHost`, implements `process(job)`

### Auth Guards

- `AuthGuard` (abstract, not `@Injectable()`) implements `CanActivate` — takes `TokenValidator` via constructor
- `InternalAuthGuard` and `ExternalAuthGuard` are `@Injectable()` subclasses
- Both support REST and GraphQL contexts (checks `context.getType() === 'graphql'`)
- `@CurrentUser()` decorator extracts `request.user`

### Exception Handling

- `GlobalExceptionFilter` catches everything via `@Catch()`
- Returns: `{ statusCode, message, data: null, meta: { timestamp, path } }`
- Registered via `APP_FILTER` provider token

### Response Format

- All HTTP responses wrapped in: `{ statusCode, message, data, meta }`
- `@SkipResponseWrap()` decorator on handler/class to opt out
- Paginated responses detected by `{ data, meta: { pagination } }` shape

### Validation

- **Config**: Zod schemas in `src/config/` (validated at startup)
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
| `src/config/env.config.ts` | Barrel — re-exports all 5 config factories |
| `src/config/*.config.ts` | Config factories (app, database, auth, redis, mail) |
| `src/common/auth/auth.guard.ts` | Base auth guard — token extraction, delegation |
| `src/common/auth/token-validator.ts` | Abstract validator + `JwtPayload` interface |
| `src/common/interceptors/response.interceptor.ts` | Response envelope wrapper |
| `src/common/filters/global-exception.filter.ts` | Unified error response |
| `src/integrations/prisma/prisma.service.ts` | PrismaClient wrapper (v7 driver adapter) |
| `src/integrations/redis/redis.health.ts` | Health indicator for Redis |
| `src/modules/health/health.controller.ts` | `GET /health` endpoint |
| `src/modules/empty/` | Scaffold module (template for new features) |
| `prisma/schema.prisma` | Single `User` model |
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
- Place test files next to the code they test: `mail.service.ts` → `mail.service.spec.ts`

### E2E Tests

- Custom config at `test/jest-e2e.json`
- PrismaClient mocked via `moduleNameMapper` → `test/__mocks__/prisma-client.ts`
- DI overrides via `.overrideProvider()` for PrismaService/PrismaHealthIndicator
- App bootstrapped fresh per test via `Test.createTestingModule`

### Current Coverage

2 E2E tests (health endpoint, GraphQL hello query). **Zero unit tests.** Coverage configuration exists but no meaningful coverage yet.

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
