import mongoose from "mongoose";
import { addIngredientNameNormalization } from "./ingredientNameNormalization.js";

const shoppingItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },
  ingredientName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  normalizedIngredientName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  checked: {
    type: Boolean,
    required: true,
    default: false,
  },
});

addIngredientNameNormalization(shoppingItemSchema);

shoppingItemSchema.index(
  { userId: 1, normalizedIngredientName: 1 },
  { unique: true }
);

const ShoppingItem =
  mongoose.models.ShoppingItem ||
  mongoose.model("ShoppingItem", shoppingItemSchema);

export default ShoppingItem;
