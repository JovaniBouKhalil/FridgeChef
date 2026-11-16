import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getJwtConfig } from "../config/jwt.js";

export function createAuthenticateToken({ secret } = {}) {
  const { secret: jwtSecret } = getJwtConfig({ secret });

  return function authenticateToken(req, res, next) {
    const authorization = req.get("authorization") ?? "";
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);

    if (!match) {
      return res.status(401).json({ error: "Authentication required." });
    }

    let payload;

    try {
      payload = jwt.verify(match[1], jwtSecret);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.userId !== "string" ||
      !mongoose.isValidObjectId(payload.userId)
    ) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    req.user = { id: payload.userId };
    return next();
  };
}
