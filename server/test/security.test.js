import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import mongoose from "mongoose";
import { createApp } from "../app.js";

async function withApi(check) {
  const userModel = {
    findOne() {
      return {
        select: async () => null,
        then: (resolve) => Promise.resolve(null).then(resolve),
      };
    },
    async create(fields) {
      return { _id: "0123456789abcdef01234567", ...fields };
    },
  };
  const app = createApp({
    jwtSecret: randomBytes(32).toString("hex"),
    userModel,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) =>
    fetch(url + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  try {
    await check({ url, post });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("API responses include CSP, HTTPS and MIME protections without advertising Express", async () => {
  await withApi(async ({ url }) => {
    const response = await fetch(`${url}/api/health`);
    assert.match(
      response.headers.get("content-security-policy"),
      /default-src 'self'/,
    );
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("strict-transport-security"), /max-age=/);
    assert.equal(response.headers.get("x-powered-by"), null);
  });
});

test("the sixth failed login is throttled with a JSON 429 and Retry-After", async () => {
  await withApi(async ({ post }) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      assert.equal(
        (
          await post("/api/auth/login", {
            email: "audit@example.test",
            password: "audit-password",
          })
        ).status,
        401,
      );
    }
    const blocked = await post("/api/auth/login", {
      email: "audit@example.test",
      password: "audit-password",
    });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    assert.match((await blocked.json()).error, /Too many sign-in attempts/);
  });
});

test("signup rejects oversized and operator-shaped profile fields before a database write", async () => {
  await withApi(async ({ post }) => {
    for (const fields of [
      { name: "A".repeat(101) },
      { email: "a".repeat(250) + "@example.test" },
      { email: { $ne: null } },
    ]) {
      const response = await post("/api/auth/signup", {
        name: "Audit user",
        email: "audit@example.test",
        password: "audit-password",
        ...fields,
      });
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, "string");
    }
  });
});

test("security configuration sanitizes Mongo filters and fails closed without a production origin", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousOrigin = process.env.CLIENT_ORIGIN;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.CLIENT_ORIGIN;
    assert.throws(
      () => createApp({ jwtSecret: randomBytes(32).toString("hex") }),
      /CLIENT_ORIGIN is required in production/,
    );
    assert.equal(mongoose.get("sanitizeFilter"), true);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousOrigin === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = previousOrigin;
  }
});
