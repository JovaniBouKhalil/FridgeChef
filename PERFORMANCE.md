# Performance and testing — Chapter 22

Measured on 16 November 2026, following Chapter 22 pages 5 and 18: audit the production build, save the before report, make an improvement, re-run, and record the result.

## Improvement

The featured carousel now uses JavaScript/JSX, React state, and CSS keyframes. Removing the extra animation/icon/style tooling reduces the amount of code needed when opening Featured recipes. The route remains lazy-loaded. The sign-in page is the Lighthouse comparison target because it renders the same content before and after and does not depend on a live database or recipe provider.

| Production build output | Before | After |
| --- | ---: | ---: |
| Featured route JavaScript | 158.33 KB | 9.43 KB |
| Featured route JavaScript, gzip | 59.73 KB | 3.69 KB |
| Main stylesheet | 31.33 KB | 28.62 KB |
| Main stylesheet, gzip | 7.32 KB | 6.72 KB |
| Main application JavaScript | 333.43 KB | 333.48 KB |

The Featured JavaScript chunk is about **94% smaller**, and its gzip size is about **94% smaller**. The main bundle is effectively unchanged while adding real Featured API loading. These are build artifact sizes, not estimates of a production user's download time.

## Saved Lighthouse comparison

Lighthouse 13.6.0 audited `http://127.0.0.1:4173/login` using the production preview, headless Chrome, and default mobile settings. Each run used a fresh temporary browser profile. It did not audit the Vite development server.

| Metric | Before | After |
| --- | ---: | ---: |
| Performance score | 100 | 100 |
| Accessibility score | 100 | 100 |
| Best practices score | 100 | 100 |
| First contentful paint | 762 ms | 756 ms |
| Largest contentful paint | 762 ms | 756 ms |
| Total blocking time | 8 ms | 11 ms |
| Cumulative layout shift | 0 | 0 |
| Transferred bytes on this page | 175,347 | 174,790 |

The score was already at its maximum; it did not improve. Small timing changes are normal run-to-run variation, and blocking time increased by 3 ms. The measured code-size improvement concerns the Featured route, which is not loaded on the audited sign-in screen. A Lighthouse navigation audit does not measure real-user INP, nor does this local test certify deployed latency or live API functionality.

- [Before report](docs/evidence/lighthouse-before.html)
- [After report](docs/evidence/lighthouse-after.html)
- [Machine-readable metric summary](docs/evidence/performance-metrics.json)

The after build used the explicitly non-deployable `https://build-only.invalid` compile-check origin because a production API URL has not been provisioned. The audited sign-in page performs no API calls. The hosting build must use the actual HTTPS API origin, and the final production site should be audited again after publication.

## Existing performance controls

- React lazy loading keeps the Featured page out of the initial route load.
- Image dimensions reserve layout space; noncritical card images load lazily.
- Recipe details are cached in the browser; ingredient candidates are capped at 24 and hydrated six requests at a time.
- Successful public provider requests also have a one-minute server cache, capped at 100 URLs, and one bounded retry for transport/upstream 5xx failures. Private collections and errors are not cached.
- Private MongoDB queries use `lean()` and owner indexes; per-user compound unique indexes support duplicate prevention.
- AbortController cancels obsolete frontend requests; browser and upstream server requests have timeouts.

## Automated test evidence

The reviewed source passed **22 frontend tests**, **46 backend tests**, and **24 desktop/mobile browser tests**, plus frontend lint and a configured production build. Browser checks cover responsive widths of 320, 360, 430, and 768px and the actual controls users operate. Backend tests exercise 401/400/404/409/429 cases, hashing, ownership, upstream failures, bounded retries, and cache expiry.

For the chapter's deliberate-failure exercise, an in-memory copy of `normalizeIngredient` had its alias lookup removed. The assertion that `tomatoes` normalizes to `tomato` failed for that copy and passed against the real source. No project file was left broken.

Tests use injected models and mocked HTTP; real Atlas persistence and the live frontend/API flow remain deployment acceptance checks. Reproduce checks using the root README and [deployment guide](docs/DEPLOYMENT.md).

A separate [local full-stack verification](docs/FULL_STACK_VERIFICATION.md) also passed using real MongoDB, live TheMealDB requests, and a browser without application/API mocks. It confirms local persistence and account isolation; the deployed environment still needs acceptance.

The same source also passed [GitHub Actions on a clean Ubuntu runner](https://github.com/JovaniBouKhalil/FridgeChef/actions/runs/43909610843) at implementation commit `780350a`, including installation, lint, both test suites, the configured build, and all browser checks.
