import express from "express";
import PantryItem from "../models/PantryItem.js";
import { normalizeIngredient } from "../utils/ingredientNames.js";
import { findOwnedIngredient } from "../services/pantryIngredients.js";
import {
  addDocumentIdValidation,
  sendDuplicateConflict,
} from "./apiHelpers.js";
import {
  pantryCreateInput,
  pantryUpdateInput,
  parseInput,
} from "../validation/schemas.js";

function toPantryDto(item) {
  return {
    _id: item._id.toString(),
    ingredientName: item.ingredientName,
    quantity: item.quantity,
  };
}

function readPantryFields(body, { partial = false } = {}) {
  return parseInput(partial ? pantryUpdateInput : pantryCreateInput, body);
}

export function createPantryRouter({ pantryModel = PantryItem } = {}) {
  const router = express.Router();
  addDocumentIdValidation(router, "Pantry item");

  router.get("/", async (req, res, next) => {
    try {
      const items = await pantryModel.find({ userId: req.user.id }).lean();
      return res.status(200).json(items.map(toPantryDto));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const fields = readPantryFields(req.body);

    if (!fields) {
      return res.status(400).json({
        error: "Ingredient name and quantity are required and must be valid.",
      });
    }

    try {
      if (
        await findOwnedIngredient(
          pantryModel,
          req.user.id,
          fields.ingredientName,
        )
      ) {
        return res
          .status(409)
          .json({
            error:
              "This ingredient is already in your pantry. Edit its quantity instead.",
          });
      }
      const item = await pantryModel.create({
        userId: req.user.id,
        ...fields,
        normalizedIngredientName: normalizeIngredient(fields.ingredientName),
      });

      return res.status(201).json(toPantryDto(item));
    } catch (error) {
      if (sendDuplicateConflict(error, res)) {
        return;
      }

      return next(error);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    const fields = readPantryFields(req.body, { partial: true });

    if (!fields) {
      return res
        .status(400)
        .json({ error: "Provide valid pantry fields to update." });
    }

    const update = { ...fields };
    if (fields.ingredientName !== undefined) {
      update.normalizedIngredientName = normalizeIngredient(
        fields.ingredientName,
      );
    }

    try {
      if (
        fields.ingredientName !== undefined &&
        (await findOwnedIngredient(
          pantryModel,
          req.user.id,
          fields.ingredientName,
          req.params.id,
        ))
      ) {
        return res
          .status(409)
          .json({
            error:
              "This ingredient is already in your pantry. Edit its quantity instead.",
          });
      }
      const item = await pantryModel
        .findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { $set: update },
          { new: true, runValidators: true },
        )
        .lean();

      if (!item) {
        return res.status(404).json({ error: "Pantry item not found." });
      }

      return res.status(200).json(toPantryDto(item));
    } catch (error) {
      if (sendDuplicateConflict(error, res)) {
        return;
      }

      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const item = await pantryModel
        .findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        .lean();

      if (!item) {
        return res.status(404).json({ error: "Pantry item not found." });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
