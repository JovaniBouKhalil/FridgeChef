import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is required. Set it in server/.env.");
  }

  try {
    await mongoose.connect(uri);
  } catch {
    throw new Error(
      "MongoDB connection failed. Check MONGODB_URI and Atlas network access."
    );
  }
}
