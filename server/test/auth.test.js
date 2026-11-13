import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../app.js";
import { createAuthenticateToken } from "../middleware/authenticateToken.js";

const jwtSecret = randomBytes(32).toString("base64url");
const userId = "0123456789abcdef01234567";

class FakeQuery {
  constructor(value) {
    this.value = value;
  }

  select() {
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.value).then(resolve, reject);
  }
}

function createFakeUserModel(seedUsers = []) {
  const users = [...seedUsers];

  return {
    users,

    findOne({ email }) {
      return new FakeQuery(users.find((user) => user.email === email) ?? null);
    },

    async create(fields) {
      if (users.some((user) => user.email === fields.email)) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }

      const user = { _id: new mongoose.Types.ObjectId(), ...fields };
      users.push(user);
      return user;
    },
  };
}

function createTestApp(userModel) {
  return createApp({
    userModel,
    jwtSecret,
    jwtExpiresIn: "1h",
  });
}

async function withServer(app, callback) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("signup hashes the password and returns the contracted public user and expiring token", async () => {
  const userModel = createFakeUserModel();

  await withServer(createTestApp(userModel), async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/signup", {
      name: "  Ada Lovelace ",
      email: " ADA@EXAMPLE.COM ",
      password: "correct-horse",
      userId: "client-controlled-id",
      passwordHash: "client-controlled-hash",
    });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(result.user, {
      _id: userModel.users[0]._id.toString(),
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    assert.equal("passwordHash" in result.user, false);
    assert.equal("password" in result.user, false);
    assert.deepEqual(
      Object.keys(userModel.users[0]).sort(),
      ["_id", "email", "name", "passwordHash"].sort()
    );
    assert.equal(
      await bcrypt.compare("correct-horse", userModel.users[0].passwordHash),
      true
    );

    const claims = jwt.verify(result.token, jwtSecret);
    assert.equal(claims.userId, userModel.users[0]._id.toString());
    assert.equal(claims.exp > claims.iat, true);
  });
});

test("signup rejects invalid input and malformed JSON with JSON errors", async () => {
  const userModel = createFakeUserModel();
  const invalidBodies = [
    { name: "A", email: "ada@example.com", password: "correct-horse" },
    { name: "Ada", email: "not-an-email", password: "correct-horse" },
    { name: "Ada", email: "ada@example.com", password: "short" },
  ];

  await withServer(createTestApp(userModel), async (baseUrl) => {
    for (const body of invalidBodies) {
      const response = await postJson(baseUrl, "/api/auth/signup", body);
      const result = await response.json();

      assert.equal(response.status, 400);
      assert.equal(typeof result.error, "string");
    }

    const malformedResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });

    assert.equal(malformedResponse.status, 400);
    assert.equal(typeof (await malformedResponse.json()).error, "string");
    assert.equal(userModel.users.length, 0);
  });
});

test("signup rejects duplicate normalized emails with 409", async () => {
  const userModel = createFakeUserModel();

  await withServer(createTestApp(userModel), async (baseUrl) => {
    const signup = (email) =>
      postJson(baseUrl, "/api/auth/signup", {
        name: "Ada Lovelace",
        email,
        password: "correct-horse",
      });

    assert.equal((await signup("ada@example.com")).status, 201);

    const duplicateResponse = await signup(" ADA@EXAMPLE.COM ");
    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(typeof duplicateBody.error, "string");
    assert.equal(userModel.users.length, 1);
  });
});

test("login returns a token on success and the same generic 401 for bad credentials", async () => {
  const passwordHash = await bcrypt.hash("correct-horse", 4);
  const userModel = createFakeUserModel([
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash,
    },
  ]);

  await withServer(createTestApp(userModel), async (baseUrl) => {
    const successResponse = await postJson(baseUrl, "/api/auth/login", {
      email: " ADA@EXAMPLE.COM ",
      password: "correct-horse",
    });
    const successBody = await successResponse.json();

    assert.equal(successResponse.status, 200);
    assert.deepEqual(successBody.user, {
      _id: userModel.users[0]._id.toString(),
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    assert.equal("passwordHash" in successBody.user, false);
    assert.equal(jwt.verify(successBody.token, jwtSecret).userId, successBody.user._id);

    const unknownEmailResponse = await postJson(
      baseUrl,
      "/api/auth/login",
      { email: "other@example.com", password: "correct-horse" }
    );
    const wrongPasswordResponse = await postJson(
      baseUrl,
      "/api/auth/login",
      { email: "ada@example.com", password: "incorrect-horse" }
    );

    assert.equal(unknownEmailResponse.status, 401);
    assert.equal(wrongPasswordResponse.status, 401);
    assert.deepEqual(
      await unknownEmailResponse.json(),
      await wrongPasswordResponse.json()
    );
  });
});

test("authentication middleware rejects missing, malformed, and expired JWTs", async () => {
  const app = express();
  app.get(
    "/private",
    createAuthenticateToken({ secret: jwtSecret }),
    (req, res) => res.json({ userId: req.user.id })
  );
  const expiredToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "-1s" });
  const validToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "1h" });

  await withServer(app, async (baseUrl) => {
    const missingResponse = await fetch(`${baseUrl}/private`);
    const malformedResponse = await fetch(`${baseUrl}/private`, {
      headers: { authorization: "Bearer not-a-jwt" },
    });
    const expiredResponse = await fetch(`${baseUrl}/private`, {
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    const validResponse = await fetch(`${baseUrl}/private`, {
      headers: { authorization: `Bearer ${validToken}` },
    });

    assert.equal(missingResponse.status, 401);
    assert.equal(malformedResponse.status, 401);
    assert.equal(expiredResponse.status, 401);
    assert.equal(validResponse.status, 200);
    assert.deepEqual(await validResponse.json(), { userId });
  });
});

test("CORS allows the frontend origin, auth headers, and contract methods", async () => {
  const app = createApp({
    userModel: createFakeUserModel(),
    jwtSecret,
    jwtExpiresIn: "1h",
    clientOrigin: "http://localhost:5173",
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:5173"
    );
    assert.match(
      response.headers.get("access-control-allow-methods"),
      /GET.*POST.*PATCH.*DELETE.*OPTIONS/
    );
    assert.match(
      response.headers.get("access-control-allow-headers"),
      /Authorization/
    );
    assert.match(
      response.headers.get("access-control-allow-headers"),
      /Content-Type/
    );
  });
});
