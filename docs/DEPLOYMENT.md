# Chapter 23 deployment

The course setup is a Vite/React frontend on Vercel, an Express/Node API on Render, and MongoDB in Atlas. The application remains JavaScript, JSX, HTML, and CSS. Hosting settings do not require another application framework.

**Current state: not deployed.** The repository contains deployment configuration; account access and production database settings are still needed. A successful local build is not a public deployment.

## 1. Database

Reuse the team's existing Atlas cluster if it is already configured on a teammate's computer. Otherwise create a project and a free cluster in the team's Atlas account. Create a database user with read/write access to the FridgeChef database. Add the API host's outbound IP addresses to Atlas Network Access. Use the Atlas-provided driver connection string with the `fridgechef` database name. Percent-encode special characters in a database password when assembling a URI.

Enter that URI directly into Render's private environment settings as `MONGODB_URI`. A local `.env` on this computer is not required to deploy. Atlas database users and Atlas website accounts are separate. See the [official Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).

## 2. API on Render

Connect Render to the team's GitHub repository. The root [render.yaml](../render.yaml) describes the service. Import it as a Blueprint, or create a Node Web Service with these settings:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Node version | `24` |
| Health check | `/api/health` |
| Plan | Free |
| Auto-deploy | After CI checks pass |

Set these environment variables in Render:

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | The team's private Atlas connection URI |
| `JWT_SECRET` | Generated random secret of at least 32 bytes; the Blueprint can generate it |
| `JWT_EXPIRES_IN` | `1d` |
| `CLIENT_ORIGIN` | The exact stable Vercel frontend origin, beginning with HTTPS and without a trailing slash |
| `TRUST_PROXY_HOPS` | `1` for the Render reverse proxy |
| `MEALDB_URL` | `https://www.themealdb.com/api/json/v1/1` |

Let Render supply `PORT`. The server checks configuration, connects to MongoDB, then listens. Open the returned API URL plus `/api/health`; the expected response is `{"status":"ok"}`. Keep the actual API origin for step 3. Service names and public subdomains are assigned by the host; example names in configuration are not proof of a deployed URL.

This follows [Render's Express deployment process](https://render.com/docs/deploy-node-express-app). The Blueprint uses the documented [checksPass auto-deploy setting](https://render.com/docs/blueprint-spec#autodeploytrigger).

## 3. Frontend on Vercel

Import the same GitHub repository in Vercel, choose **Vite**, and set **Root Directory** to `client`. Use `npm ci`, `npm run build`, and output directory `dist`; [client/vercel.json](../client/vercel.json) also records these values.

Set `VITE_API_URL` in the production build environment to the real HTTPS Render API origin, without `/api`. For example, if the host returns an origin, use that exact origin rather than guessing it. Vite replaces this value during the build, so changing it requires a redeploy. A production build rejects a missing, HTTP, or localhost API origin.

The committed rewrite serves `index.html` on application routes, following the [official Vite SPA configuration](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas). Verify that directly opening and refreshing `/pantry`, `/featured`, and `/recipes/52771` loads the app. The production URL must be accessible to the grader without signing into Vercel.

Set `CLIENT_ORIGIN` on Render to the final stable Vercel origin and redeploy the API. Preview domains are different origins; keep the graded production URL stable. Public recipe calls go to the Express proxy; the frontend only needs `VITE_API_URL`. No database URI or JWT signing secret is a frontend variable.

Production startup intentionally fails when `CLIENT_ORIGIN` is missing. This follows the course fail-fast guidance and prevents a forgotten production setting from silently falling back to localhost.

## 4. Live acceptance check

Run the deployment verifier from the repository root using the two real URLs:

```sh
node scripts/verify-deployment.mjs https://YOUR-FRONTEND-ORIGIN https://YOUR-API-ORIGIN
```

The script creates two labeled test accounts, checks public routes and recipe requests, exercises private CRUD, confirms ownership isolation, and removes the resource records it creates. The two test account records remain because the application has no account deletion endpoint. Passwords and tokens stay in process memory and are not printed.

Then use a phone on mobile data, outside demo mode:

1. Open the frontend, create a fresh account, and log out/in.
2. Add an ingredient, edit its quantity, refresh, and confirm it remains.
3. Search for a recipe, enable pantry ranking, and inspect missing ingredients.
4. Save a recipe, generate a shopping list, refresh, check an item, and clear it.
5. Use a second account; the first account's records must be absent.
6. Confirm no uncaught browser errors, failed API requests, or CORS errors.
7. Open both public URLs from another device and test page refreshes.

Record the date and results in the milestone checklist and replace the pending values at the top of the root README with the actual URLs. Milestone 4 is complete only after this works on the deployed services.

## 5. Continuous integration

[.github/workflows/ci.yml](../.github/workflows/ci.yml) checks the client and server on pushes and pull requests, as shown in Chapter 23 page 11. It runs frontend lint, unit tests, a compile check, browser checks, and backend tests. The CI build uses `https://build-only.invalid` solely as a compile-time placeholder; that artifact is not a deployable production configuration. Vercel must build again with the real API URL. Render is configured to auto-deploy after checks pass.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API never starts | `MONGODB_URI`, Atlas database user permissions/network access, and a sufficiently long JWT secret |
| CORS failure | `CLIENT_ORIGIN` matches the actual frontend scheme and host exactly |
| Frontend tries localhost or old API | Correct `VITE_API_URL` and rebuild/redeploy; changing only a runtime server setting cannot change an existing Vite bundle |
| Deep-link refresh is a 404 | `client` is Vercel's root and its `vercel.json` rewrite is included |
| 429 after repeated failed logins | Wait for the 15-minute window; successful logins are not counted against the failed-login limit |
| Recipe service error | Check the API's public recipe route and upstream TheMealDB availability; the UI displays a retry action |
