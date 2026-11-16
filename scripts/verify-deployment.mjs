import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

// Chapter 23 live check. Credentials exist only in this process.
const [frontendArgument, apiArgument] = process.argv.slice(2);
if (!frontendArgument || !apiArgument) {
  console.error(
    "Usage: node scripts/verify-deployment.mjs <frontend-origin> <api-origin>",
  );
  process.exit(2);
}

function publicOrigin(value) {
  const url = new URL(value);
  assert.equal(url.protocol, "https:", "Use the public HTTPS deployment URL.");
  assert.ok(
    !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/",
    "Pass an origin without credentials, paths, queries or fragments.",
  );
  return url.origin;
}

const frontend = publicOrigin(frontendArgument);
const api = publicOrigin(apiArgument);
const created = [];
const password = randomBytes(24).toString("base64url");
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;

async function request(
  path,
  { method = "GET", token, body, status = 200 } = {},
) {
  const response = await fetch(`${api}${path}`, {
    method,
    signal: AbortSignal.timeout(90000),
    headers: {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  assert.equal(
    response.status,
    status,
    `${method} ${path}: unexpected HTTP status`,
  );
  return status === 204 ? null : response.json();
}

function passed(message) {
  console.log(`PASS ${message}`);
}

async function run() {
  for (const path of ["/", "/pantry", "/featured", "/recipes/52771"]) {
    const response = await fetch(`${frontend}${path}`, {
      signal: AbortSignal.timeout(90000),
    });
    assert.equal(response.status, 200, `Frontend deep link ${path}`);
    assert.match(
      await response.text(),
      /id=["']root["']/,
      `Frontend ${path} must return the React HTML entry`,
    );
  }
  passed("frontend entry and direct page refresh routes");
  assert.deepEqual(await request("/api/health"), { status: "ok" });
  await request("/api/pantry", { status: 401 });
  await request("/api/pantry", { token: "invalid-token", status: 401 });
  passed("API health and protected-route rejection");

  const accounts = [];
  for (const name of ["Alice", "Bob"]) {
    const email = `fridgechef-check-${name.toLowerCase()}-${suffix}@example.test`;
    const account = await request("/api/auth/signup", {
      method: "POST",
      status: 201,
      body: { name: `FridgeChef check ${name}`, email, password },
    });
    assert.ok(
      typeof account.token === "string" && account.user?._id,
      "Signup must return a token and public user.",
    );
    assert.ok(
      !("passwordHash" in account.user) && !("password" in account.user),
      "Signup must not expose password data.",
    );
    accounts.push({ ...account, email });
  }
  const [alice, bob] = accounts;
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: alice.email, password },
  });
  assert.equal(login.user._id, alice.user._id);
  await request("/api/auth/login", {
    method: "POST",
    status: 401,
    body: { email: alice.email, password: "intentionally-wrong-password" },
  });
  passed("two real signups, login, and wrong-password rejection");

  const pantry = await request("/api/pantry", {
    method: "POST",
    status: 201,
    token: alice.token,
    body: {
      ingredientName: "Tomatoes",
      quantity: "4 whole",
      userId: bob.user._id,
    },
  });
  created.push({ path: `/api/pantry/${pantry._id}`, token: alice.token });
  await request(`/api/pantry/${pantry._id}`, {
    method: "PATCH",
    token: bob.token,
    status: 404,
    body: { quantity: "99" },
  });
  await request(`/api/pantry/${pantry._id}`, {
    method: "DELETE",
    token: bob.token,
    status: 404,
  });
  const updated = await request(`/api/pantry/${pantry._id}`, {
    method: "PATCH",
    token: alice.token,
    body: { quantity: "2 whole" },
  });
  assert.equal(updated.quantity, "2 whole");
  assert.deepEqual(await request("/api/pantry", { token: bob.token }), []);
  const reloaded = await request("/api/pantry", { token: alice.token });
  assert.ok(
    reloaded.some(
      (item) => item._id === pantry._id && item.quantity === "2 whole",
    ),
    "A fresh request must reload the stored change.",
  );
  await request("/api/pantry", {
    method: "POST",
    token: alice.token,
    status: 400,
    body: { ingredientName: { $ne: null }, quantity: "1" },
  });
  passed(
    "pantry create/read/update, persisted re-read, validation, and Bob/Alice isolation",
  );

  const favorite = await request("/api/favorites", {
    method: "POST",
    token: alice.token,
    status: 201,
    body: { recipeId: "52771", recipeName: "Spicy Arrabiata Penne" },
  });
  created.push({ path: `/api/favorites/${favorite._id}`, token: alice.token });
  assert.deepEqual(await request("/api/favorites", { token: bob.token }), []);
  await request("/api/favorites", {
    method: "POST",
    token: alice.token,
    status: 409,
    body: { recipeId: "52771", recipeName: "Spicy Arrabiata Penne" },
  });
  const shopping = await request("/api/shopping", {
    method: "POST",
    token: alice.token,
    status: 201,
    body: { ingredientName: "Garlic", checked: false },
  });
  created.push({ path: `/api/shopping/${shopping._id}`, token: alice.token });
  assert.equal(
    (
      await request(`/api/shopping/${shopping._id}`, {
        method: "PATCH",
        token: alice.token,
        body: { checked: true },
      })
    ).checked,
    true,
  );
  assert.deepEqual(await request("/api/shopping", { token: bob.token }), []);
  passed(
    "saved recipes, duplicate prevention, shopping updates, and private lists",
  );

  const recipes = await request("/api/recipes/search?name=pasta");
  assert.ok(
    Array.isArray(recipes.meals) && recipes.meals.length > 0,
    "Live recipe search must return recipes.",
  );
  assert.equal(
    (await request("/api/recipes/52771")).meals?.[0]?.idMeal,
    "52771",
  );
  const preflight = await fetch(`${api}/api/pantry`, {
    method: "OPTIONS",
    headers: {
      Origin: frontend,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
    signal: AbortSignal.timeout(90000),
  });
  assert.equal(preflight.headers.get("access-control-allow-origin"), frontend);
  passed("live TheMealDB proxy and production CORS origin");
}

try {
  await run();
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const item of created.reverse()) {
    try {
      await request(item.path, {
        method: "DELETE",
        token: item.token,
        status: 204,
      });
    } catch {
      console.error(
        `Cleanup failed for a generated test resource: ${item.path}`,
      );
      process.exitCode = 1;
    }
  }
}
if (!process.exitCode) {
  passed("delete/cleanup of generated private records");
  console.log(`Verified frontend: ${frontend}\nVerified API: ${api}`);
  console.log(
    "Two labeled test account records remain; no passwords or tokens were printed.",
  );
}
