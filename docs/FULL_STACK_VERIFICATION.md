# Real database and full-stack verification

**Passed on 16 November 2026.** This check exercised the normal application using real MongoDB 8.2.6 with WiredTiger, the actual `server/server.js` process, the React/Vite frontend, Chrome, and live TheMealDB HTTP requests. It used no application model substitutes, intercepted browser routes, or demo kitchen data.

The MongoDB process used a disposable local database. Only synthetic test accounts and ingredients were created. The test did not read or change a teammate's `.env` or database, and the browser, frontend/API processes, and disposable database were stopped after the run. The temporary test tooling was not added to the application dependencies.

## Results

| Check | Result |
| --- | --- |
| Real MongoDB connection, model initialization, and index creation | Passed |
| Actual server startup, signup/login, bcrypt hashes in storage, and JWT protection | Passed |
| Pantry/favorites/shopping CRUD, unique indexes, and server-chosen ownership | Passed |
| Alice/Bob read isolation and rejection of another user's update/delete attempts | Passed |
| Saved records and edited values survive stopping and restarting the Node API process | Passed |
| Live TheMealDB recipe details, name search, and ingredient-filter proxy requests | Passed |
| Browser signup, pantry creation/editing, and persistence after page refresh | Passed |
| Browser pantry matching, saving recipes, missing-ingredient deduplication, and persisted shopping checks | Passed |
| Browser logout/login, pantry deletion, and second-account isolation | Passed |
| Uncaught browser page errors | None |

The shopping check waited for the API-confirmed checkbox state, verified the actual MongoDB document, then refreshed the page. Re-login correctly returned to the requested protected screen; the test then navigated to Pantry explicitly to inspect saved data.

The [machine-readable run result](evidence/full-stack-verification.json) identifies the source baseline and the SHA-256 of the verified recipe-service revision. The same application source remains HTML/CSS and JavaScript/JSX with React, Express, and Mongoose.

## Reliability adjustment found during verification

The live provider returned one intermittent 502 during repeated runs, while a direct retry succeeded. The recipe service now retries a transport failure or upstream 5xx response once, with a 250ms delay. Each attempt has a seven-second timeout, keeping the default retry sequence inside the frontend's 20-second request budget. Upstream 4xx responses are not automatically retried.

Successful public recipe responses are cached for one minute, keyed by the full provider URL and capped at 100 entries. Failures and private user collections are not cached. This applies the Map/expiry caching technique in Chapter 22. Persistent failures still return the existing safe 502 response and visible retry UI.

Four added backend tests cover recovery, bounded failure, cache identity/expiry, and upstream rate-limit errors. The backend suite now contains **46 passing tests**. The existing **22 frontend** and **24 browser** checks also run in GitHub CI.

## Checkpoint meaning and limits

This provides local functional evidence for Milestones 1–3: startup/scaffold, backend authentication and CRUD, and frontend/backend integration with persistent data. The finalized wireframes/schema and full requirement mapping remain in [DESIGN.md](DESIGN.md) and [CAPSTONE_MILESTONES.md](CAPSTONE_MILESTONES.md).

It does not certify a teammate's particular Atlas credentials, network access settings, production HTTPS/CORS, public URLs, or checkpoint submission dates. Milestone 4 is deferred. Before final submission, repeat the first-run check in the README with the team's actual configuration, complete deployment acceptance, and rehearse the 5–8 minute presentation.
