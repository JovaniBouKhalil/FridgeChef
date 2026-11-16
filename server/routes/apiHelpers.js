import mongoose from "mongoose";

export function isRequestObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function addDocumentIdValidation(router, resourceName) {
  router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: `Invalid ${resourceName} id.` });
    }

    return next();
  });
}

export function sendDuplicateConflict(error, res) {
  if (error?.code !== 11000) {
    return false;
  }

  res.status(409).json({ error: "An item with these details already exists." });
  return true;
}
