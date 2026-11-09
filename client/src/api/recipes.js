import { mealdbFetch } from './client'
import demoMeals from '../data/demoMeals.json'
import { normalizeIngredient, rankRecipes } from '../utils/ingredients'

const mealCache = new Map()

export async function getRecipe(id, { demo = false, signal } = {}) {
  if (demo) {
    const local = demoMeals.find((meal) => meal.idMeal === id)
    if (local) return local
  }
  if (mealCache.has(id)) return mealCache.get(id)
  const { meals } = await mealdbFetch(
    `/lookup.php?i=${encodeURIComponent(id)}`,
    { signal },
  )
  if (!meals?.[0])
    throw new Error('This recipe couldn’t be found. Try another from Discover.')
  mealCache.set(id, meals[0])
  return meals[0]
}

export async function searchRecipes({
  query = '',
  pantry = [],
  matches = false,
  demo = false,
  signal,
}) {
  if (demo) {
    const filtered = demoMeals.filter((meal) =>
      meal.strMeal.toLowerCase().includes(query.toLowerCase()),
    )
    return matches ? rankRecipes(filtered, pantry) : filtered
  }
  if (matches && pantry.length && !query) {
    // The free API supports one ingredient per filter. Union a small candidate
    // set, hydrate full details, then rank by the complete ingredient list.
    const names = [
      ...new Set(
        pantry.map((item) => normalizeIngredient(item.ingredientName)),
      ),
    ].slice(0, 5)
    const lists = await Promise.all(
      names.map((name) =>
        mealdbFetch(
          `/filter.php?i=${encodeURIComponent(name.replaceAll(' ', '_'))}`,
          { signal },
        ),
      ),
    )
    const ids = [
      ...new Set(
        lists.flatMap((result) =>
          (result.meals || []).map((meal) => meal.idMeal),
        ),
      ),
    ].slice(0, 24)
    const details = []
    for (let index = 0; index < ids.length; index += 6) {
      details.push(
        ...(await Promise.all(
          ids.slice(index, index + 6).map((id) => getRecipe(id, { signal })),
        )),
      )
    }
    return rankRecipes(details, pantry)
  }
  const { meals } = await mealdbFetch(
    `/search.php?s=${encodeURIComponent(query)}`,
    { signal },
  )
  for (const meal of meals || []) mealCache.set(meal.idMeal, meal)
  return matches ? rankRecipes(meals || [], pantry) : meals || []
}

export function recipeImage(meal) {
  return demoMeals.some((item) => item.idMeal === meal.idMeal)
    ? `/images/${meal.idMeal}.jpg`
    : meal.strMealThumb
}
