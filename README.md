# Real Estate Investment — Backend

NestJS + MongoDB API for a real-estate investment platform: companies, projects,
image uploads, and a public "get in touch" lead form, with JWT-based admin authentication.

> **Read [`PROJECT_GUIDELINES.md`](./PROJECT_GUIDELINES.md) before contributing** — it defines
> the project structure, naming conventions, and best practices every change must follow.

## Requirements

- Node.js 22+
- MongoDB running locally or a connection string (Atlas etc.)

## Setup

```bash
npm install
cp .env.example .env   # then edit values (Mongo URI, JWT secret, admin credentials)
npm run start:dev
```

On first boot an admin account is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## API documentation (Swagger)

Interactive Swagger UI is available at **`http://localhost:3000/docs`** once the app is
running. To call protected endpoints from the UI: run `POST /auth/login`, copy the
`accessToken`, click **Authorize** and paste it.

## Authentication

```
POST /auth/login          { "email": "...", "password": "..." }  → { "accessToken": "..." }
```

Send the token on protected routes: `Authorization: Bearer <accessToken>`.

**Every endpoint requires auth by default.** Public exceptions:

| Endpoint                | Why public                     |
| ----------------------- | ------------------------------ |
| `POST /auth/login`      | Entry point for admins         |
| `GET /companies`, `GET /companies/:id` | Public website data |
| `GET /projects`, `GET /projects/:id`   | Public website data |
| `GET /images/:id`       | Serves image files to the site |
| `POST /get-in-touch`    | Visitor-submitted lead form    |
| `GET /health`           | Health check                   |

## Endpoints

### Companies — `/companies`

`POST` · `GET` · `GET /:id` · `PUT /:id` · `DELETE /:id`

Fields: `companyName`, `projectsCompleted`, `unitsDelivered`, `activeProjects`,
`operatingSince` (year), `companyLocation`, `companyDescription`.

### Images — `/images`

- `POST /images` — multipart upload, field name `images`, up to 10 files, `image/*` only,
  10 MB max each. Returns image documents; use their `_id`s in project payloads.
- `GET /images` — list metadata (admin).
- `GET /images/:id` — serves the binary file (public).
- `PUT /images/:id` — replace the stored file (single file, field name `images`).
- `DELETE /images/:id` — removes document and file.

### Projects — `/projects`

`POST` · `GET` · `GET /:id` · `PUT /:id` · `DELETE /:id`

A project must reference an existing `company` (id). `projectImages` and `floorPlanImages`
are arrays of previously uploaded image ids. GET responses replace the `company` field with
a fully populated **`companyInfo`** object.

<details>
<summary>Example POST /projects payload</summary>

```json
{
  "projectName": "Seaside Towers",
  "projectImages": ["<imageId>"],
  "projectLocation": "Batumi, Georgia",
  "projectLatitude": 41.6461,
  "projectLongitude": 41.6339,
  "projectDescriptionCards": [
    {
      "projectDescriptionCardTitle": "Prime location",
      "projectDescriptionCardContent": "100m to the beach",
      "projectDescriptionCardDescription": "Steps from the seaside boulevard"
    }
  ],
  "projectAdvantages": ["Sea view", "High ROI"],
  "paymentDescription": "Flexible installments until completion",
  "projectDescription": {
    "projectDescriptionTitle": "About the project",
    "projectDescriptionContent": "Long form description...",
    "projectShortDescription": "Short teaser..."
  },
  "verificationChecklist": ["Building permit verified", "Developer track record checked"],
  "lastVerified": "2026-07-01",
  "investmentCards": [
    {
      "investmentCardTitle": "Rental yield",
      "investmentCardContent": "9-11%",
      "investmentCardDescription": "Projected annual short-term rental yield"
    }
  ],
  "buildingType": "Apart-hotel",
  "totalFloors": 32,
  "unitsInBuilding": 420,
  "unitSizesAvailable": "28-75 m²",
  "finishing": "Turnkey",
  "furniturePackage": "Available",
  "strManagementOnSite": "Yes",
  "distanceToSea": "100 m",
  "distanceToCityCenter": "2.5 km",
  "floorPlanImages": ["<imageId>"],
  "pricingBySquareMeters": [
    { "squareMeterRange": "28-40 m²", "startingPrice": 1450 }
  ],
  "paymentPlans": [
    { "paymentStage": "Reservation", "paymentAmount": 10, "when": "At signing" }
  ],
  "paymentAdvantages": ["0% interest installments"],
  "company": "<companyId>"
}
```

</details>

### Get in touch — `/get-in-touch`

`POST` (public) · `GET` · `GET /:id` · `PUT /:id` · `DELETE /:id`

Fields: `project` (project id), `fullName`, `whatsAppNumber` (string, digits with optional
`+` — stored as a string so `+` prefixes and leading zeros are preserved), `budgetRange`,
`investmentPurpose`.

## Scripts

```bash
npm run start:dev   # watch mode
npm run build       # compile to dist/
npm run start:prod  # run compiled app
npm run lint        # eslint
npm run test        # unit tests
```

## Deployment (Railway)

`railway.json` configures the build (`npm ci && npm run build`), the start command
(`npm run start:prod`) and a health check against `/health`.

**1. Environment variables** — set these in the Railway service (Variables tab):

| Variable         | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| `MONGODB_URI`    | MongoDB Atlas connection string (or Railway's MongoDB plugin) |
| `JWT_SECRET`     | long random string                                            |
| `JWT_EXPIRES_IN` | e.g. `1d`                                                     |
| `ADMIN_EMAIL`    | initial admin email                                           |
| `ADMIN_PASSWORD` | initial admin password                                        |
| `CORS_ORIGINS`   | `https://properly.ge,https://www.properly.ge,https://*.vercel.app` |
| `UPLOAD_DIR`     | `/data/uploads` (mount path of the volume, see below)         |
| `NODE_ENV`       | `production`                                                  |

Do **not** set `PORT` — Railway injects it and the app binds to it on `0.0.0.0`.

**2. Persistent storage** — uploaded images are written to disk, and Railway containers
have an ephemeral filesystem, so files are lost on every redeploy unless a volume is
attached. Add a volume to the service, mount it at `/data`, and set `UPLOAD_DIR=/data/uploads`.

**3. Frontend** — point the Vercel app at the Railway URL (or a custom domain such as
`api.properly.ge` added under the service's Settings → Networking).

### CORS

Allowed origins come from `CORS_ORIGINS` (comma-separated). A `*` inside an entry matches a
single hostname label, so `https://*.vercel.app` covers preview deployments. `*` on its own
allows any origin. When the variable is unset, the defaults in `src/main.ts` apply:
`properly.ge`, `www.properly.ge`, `*.vercel.app` and localhost dev servers. Only
`Content-Type` and `Authorization` request headers are allowed, which is all the JWT
`Bearer` flow needs.
