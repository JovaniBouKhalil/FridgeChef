import mongoose from "mongoose";
import { addIngredientNameNormalization } from "./ingredientNameNormalization.js";

const pantryItemSchema = new mongoose.Schema({
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
  quantity: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
});

addIngredientNameNormalization(pantryItemSchema);

pantryItemSchema.index(
  { userId: 1, normalizedIngredientName: 1 },
  { unique: true }
);

const PantryItem =
  mongoose.models.PantryItem ||
  mongoose.model("PantryItem", pantryItemSchema);

export default PantryItem;
