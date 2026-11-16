import assert from "node:assert/strict";
import test from "node:test";
import Favorite from "../models/Favorite.js";
import PantryItem from "../models/PantryItem.js";
import ShoppingItem from "../models/ShoppingItem.js";
import User from "../models/User.js";

const userId = "0123456789abcdef01234567";

function hasUniqueIndex(schema, keys) {
  return schema.indexes().some(
    ([indexKeys, options]) =>
      JSON.stringify(indexKeys) === JSON.stringify(keys) &&
      options.unique === true
  );
}

function assertUserOwnership(model) {
  const userIdPath = model.schema.path("userId");

  assert.equal(userIdPath.isRequired, true);
  assert.equal(userIdPath.options.ref, "User");
  assert.equal(userIdPath.options.index, true);
}

test("User normalizes profile fields and enforces its schema", async () => {
  const user = new User({
    name: "  Ada Lovelace  ",
    email: " ADA@EXAMPLE.COM ",
    passwordHash: "bcrypt-hash",
  });

  await user.validate();

  assert.equal(user.name, "Ada Lovelace");
  assert.equal(user.email, "ada@example.com");
  assert.equal(User.schema.options.timestamps, true);
  assert.equal(User.schema.path("passwordHash").options.select, false);
  assert.equal(hasUniqueIndex(User.schema, { email: 1 }), true);
});

test("User rejects names shorter than two characters", async () => {
  const user = new User({
    name: "A",
    email: "ada@example.com",
    passwordHash: "bcrypt-hash",
  });

  await assert.rejects(
    user.validate(),
    (error) => error.errors.name?.kind === "minlength"
  );
});

test("PantryItem normalizes ingredient names and has an owner-scoped unique index", async () => {
  const item = new PantryItem({
    userId,
    ingredientName: "  Fresh Tomatoes  ",
    quantity: " 500 g ",
  });

  await item.validate();

  assert.equal(item.ingredientName, "Fresh Tomatoes");
  assert.equal(item.normalizedIngredientName, "fresh tomatoes");
  assert.equal(item.quantity, "500 g");
  assertUserOwnership(PantryItem);
  assert.equal(
    hasUniqueIndex(PantryItem.schema, {
      userId: 1,
      normalizedIngredientName: 1,
    }),
    true
  );
});

test("PantryItem enforces ingredient and quantity maximum lengths", async () => {
  const item = new PantryItem({
    userId,
    ingredientName: "T".repeat(81),
    quantity: "q".repeat(51),
  });

  await assert.rejects(
    item.validate(),
    (error) =>
      error.errors.ingredientName?.kind === "maxlength" &&
      error.errors.quantity?.kind === "maxlength"
  );
});

test("Favorite allows missing recipe image and is unique per user and recipe", async () => {
  const favorite = new Favorite({
    userId,
    recipeId: "52771",
    recipeName: "  Spicy Arrabiata Penne  ",
  });

  await favorite.validate();

  assert.equal(favorite.recipeName, "Spicy Arrabiata Penne");
  assert.equal(favorite.recipeImage, undefined);
  assertUserOwnership(Favorite);
  assert.equal(
    hasUniqueIndex(Favorite.schema, { userId: 1, recipeId: 1 }),
    true
  );
});

test("ShoppingItem defaults checked and normalizes its owner-scoped ingredient key", async () => {
  const item = new ShoppingItem({
    userId,
    ingredientName: "  Chilli flakes ",
  });

  await item.validate();

  assert.equal(item.checked, false);
  assert.equal(item.ingredientName, "Chilli flakes");
  assert.equal(item.normalizedIngredientName, "chilli flakes");
  assertUserOwnership(ShoppingItem);
  assert.equal(
    hasUniqueIndex(ShoppingItem.schema, {
      userId: 1,
      normalizedIngredientName: 1,
    }),
    true
  );
});
