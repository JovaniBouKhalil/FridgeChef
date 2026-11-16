export function addIngredientNameNormalization(schema) {
  schema.pre("validate", function () {
    if (typeof this.ingredientName === "string") {
      this.normalizedIngredientName = this.ingredientName.trim().toLowerCase();
    }
  });
}
