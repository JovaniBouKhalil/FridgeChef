import { z } from "zod";

const trimmed = (maximum) => z.string().trim().min(1).max(maximum);

export const signupInput = z.object({
  name: trimmed(100).min(2),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      message: "Password must be no more than 72 bytes.",
    }),
});

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      message: "Password must be no more than 72 bytes.",
    }),
});

export const pantryCreateInput = z.object({
  ingredientName: trimmed(80),
  quantity: trimmed(50),
});

export const pantryUpdateInput = pantryCreateInput
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one pantry field.",
  });

export const favoriteCreateInput = z.object({
  recipeId: z
    .string()
    .trim()
    .regex(/^\d{1,10}$/),
  recipeName: trimmed(200),
  recipeImage: z
    .string()
    .max(2048)
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Recipe image must be an HTTP or HTTPS URL.")
    .optional(),
});

export const shoppingCreateInput = z.object({
  ingredientName: trimmed(80),
  checked: z.boolean().optional().default(false),
});

export const shoppingUpdateInput = z.object({ checked: z.boolean() });

export function parseInput(schema, value) {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
