# Healthcare Scheduling

Microservices monorepo for managing healthcare appointments. Built with NestJS v11, GraphQL, Prisma ORM, Redis, and PostgreSQL.

[🇮🇩 Bahasa Indonesia](./README-ID.md)

## Services

| Service | Description | README |
|---|---|---|
| **Schedule Service** | Appointment management — customers, doctors, schedules, email notifications | [English](./schedule-service/README.md) · [Indonesia](./schedule-service/README-ID.md) |
| **Auth Service** | Authentication — user registration, login, JWT validation | [English](./auth-service/README.md) · [Indonesia](./auth-service/README-ID.md) |

## Quick Start

```bash
# Copy environment
cp .env.example .env

# Start infrastructure
podman compose up -d postgresql redis smtp4dev adminer redis-commander

# Run migrations
podman compose run --rm migrate-auth-service
podman compose run --rm migrate-schedule-service

# Start services
podman compose up -d auth-service schedule-service
```

## Architecture

```mermaid
graph LR
    subgraph Client
        CL[Browser / Postman]
    end

    subgraph "Services"
        AUTH["Auth Service<br/>(port 3001)<br/>register · login · validateToken"]
        SCHED["Schedule Service<br/>(port 3002)<br/>customers · doctors · schedules"]
    end

    subgraph "Infrastructure"
        PG[(PostgreSQL)]
        RD[(Redis)]
        SMTP[SMTP4Dev]
    end

    CL -- register / login --> AUTH
    AUTH -- JWT --> CL
    CL -- "Authorization: Bearer" --> SCHED
    SCHED -. validate JWT .-> AUTH
    AUTH --- PG
    SCHED --- PG
    SCHED --- RD
    SCHED -. send email .-> SMTP
```

- **Auth Service**: User registration/login, JWT generation and validation
- **Schedule Service**: Customer/doctor/schedule CRUD, pagination, caching, email notifications via BullMQ

## Prerequisites

- Node.js 22+
- pnpm
- podman (or docker)
- PostgreSQL 17
- Redis 7

## Environment

See `.env.example` at the project root. Each service also has its own `.env` file with service-specific overrides.

Key shared variables:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `change-this-...` | Secret for user-facing JWT |
| `INTERNAL_JWT_SECRET` | `change-this-...` | Secret for service-to-service JWT |
| `MAIL_HOST` | `smtp4dev` | SMTP server (smtp4dev container) |

## Development

```bash
# Install dependencies (all services)
cd schedule-service && pnpm install
cd auth-service && pnpm install

# Run tests
cd schedule-service && pnpm test    # 45 tests
cd auth-service && pnpm test        # 14 tests

# Format code
cd schedule-service && pnpm format
cd auth-service && pnpm format
```

## Tools

| Tool | URL | Purpose |
|---|---|---|
| Adminer | `http://localhost:8080` | PostgreSQL UI |
| Redis Commander | `http://localhost:8081` | Redis UI |
| SMTP4Dev | `http://localhost:5000` | Email preview (catches all outgoing mail) |

## Postman

Import `postman_collection.json` into Postman for the full API collection covering all services.
