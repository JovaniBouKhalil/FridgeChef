import {
  normalizeIngredient,
  unspecifiedQuantity,
} from "../utils/ingredientNames.js";

export async function findOwnedIngredient(model, userId, name, exceptId) {
  const key = normalizeIngredient(name);
  // Older documents have lowercase-only keys. Match their actual names too,
  // so deploying the new rules does not allow duplicates of existing records.
  const items = await model.find({ userId }).lean();
  return items.find(
    (item) =>
      item._id.toString() !== exceptId?.toLowerCase() &&
      normalizeIngredient(item.ingredientName) === key,
  );
}

export async function ensurePantryIngredient(pantryModel, userId, name) {
  if (await findOwnedIngredient(pantryModel, userId, name)) return;
  try {
    await pantryModel.create({
      userId,
      ingredientName: name,
      normalizedIngredientName: normalizeIngredient(name),
      quantity: unspecifiedQuantity,
    });
  } catch (error) {
    // Two concurrent checks can buy the same ingredient. The unique index is
    // the final guard; never overwrite the quantity already in the pantry.
    if (
      error?.code !== 11000 ||
      !(await findOwnedIngredient(pantryModel, userId, name))
    ) {
      throw error;
    }
  }
}
