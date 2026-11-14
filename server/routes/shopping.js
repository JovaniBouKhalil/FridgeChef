import express from "express";
import ShoppingItem from "../models/ShoppingItem.js";
import {
  addDocumentIdValidation,
  isRequestObject,
  sendDuplicateConflict,
} from "./apiHelpers.js";

function toShoppingDto(item) {
  return {
    id: item._id.toString(),
    ingredientName: item.ingredientName,
    checked: item.checked,
  };
}

function readShoppingIngredient(body) {
  if (
    !isRequestObject(body) ||
    typeof body.ingredientName !== "string" ||
    body.ingredientName.trim().length === 0 ||
    body.ingredientName.trim().length > 80 ||
    (Object.hasOwn(body, "checked") && typeof body.checked !== "boolean")
  ) {
    return null;
  }

  return {
    ingredientName: body.ingredientName.trim(),
    normalizedIngredientName: body.ingredientName.trim().toLowerCase(),
    checked: body.checked ?? false,
  };
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
    if (!isRequestObject(req.body) || typeof req.body.checked !== "boolean") {
      return res.status(400).json({ error: "A boolean checked value is required." });
    }

    try {
      const item = await shoppingModel
        .findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { $set: { checked: req.body.checked } },
          { new: true, runValidators: true }
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
