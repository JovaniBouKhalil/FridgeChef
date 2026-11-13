import cors from "cors";
import express from "express";
import { createAuthRouter } from "./routes/auth.js";

export function createApp(options = {}) {
  const clientOrigin =
    options.clientOrigin ??
    process.env.CLIENT_ORIGIN ??
    "http://localhost:5173";
  const app = express();

  app.use(
    cors({
      origin: clientOrigin,
      allowedHeaders: ["Authorization", "Content-Type"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    })
  );
  app.use(express.json({ limit: "16kb" }));
  app.use("/api/auth", createAuthRouter(options));
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });
  app.use((error, _req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Request body must be valid JSON." });
    }

    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large." });
    }

    console.error(
      "Unhandled API error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).json({ error: "An unexpected error occurred." });
  });

  return app;
}
