# Auth Service

[🇬🇧 English](./README.md)

API GraphQL + REST NestJS v11 dengan Prisma ORM (PostgreSQL), autentikasi JWT, dan hashing password bcrypt.

## Struktur

```
src/
├── app.module.ts              ← modul root
├── main.ts                    ← bootstrap dengan CORS, ValidationPipe, shutdown hooks
│
├── config/
│   └── env-vars.schema.ts     ← Skema validasi Zod + tipe Env
│
├── integrations/
│   ├── prisma/                ← Pembungkus PrismaClient (v7 driver adapter)
│   ├── redis/                 ← ioredis (koneksi lazy, lifecycle hooks)
│   ├── bullmq/                ← Konfigurasi BullMQ global
│   └── graphql/               ← Driver Apollo dengan format error validasi
│
├── common/
│   ├── auth/
│   │   ├── auth.guard.ts              ← guard dasar
│   │   ├── internal.guard.ts          ← memvalidasi JWT internal (INTERNAL_JWT_SECRET)
│   │   ├── internal-token.service.ts  ← menghasilkan JWT layanan-ke-layanan
│   │   ├── user-token.service.ts      ← menghasilkan JWT autentikasi pengguna (JWT_SECRET)
│   │   ├── token-validator.ts         ← kelas abstrak + tipe JwtPayload
│   │   └── strategies/
│   ├── cache/
│   │   ├── cache.module.ts            ← Modul global (berbasis Redis)
│   │   └── cache.service.ts
│   ├── decorators/
│   │   ├── cacheable.decorator.ts     ← @Cacheable(keyFn, ttl?)
│   │   └── skip-response-wrap.decorator.ts
│   ├── filters/
│   │   └── prisma-client-exception.filter.ts  ← Pemetaan P2001/P2002/P2025
│   ├── interceptors/
│   │   ├── logging.interceptor.ts     ← pencatatan request dengan detail input/error
│   │   ├── response.interceptor.ts
│   │   └── cacheable.interceptor.ts
│   ├── pagination/
│   │   ├── pagination.type.ts         ← Factory PaginatedType
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
│   └── health/                 ← GET /health (keterjangkauan server)
│
└── prisma/
    ├── schema.prisma           ← Model User
    ├── seed/
    └── migrations/
```

## Konfigurasi

Semua variabel lingkungan divalidasi saat startup melalui skema Zod. Injeksi sebagai `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('JWT_SECRET', { infer: true })  // bertipe, tanpa fallback
```

## Prasyarat

- Node.js 22+
- pnpm
- PostgreSQL

## Setup

```bash
pnpm install
pnpm prisma generate
cp .env.example .env
```

## Menjalankan

```bash
pnpm start:dev      # pengembangan
pnpm start:prod     # produksi
```

## Tes

```bash
pnpm test          # unit (Jest) — 14 tes di 4 suite
pnpm test:e2e      # e2e (supertest)
```

## Variabel Lingkungan

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `PORT` | tidak | `3000` | Port HTTP |
| `SERVICE_NAME` | tidak | `unknown` | Identitas untuk JWT internal |
| `NODE_ENV` | tidak | `development` | `development`, `production`, `test` |
| `DB_HOST` | tidak | `localhost` | Host PostgreSQL |
| `DB_PORT` | tidak | `5432` | Port PostgreSQL |
| `DB_USER` | tidak | `postgres` | User PostgreSQL |
| `DB_PASSWORD` | tidak | `postgres` | Password PostgreSQL |
| `DB_NAME` | tidak | `auth_service` | Nama database PostgreSQL |
| `DATABASE_URL` | ya | — | String koneksi lengkap |
| `INTERNAL_JWT_SECRET` | ya | — | Rahasia bersama untuk JWT layanan-ke-layanan |
| `JWT_SECRET` | ya | — | Rahasia bersama untuk JWT pengguna |
| `REDIS_HOST` | tidak | — | Host Redis (opsional) |
| `REDIS_PORT` | tidak | `6379` | Port Redis (opsional) |
| `REDIS_PASSWORD` | tidak | `''` | Password Redis |
| `REDIS_DB` | tidak | `0` | Indeks database Redis |
| `MAIL_HOST` | tidak | — | Host SMTP (opsional) |
| `MAIL_PORT` | tidak | `587` | Port SMTP (opsional) |
| `MAIL_USER` | tidak | — | User SMTP |
| `MAIL_PASSWORD` | tidak | — | Password SMTP |
| `MAIL_FROM` | tidak | `noreply@example.com` | Alamat pengirim default |

## Autentikasi

### Layanan-ke-Layanan

`InternalAuthGuard` memverifikasi JWT berumur pendek (5 menit, `INTERNAL_JWT_SECRET`) antar layanan.

```ts
// Layanan A — mengirim
const token = this.internalTokenService.generate();
await fetch('http://other-service/internal/endpoint', {
  headers: { Authorization: `Bearer ${token}` },
});

// Layanan B — menerima (berlaku untuk semua layanan yang menggunakan InternalAuthGuard)
@UseGuards(InternalAuthGuard)
@Post('internal/endpoint')
async handle(@CurrentUser() user: JwtPayload) {
  console.log(user.sub); // mengidentifikasi layanan pengirim
}
```

### Autentikasi Pengguna (GraphQL)

Tersedia di `POST /graphql`. Buka Apollo Sandbox di `http://localhost:3000/graphql`.

#### register

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) { token }
}
```

**Variabel:** `{ "input": { "email": "user@example.com", "password": "securePassword123" } }`

**Error:** `409 Conflict` — email sudah terdaftar.

#### login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) { token }
}
```

**Error:** `401 Unauthorized` — email atau password salah.

#### validateToken

```graphql
query ValidateToken($token: String!) {
  validateToken(token: $token) { sub email roles }
}
```

**Respons:** `{ "data": { "validateToken": { "sub": "uuid", "email": "user@example.com", "roles": ["user"] } } }`

**Error:** `401 Unauthorized` — token tidak valid atau kedaluwarsa.

#### Menggunakan token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Docker

```bash
podman compose build auth-service
podman compose up -d postgresql auth-service
podman compose run --rm migrate-auth-service
```
