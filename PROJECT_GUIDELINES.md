# Project Guidelines — Real Estate Investment Backend

This document describes **how this project is written**: the structure, naming conventions,
and best practices that every new feature must follow. Read this before adding any code.

---

## 1. Tech Stack

| Concern         | Choice                              | Why                                                                 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework       | NestJS 11 (Express platform)        | Modular architecture, DI, first-class TypeScript                    |
| Database        | MongoDB via Mongoose                | Project entities contain deeply nested arrays of objects — a natural fit for documents |
| Auth            | JWT (passport-jwt) with bcrypt      | Stateless admin auth, hashed passwords                              |
| Validation      | class-validator + class-transformer | Declarative DTO validation on every request body                    |
| File uploads    | Multer (disk storage)               | Images stored on disk, metadata stored in MongoDB                   |
| Config          | @nestjs/config (.env)               | No secrets or environment-specific values in code                   |
| API docs        | @nestjs/swagger (Swagger UI)        | Interactive documentation generated from code at `/docs`            |

---

## 2. Folder Structure

The project is **feature-module based**. Every domain concept gets its own folder under `src/`
containing everything that belongs to it. Shared code lives in `src/common/`.

```
src/
├── main.ts                     # Bootstrap: global pipes, CORS, port
├── app.module.ts               # Root module: config, DB connection, global guard, feature modules
├── app.controller.ts           # Health check only
│
├── common/                     # Code shared by more than one module
│   ├── decorators/             #   @Public() etc.
│   ├── enums/                  #   Shared enums
│   └── interfaces/             #   Shared interfaces (e.g. JwtPayload)
│
├── auth/                       # Admin authentication
│   ├── dto/
│   ├── guards/
│   ├── interfaces/
│   ├── schemas/
│   ├── strategies/
│   ├── admin-seeder.service.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── companies/                  # Feature module (pattern for all others)
│   ├── dto/
│   │   ├── create-company.dto.ts
│   │   └── update-company.dto.ts
│   ├── schemas/
│   │   └── company.schema.ts
│   ├── companies.controller.ts
│   ├── companies.module.ts
│   └── companies.service.ts
│
├── images/
├── projects/
└── get-in-touch/
```

**Rules:**

- One module per domain entity. A module owns its controller, service, DTOs, and schemas.
- Nothing outside a module may import that module's service directly — import the **module**
  and let Nest's DI resolve it (see `ProjectsModule` importing `CompaniesModule`).
- `common/` never imports from feature modules. Dependencies flow one way: features → common.

---

## 3. Naming Conventions

| Thing            | Convention                          | Example                          |
| ---------------- | ----------------------------------- | -------------------------------- |
| Files            | kebab-case with type suffix         | `create-project.dto.ts`          |
| Classes          | PascalCase with type suffix         | `CreateProjectDto`, `ProjectsService` |
| Schemas          | PascalCase entity name              | `Project`, `Company`             |
| Endpoints        | plural kebab-case nouns             | `/projects`, `/get-in-touch`     |
| Enums            | PascalCase name, PascalCase members, string values | `enum SortOrder { Asc = 'asc' }` |
| Interfaces       | PascalCase, **no** `I` prefix       | `JwtPayload`                     |
| Env variables    | SCREAMING_SNAKE_CASE                | `JWT_SECRET`                     |

---

## 4. Endpoints

Every resource exposes the same REST surface:

| Method | Path            | Purpose            | Auth                          |
| ------ | --------------- | ------------------ | ----------------------------- |
| POST   | `/resource`     | Create             | Guarded (except get-in-touch, which is a public lead form) |
| GET    | `/resource`     | Get all            | Public for companies/projects; guarded otherwise |
| GET    | `/resource/:id` | Get one            | Public for companies/projects/images; guarded otherwise |
| PUT    | `/resource/:id` | Full update        | Guarded                       |
| DELETE | `/resource/:id` | Delete             | Guarded                       |

**Rules:**

- Controllers are thin: they only declare routes, apply decorators, and delegate to the service.
  All business logic lives in services.
- Services throw Nest HTTP exceptions (`NotFoundException`, `BadRequestException`, …) — never
  return `null` for a missing entity from a public method.
- Every `:id` path param is validated as a Mongo ObjectId before hitting the database
  (invalid ids return 400, not 500 or a misleading 404).
- Use `PUT` for full replacement semantics; the update DTO is `PartialType(CreateDto)` so
  partial payloads are also accepted without breaking validation.

---

## 5. Authentication & Authorization

- **Global guard strategy**: `JwtAuthGuard` is registered as a global `APP_GUARD` in
  `AppModule`. This means **every endpoint is guarded by default**.
- Public endpoints must opt out explicitly with the `@Public()` decorator
  (`src/common/decorators/public.decorator.ts`). This is intentionally inverted from
  "guard what needs guarding" — forgetting a decorator fails **closed**, not open.
- Admin credentials are seeded on application bootstrap from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  env vars (only if no admin exists yet). Passwords are hashed with bcrypt — plain-text
  passwords never touch the database.
- Login: `POST /auth/login` → `{ accessToken }`. Clients send it as
  `Authorization: Bearer <token>`.
- JWT payload is minimal: `{ sub: adminId, email }`. Never put sensitive data in a JWT.

---

## 6. DTOs & Validation

- **Every** request body has a DTO class in the module's `dto/` folder. No inline types,
  no `any`.
- DTOs use class-validator decorators on every property. Nested objects use
  `@ValidateNested({ each: true })` + `@Type(() => NestedDto)` and get their own DTO class
  (e.g. `ProjectDescriptionCardDto`).
- The global `ValidationPipe` runs with:
  - `whitelist: true` — unknown properties are stripped,
  - `forbidNonWhitelisted: true` — unknown properties are rejected with 400,
  - `transform: true` — payloads are converted to DTO instances (strings → numbers, etc.).
- Update DTOs are `PartialType(CreateDto)` from `@nestjs/mapped-types` — never duplicate
  field lists by hand.
- Responses never expose secrets: the admin schema strips `passwordHash` in `toJSON`.

---

## 7. Schemas (Mongoose)

- One schema class per file in the module's `schemas/` folder, using `@Schema()` /
  `@Prop()` decorators from `@nestjs/mongoose`.
- Nested objects (e.g. `investmentCards`) are their own `@Schema({ _id: false })` classes
  with an explicit generated `SchemaFactory` — never untyped `Object` props.
- References to other collections use `Types.ObjectId` with `ref`
  (e.g. `Project.company → Company`, `Project.projectImages → Image`).
- Every schema uses `{ timestamps: true }` so `createdAt` / `updatedAt` come for free.
- Referential integrity is enforced in the service layer: creating a project verifies the
  company exists; creating a get-in-touch entry verifies the project exists.

---

## 8. Enums & Interfaces

- Enums live next to the module that owns them (`<module>/enums/`), or in `common/enums/`
  when shared. Always give enum members **string values** so database contents and API
  payloads stay human-readable.
- When a string field has a fixed set of valid values, promote it to an enum and validate
  with `@IsEnum(...)` — do not validate free-form strings against magic values in services.
- Interfaces describe internal shapes (JWT payloads, service return types). They live in
  `<module>/interfaces/` or `common/interfaces/`. DTO classes — not interfaces — describe
  HTTP input, because interfaces are erased at runtime and cannot be validated.

---

## 9. File Uploads (Images)

- Uploads go through `POST /images` (multipart form, field name `images`, up to 10 files).
- Only `image/*` mime types are accepted; max 10 MB per file.
- Files are written to `UPLOAD_DIR` (default `./uploads`, git-ignored) with a UUID filename —
  never the client-supplied name (path traversal / collision safety).
- A metadata document (original name, mime type, size, stored filename) is saved to MongoDB;
  **the image `_id` is what other entities reference** (`projectImages`, `floorPlanImages`).
- `GET /images/:id` streams the file publicly with the correct `Content-Type`.
- Deleting an image removes both the document and the file on disk.

---

## 10. API Documentation (Swagger)

- Swagger UI is served at **`/docs`** (spec assembled in `setupSwagger` in `main.ts`).
- The **@nestjs/swagger CLI plugin** is enabled in `nest-cli.json` — it reads DTO classes,
  their types, class-validator decorators, and JSDoc comments automatically. Therefore:
  **do not hand-write `@ApiProperty()` on DTO fields**; document fields with JSDoc comments
  instead, and they will appear in Swagger.
- Every controller gets an `@ApiTags('<resource>')` so endpoints are grouped per resource.
- Guarded routes get `@ApiBearerAuth('access-token')` — this shows the lock icon and lets
  the "Authorize" button attach the JWT. Public routes must **not** carry it, so the docs
  accurately reflect which endpoints need a token.
- Multipart endpoints (image upload/replace) need explicit `@ApiConsumes('multipart/form-data')`
  and an `@ApiBody` schema with `format: 'binary'`, because the plugin cannot infer file fields.
- To try protected endpoints in the UI: `POST /auth/login`, copy `accessToken`, click
  **Authorize**, paste the token.

---

## 11. Configuration

- All environment-specific values come from `.env` via `@nestjs/config` (global).
- `.env` is git-ignored; `.env.example` documents every variable and is committed.
- Required variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`, `PORT`, `UPLOAD_DIR`.
- Never hard-code a secret, connection string, or port. Never commit `.env`.

---

## 12. Error Handling

- Let Nest's built-in exception layer format errors — throw `HttpException` subclasses,
  don't build response objects by hand.
- 400 — validation failures, malformed ObjectIds, broken references (e.g. unknown company id).
- 401 — missing/invalid JWT (handled by the global guard).
- 404 — entity genuinely not found.
- Never swallow errors silently; never leak stack traces or internal messages to clients.

---

## 13. General Rules

- `npm run lint` and `npm run build` must pass before any commit.
- Keep controllers, services, and schemas in separate files — no multi-class files except
  nested schema/DTO helpers that are only used by their parent.
- No business logic in controllers, no HTTP concerns in services.
- Prefer explicit return types on public service methods.
- When adding a new resource, copy the **companies** module as the reference pattern —
  it is the canonical minimal example of controller/service/DTO/schema layout.
