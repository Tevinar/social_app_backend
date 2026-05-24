# Social App Backend

A NestJS backend demo for the Flutter client "social_app".

## Overview

social_app_backend is a feature-first API organized around explicit
architectural boundaries rather than a generic Nest starter layout.

It currently covers three main capabilities:

- email/password authentication with server-managed refresh sessions
- blog publishing with image upload to GCS-compatible storage
- chat and messaging with cursor-based reads and SSE updates

The repository is intended as a technical codebase that stays readable as it
grows. The main idea is to keep transport concerns, application orchestration,
domain rules, and technical adapters clearly separated.

## Goals

The main goals of the project are:

- maintainability
- scalability
- readability
- explicit boundaries
- clear ownership of responsibilities
- ease of testing
- ease of evolution over time

## API Compatibility

API v1

- supported by Android 1.0+
- supported by iOS 1.0+

Notes

- v1 is the current API contract
- clients should remain compatible with additive backend changes
- a new API version is introduced only for breaking changes

## Tech Stack

### Core Technologies

- Language: TypeScript
- Framework: NestJS
- Runtime: Node.js

### Data / Persistence

- Database: PostgreSQL
- Database client: `postgres`
- Schema management: SQL migrations in `database/migrations/`
- Object storage: Google Cloud Storage via `@google-cloud/storage`
- Local object-storage emulation: `fake-gcs-server`
- Auth/session persistence: server-side refresh sessions with hashed tokens

### Infrastructure / Runtime

- Logging: `nestjs-pino` / `pino-http`
- Validation: Nest `ValidationPipe`, `class-validator`,
  `class-transformer`
- Password hashing: `argon2`
- Tokens: JWT access tokens and refresh tokens with separate secrets
- Realtime transport: SSE endpoints backed by RxJS event streams, with
  Google Pub/Sub fan-out for multi-instance delivery

### Testing Tooling

- `jest`
- `ts-jest`

## Architecture Summary

The backend follows a feature-first modular hexagonal structure:

- `database/` contains migration and script assets outside the HTTP runtime
- `src/main.ts` boots the Nest application
- `src/app/bootstrap` is the composition root
- `src/core` contains shared technical building blocks
- `src/features/*` is split into `presentation`, `application`, `domain`,
  and `infrastructure`

At runtime, controllers validate and map transport input, use cases orchestrate
business flows, domain objects protect invariants, and infrastructure adapters
implement application ports for PostgreSQL, storage, security, and realtime
delivery.

Known business and validation failures are mapped centrally by the global HTTP
exception boundary in `src/core/presentation/filters/`.

Chat realtime delivery uses Google Pub/Sub for multi-instance-safe fan-out.
The runtime creates one short-lived pull subscription per app instance, so the
deployed service account needs Pub/Sub publish plus subscription
create/consume/delete permissions.

For the full architectural rules, dependency direction, layer
responsibilities, and error/logging conventions, see
[architecture.md](./architecture.md).

## Project Structure

```text
social_app_backend/
  database/
    migrations/
    scripts/
  src/
    main.ts
    app/
      bootstrap/
    core/
      config/
      contracts/
      database/
      outbox/
      presentation/filters/
      storage/
    features/
      auth/
      blog/
      chat/
  docker-compose.yml
  .env
  .secrets/
```

Main folders:

- `database/` contains SQL migrations and maintenance scripts
- `src/` contains all runtime application code
- `src/core/` contains shared technical modules and contracts
- `src/core/outbox/` contains the transactional outbox publisher
- `src/features/` contains feature modules and their internal layers
- `.secrets/` contains required local secret files

## API Surface

All `/blogs` and `/chats` routes require
`Authorization: Bearer <access-token>`.

Authentication:

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/refresh`
- `POST /auth/sign-out`

Blogs:

- `POST /blogs`
- `GET /blogs`
- `GET /blogs/:blogId`
- `GET /blogs/:blogId/image`

Notes:

- blog creation expects `multipart/form-data`
- the image file field name is `image`
- `GET /blogs/:blogId/image` redirects to a signed URL in non-local
  environments and to the fake GCS object URL in local mode

Chats:

- `POST /chats`
- `GET /chats`
- `GET /chats/candidates`
- `GET /chats/by-members`
- `GET /chats/:chatId/messages`
- `POST /chats/:chatId/messages`
- `SSE /chats/events`
- `SSE /chats/:chatId/messages/events`

## Getting Started

### Prerequisites

You need:

- Node.js LTS and npm
- Docker / Docker Compose
- local `.env` values
- local secret files under `.secrets/`

### Installation

```bash
git clone <repository-url>
cd social_app_backend
npm install
```

### Configuration

The backend reads runtime configuration from `.env` and secret files from
`.secrets/`.

Required secret files:

- `.secrets/postgres_password.txt`
- `.secrets/jwt_access_secret.txt`
- `.secrets/jwt_refresh_secret.txt`
- `.secrets/token_hash_secret.txt`

For local development, `API_BASE_URL` should match the public address where the
Nest app is reachable, typically `http://localhost:3000`.

### Start Local Dependencies

Prerequises: you have to have Docked Desktop installed and launched

```bash
docker compose --env-file .env --env-file .env.local up -d
```

This starts:

- PostgreSQL 16
- a fake GCS server used by the blog image flow

### Apply Migrations

```bash
npm run database:migrate
```

### Start Local Pub/Sub

Start the Pub/Sub emulator in a separate terminal:

```bash
gcloud beta emulators pubsub start \
  --project=social-app-local \
  --host-port=127.0.0.1:8085
```

Create the local chat topics after the emulator is running:

```bash
npm run pubsub:init-topics
```

### Start the Nest server in watch mode, accepting fake-gcs certificate and connecting to Pub/Sub

Run the backend in a third terminal:

```bash
NODE_EXTRA_CA_CERTS="$PWD/.certs/fake-gcs.pem" npm run start:debug
```

If you use VS Code, the `Backend: Nest debug` launch configuration automates
the Docker startup, Pub/Sub emulator startup, topic bootstrap, and backend
launch sequence.

The Flutter mobile client defaults to `http://localhost:3000`, so the backend
and the app line up locally without additional routing work.

### Swagger Documentation

In non-production environments, the API is also available through Swagger UI at:

- `http://localhost:3000/docs`

The raw OpenAPI specification is exposed at:

- `http://localhost:3000/docs-json`
- `http://localhost:3000/docs-yaml`

## Testing and Quality

Run tests:

```bash
npm test
```

Coverage:

```bash
npm run test:cov
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```
