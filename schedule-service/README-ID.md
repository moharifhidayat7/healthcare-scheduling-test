# Schedule Service

[🇬🇧 English](./README.md)

Layanan GraphQL NestJS v11 untuk manajemen janji temu pelanggan. Menggunakan Prisma ORM (PostgreSQL), Redis cache/antrean, BullMQ antrean email, dan autentikasi JWT.

## Struktur Proyek

```
src/
├── config/
│   └── env-vars.schema.ts         ← Validasi Zod + tipe Env
├── integrations/
│   ├── prisma/                    ← PrismaClient (PostgreSQL)
│   ├── redis/                     ← ioredis
│   ├── bullmq/                    ← Konfigurasi BullMQ
│   └── graphql/                   ← Driver Apollo
├── common/
│   ├── auth/                      ← Guard, validator, layanan token
│   ├── cache/                     ← CacheService (Redis)
│   ├── dekorator/                 ← @Cacheable, @SkipResponseWrap
│   ├── filter/                    ← PrismaClientExceptionFilter
│   ├── interceptor/               ← Logging, response wrapper, cacheable
│   └── pagination/                ← PaginatedType, normalizePagination
├── modules/
│   └── <nama-modul>/
│       ├── <nama-modul>.module.ts ← Definisi @Module
│       ├── <nama-modul>.service.ts ← Akses data + cache
│       ├── graphql/
│       │   ├── <nama-modul>.resolver.ts
│       │   ├── inputs/              ← Kelas @InputType
│       │   └── types/               ← Kelas @ObjectType
│       ├── rest/
│       │   ├── <nama-modul>.controller.ts
│       │   └── dto/                 ← DTO request/response
│       └── use-cases/               ← Logika orkestrasi
└── prisma/
    └── schema.prisma              ← Model Customer, Doctor, Schedule

## Prasyarat

- Node.js 22+
- pnpm
- PostgreSQL 17 (berjalan)
- Redis 7 (berjalan)
- Auth Service berjalan dan dapat diakses

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env sesuai infrastruktur Anda
pnpm prisma generate
pnpm prisma migrate deploy
```

## Menjalankan

```bash
pnpm start:dev      # pengembangan (watch mode)
pnpm start          # produksi
pnpm start:prod     # output kompilasi (node dist/src/main.js)
```

Endpoint GraphQL di `POST /graphql` pada port yang dikonfigurasi (default 3002).

## Docker

```bash
# Bangun
docker build -t schedule-service:latest .

# Jalankan (membutuhkan PostgreSQL dan Redis yang dapat diakses via konfigurasi ENV)
docker run -d \
  --name schedule-service \
  --env-file .env \
  -p 3002:3000 \
  schedule-service:latest
```

## Tes

```bash
pnpm test          # unit (Jest) — 45 tes di 17 suite
pnpm test:e2e      # e2e (supertest)
pnpm test:cov      # dengan coverage
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

### GraphQL

```graphql
# Pelanggan
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

# Dokter
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

# Jadwal
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
GET /health    ← keterjangkauan server
```

## Autentikasi

### Eksternal (JWT pengguna)

Sertakan JWT dari `register` atau `login` di header `Authorization` untuk permintaan terautentikasi:

```http
Authorization: Bearer <token>
```

### Internal (layanan-ke-layanan)

`InternalAuthGuard` memverifikasi JWT berumur pendek (5 menit, `INTERNAL_JWT_SECRET`) antar layanan.

```ts
// Layanan pemanggil — buat token
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

Nilai `sub` dalam JWT mengidentifikasi layanan pemanggil (misalnya `"notification-service"`).
