import assert from "node:assert/strict";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../app.js";

const jwtSecret = randomBytes(32).toString("base64url");
const aliceId = new mongoose.Types.ObjectId().toString();
const bobId = new mongoose.Types.ObjectId().toString();

function duplicateKeyError() {
  const error = new Error("duplicate key");
  error.code = 11000;
  return error;
}

function createMemoryModel(uniqueField) {
  const records = [];
  const updates = [];

  function isOwnedMatch(record, filter) {
    return (
      record._id.toString() === filter._id &&
      record.userId.toString() === filter.userId.toString()
    );
  }

  function hasDuplicate(candidate, exceptId) {
    return records.some(
      (record) =>
        record._id.toString() !== exceptId &&
        record.userId.toString() === candidate.userId.toString() &&
        record[uniqueField] === candidate[uniqueField]
    );
  }

  return {
    records,
    updates,

    find({ userId }) {
      return {
        lean: async () =>
          records
            .filter((record) => record.userId.toString() === userId.toString())
            .map((record) => ({ ...record })),
      };
    },

    async create(fields) {
      const record = { _id: new mongoose.Types.ObjectId(), ...fields };

      if (hasDuplicate(record)) {
        throw duplicateKeyError();
      }

      records.push(record);
      return { ...record };
    },

    findOneAndUpdate(filter, update, options) {
      updates.push({ filter, update, options });

      return {
        lean: async () => {
          const record = records.find((item) => isOwnedMatch(item, filter));

          if (!record) {
            return null;
          }

          const candidate = { ...record, ...update.$set };

          if (hasDuplicate(candidate, record._id.toString())) {
            throw duplicateKeyError();
          }

          Object.assign(record, update.$set);
          return { ...record };
        },
      };
    },

    findOneAndDelete(filter) {
      return {
        lean: async () => {
          const index = records.findIndex((record) =>
            isOwnedMatch(record, filter)
          );

          if (index === -1) {
            return null;
          }

          return { ...records.splice(index, 1)[0] };
        },
      };
    },
  };
}

function createApiApp() {
  const pantryModel = createMemoryModel("normalizedIngredientName");
  const favoriteModel = createMemoryModel("recipeId");
  const shoppingModel = createMemoryModel("normalizedIngredientName");

  return {
    app: createApp({
      jwtSecret,
      jwtExpiresIn: "1h",
      pantryModel,
      favoriteModel,
      shoppingModel,
    }),
    pantryModel,
    favoriteModel,
    shoppingModel,
  };
}

function tokenFor(userId) {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: "1h" });
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

function request(baseUrl, method, path, userId, body) {
  const headers = {};

  if (userId) {
    headers.authorization = `Bearer ${tokenFor(userId)}`;
  }
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("all private routes reject missing and invalid authentication", async () => {
  const { app } = createApiApp();
  const id = new mongoose.Types.ObjectId().toString();
  const endpoints = [
    ["GET", "/api/pantry"],
    ["POST", "/api/pantry", { ingredientName: "Tomatoes", quantity: "4" }],
    ["PATCH", `/api/pantry/${id}`, { quantity: "2" }],
    ["DELETE", `/api/pantry/${id}`],
    ["GET", "/api/favorites"],
    ["POST", "/api/favorites", { recipeId: "52771", recipeName: "Penne" }],
    ["DELETE", `/api/favorites/${id}`],
    ["GET", "/api/shopping"],
    ["POST", "/api/shopping", { ingredientName: "Tomatoes", checked: false }],
    ["PATCH", `/api/shopping/${id}`, { checked: true }],
    ["DELETE", `/api/shopping/${id}`],
  ];

  await withServer(app, async (baseUrl) => {
    for (const [method, path, body] of endpoints) {
      const response = await request(baseUrl, method, path, undefined, body);
      assert.equal(response.status, 401, `${method} ${path}`);
      assert.equal(typeof (await response.json()).error, "string");
    }

    const invalidTokenResponse = await fetch(`${baseUrl}/api/pantry`, {
      headers: { authorization: "Bearer malformed" },
    });
    assert.equal(invalidTokenResponse.status, 401);
  });
});

test("pantry CRUD is owner-scoped, validates fields, and rejects duplicates", async () => {
  const { app, pantryModel } = createApiApp();

  await withServer(app, async (baseUrl) => {
    const createResponse = await request(
      baseUrl,
      "POST",
      "/api/pantry",
      aliceId,
      {
        ingredientName: " Tomatoes ",
        quantity: " 4 whole ",
        userId: bobId,
        normalizedIngredientName: "spoofed",
      }
    );
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.deepEqual(Object.keys(created).sort(), ["id", "ingredientName", "quantity"]);
    assert.equal(created.ingredientName, "Tomatoes");
    assert.equal(pantryModel.records[0].userId, aliceId);
    assert.equal(pantryModel.records[0].normalizedIngredientName, "tomatoes");

    const duplicateResponse = await request(
      baseUrl,
      "POST",
      "/api/pantry",
      aliceId,
      { ingredientName: "tomatoes", quantity: "1" }
    );
    assert.equal(duplicateResponse.status, 409);

    const bobListResponse = await request(
      baseUrl,
      "GET",
      "/api/pantry",
      bobId
    );
    assert.deepEqual(await bobListResponse.json(), []);

    const bobPatchResponse = await request(
      baseUrl,
      "PATCH",
      `/api/pantry/${created.id}`,
      bobId,
      { quantity: "9" }
    );
    const bobDeleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/pantry/${created.id}`,
      bobId
    );
    assert.equal(bobPatchResponse.status, 404);
    assert.equal(bobDeleteResponse.status, 404);

    const bobCreateResponse = await request(
      baseUrl,
      "POST",
      "/api/pantry",
      bobId,
      { ingredientName: "Tomatoes", quantity: "2" }
    );
    assert.equal(bobCreateResponse.status, 201);

    const aliceListResponse = await request(
      baseUrl,
      "GET",
      "/api/pantry",
      aliceId
    );
    const aliceItems = await aliceListResponse.json();
    assert.equal(aliceListResponse.status, 200);
    assert.equal(aliceItems.length, 1);
    assert.equal(aliceItems[0].id, created.id);

    const updateResponse = await request(
      baseUrl,
      "PATCH",
      `/api/pantry/${created.id}`,
      aliceId,
      {
        ingredientName: "Cherry tomatoes",
        quantity: "2 boxes",
        userId: bobId,
      }
    );
    const updated = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.deepEqual(updated, {
      id: created.id,
      ingredientName: "Cherry tomatoes",
      quantity: "2 boxes",
    });
    assert.equal(pantryModel.updates.length, 2);
    const [bobUpdate, aliceUpdate] = pantryModel.updates;
    assert.equal(bobUpdate.filter.userId, bobId);
    assert.equal(aliceUpdate.filter.userId, aliceId);
    assert.equal(aliceUpdate.options.runValidators, true);
    assert.equal("userId" in aliceUpdate.update.$set, false);

    const deleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/pantry/${created.id}`,
      aliceId
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), "");
  });
});

test("favorites are private, unique per user, and deleted by document ID", async () => {
  const { app, favoriteModel } = createApiApp();

  await withServer(app, async (baseUrl) => {
    const aliceCreateResponse = await request(
      baseUrl,
      "POST",
      "/api/favorites",
      aliceId,
      {
        recipeId: "52771",
        recipeName: " Spicy Arrabiata Penne ",
        recipeImage: "https://example.test/recipe.jpg",
        userId: bobId,
      }
    );
    const aliceFavorite = await aliceCreateResponse.json();

    assert.equal(aliceCreateResponse.status, 201);
    assert.deepEqual(aliceFavorite, {
      id: favoriteModel.records[0]._id.toString(),
      recipeId: "52771",
      recipeName: "Spicy Arrabiata Penne",
      recipeImage: "https://example.test/recipe.jpg",
    });
    assert.equal(favoriteModel.records[0].userId, aliceId);

    const duplicateResponse = await request(
      baseUrl,
      "POST",
      "/api/favorites",
      aliceId,
      { recipeId: "52771", recipeName: "Another title" }
    );
    assert.equal(duplicateResponse.status, 409);

    const bobListResponse = await request(
      baseUrl,
      "GET",
      "/api/favorites",
      bobId
    );
    assert.deepEqual(await bobListResponse.json(), []);

    const bobDeleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/favorites/${aliceFavorite.id}`,
      bobId
    );
    assert.equal(bobDeleteResponse.status, 404);

    const bobCreateResponse = await request(
      baseUrl,
      "POST",
      "/api/favorites",
      bobId,
      { recipeId: "52771", recipeName: "Spicy Arrabiata Penne" }
    );
    assert.equal(bobCreateResponse.status, 201);

    const aliceListResponse = await request(
      baseUrl,
      "GET",
      "/api/favorites",
      aliceId
    );
    assert.deepEqual(await aliceListResponse.json(), [aliceFavorite]);

    const deleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/favorites/${aliceFavorite.id}`,
      aliceId
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), "");
  });
});

test("shopping items are owner-scoped, duplicate-safe, and update checked only", async () => {
  const { app, shoppingModel } = createApiApp();

  await withServer(app, async (baseUrl) => {
    const aliceCreateResponse = await request(
      baseUrl,
      "POST",
      "/api/shopping",
      aliceId,
      {
        ingredientName: " Chilli flakes ",
        checked: false,
        userId: bobId,
      }
    );
    const aliceItem = await aliceCreateResponse.json();

    assert.equal(aliceCreateResponse.status, 201);
    assert.deepEqual(aliceItem, {
      id: shoppingModel.records[0]._id.toString(),
      ingredientName: "Chilli flakes",
      checked: false,
    });
    assert.equal(shoppingModel.records[0].userId, aliceId);
    assert.equal(shoppingModel.records[0].normalizedIngredientName, "chilli flakes");

    const duplicateResponse = await request(
      baseUrl,
      "POST",
      "/api/shopping",
      aliceId,
      { ingredientName: "chilli flakes", checked: false }
    );
    assert.equal(duplicateResponse.status, 409);

    const bobCreateResponse = await request(
      baseUrl,
      "POST",
      "/api/shopping",
      bobId,
      { ingredientName: "Chilli flakes", checked: false }
    );
    assert.equal(bobCreateResponse.status, 201);

    const bobListResponse = await request(
      baseUrl,
      "GET",
      "/api/shopping",
      bobId
    );
    const bobItems = await bobListResponse.json();
    assert.equal(bobItems.length, 1);
    assert.notEqual(bobItems[0].id, aliceItem.id);

    const bobPatchResponse = await request(
      baseUrl,
      "PATCH",
      `/api/shopping/${aliceItem.id}`,
      bobId,
      { checked: true }
    );
    const bobDeleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/shopping/${aliceItem.id}`,
      bobId
    );
    assert.equal(bobPatchResponse.status, 404);
    assert.equal(bobDeleteResponse.status, 404);

    const patchResponse = await request(
      baseUrl,
      "PATCH",
      `/api/shopping/${aliceItem.id}`,
      aliceId,
      { checked: true, userId: bobId, ingredientName: "Ignored" }
    );
    const patched = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.deepEqual(patched, {
      id: aliceItem.id,
      ingredientName: "Chilli flakes",
      checked: true,
    });
    assert.equal(shoppingModel.updates[0].options.runValidators, true);
    assert.deepEqual(shoppingModel.updates[0].update.$set, { checked: true });

    const aliceListResponse = await request(
      baseUrl,
      "GET",
      "/api/shopping",
      aliceId
    );
    assert.deepEqual(await aliceListResponse.json(), [patched]);

    const deleteResponse = await request(
      baseUrl,
      "DELETE",
      `/api/shopping/${aliceItem.id}`,
      aliceId
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), "");
  });
});

test("private routes reject malformed document IDs and invalid request bodies", async () => {
  const { app } = createApiApp();

  await withServer(app, async (baseUrl) => {
    const invalidRequests = [
      ["POST", "/api/pantry", aliceId, { ingredientName: "Tomatoes" }],
      ["PATCH", "/api/pantry/not-an-id", aliceId, { quantity: "1" }],
      ["DELETE", "/api/favorites/not-an-id", aliceId],
      ["POST", "/api/favorites", aliceId, { recipeId: "52771" }],
      ["POST", "/api/shopping", aliceId, { ingredientName: "Tomatoes", checked: "false" }],
      ["PATCH", "/api/shopping/not-an-id", aliceId, { checked: true }],
      ["PATCH", `/api/shopping/${new mongoose.Types.ObjectId()}`, aliceId, { checked: "true" }],
    ];

    for (const [method, path, userId, body] of invalidRequests) {
      const response = await request(baseUrl, method, path, userId, body);
      assert.equal(response.status, 400, `${method} ${path}`);
      assert.equal(typeof (await response.json()).error, "string");
    }
  });
});
