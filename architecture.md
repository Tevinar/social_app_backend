# Architecture

This document defines the project structure, layer responsibilities,
dependency rules, and runtime conventions used by `social_app_backend`.

## 1. Goals

The architecture is designed to provide:

- clear ownership of code
- explicit boundaries between transport, application orchestration, domain
  rules, and infrastructure
- low coupling between features
- predictable data flow
- scalability without widespread rewrites
- simple local development with a real database and storage-like adapter

## 2. High-Level Shape

```text
social_app_backend/
  database/
  src/
    main.ts
    app/
      bootstrap/
    core/
    features/
```

The project is intentionally split into two top-level zones:

- `database/` for schema assets and operational scripts outside the HTTP
  runtime
- `src/` for everything the Nest application needs at runtime

Current runtime feature modules are:

- `auth`
- `blog`
- `chat`

## 3. Responsibility Zones

### `database/`

Purpose:

- hold database assets and operations outside the app runtime

Typical contents:

- `migrations/` for ordered SQL schema changes
- `scripts/` for migration and maintenance commands

Must not contain:

- Nest controllers
- runtime feature logic
- application services

Rule:

- `database/` is operational support, not an application layer

### `src/main.ts`

Purpose:

- bootstrap the Nest application
- enable graceful shutdown
- attach the configured logger
- start the HTTP server on the configured port

Rule:

- `main.ts` starts the app; it does not own business logic

### `src/app/bootstrap/`

Purpose:

- act as the composition root
- assemble global modules and providers
- register cross-cutting concerns such as config, logging, shared modules, and
  global exception filters

Current state:

- this repository keeps `app/` minimal and uses it mostly for bootstrap

Evolution rule:

- add wider `app/` orchestration only when a concern truly spans multiple
  features

### `src/core/`

Purpose:

- hold passive, feature-agnostic technical building blocks

Typical contents in this repository:

- configuration helpers and environment enums
- shared use-case contracts
- PostgreSQL module/provider/service
- storage module/provider/service
- global exception mapping and HTTP filters

Must not contain any feature layer object.

### `src/features/*/presentation/`

Purpose:

- expose a feature to the outside world

Typical contents:

- controllers
- DTOs
- guards
- decorators
- response mappers

Responsibilities:

- receive request data from params, query, body, headers, or multipart input
- validate and transform transport input
- call application use cases
- shape the transport response

Must not contain:

- persistence logic
- JWT creation logic
- direct database queries
- domain orchestration

### `src/features/*/application/`

Purpose:

- orchestrate what the feature does in response to a command, query, or
  subscription

Typical contents:

- use cases
- ports
- pagination helpers
- feature-level result types

Responsibilities:

- coordinate domain objects and infrastructure capabilities
- expose stable business outcomes to callers
- define dependency contracts through ports

Important note:

- this layer should stay transport-agnostic
- Nest DI decorators may appear as wiring metadata

Why `ports/` and not only `repositories/`:

- not every dependency is persistence
- a port may represent a repository, token creator, password verifier, event
  bus, storage adapter, URL signer, or other capability the application needs

Port organization rule:

- prefer one capability per file
- keep the symbol, interface, and closely related types together

### `src/features/*/domain/`

Purpose:

- hold the core business concepts and invariants of the feature

Typical contents:

- entities
- value objects
- domain events
- pure domain services when needed
- invariant-driven domain errors

Entities:

- represent business concepts with identity
- own lifecycle and identity-related rules

Value objects:

- represent business concepts defined by value rather than identity
- encapsulate validation and small invariants

Examples from this repository:

- `Email`
- `DeviceId`
- `BlogTitle`
- `ChatMembers`
- `ChatMessageContent`

Rule:

- invalid business values should be rejected as early as possible inside the
  domain

### `src/features/*/infrastructure/`

Purpose:

- implement the concrete technical capabilities required by the feature

Typical contents in this repository:

- PostgreSQL readers and writers
- JWT adapters
- Argon2 password adapters
- token hashing adapters
- GCS-backed storage adapters
- in-memory event buses

Responsibilities:

- implement `application/ports/`
- translate external systems into application/domain-friendly data
- keep third-party and transport details out of higher layers

## 4. Dependency Rules

The default business-flow direction is:

```text
Presentation
↓
Application
↓
Domain
```

Infrastructure is a technical implementation detail that depends on
application contracts and, when necessary, on domain types for mapping and
reconstitution.

Practical dependency rules:

- `core/` must not depend on `app/` or `features/`
- `app/bootstrap` may depend on `core/` and feature modules
- `presentation/` should normally call its own feature application layer
- `application/` may depend on its own feature domain layer
- `application/` may depend on other features through application-level exports
  when cross-feature coordination is needed
- `domain/` must not depend on `presentation/`, `application/`,
  `infrastructure/`, `core/`, or other feature internals
- `infrastructure/` implements application ports and may use its own domain
  types
- feature presentation should not depend on another feature's presentation
  layer, except for clearly owned shared transport helpers
- repositories and adapters must never be called directly from controllers

## 5. Cross-Feature Boundaries

Default rule:

- prefer cross-feature access through exported application APIs (i.e. if feature A needs something from feature B, A should depend on the public service that B intentionally exposes, not on B’s private internals)

Why:

- it keeps orchestration decisions inside the owning feature
- it avoids leaking private persistence details
- it prevents other features from reaching directly into controllers or
  infrastructure adapters

You can share:

- application layer
- domain layer

Do not share:

- presentation layer
- infrastructure layer

## 6. Runtime and Data Flow

### HTTP Command Flow

1. a request enters a controller in `presentation/`
2. Nest validation and DTO mapping normalize the transport input
3. guards and decorators resolve authenticated context when needed
4. a use case in `application/` orchestrates the operation
5. domain objects validate invariants
6. infrastructure adapters fulfill ports for persistence, security, storage, or
   realtime broadcasting
7. the controller maps the result to response DTOs
8. thrown errors reach the global HTTP boundary when they are not handled

### Auth Flow

The authentication feature follows these principles:

- email and device identifiers are normalized through value objects
- passwords are verified through an application port backed by Argon2
- access and refresh tokens are created through a dedicated token port
- refresh tokens are hashed before being stored
- refresh sessions are server-managed and tied to device identifiers

Result:

- the server can rotate and revoke refresh sessions without storing raw refresh
  tokens

### Blog Flow

The blog feature follows this write/read pattern:

- blog creation receives multipart input from the controller
- the image is validated as a domain value object
- the image is stored through a storage port
- the blog record is persisted in PostgreSQL
- if persistence fails after upload, the use case performs best-effort image
  cleanup
- blog image reads go through `GET /blogs/:blogId/image`, which redirects to a
  signed URL or local fake-GCS URL

### Chat Flow

The chat feature combines paginated reads with SSE updates:

- chat lists and message lists are read from PostgreSQL with cursor-based
  queries
- writes persist business data and durable outbox rows in the same PostgreSQL
  transaction
- the background outbox publisher sends those chat-list and chat-message
  events to shared Pub/Sub topics
- each app instance consumes those topics through its own subscriptions before
  forwarding matching events to its local SSE subscribers as
  `text/event-stream`

## 7. Error Handling and Logging

### Global Rules

- if an error cannot be corrected automatically, rethrow it
- preserving the original stack trace is more valuable than swallowing the
  failure too early

### Presentation Layer

Rules:

- do not create business errors here
- let Nest validation handle request-shape issues
- catch errors only at the global HTTP boundary to map known business failures
  into HTTP responses

Current implementation:

- `src/core/presentation/filters/global-http-request-exception.filter.ts`
- `src/core/presentation/filters/error-to-exception.mapper.ts`

Behavior:

- validation errors become `400`
- known auth/chat/domain failures are mapped to stable public codes and status
  codes
- unexpected failures become `500`
- unexpected failures are logged with stack traces

### Application Layer

Rules:

- create errors when the use case must expose a stable business outcome to its
  caller
- catch lower-level failures only when converting them into business meaning or
  when hiding sensitive implementation detail

Examples in this repository:

- `InvalidCredentialsError`
- `EmailAlreadyInUseError`
- `UserAlreadySignedInOnDeviceError`
- `ChatNotFoundError`
- `ChatMemberNotFoundError`

Logging convention:

- expected business/security situations may be logged as warnings when they are
  operationally useful
- no stack trace is needed for expected outcomes

### Domain Layer

Rules:

- create errors when an entity or value object would become invalid
- do not catch domain errors just to reword them inside the domain
- do not log from the domain

Examples:

- invalid email
- invalid device id
- invalid chat members
- invalid message content

### Infrastructure Layer

Rules:

- do not manufacture business errors for expected application scenarios
- prefer returning `null`, booleans, or typed result enums for expected misses
- wrap technical failures only when extra safe context is genuinely helpful
- never leak secrets through error messages or logs

Logging convention:

- log only handled technical situations that the global exception filter would
  not explain well enough on its own

## 8. Naming Conventions

Use-case naming:

- `Create...UseCase` for writes
- `Get...UseCase` for one-shot reads
- `SubscribeTo...UseCase` for streams and SSE

Adapter naming:

- `Postgres...` for PostgreSQL adapters
- `Jwt...` for JWT adapters
- `Argon2...` for password adapters
- `Gcs...` for cloud storage adapters
- `InMemory...` for process-local runtime adapters

Other conventions:

- keep route contracts primitive and serializable
- keep migrations ordered with numeric prefixes such as `001_...sql`
- prefer explicit files over overly generic shared folders

## 9. Adding or Evolving a Feature

Recommended sequence:

1. create the feature module and its four internal layers
2. define the use cases and the ports the feature needs
3. create entities and value objects for the business invariants
4. implement infrastructure adapters behind the ports
5. expose the feature through controllers, DTOs, guards, and response mappers
6. wire the module into `app/bootstrap/app.module.ts`
7. add SQL migrations for persistence changes
8. update the error mapper if new public business errors must surface over HTTP

The goal is not to maximize folders. The goal is to keep responsibility
boundaries explicit enough that the next feature does not force a rewrite of
the previous one.
