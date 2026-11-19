import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";

import { createAuthenticateToken } from "./middleware/authenticateToken.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { createAuthRouter } from "./routes/auth.js";
import { createFavoritesRouter } from "./routes/favorites.js";
import { createPantryRouter } from "./routes/pantry.js";
import { createRecipeRouter } from "./routes/recipeRoutes.js";
import { createShoppingRouter } from "./routes/shopping.js";
import { createMealDbService } from "./services/mealDbService.js";

export function createApp(options = {}) {
  mongoose.set("sanitizeFilter", true);
  const clientOrigin =
    options.clientOrigin ??
    process.env.CLIENT_ORIGIN ??
    // Local-development fallback only. Production startup rejects a missing
    // CLIENT_ORIGIN below, so the deployed API never falls back to localhost.
    "http://localhost:5173";
  if (
    process.env.NODE_ENV === "production" &&
    !options.clientOrigin &&
    !process.env.CLIENT_ORIGIN
  ) {
    throw new Error("CLIENT_ORIGIN is required in production.");
  }
  const mealDbService = options.mealDbService ?? createMealDbService();
  const app = express();
  const proxyHops =
    options.trustProxyHops ?? Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
  }
  app.set("trust proxy", proxyHops);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: clientOrigin,
      allowedHeaders: ["Authorization", "Content-Type"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again in 15 minutes." },
    }),
  );
  app.use(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      skipSuccessfulRequests: true,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Too many sign-in attempts. Please try again in 15 minutes.",
      },
    }),
  );

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/recipes", createRecipeRouter({ mealDbService }));
  app.use("/api/auth", createAuthRouter(options));

  const authenticateToken = createAuthenticateToken({
    secret: options.jwtSecret,
  });
  app.use(
    "/api/pantry",
    authenticateToken,
    createPantryRouter({ pantryModel: options.pantryModel }),
  );
  app.use(
    "/api/favorites",
    authenticateToken,
    createFavoritesRouter({ favoriteModel: options.favoriteModel }),
  );
  app.use(
    "/api/shopping",
    authenticateToken,
    createShoppingRouter({ shoppingModel: options.shoppingModel }),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
