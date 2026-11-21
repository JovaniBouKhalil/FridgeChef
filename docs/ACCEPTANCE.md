# Final feedback and acceptance report

Updated **21 November 2026** against the final capstone rubric. The team confirms a **9/10 presentation score**. The overall project grade remains the instructor's decision.

## Teacher feedback implemented

| Feedback | Current behavior | Verification |
| --- | --- | --- |
| Ingredient variants count as one ingredient | General English singular/plural rules, case, whitespace, accents, hyphens, and common spelling corrections are applied to pantry duplicates, shopping duplicates, and recipe matching. Distinct ingredients remain distinct. | Frontend matching tests, Mongoose validation, API duplicate checks against current and legacy records, desktop/mobile browser flow. |
| Picking up groceries updates the ingredients list | Checking a shopping item adds it to the owner's pantry once. Unknown amounts show Not specified; existing pantry quantities are preserved. Unchecking or clearing shopping does not remove pantry items. | API ownership/idempotency/failure tests, signed-in state-refresh test, demo persistence, desktop/mobile browser flow. |
| Quantities need clear measurement units | Add/edit forms offer g, kg, ml, l, tsp, tbsp, cups, containers, and No unit for counts. Existing free-text amounts and saved units remain editable. | Form tests for measured amounts, bare counts, pending saves, and legacy quantities; desktop/mobile flow and layout checks. |
| Normalized names must still find recipes | Empty ingredient searches resolve against TheMealDB's ingredient catalog, translating keys such as mushroom and chilli flake to the provider's accepted spelling. | Provider service regression tests and live public-provider checks. |

## Automated release checks

All local release checks passed on **21 November 2026**:

| Check | Result |
| --- | --- |
| Frontend `npm test` | 88 tests passed |
| Backend `npm test` | 52 tests passed |
| Desktop/mobile `npm run test:e2e -- --workers=2` | 30 browser tests passed |
| Frontend `npm run lint` | Passed |
| Frontend production build using the public API origin | Passed |
| Live provider queries through the updated service | mushroom: 20 recipes; chilli flake: 8 recipes |
| Local Markdown references | 14 documents checked; no missing file links |
| Git whitespace check and verifier syntax checks | Passed |
| Clean Ubuntu GitHub CI | [Passed for f9d6184](https://github.com/JovaniBouKhalil/FridgeChef/actions/runs/44923170223) |

The total is **170 automated tests**. Browser checks used Chrome on Windows, with desktop/mobile viewports and responsive widths from 320px to 768px. The reproducible CI configuration uses Chromium on Ubuntu. Local component/API/browser suites use fixtures or injected models; the live verification below provides separate hosted-service evidence.

Historical Lighthouse measurements in PERFORMANCE.md retain their original dates; they are not presented as a fresh live audit.

## Public deployment

- Frontend: https://fridge-chef-ecru.vercel.app
- API: https://fridgechef-api-xvri.onrender.com
- Database: MongoDB Atlas, accessed only by the API.
- Frontend HTML and API health both returned HTTP 200 on 21 November 2026.
- Vercel reported a successful deployment of `f9d6184`.
- The deployed frontend passed isolated demo checks at 1440px and 390px: unit editing, refresh persistence, and shopping-to-pantry additions, with zero uncaught browser errors. These checks verify the production frontend bundle; demo storage does not establish MongoDB persistence.

**API rollout still needs confirmation.** After the successful source push and CI run, the public API still returned the previous behavior: zero recipes for normalized mushroom and chilli flake, while the updated service returned 20 and 8 respectively against the real provider. Render account access is not connected in this workspace, so its deployment event/log state could not be inspected. Confirm the API service deploys the updated `main` commit before considering this release live-verified.

Once that API rollout completes, run:

```sh
node scripts/verify-deployment.mjs https://fridge-chef-ecru.vercel.app https://fridgechef-api-xvri.onrender.com --browser
```

This expanded live check covers real accounts, persistence, owner isolation, ingredient duplicates, shopping-to-pantry updates, recipe searches, CORS, and desktop/mobile UI flows. It has not been recorded as passed against the old API. Generated resource records are cleaned up; labeled test accounts remain because account deletion is outside the application scope. Credentials remain in memory.

## Remaining manual evidence

- Test on a physical phone using mobile data. Automated mobile browser coverage does not establish this.
- Confirm original milestone submission dates in the course submission system. This report does not backdate changes or infer deadline compliance.
