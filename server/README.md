# FridgeChef backend

## MongoDB connection

1. From this directory, copy `.env.example` to `.env`.
2. Replace the placeholder values in `MONGODB_URI` with your MongoDB Atlas connection details. Keep `.env` private and do not commit it.
3. Generate a JWT key with `openssl rand -base64 32` and set it as `JWT_SECRET` in `.env`.
4. Optionally change `JWT_EXPIRES_IN`; it defaults to `1d`.
5. Set `CLIENT_ORIGIN` to your frontend origin; it defaults to `http://localhost:5173`.
6. Start the backend with `npm run dev`.

The server requires a JWT secret of at least 32 bytes and connects to MongoDB before it starts listening on port `3000`. A successful connection prints `Connected to MongoDB.`; connection failures produce a message that does not include the connection URI.

## Authentication

- `POST /api/auth/signup` accepts `{ name, email, password }` and returns `201` with a signed token and public user.
- `POST /api/auth/login` accepts `{ email, password }` and returns `200` with a signed token and public user.
- Use `Authorization: Bearer <token>` for protected routes. The authentication middleware verifies the token and sets `req.user.id`.

## Tests

Run `npm --prefix server test` from the repository root, or `npm test` from this directory. The model and authentication tests run without a MongoDB connection.
