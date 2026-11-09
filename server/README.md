# FridgeChef recipe API

This Express API proxies the public TheMealDB educational API. It keeps external API concerns on the server and returns JSON using the shape the FridgeChef client already understands. Authentication, MongoDB, pantry, favorites, and shopping-list persistence are separate team responsibilities and are not implemented here.

## Setup

Use Node.js 22 or newer. From `server/`:

```sh
npm ci
```

Optionally copy `.env.example` to `.env` and supply the values through your shell or hosting provider. Node.js does not load `.env` automatically in this project, so local PowerShell values can be set with `$env:PORT = "3000"`, for example.

Start the development server:

```sh
npm run dev
```

Run the automated tests:

```sh
npm test
```

## Routes

All responses are JSON. Errors use `{ "error": "message" }`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check whether the API is running |
| GET | `/api/recipes/search?name=pasta` | Search recipes by name |
| GET | `/api/recipes/:id` | Fetch a full recipe by numeric TheMealDB ID |
| GET | `/api/recipes?ingredient=chicken breast` | Find recipe candidates by one ingredient |

Successful recipe responses preserve TheMealDB's `{ "meals": [...] }` format. A lookup that has no matching recipe returns `404`. Invalid or missing input returns `400`. An unavailable or malformed upstream service returns `502`.

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Local HTTP port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Frontend origin allowed by CORS |
| `MEALDB_URL` | TheMealDB V1 educational URL | Upstream API base URL |

Do not place secrets in client-side `VITE_` variables. TheMealDB's public educational endpoint does not require a secret key.
