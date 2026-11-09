# FridgeChef frontend

React + React Router + Vite + plain CSS, following the supplied course slides.

The later Dish Orbit carousel adds a typed component, GSAP/Lucide and Tailwind/shadcn-compatible setup. See the [carousel integration guide](../docs/DISH_ORBIT_CAROUSEL.md). Run `npm run typecheck` to check its TSX files.

See the [project README](../README.md) for setup, features, tests and deployment, [API contract](../docs/API_CONTRACT.md) for backend integration, and [frontend guide](../docs/FRONTEND_GUIDE.md) for course mapping and screen flow.

```sh
npm ci
# Copy .env.example to .env, then:
npm run dev
```

To review before the backend exists, use **Sign in → Try demo kitchen**. Normal account actions call the real Express API configured in `VITE_API_URL`.
