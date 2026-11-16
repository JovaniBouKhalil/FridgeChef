import "dotenv/config";

import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

try {
  const app = createApp();
  await connectDatabase();
  console.info("Connected to MongoDB.");

  app.listen(port, () => {
    console.info(`FridgeChef API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
