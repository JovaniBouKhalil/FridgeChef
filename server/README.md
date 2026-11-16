# FridgeChef API

The Express server provides authentication, private MongoDB-backed kitchen data, and a public TheMealDB recipe proxy.

## Setup

Use Node.js 22 or newer. From `server/`:

```sh
npm ci
```

Copy `.env.example` to `.env`, then configure `MONGODB_URI` and a `JWT_SECRET` of at least 32 bytes. Keep `.env` private. `CLIENT_ORIGIN` defaults to `http://localhost:5173`, `PORT` defaults to `3000`, and `MEALDB_URL` defaults to TheMealDB's public V1 educational endpoint.

Start the server with `npm run dev` or `npm start`. The server validates configuration and connects to MongoDB before listening.

## Routes

All responses are JSON and errors use `{ "error": "message" }`.

- `GET /api/health`
- `GET /api/recipes/discover`
- `GET /api/recipes/search?name=pasta`
- `GET /api/recipes/:id`
- `GET /api/recipes?ingredient=chicken breast`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET` and `POST /api/pantry`; `PATCH` and `DELETE /api/pantry/:id`
- `GET` and `POST /api/favorites`; `DELETE /api/favorites/:id`
- `GET` and `POST /api/shopping`; `PATCH` and `DELETE /api/shopping/:id`

Pantry, favorites, and shopping routes require `Authorization: Bearer <token>`. Private records are scoped to the authenticated user and expose their MongoDB document identifier as `_id`, matching the frontend contract in `docs/API_CONTRACT.md`.

Recipe responses preserve TheMealDB's `{ "meals": [...] }` format. Authentication responses contain `{ token, user }`. Private collections return arrays directly, and successful deletes return `204` without a response body.

Helmet adds security headers. API requests are limited to 300 per IP per 15 minutes; five failed logins are permitted in that window before a JSON 429. Successful logins do not consume the failed-login allowance. Use `TRUST_PROXY_HOPS=0` locally and `1` behind Render's reverse proxy. Review [SECURITY.md](../SECURITY.md) for measured before/after evidence.

Deploy using the root `render.yaml` and [Chapter 23 guide](../docs/DEPLOYMENT.md). MongoDB credentials and JWT secrets are configured privately on the host. The frontend calls these recipe routes rather than contacting TheMealDB itself.

## Tests

Run `npm test` from this directory or `npm --prefix server test` from the repository root. The automated suites use injected services and models, so they do not require a live MongoDB connection or TheMealDB access.
