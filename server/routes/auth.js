import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtConfig } from "../config/jwt.js";
import { loginInput, parseInput, signupInput } from "../validation/schemas.js";

const BCRYPT_ROUNDS = 12;

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
    const body = parseInput(signupInput, req.body);
    if (!body) {
      return res
        .status(400)
        .json({ error: "Request body contains invalid fields." });
    }
    const name = body.name;
    const email = body.email;
    const password = body.password;

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        error: "Name must be between 2 and 100 characters.",
      });
    }

    if (!email) {
      return res
        .status(400)
        .json({ error: "A valid email address is required." });
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
    const body = parseInput(loginInput, req.body);
    if (!body) {
      return res
        .status(400)
        .json({ error: "Request body contains invalid fields." });
    }
    const email = body.email;
    const password = body.password;

    try {
      const user = await userModel.findOne({ email }).select("+passwordHash");

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
