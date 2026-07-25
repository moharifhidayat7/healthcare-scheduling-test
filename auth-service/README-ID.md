# Auth Service

[🇬🇧 English](./README.md)

API GraphQL + REST NestJS v11 dengan Prisma ORM (PostgreSQL), autentikasi JWT, dan hashing password bcrypt.

## Prasyarat

- Node.js 22+
- pnpm
- PostgreSQL 17 (berjalan)

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

Endpoint GraphQL di `POST /graphql` pada port yang dikonfigurasi (default 3001).

## Docker

```bash
# Bangun
docker build -t auth-service:latest .

# Jalankan (membutuhkan PostgreSQL yang dapat diakses via konfigurasi ENV)
docker run -d \
  --name auth-service \
  --env-file .env \
  -p 3001:3000 \
  auth-service:latest
```

## Tes

```bash
pnpm test          # unit (Jest) — 14 tes di 4 suite
pnpm test:e2e      # e2e (supertest)
pnpm test:cov      # dengan coverage
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

## API

### GraphQL

```graphql
# Register
mutation Register($input: RegisterInput!) { register(input: $input) { token } }

# Login
mutation Login($input: LoginInput!) { login(input: $input) { token } }

# Validasi token
query ValidateToken($token: String!) { validateToken(token: $token) { sub email roles } }
```

**Error:** `409 Conflict` (register — email sudah terdaftar), `401 Unauthorized` (login — kredensial salah, validateToken — token tidak valid/kedaluwarsa)

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
await fetch('http://auth-service:3001/graphql', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: '...', variables: { ... } }),
});
```

Nilai `sub` dalam JWT mengidentifikasi layanan pemanggil (misalnya `"schedule-service"`).
