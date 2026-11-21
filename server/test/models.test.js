import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import Favorite from "../models/Favorite.js";
import PantryItem from "../models/PantryItem.js";
import ShoppingItem from "../models/ShoppingItem.js";
import User from "../models/User.js";

const userId = "0123456789abcdef01234567";

test("independently deployed client and server ship identical ingredient rules", async () => {
  const [clientRules, serverRules] = await Promise.all([
    readFile(
      new URL("../../client/src/utils/ingredientNames.js", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../utils/ingredientNames.js", import.meta.url), "utf8"),
  ]);
  assert.equal(
    clientRules.replaceAll("\r\n", "\n"),
    serverRules.replaceAll("\r\n", "\n"),
  );
});

function hasUniqueIndex(schema, keys) {
  return schema
    .indexes()
    .some(
      ([indexKeys, options]) =>
        JSON.stringify(indexKeys) === JSON.stringify(keys) &&
        options.unique === true,
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
    (error) => error.errors.name?.kind === "minlength",
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
  assert.equal(item.normalizedIngredientName, "fresh tomato");
  assert.equal(item.quantity, "500 g");
  assertUserOwnership(PantryItem);
  assert.equal(
    hasUniqueIndex(PantryItem.schema, {
      userId: 1,
      normalizedIngredientName: 1,
    }),
    true,
  );
});

test("pantry and shopping models share canonical spelling and plural rules", async () => {
  for (const Model of [PantryItem, ShoppingItem]) {
    for (const [ingredientName, expected] of [
      ["tomato", "tomato"],
      [" TOmato ", "tomato"],
      ["tomatoes", "tomato"],
      ["tomatos", "tomato"],
      ["ONIONS", "onion"],
      ["artichokes", "artichoke"],
      ["radishes", "radish"],
      ["Dried Bay Leaves", "dried bay leaf"],
      ["beans in brine", "bean in brine"],
      ["JALAPEÑOS", "jalapeno"],
      ["black-eyed peas", "black eyed pea"],
      ["avacados", "avocado"],
      ["molasses", "molasses"],
    ]) {
      const item = new Model({ userId, ingredientName, quantity: "2" });
      await item.validate();
      assert.equal(item.normalizedIngredientName, expected);
    }
  }
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
      error.errors.quantity?.kind === "maxlength",
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
    true,
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
  assert.equal(item.normalizedIngredientName, "chilli flake");
  assertUserOwnership(ShoppingItem);
  assert.equal(
    hasUniqueIndex(ShoppingItem.schema, {
      userId: 1,
      normalizedIngredientName: 1,
    }),
    true,
  );
});
