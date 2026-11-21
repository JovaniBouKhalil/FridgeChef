import { normalizeIngredient } from './ingredientNames'

export { normalizeIngredient } from './ingredientNames'

export function recipeIngredients(meal) {
  return Array.from({ length: 20 }, (_, index) => ({
    name: (meal[`strIngredient${index + 1}`] || '').trim(),
    measure: (meal[`strMeasure${index + 1}`] || '').trim(),
  })).filter((ingredient) => ingredient.name)
}

export function matchIngredients(meal, pantry = []) {
  const names = new Set(
    pantry.map((item) => normalizeIngredient(item.ingredientName)),
  )
  const ingredients = recipeIngredients(meal).map((ingredient) => ({
    ...ingredient,
    available: names.has(normalizeIngredient(ingredient.name)),
  }))
  const available = ingredients.filter((ingredient) => ingredient.available)
  return {
    ingredients,
    available,
    missing: ingredients.filter((ingredient) => !ingredient.available),
    percentage: ingredients.length
      ? Math.round((available.length / ingredients.length) * 100)
      : 0,
  }
}

export function rankRecipes(meals, pantry) {
  return [...meals].sort((a, b) => {
    const first = matchIngredients(a, pantry)
    const second = matchIngredients(b, pantry)
    return (
      second.percentage - first.percentage ||
      second.available.length - first.available.length ||
      a.strMeal.localeCompare(b.strMeal)
    )
  })
}
