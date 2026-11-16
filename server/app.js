import cors from "cors";
import express from "express";

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
  const clientOrigin =
    options.clientOrigin ??
    process.env.CLIENT_ORIGIN ??
    "http://localhost:5173";
  const mealDbService = options.mealDbService ?? createMealDbService();
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: clientOrigin,
      allowedHeaders: ["Authorization", "Content-Type"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    })
  );
  app.use(express.json({ limit: "16kb" }));

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
    createPantryRouter({ pantryModel: options.pantryModel })
  );
  app.use(
    "/api/favorites",
    authenticateToken,
    createFavoritesRouter({ favoriteModel: options.favoriteModel })
  );
  app.use(
    "/api/shopping",
    authenticateToken,
    createShoppingRouter({ shoppingModel: options.shoppingModel })
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
