# Capstone requirements and milestone audit

Reviewed on **16 November 2026** against the final project brief, the submitted FridgeChef proposal, and Chapters 12–23: 14 PDFs, 237 pages. Chapter slides were image-only and were read using OCR. The final brief and proposal define the capstone scope. To-do, weather, and notes exercises are separate teaching examples/assignments; their techniques are applied to FridgeChef without adding unrelated applications.

**Current conclusion, updated 21 November 2026:** the application is deployed on Vercel and Render with Atlas persistence. The team confirms a completed presentation score of **9/10**. Teacher feedback has been implemented: general ingredient normalization, automatic shopping-to-pantry additions, and a unit dropdown with No unit for counts. Current test and deployment evidence is recorded in [ACCEPTANCE.md](ACCEPTANCE.md). Original milestone submission dates are not inferred from later work.

## Milestones explicitly listed in the chapters

| Deliverable | Due | Exact source | Implementation and remaining evidence |
| --- | --- | --- | --- |
| Proposal | Session 19 | Chapter 17 p. 24; final brief p. 1 | Supplied one-page proposal includes idea, audience, must/nice-to-have features, stack, team names, and rough schema. Instructor approval and original submission date are not recorded here. |
| Milestone 1 | Session 20 | Chapter 20 p. 3 | One repo, `client/` + `server/`, two `dev` scripts, ignored env files, committed examples, and setup README. [DESIGN.md](DESIGN.md) now includes every main screen, navigation arrows, and all schema fields/types/references. A fresh real-database startup check on a teammate's configured environment remains. |
| Milestone 2 | Session 21 | Chapter 21 p. 3 | Signup/login with bcrypt/JWT; every private route authenticated; missing/bad token → 401; main-resource CRUD; owner-scoped queries; meaningful status codes. Backend tests check Bob/Alice isolation and input rejection; current hosted verification is tracked in the acceptance report. |
| Milestone 3 | Session 22 | Chapter 22 p. 3 | React calls Express using the configured API origin; tokens accompany private calls; loading/errors are visible; signup/login/logout and pantry CRUD exist. Normal mode uses the real API; labeled demo mode is separate. The acceptance report distinguishes mocked browser coverage from live persistence checks. |
| Milestone 4 | Session 23 | Chapter 23 p. 3 | **Deployed.** Public frontend/API links are at the top of README. Vercel SPA rewrites, Render configuration, Atlas persistence, and production guards are present. Current live checks and remaining physical-phone checks are identified in the acceptance report. |
| Final submission | Session 24 | Chapter 17 p. 25; final brief p. 2 | One full-stack GitHub repo, both public URLs, documented app, and completed presentation. The team reports **9/10** for the presentation. [PRESENTATION.md](PRESENTATION.md) now reflects the feedback improvements. |

The checkpoint schedule also appears in Chapter 17 p. 23. A milestone needs a visible commit/tag or posted update **by its due date** (final brief p. 2). The PDFs identify sessions, not calendar dates, so this review does not infer deadline compliance or backdate progress.

## Visible source history

| Evidence | Existing commit |
| --- | --- |
| Initial scaffold | `131434b` — 6 November 2026 |
| React frontend and API integration preparation | `4e4aee9` — 9 November 2026 |
| Tested public recipe API | `75b0614` — 9 November 2026 |
| Database/auth work | `a6de54f` — 13 November 2026 |
| Private pantry/favorites/shopping APIs | `319a333` — 14 November 2026 |
| Full-stack integration merge | `36b068c` — 16 November 2026 |

This course-compliance update adds finalized design evidence, security fixes, JavaScript-only carousel source, full recipe proxy use, performance evidence, and deployment configuration. These additions document the current result; they are not proof that the same material existed at an earlier deadline.

The implementation checkpoint is commit `780350a`. Both the [push checks](https://github.com/JovaniBouKhalil/FridgeChef/actions/runs/43909610843) and [pull request checks](https://github.com/JovaniBouKhalil/FridgeChef/actions/runs/43909848184) passed on GitHub's clean Ubuntu environment, including the frontend build and browser suite. [Pull request #1](https://github.com/JovaniBouKhalil/FridgeChef/pull/1) records the complete change.

## Proposal feature coverage

| Proposal feature | Source evidence |
| --- | --- |
| Signup/login | `server/routes/auth.js`, `client/src/auth/`, `client/src/pages/AuthPage.jsx` |
| Private pantry add/edit/delete | `server/routes/pantry.js`, `server/models/PantryItem.js`, `PantryPage.jsx` |
| TheMealDB recipe search | Express recipe routes/controller/service and `client/src/api/recipes.js` |
| Ingredient-match ranking | `client/src/utils/ingredients.js`, pantry matching control, and ranking tests |
| Details showing missing ingredients | `RecipePage.jsx` and shared ingredient matching |
| Mobile-friendly design | Responsive CSS and browser checks at 320, 360, 430, and 768px |
| Save favorites (nice-to-have) | Private Favorites model/routes, saved page, and card/detail/carousel actions |
| Missing-ingredient shopping list (nice-to-have) | Private ShoppingItem model/routes and deduplicating kitchen actions |
| Category filters (nice-to-have) | Discover category chips filter the currently loaded results |

All application source is JavaScript/JSX, HTML, and CSS. React/Router/Vite, Express/Mongoose, bcrypt/JWT, CORS, Helmet, and rate limiting match the course techniques. Additional browser testing is development tooling.

## Other chapter evidence

| Course item | Evidence |
| --- | --- |
| Chapters 12–15: modules, async/await, props, state, forms, effects/cleanup, context | [Frontend guide](FRONTEND_GUIDE.md), reusable components/hooks, shared services, and component tests |
| Chapters 16–18: Express, REST status codes, persistence/schema | Routes/controllers/services/models, API tests, and [final schema](DESIGN.md) |
| Chapter 19: authentication and authorization | Expiring JWTs, bcrypt, protected routes, ownership tests, and client 401 handling |
| Chapter 21 pp. 19–20: three security attacks and before/fix/after file | [SECURITY.md](../SECURITY.md), measured header/login/input findings, and regression tests |
| Chapter 22 p. 18: component/API tests, deliberate failing assertion, performance comparison | [PERFORMANCE.md](../PERFORMANCE.md), frontend/backend suites, and saved Lighthouse reports. A controlled in-memory alias regression was detected by the same assertion that passes against actual source. |
| Chapter 23 p. 11: GitHub Actions | `.github/workflows/ci.yml` checks each side; Render's deployment trigger waits for CI |
| Chapter 23 p. 15: deploy API/database, then frontend | [Deployment guide](DEPLOYMENT.md), public links in README, and current [acceptance evidence](ACCEPTANCE.md) |

## Grading rubric and priorities

The final brief p. 2 assigns 30 functionality, 20 code quality/organization, 15 design/UX, 15 security/testing, 10 documentation, and 10 presentation points.

| Criterion | Evidence / highest remaining priority |
| --- | --- |
| Functionality — 30 | All proposed features have implementations. Verify the complete flow with real Atlas persistence on public services; mocked tests cannot certify this. |
| Organization — 20 | Separate client/server, reusable React components and hooks, shared request service, Express routes/services/models, and course-stack JavaScript. |
| Design/UX — 15 | Responsive screens, keyboard/touch controls, validation, explicit loading/error/empty states, and reviewed desktop/mobile screenshots. |
| Security/testing — 15 | Hashing, ownership, bounded inputs, safe errors, secrets outside Git, rate limits, headers, and automated tests. Confirm hosted HTTPS/CORS and the two-user check. |
| Documentation — 10 | Root setup/features/stack/architecture README with public URLs, API agreement, current wireframes/schema, acceptance evidence, and dated security/performance reports. |
| Presentation — 10 | **9/10 received**, as confirmed by the team. This score applies to the presentation criterion only. |

## Remaining acceptance checklist

- [x] Configure hosting and the team's Atlas connection; private values remain outside the repository.
- [x] Publish the checked source and confirm CI succeeds remotely (`780350a`, both push and PR runs passed).
- [x] Deploy the Express API and frontend and record both public URLs in README.
- [ ] Complete the updated release acceptance check; results belong in [ACCEPTANCE.md](ACCEPTANCE.md).
- [ ] Complete the physical-phone/mobile-data check outside demo mode; browser emulation is separate evidence.
- [ ] Confirm original milestone submission dates against the course submission system; Git history alone does not establish session deadlines.
- [x] Deliver the presentation/Q&A; the team confirms **9/10**.
