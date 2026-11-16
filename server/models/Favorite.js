import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },
  recipeId: {
    type: String,
    required: true,
    match: /^\d{1,10}$/,
  },
  recipeName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  recipeImage: {
    type: String,
    maxlength: 2048,
  },
});

favoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

export default Favorite;
