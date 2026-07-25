# Schedule Service

[🇬🇧 English](./README.md)

Layanan GraphQL NestJS v11 untuk manajemen janji temu pelanggan. Menggunakan Prisma ORM (PostgreSQL), Redis cache/antrean, BullMQ antrean email, dan autentikasi JWT.

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
│   │   ├── auth.guard.ts          ← guard dasar
│   │   ├── internal.guard.ts      ← memvalidasi JWT internal
│   │   ├── external.guard.ts      ← memanggil Auth Service
│   │   ├── internal-token.service.ts
│   │   ├── token-validator.ts
│   │   └── strategies/
│   ├── cache/
│   │   ├── cache.module.ts        ← Modul global
│   │   └── cache.service.ts       ← Berbasis Redis dengan JSON date reviver
│   ├── decorators/
│   │   ├── cacheable.decorator.ts ← @Cacheable(keyFn, ttl?)
│   │   └── skip-response-wrap.decorator.ts
│   ├── filters/
│   │   └── prisma-client-exception.filter.ts  ← Pemetaan P2001/P2002/P2025
│   ├── interceptors/
│   │   ├── logging.interceptor.ts ← pencatatan request dengan detail input/error
│   │   ├── response.interceptor.ts
│   │   └── cacheable.interceptor.ts
│   ├── pagination/
│   │   ├── pagination.type.ts     ← Factory PaginatedType, PaginationMetaWrapper
│   │   ├── pagination.util.ts     ← normalizePagination, buildPaginatedResult
│   │   ├── pagination.interface.ts
│   │   └── pagination.dto.ts
│   └── mail/
│       ├── mail.service.ts        ← menambah pekerjaan ke antrean BullMQ 'mail'
│       ├── mail.processor.ts      ← WorkerHost + nodemailer
│       └── mail.constants.ts
│
├── modules/
│   ├── customer/               ← CRUD + daftar berpaginasi
│   ├── doctor/                 ← CRUD + daftar berpaginasi
│   ├── schedule/               ← CRUD (mengorkestrasi pencarian customer/doctor + email)
│   └── health/                 ← GET /health (keterjangkauan server)
│
└── prisma/
    ├── schema.prisma           ← Model Customer, Doctor, Schedule
    └── migrations/
```

## Lapisan

| Lapisan | Tanggung Jawab | Contoh |
|---|---|---|
| **Resolver** | Dekorator GraphQL, argumen, guard | `@Query(() => CustomerType)` |
| **Use Case** | Orkestrasi antar layanan | Cari customer/doctor, validasi, buat, kirim email |
| **Service** | Akses data + cache | Query Prisma, `@Cacheable` pada baca, invalidasi cache langsung pada tulis |

## Konfigurasi

Semua variabel lingkungan divalidasi saat startup melalui skema Zod. Injeksi sebagai `ConfigService<Env, true>`:

```ts
constructor(private config: ConfigService<Env, true>) {}
this.config.getOrThrow('MAIL_HOST', { infer: true })  // bertipe, tanpa fallback
```

## Prasyarat

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

## Menjalankan

```bash
pnpm start:dev      # pengembangan
pnpm start:prod     # produksi
```

## Tes

```bash
pnpm test          # unit (Jest) — 45 tes di 17 suite
pnpm test:e2e      # e2e (supertest)
```

## Variabel Lingkungan

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `PORT` | tidak | `3000` | Port HTTP |
| `SERVICE_NAME` | tidak | `schedule_service` | Identitas untuk JWT internal |
| `NODE_ENV` | tidak | `development` | `development`, `production`, `test` |
| `DB_HOST` | tidak | `localhost` | Host PostgreSQL |
| `DB_PORT` | tidak | `5432` | Port PostgreSQL |
| `DB_USER` | tidak | `postgres` | User PostgreSQL |
| `DB_PASSWORD` | tidak | `postgres` | Password PostgreSQL |
| `DB_NAME` | tidak | `schedule_service` | Nama database PostgreSQL |
| `DATABASE_URL` | ya | — | String koneksi lengkap |
| `INTERNAL_JWT_SECRET` | ya | — | Rahasia bersama untuk JWT internal |
| `AUTH_SERVICE_URL` | ya | — | Endpoint GraphQL Auth Service |
| `REDIS_HOST` | ya | — | Host Redis |
| `REDIS_PORT` | tidak | `6379` | Port Redis |
| `REDIS_PASSWORD` | tidak | `''` | Password Redis |
| `REDIS_DB` | tidak | `0` | Indeks database Redis |
| `MAIL_HOST` | ya | — | Host SMTP |
| `MAIL_PORT` | tidak | `587` | Port SMTP |
| `MAIL_USER` | tidak | — | User SMTP (opsional) |
| `MAIL_PASSWORD` | tidak | — | Password SMTP (opsional) |
| `MAIL_FROM` | tidak | `noreply@example.com` | Alamat pengirim default |

## API

### GraphQL — Pelanggan

```graphql
# Daftar pelanggan (berpaginasi)
query Customers($page: Int, $limit: Int) {
  customers(page: $page, limit: $limit) {
    data { id name email createdAt }
    meta {
      pagination { page limit total totalPages }
    }
  }
}

# Cari pelanggan berdasarkan ID
query Customer($id: ID!) {
  customer(id: $id) { id name email createdAt }
}

# Buat pelanggan
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) { id name email }
}

# Ubah pelanggan
mutation UpdateCustomer($input: UpdateCustomerInput!) {
  updateCustomer(input: $input) { id name email }
}

# Hapus pelanggan
mutation DeleteCustomer($id: ID!) {
  deleteCustomer(id: $id) { id }
}
```

### GraphQL — Dokter

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

### GraphQL — Jadwal

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
GET /health    ← keterjangkauan server
```

Semua respons REST dibungkus dalam: `{ statusCode, message, data, meta: { timestamp } }`

## Docker

```bash
# Bangun
podman compose build schedule-service

# Jalankan dengan dependensi
podman compose up -d postgresql redis auth-service schedule-service

# Migrasi
podman compose run --rm migrate-schedule-service
```

## Autentikasi

Endpoint dilindungi oleh `ExternalAuthGuard` — sertakan JWT valid dari Auth Service:

```http
Authorization: Bearer <token>
```
