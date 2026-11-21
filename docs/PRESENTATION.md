# Session 24 presentation — approximately seven minutes

Source: final brief page 2 and Chapter 17 page 25. The required presentation lasts 5–8 minutes and includes the problem, a live walkthrough, one technical challenge, future work, and Q&A.

**Presentation completed: 9/10**, confirmed by the team on 21 November 2026. The walkthrough below describes the current application and supports the final project handoff. The teacher's feedback led to general ingredient normalization, automatic shopping-to-pantry updates, and a quantity unit dropdown with a No unit option.

Use the deployed production app and a fresh test account. Demo mode can support a clearly disclosed backup if an external service is unavailable; it does not demonstrate real authentication or persistence.

| Time | Show / explain |
| --- | --- |
| 0:00–0:40 | Introduce the team and problem: students and home cooks often buy ingredients while forgetting food they already have. FridgeChef finds recipes using their pantry and highlights what is missing. |
| 0:40–1:20 | Create an account or sign into a prepared demonstration account. Explain that the API hashes passwords and protects private routes with JWTs. |
| 1:20–2:20 | Add ingredients with quantities, selecting g/ml/tsp or No unit for counts. Demonstrate that capitalization and singular/plural variants do not create duplicates. Edit a quantity, refresh to prove persistence, then remove an unneeded item. |
| 2:20–3:30 | Search for a recipe, enable Pantry matches, open the details, and explain available/missing ingredients. State that matching compares names and does not calculate quantities. |
| 3:30–4:20 | Save a recipe, add missing ingredients to Shopping twice to show deduplication, check an item, and open My pantry to show its automatic addition. Explain that an unknown purchased amount is marked Not specified and can be edited. Show the mobile layout briefly. |
| 4:20–5:30 | Explain one request end to end: React component → shared API client → JWT middleware → owner-scoped route → MongoDB → JSON → updated React state. Public recipe requests go through the Express/TheMealDB service. |
| 5:30–6:15 | Explain a concrete challenge: TheMealDB's ingredient filter returns partial candidate recipes. The application fetches full ingredient lists, normalizes aliases, and ranks matches, while bounding requests. Explain why quantities are not inferred. |
| 6:15–7:00 | Show passing tests and the security/performance evidence. Explain future work: quantity-aware recipe matching and unit conversion, ingredient suggestions for uncommon spellings, and password recovery. Invite questions. |

## Questions to rehearse

- Why is a protected React route insufficient? The API must independently verify the JWT and ownership on every private request.
- How is one user's data kept separate? User IDs come from the token and appear in each database filter; changing userId in a request body has no effect.
- Where are recipes stored? Full recipes come from TheMealDB through Express; the database stores users' pantry, favorites metadata, and shopping items.
- Why fetch full recipe details for matching? Ingredient-filter candidates do not contain all 20 ingredient slots needed to calculate a percentage.
- How are ingredient variants handled? Shared rules normalize case, spacing, accents, hyphens, general English plurals, and common spelling variants. The backend also resolves normalized names to the recipe provider's ingredient catalog when its exact spelling is required.
- Why does a checked shopping item show Not specified in the pantry? The checklist records ingredient names, not purchased amounts. The app adds the ingredient without inventing an amount or overwriting an existing pantry quantity.
- What survives refresh? Auth token/profile are browser state; real pantry, favorites, and shopping records reload from MongoDB. Demo samples use a separate browser key.
- What happens when a token expires or an API fails? A private 401 clears the session; loading/error/retry states are visible instead of an uncaught failure.
- What belongs in Vercel versus Render settings? Only the public API origin is needed by the frontend; the database URI and JWT signing secret belong on the server.
- What did the security audit change? Headers, failed-login throttling, and oversized profile input limits; see the measured before/after table.

Before presenting, rehearse once with a timer, verify both public URLs on mobile data, prepare two accounts to demonstrate isolation, and confirm the Network and Console panels are clear. Each teammate should be able to explain their own contribution without claiming work they did not do.
