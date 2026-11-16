# FridgeChef frontend

React, React Router, JavaScript/JSX, Vite, and plain CSS, following Chapters 12–15 and 20–23. The featured recipe carousel uses React state and CSS keyframes with the shared SVG icon component.

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env` for local configuration. `VITE_API_URL` is the Express API origin. Public recipes and private account data both use the API; public calls omit the bearer token.

For a production build, set `VITE_API_URL` to the actual public HTTPS API origin, then run `npm run build`. Vercel must use this `client` directory as its root so `vercel.json` supplies the SPA fallback.

To review the interface without a database connection, use **Sign in → Try demo kitchen**. Normal account mode uses the real API and MongoDB persistence.

See the [project README](../README.md), [deployment guide](../docs/DEPLOYMENT.md), [API contract](../docs/API_CONTRACT.md), and [frontend guide](../docs/FRONTEND_GUIDE.md).
