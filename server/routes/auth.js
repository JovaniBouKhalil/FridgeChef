import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtConfig } from "../config/jwt.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;
const BCRYPT_MAX_BYTES = 72;

function normalizeEmail(value) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function createPublicUser(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function createToken(user, secret, expiresIn) {
  return jwt.sign({ userId: user._id.toString() }, secret, { expiresIn });
}

function isValidPassword(value, { requireMinimumLength = true } = {}) {
  return (
    typeof value === "string" &&
    (!requireMinimumLength || Array.from(value).length >= 8) &&
    Buffer.byteLength(value, "utf8") <= BCRYPT_MAX_BYTES
  );
}

export function createAuthRouter({
  userModel = User,
  jwtSecret,
  jwtExpiresIn,
} = {}) {
  const { secret, expiresIn } = getJwtConfig({
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  });
  const router = express.Router();

  router.post("/signup", async (req, res, next) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "A JSON request body is required." });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (name.length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters.",
      });
    }

    if (!email) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    try {
      const existingUser = await userModel.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          error: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await userModel.create({ name, email, passwordHash });
      const token = createToken(user, secret, expiresIn);

      return res.status(201).json({
        token,
        user: createPublicUser(user),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          error: "An account with this email already exists.",
        });
      }

      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "A JSON request body is required." });
    }

    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!email || !isValidPassword(password, { requireMinimumLength: false })) {
      return res.status(400).json({
        error: "A valid email address and password are required.",
      });
    }

    try {
      const user = await userModel
        .findOne({ email })
        .select("+passwordHash");

      if (
        !user ||
        typeof user.passwordHash !== "string" ||
        !(await bcrypt.compare(password, user.passwordHash))
      ) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = createToken(user, secret, expiresIn);

      return res.status(200).json({
        token,
        user: createPublicUser(user),
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
