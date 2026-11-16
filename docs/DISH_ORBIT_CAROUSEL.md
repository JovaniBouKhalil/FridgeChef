# Dish Orbit Carousel integration

Open `/featured`, or choose **Featured recipes** from discovery. The route is public; saving a recipe uses the existing login/demo rules. Five actual recipes from the existing TheMealDB snapshot provide matching photos, ingredients, videos, IDs and working links to full recipe details.

## Files and default paths

| Purpose | Path |
| --- | --- |
| Reusable typed component | `client/src/components/ui/dish-orbit-carousel.tsx` |
| Component styles | `client/src/components/ui/dish-orbit-carousel.css` |
| Supplied geometry/navigation helpers | `client/src/components/ui/dish-orbit-carousel.utils.ts` |
| Usage wrapper | `client/src/components/ui/demo.tsx` |
| App integration and real recipe actions | `client/src/pages/FeaturedRecipesPage.jsx` |
| Tailwind utilities/theme | `client/src/tailwind.css` |
| Existing application styles | `client/src/index.css`, `App.css`, `interactions.css` |
| Shared shadcn class helper | `client/src/lib/utils.ts` |
| shadcn generator configuration | `client/components.json` |

The project previously placed all components in `client/src/components`. The new `ui` subfolder separates the reusable visual component from pantry/authentication/domain components. It is the conventional target for shadcn-generated UI source. React itself does not require this folder; the useful part is a consistent location and import alias. Here `@/components/ui` resolves to `client/src/components/ui`, not a folder at repository root.

## Setup already performed

The application remains React + Vite. Existing screens stay JavaScript/JSX, with TypeScript support added for the supplied component and shared typed utilities.

```sh
cd client
npm install gsap lucide-react clsx tailwind-merge
npm install -D typescript typescript-eslint @types/node tailwindcss @tailwindcss/vite
```

Vite's existing React plugin transpiles TSX; `tsconfig.json` enables strict checking of TS/TSX files, JSON imports, DOM types and the `@/*` path alias. `npm run typecheck` performs the separate compiler check. Existing JavaScript files are allowed without turning this task into a conversion of the whole course project. ESLint checks both JS/JSX and TS/TSX.

Tailwind uses its Vite plugin. `src/tailwind.css` imports theme and utility layers, with no Preflight reset, so adding tooling does not reset the existing forms, layout or typography. It defines the existing FridgeChef colors as Tailwind theme tokens. The carousel itself uses scoped CSS for its geometry and animation layout; installing Tailwind is not a reason to rewrite the previous screens.

The shadcn-compatible structure is configured manually in `components.json`: TSX, Lucide icons, the CSS entry, and aliases for components, UI, hooks and utilities. No shadcn widgets were needed by the supplied component. Future widgets can be generated from `client/` using, for example:

```sh
npx shadcn@latest add button
```

For a new project without this configuration, follow the [official shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite), run `npx shadcn@latest init`, and configure the aliases and Tailwind plugin as documented. The [official Tailwind Vite guide](https://tailwindcss.com/docs/installation/using-vite) describes the plugin setup. These generator commands are instructions for future additions; the integration does not require running init again.

## Data and actions

- `dishes` is a stable array built from `demoMeals.json`, the same real recipe snapshots used elsewhere in the app. Display titles are shortened for the carousel, while thumbnail labels and destination IDs retain the actual recipe names.
- `onOrder`, retained from the supplied component's prop name, opens `/recipes/:id`. Its visible label is **View recipe**; FridgeChef does not implement food ordering.
- `onPlay` opens the selected recipe's HTTPS YouTube link in a separate tab. The control is shown only when a video exists.
- `renderAction` renders the app's save button. It delegates to `KitchenProvider.toggleFavorite`, shows genuine pending/errors, and redirects guests to login with `/featured` as the return destination.
- `onChange` remains available to component consumers. The component owns its selected index, information tab and gesture state.
- Optional `rating`, `chef` and `kitchen` metadata remain supported by the reusable component, but the app supplies actual ingredient counts and TheMealDB attribution. It does not invent community ratings or present example chefs as real authors.

## Animation and responsive behavior

The original orbit pivot, arc generation, shortest-direction calculation, opposing title wipes, plate swing and color morph are retained. The layout uses a responsive grid instead of shrinking a fixed 960px canvas, which keeps text and controls legible. Controls remain at least 44px. Narrow containers stack the image, title and information card; the thumbnail row remains horizontally scrollable.

Arrow buttons, thumbnail buttons, Left/Right keys, Home/End and horizontal mouse/touch swipes change the selected recipe. The Overview/Ingredients tabs have their own Left/Right and Home/End behavior. Only the active recipe is exposed to assistive technology. Reduced motion switches slides immediately and stops decorative GSAP movement.

Each slide animation uses [GSAP context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context()/). Timelines are killed/reverted on replacement, preference change or unmount. This also handles StrictMode's mount/cleanup cycle. Thumbnail scrolling stays within its own strip.

`scrollDriven` is an optional desktop-only presentation mode for consumers who want the original pinned-scroll showcase. `height` sets its stage height and `loop` controls wrapping. Touch devices and reduced-motion users always retain normal scrolling. The app's usage wrapper explicitly sets `scrollDriven={false}` so this optional showcase does not trap users trying to reach pantry navigation or the page footer.

The entire Featured page is lazy loaded. The GSAP/Lucide/carousel code and component CSS are loaded when opening this route, rather than being part of the normal discovery/pantry startup bundle.

## Assets and attribution

- Recipe photos/data: existing [TheMealDB](https://www.themealdb.com) snapshots and local images. They match the full recipe pages.
- The supplied Unsplash wall backdrop is extracted into `client/public/images/orbit/kitchen-wall.webp`; its source note is alongside the asset. No remote image dependency is required to open the featured view.
- The supplied Outfit font is extracted into `client/public/fonts/outfit-latin.woff2`. The complete SIL Open Font License and upstream copyright notice are included in `client/public/fonts/OFL-Outfit.txt`; [upstream license](https://github.com/Outfitio/Outfit-Fonts/blob/main/OFL.txt). Pass `fontSrc={null}` to use the host font.
- Icons use Lucide React. `cn` uses clsx and tailwind-merge, following the configured shadcn source structure.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The browser suite checks carousel entry/exit, settled animations, arrows/thumbnails/keyboard, information tabs, real saved-recipe destinations, guest login return, touch swipes, reduced motion and 44px controls. `/featured` is also included in the 320/360/430/768px responsive route checks. The unit suite covers the original navigation/geometry helpers alongside the existing frontend tests.
