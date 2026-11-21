import { normalizeIngredient } from "../utils/ingredientNames.js";

export function addIngredientNameNormalization(schema) {
  schema.pre("validate", function () {
    if (typeof this.ingredientName === "string") {
      this.normalizedIngredientName = normalizeIngredient(this.ingredientName);
    }
  });
}
