import express from "express";
import ShoppingItem from "../models/ShoppingItem.js";
import {
  addDocumentIdValidation,
  sendDuplicateConflict,
} from "./apiHelpers.js";
import {
  parseInput,
  shoppingCreateInput,
  shoppingUpdateInput,
} from "../validation/schemas.js";

function toShoppingDto(item) {
  return {
    _id: item._id.toString(),
    ingredientName: item.ingredientName,
    checked: item.checked,
  };
}

function readShoppingIngredient(body) {
  const fields = parseInput(shoppingCreateInput, body);
  return (
    fields && {
      ...fields,
      normalizedIngredientName: fields.ingredientName.toLowerCase(),
    }
  );
}

export function createShoppingRouter({ shoppingModel = ShoppingItem } = {}) {
  const router = express.Router();
  addDocumentIdValidation(router, "Shopping item");

  router.get("/", async (req, res, next) => {
    try {
      const items = await shoppingModel.find({ userId: req.user.id }).lean();
      return res.status(200).json(items.map(toShoppingDto));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const fields = readShoppingIngredient(req.body);

    if (!fields) {
      return res.status(400).json({
        error: "A valid ingredient name and checked status are required.",
      });
    }

    try {
      const item = await shoppingModel.create({
        userId: req.user.id,
        ...fields,
      });

      return res.status(201).json(toShoppingDto(item));
    } catch (error) {
      if (sendDuplicateConflict(error, res)) {
        return;
      }

      return next(error);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    const fields = parseInput(shoppingUpdateInput, req.body);
    if (!fields) {
      return res
        .status(400)
        .json({ error: "A boolean checked value is required." });
    }

    try {
      const item = await shoppingModel
        .findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { $set: fields },
          { new: true, runValidators: true },
        )
        .lean();

      if (!item) {
        return res.status(404).json({ error: "Shopping item not found." });
      }

      return res.status(200).json(toShoppingDto(item));
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const item = await shoppingModel
        .findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        .lean();

      if (!item) {
        return res.status(404).json({ error: "Shopping item not found." });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
