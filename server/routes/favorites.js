import express from "express";
import Favorite from "../models/Favorite.js";
import {
  addDocumentIdValidation,
  isRequestObject,
  sendDuplicateConflict,
} from "./apiHelpers.js";

function toFavoriteDto(favorite) {
  const dto = {
    id: favorite._id.toString(),
    recipeId: favorite.recipeId,
    recipeName: favorite.recipeName,
  };

  if (favorite.recipeImage !== undefined) {
    dto.recipeImage = favorite.recipeImage;
  }

  return dto;
}

function readFavoriteFields(body) {
  if (
    !isRequestObject(body) ||
    typeof body.recipeId !== "string" ||
    body.recipeId.trim().length === 0 ||
    typeof body.recipeName !== "string" ||
    body.recipeName.trim().length === 0 ||
    (Object.hasOwn(body, "recipeImage") &&
      typeof body.recipeImage !== "string")
  ) {
    return null;
  }

  const fields = {
    recipeId: body.recipeId.trim(),
    recipeName: body.recipeName.trim(),
  };

  if (Object.hasOwn(body, "recipeImage")) {
    fields.recipeImage = body.recipeImage;
  }

  return fields;
}

export function createFavoritesRouter({ favoriteModel = Favorite } = {}) {
  const router = express.Router();
  addDocumentIdValidation(router, "Favorite");

  router.get("/", async (req, res, next) => {
    try {
      const favorites = await favoriteModel.find({ userId: req.user.id }).lean();
      return res.status(200).json(favorites.map(toFavoriteDto));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const fields = readFavoriteFields(req.body);

    if (!fields) {
      return res.status(400).json({
        error: "Recipe ID and recipe name are required and must be valid.",
      });
    }

    try {
      const favorite = await favoriteModel.create({
        userId: req.user.id,
        ...fields,
      });

      return res.status(201).json(toFavoriteDto(favorite));
    } catch (error) {
      if (sendDuplicateConflict(error, res)) {
        return;
      }

      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const favorite = await favoriteModel
        .findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        .lean();

      if (!favorite) {
        return res.status(404).json({ error: "Favorite not found." });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
