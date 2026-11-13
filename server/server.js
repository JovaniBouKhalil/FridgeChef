import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 3000;

try {
  const app = createApp();
  await connectDatabase();
  console.info("Connected to MongoDB.");

  app.listen(port, () => {
    console.info(`Server listening on port ${port}.`);
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
