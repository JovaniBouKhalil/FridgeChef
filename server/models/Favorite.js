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
  },
  recipeName: {
    type: String,
    required: true,
    trim: true,
  },
  recipeImage: {
    type: String,
  },
});

favoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

export default Favorite;
