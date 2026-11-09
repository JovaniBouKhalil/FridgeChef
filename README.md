# FridgeChef

Make more of what is already in your fridge. A web development capstone by **Jovani Bou Khalil, Ralph Alpha, and Mariam Salloum**.

## Current status

The React frontend is implemented on `frontend/jovani-fridgechef`. Public recipe browsing uses TheMealDB. Account forms and private pantry, favorites, and shopping actions are prepared for the team's Express API. **`server/server.js` is currently empty: real authentication and database persistence require the backend implementation.** Mocked integration tests do not replace a test against that backend.

You can review the frontend immediately using the explicitly labeled **demo kitchen**. Open Sign in → Explore the demo kitchen. It uses a sample pantry and eight recipe snapshots; changes persist in a separate browser storage key. It never creates an account or simulates a JWT. Exit demo before testing real authentication.

## Run the frontend

Use Node.js 22.12+ or Node.js 24 LTS and npm.

```sh
git clone https://github.com/JovaniBouKhalil/FridgeChef.git
cd FridgeChef
git switch frontend/jovani-fridgechef
cd client
npm ci
```

Copy `client/.env.example` to `client/.env`. In PowerShell, from `client/`:

```powershell
Copy-Item .env.example .env
```

In macOS/Linux shells, use `cp .env.example .env`. Then:

```sh
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173). Public discovery needs internet access to TheMealDB. The demo kitchen's sample recipes and images work without that service after the local application has loaded.

When the backend is ready, run it in a second terminal from `server/` using `npm ci` then `npm run dev`, as in Chapter 20. Set `VITE_API_URL` to its origin, normally `http://localhost:3000`, and configure the server to accept `CLIENT_ORIGIN=http://localhost:5173`. Restart Vite after changing environment variables. Running the current empty server file will not start an API.

## Features

- React Router pages for discovery, login, signup, pantry, recipe details, saved recipes, shopping list, and missing pages.
- Controlled signup/login forms with validation, password visibility, return-to-page navigation, and API error messages.
- Auth context, persisted bearer token, protected views, logout, and automatic logout on authenticated HTTP 401 responses.
- Pantry ingredient creation, quantity editing, deletion confirmation, search, and duplicate checks.
- TheMealDB recipe search, category filtering within results, details, ingredient measurements, and original recipe/video links.
- Ingredient matching and ranking with explicit missing ingredients; common ingredient aliases are supported. Quantities are not evaluated.
- Saved recipes and a shopping checklist with deduplicated missing ingredients, check-off, removal, and clearing picked-up items.
- Responsive desktop sidebar and mobile navigation, keyboard labels, focus states, reduced-motion support, and loading/error/empty states.
- An isolated demo kitchen for frontend review before the team's API is available.

## Stack and architecture

The frontend uses **React, JavaScript/JSX, React Router, Vite, browser fetch, and plain CSS**. It follows the components, hooks, forms, context, and integration patterns in Chapters 12–15 and 20. There is no additional application framework or state management library. Vitest, React Testing Library, and Playwright are development-only verification tools.

The agreed full-stack architecture is React → Express REST API → MongoDB/Mongoose, with bcrypt/JWT on the server. Public recipe data comes from TheMealDB; the frontend currently requests it directly using its public educational API. Database credentials, JWT signing, password hashing, ownership enforcement, and CORS belong on the server.

```text
client/
  src/
    api/          # Shared request client and TheMealDB recipe service
    auth/         # AuthProvider, auth hook, protected route
    components/   # Layout, recipe cards, forms, feedback, icons
    context/      # User kitchen state and API-backed mutations
    data/         # Explicit demo fixtures
    hooks/        # useApi and recipe search effects
    pages/        # Route-level screens
    utils/        # Ingredient matching and storage parsing
  e2e/            # Desktop/mobile browser tests
server/           # Existing Express scaffold; owned by backend teammates
docs/
  API_CONTRACT.md  # Exact endpoint and payload agreement for the team
  FRONTEND_GUIDE.md # Course mapping, screen flow, and manual checks
```

Read the [backend integration contract](docs/API_CONTRACT.md) and the [frontend/course guide](docs/FRONTEND_GUIDE.md) before changing API shapes.

## Verify the frontend

From `client/`:

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The unit/component suite checks ingredient ranking, token headers, 204 responses, 401 expiry, route protection, form validation, pantry edits, shopping deduplication, and mocked login integration. The browser suite checks discovery, pantry CRUD, saved recipes, shopping checkboxes, and API session expiry on desktop and mobile. Browser tests mock external APIs so results do not depend on network availability. `npm run format` formats the source.

If the Playwright browser download is unavailable but Chrome is installed, set `PLAYWRIGHT_CHANNEL=chrome` before running the browser tests. In PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'chrome'`, then `npm run test:e2e`.

## Deployment and remaining team requirements

Build the frontend with `npm run build` and publish `client/dist`. Set `VITE_API_URL` to the reachable HTTPS API origin **before building**. Vite replaces `VITE_` values at build time: they are public, so keep secrets exclusively in server environment settings. The app uses browser routing; configure the host to serve `index.html` for unknown application paths. `client/public/_redirects` provides this fallback for Netlify. Other hosts need equivalent configuration.

The final capstone still requires the team's real Express routes, MongoDB persistence, bcrypt/JWT authentication and user ownership checks, at least one automated backend test, verification with two real users, live frontend and API URLs, and the 5–8 minute team presentation. This frontend branch does not claim those backend/deployment requirements are complete.

## Attribution

Recipe data and food photographs are from [TheMealDB](https://www.themealdb.com), using its [documented educational API](https://www.themealdb.com/api.php). The eight local snapshots and matching photos support the clearly labeled demo kitchen; live mode requests live data. Recipe matching is ingredient-name assistance and does not assess quantities, allergies, or nutrition.
