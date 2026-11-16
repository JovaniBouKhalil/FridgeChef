# Featured recipe carousel

The Featured route uses the course stack: JavaScript/JSX, React hooks, browser events, and plain CSS. The earlier supplied component was adapted to this stack; its extra language, animation, utility, and icon tooling has been removed from the application dependencies.

## Files

| Purpose | File |
| --- | --- |
| Route and API loading | `client/src/pages/FeaturedRecipesPage.jsx` |
| Reusable carousel | `client/src/components/ui/dish-orbit-carousel.jsx` |
| Navigation / SVG helpers | `client/src/components/ui/dish-orbit-carousel.utils.js` |
| Layout, motion, mobile rules | `client/src/components/ui/dish-orbit-carousel.css` |
| Icons | `client/src/components/Icon.jsx` |
| Browser checks | `client/e2e/featured.spec.js` |

## Data and interaction

The page stores only a curated list of real TheMealDB recipe IDs and display accents. A cleaned-up effect loads their complete recipes through `getRecipe` and the Express API. Normal mode does not display fixture recipe contents; the explicit demo mode uses the local snapshots. Failed requests show retry feedback.

The carousel receives `dishes`, optional `backdrop`, optional `loop`, and callbacks for recipe navigation, videos, selection, and the save action. `useState` owns the selected index and Overview/Ingredients tab; props provide the recipe contents and actions. `useRef` holds pointer coordinates and thumbnail elements. An effect scrolls the selected thumbnail into view without moving the page.

Previous/Next, thumbnails, ArrowLeft/ArrowRight, Home/End, and horizontal swipes change recipes. Tabs implement their own arrow and Home/End keys. Only the active slide is exposed to assistive technology. View recipe opens the actual details route, video links allow known HTTPS YouTube hosts, and saving uses the existing JWT/kitchen contexts.

CSS keyframes animate the entering plate and title spans. A reduced-motion media query disables those animations. There is no scroll takeover, animation timer, or extra event listener to leak on route changes. The route remains lazy-loaded with React `lazy` and `Suspense`.

The CSS uses a three-column desktop composition, two columns at medium container widths, and one column on phones. Controls retain 44px targets, and thumbnails scroll horizontally inside their strip.

## Assets and checks

Local images and demo contents are attributed to TheMealDB. The local Outfit font has its OFL license under `client/public/fonts`; backdrop attribution is under `client/public/images/orbit/README.md`.

```sh
npm run lint
npm test
npm run test:e2e -- --workers=2
```

The browser suite exercises arrows, keyboard boundaries, touch/mouse swipes, tabs, reduced motion, save/detail actions, guest login return, responsive layout, and route cleanup on desktop and mobile. The production build comparison is recorded in `PERFORMANCE.md`.
