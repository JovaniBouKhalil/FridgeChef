import express from "express";
import PantryItem from "../models/PantryItem.js";
import {
  addDocumentIdValidation,
  isRequestObject,
  sendDuplicateConflict,
} from "./apiHelpers.js";

function toPantryDto(item) {
  return {
    id: item._id.toString(),
    ingredientName: item.ingredientName,
    quantity: item.quantity,
  };
}

function readPantryFields(body, { partial = false } = {}) {
  if (!isRequestObject(body)) {
    return null;
  }

  const fields = {};

  if (Object.hasOwn(body, "ingredientName")) {
    if (
      typeof body.ingredientName !== "string" ||
      body.ingredientName.trim().length === 0 ||
      body.ingredientName.trim().length > 80
    ) {
      return null;
    }

    fields.ingredientName = body.ingredientName.trim();
  } else if (!partial) {
    return null;
  }

  if (Object.hasOwn(body, "quantity")) {
    if (
      typeof body.quantity !== "string" ||
      body.quantity.trim().length === 0 ||
      body.quantity.trim().length > 50
    ) {
      return null;
    }

    fields.quantity = body.quantity.trim();
  } else if (!partial) {
    return null;
  }

  if (partial && Object.keys(fields).length === 0) {
    return null;
  }

  return fields;
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
      const item = await pantryModel.create({
        userId: req.user.id,
        ...fields,
        normalizedIngredientName: fields.ingredientName.toLowerCase(),
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
      return res.status(400).json({ error: "Provide valid pantry fields to update." });
    }

    const update = { ...fields };
    if (fields.ingredientName !== undefined) {
      update.normalizedIngredientName = fields.ingredientName.toLowerCase();
    }

    try {
      const item = await pantryModel
        .findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { $set: update },
          { new: true, runValidators: true }
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
