# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A RESTful backend built with Node, Express, and MongoDB (via Mongoose). Code style is CommonJS with `async`/`await` for anything touching Mongoose or bcrypt (no ES modules, no Promise chains) — match this style when editing existing files.

## Commands

```bash
npm run start   # node server.js — starts the server (default port 8080, see config.json)
npm test        # mocha over app/routes/v1/tests/{rest,services}/**/*.js
npm run lint    # eslint .
npm run format  # prettier --write .
```

Run a single test file directly with mocha (loads the shared bootstrap via `.mocharc.json` automatically):

```bash
npx mocha app/routes/v1/tests/rest/user.js --reporter spec
npx mocha app/routes/v1/tests/services/user.js --reporter spec
```

Tests need no external services — `app/routes/v1/tests/setup.js` (a Mocha root hook plugin loaded via `.mocharc.json`) spins up an in-memory MongoDB via `mongodb-memory-server` and connects Mongoose once for the whole run. Running the server itself (outside Docker) still needs real MongoDB; `docker-compose up` starts the app plus a `mongo` container (app on `:8080`, mongo on `:27017`), with `DATABASE_CONNECTION_STRING` pointed at the `mongo` service.

A `SESSION_SECRET` env var is required to boot the server (`v1.js` throws at require-time if it's unset) — copy `.env.example` to `.env` for local runs; `server.js` loads it via `dotenv`.

## Configuration

`config.json` holds defaults: `port`, `mongoDB.connectionString` + `mongoDB.dbName`, and the `versions` map (`{"Version 1": "/v1"}`) that drives route mounting. `PORT`, `DATABASE_CONNECTION_STRING`, `SESSION_SECRET`, and `CORS_ORIGINS` env vars (see `.env.example`) override or supply the corresponding config in `server.js`/`v1.js`.

## Architecture

**Bootstrap (`server.js`):** loads `.env`, connects Mongoose using `connectionString + dbName`, then iterates `config.versions` and mounts each version's route module at its path, e.g. `app.use('/v1', require('./app/routes/v1'))`. Adding a new API version means adding an entry to `config.versions` and a matching `app/routes/v{n}.js` module.

**Per-version app (`app/routes/v1.js`):** this is a self-contained Express app (`module.exports = express()`), not just a router. It wires up, in order: `helmet`, optional `cors` (only if `CORS_ORIGINS` is set), `express-session` (UUID session IDs, secret from `SESSION_SECRET`), Passport (`init` + `session`), Swagger UI at `/api-docs` (public — mounted _before_ the auth gate), the global `ensureAuthenticated` middleware, a rate limiter scoped to `/api/auth`, then each controller module (registered by passing `app` into it), and finally a centralized error-handling middleware.

**Controllers register routes directly on the shared `app` instance** — they are functions of shape `module.exports = function(app) { app.get(...); ... }`, not `express.Router()` sub-routers. There is a single flat route namespace per version; watch for path collisions when adding controllers.

**Request flow:** `routes/v1/controllers/*.js` (HTTP layer: validate via `routes/v1/validation/*.js` Joi schemas where applicable — on failure `throw new Error(...)` directly, no manual `res.status()` — call the service, `await` the result, respond) → `routes/v1/services/*.js` (business logic, `async`/`await`, throws `Error` on failure — no `hasOwnProperty` validation chains here anymore, that lives in the controller-level Joi schema) → `routes/v1/models/User.js` (Mongoose schema/model, bcrypt hashing in an async `pre('save')` hook). Express 5 forwards a rejected promise or thrown error from an `async` route handler to the centralized error middleware automatically — controllers don't need `try/catch` → `next(err)`. That middleware, at the end of `v1.js`, catches anything forwarded to it and responds `{ message: err.message }` with `err.statusCode || 400` — this is why services (and controller-level validation failures) throw plain `Error`s with a client-safe `.message` rather than returning error codes.

**Auth:** Passport local strategy (`modules/auth/passport.js`) looks up `User` by username and checks the bcrypt hash via the async `User.validPassword(password)` (returns a Promise, no callback). `middleware/ensureAuthenticated.js` gates every route except the anonymous paths it lists (`/`, `/api`, `/api/auth`); `/api-docs` bypasses it entirely by virtue of mount order in `v1.js`, not by being in that list.

**Versioning convention (from README):** breaking changes get a new version rather than mutating `/v1`. A new version gets its own `controllers/services/middleware/validation/tests` under `app/routes/v{n}/`, a `v{n}.js` entry file mirroring `v1.js`, and an entry in `config.json`'s `versions` map. DB is currently shared across versions; per-version DB separation is called out as future refactoring, not yet implemented.

**Pagination:** `GET /api/users` accepts optional `page`/`size` query params (both required together, both positive integers) — implemented as `.skip()`/`.limit()` in `services/user.js`'s `parsePagination`. Applied before any `group` aggregation, so paginating and grouping in the same request groups only the paginated slice.

**Tests (`app/routes/v1/tests/`):** two styles, both mocha/should, sharing one in-memory Mongo connection (via `setup.js`) for the whole run:

- `rest/*.js` — supertest against a fresh `express()` app that mounts only the controller under test directly, plus a copy of `v1.js`'s error-handling middleware (needed because controllers now use `next(err)` rather than responding inline) — not the full `v1.js` stack, so no session/passport/swagger/rate-limiting in scope.
- `services/*.js` — exercise service functions directly against the shared in-memory DB. Suites that assert exact document counts (e.g. `tests/services/user.js`) call `User.deleteMany({})` in their own `before` hook first, since other test files sharing the same database may have left data behind — this hook **must** live inside the file's outer `describe(...)` block, not at file top-level, or Mocha treats it as a root-suite hook that runs before every file's tests instead of just this one's.

**Data:** `data/UserApi.tar.gz` is a sample Mongo dump (referenced by the README as what Vagrant provisioning loads) with seed users, e.g. `admin`/`abc123`; other seeded users use password `password`.
