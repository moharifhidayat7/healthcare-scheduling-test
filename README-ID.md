# Healthcare Scheduling

Monorepo mikroservis untuk manajemen janji temu kesehatan. Dibangun dengan NestJS v11, GraphQL, Prisma ORM, Redis, dan PostgreSQL.

[🇬🇧 English](./README.md)

## Layanan

| Layanan | Deskripsi | README |
|---|---|---|
| **Schedule Service** | Manajemen janji temu — pelanggan, dokter, jadwal, notifikasi email | [English](./schedule-service/README.md) · [Indonesia](./schedule-service/README-ID.md) |
| **Auth Service** | Autentikasi — registrasi pengguna, login, validasi JWT | [English](./auth-service/README.md) · [Indonesia](./auth-service/README-ID.md) |

## Mulai Cepat

```bash
# Salin environment
cp .env.example .env

# Jalankan infrastruktur
podman compose up -d postgresql redis smtp4dev adminer redis-commander

# Jalankan migrasi
podman compose run --rm migrate-auth-service
podman compose run --rm migrate-schedule-service

# Jalankan layanan
podman compose up -d auth-service schedule-service
```

## Arsitektur

```mermaid
graph LR
    subgraph Klien
        CL[Browser / Postman]
    end

    subgraph "Layanan"
        AUTH["Auth Service<br/>(port 3001)<br/>register · login · validateToken"]
        SCHED["Schedule Service<br/>(port 3002)<br/>pelanggan · dokter · jadwal"]
    end

    subgraph "Infrastruktur"
        PG[(PostgreSQL)]
        RD[(Redis)]
        SMTP[SMTP4Dev]
    end

    CL -- register / login --> AUTH
    AUTH -- JWT --> CL
    CL -- "Authorization: Bearer" --> SCHED
    SCHED -. validasi JWT .-> AUTH
    AUTH --- PG
    SCHED --- PG
    SCHED --- RD
    SCHED -. kirim email .-> SMTP
```

- **Auth Service**: Registrasi/login pengguna, pembuatan dan validasi JWT
- **Schedule Service**: CRUD pelanggan/dokter/jadwal, paginasi, caching, notifikasi email via BullMQ

## Prasyarat

- Node.js 22+
- pnpm
- podman (atau docker)
- PostgreSQL 17
- Redis 7

## Lingkungan

Lihat `.env.example` di root proyek. Setiap layanan juga memiliki file `.env` sendiri dengan pengaturan spesifik layanan.

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `COMPOSE_PROJECT_NAME` | tidak | `hss` | Prefix proyek Docker Compose |
| `POSTGRES_PORT` | tidak | `5432` | Port PostgreSQL (compose) |
| `POSTGRES_USER` | tidak | `postgres` | User PostgreSQL (compose) |
| `POSTGRES_PASSWORD` | tidak | `postgres` | Password PostgreSQL (compose) |
| `REDIS_PORT` | tidak | `6379` | Port Redis (compose) |
| `REDIS_PASSWORD` | tidak | — | Password Redis |
| `REDIS_DB` | tidak | `0` | Indeks database Redis |
| `REDIS_URL` | tidak | `redis://localhost:6379/0` | String koneksi Redis (diturunkan dari atas) |
| `JWT_SECRET` | ya | — | Rahasia untuk JWT pengguna (Auth Service) |
| `INTERNAL_JWT_SECRET` | ya | — | Rahasia bersama untuk JWT layanan-ke-layanan |
| `MAIL_HOST` | tidak | `smtp4dev` | Server SMTP |
| `MAIL_PORT` | tidak | `25` | Port SMTP (compose) |
| `MAIL_USER` | tidak | — | User SMTP (opsional) |
| `MAIL_PASSWORD` | tidak | — | Password SMTP (opsional) |
| `MAIL_FROM` | tidak | `noreply@example.com` | Alamat pengirim default |

`REDIS_URL` adalah variabel kemudahan yang dibangun dari `REDIS_HOST`, `REDIS_PORT`, dan `REDIS_DB`. Layanan membaca field individual (`REDIS_HOST`, `REDIS_PORT`, dll.) secara langsung, bukan `REDIS_URL`.
## Pengembangan

```bash
# Install dependensi (semua layanan)
cd schedule-service && pnpm install
cd auth-service && pnpm install

# Jalankan tes
cd schedule-service && pnpm test    # 45 tes
cd auth-service && pnpm test        # 14 tes

# Format kode
cd schedule-service && pnpm format
cd auth-service && pnpm format
```

## Alat Bantu

| Alat | URL | Kegunaan |
|---|---|---|
| Adminer | `http://localhost:8080` | UI PostgreSQL |
| Redis Commander | `http://localhost:8081` | UI Redis |
| SMTP4Dev | `http://localhost:5000` | Pratinjau email (menangkap semua email keluar) |

## Postman

Import `postman_collection.json` ke Postman untuk koleksi API lengkap semua layanan.
