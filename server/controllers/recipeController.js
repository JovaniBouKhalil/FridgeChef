import { HttpError } from '../utils/HttpError.js'

function requiredQuery(value, fieldName) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    throw new HttpError(400, `${fieldName} is required.`)
  }
  return normalized
}

export function createRecipeController({ mealDbService }) {
  return {
    async search(request, response) {
      const name = requiredQuery(request.query.name, 'Recipe name')
      const meals = await mealDbService.searchMealsByName(name)
      response.json({ meals })
    },

    async filterByIngredient(request, response) {
      const ingredient = requiredQuery(
        request.query.ingredient,
        'Ingredient',
      )
      const meals = await mealDbService.filterMealsByIngredient(ingredient)
      response.json({ meals })
    },

    async getById(request, response) {
      const { id } = request.params
      if (!/^\d+$/.test(id)) {
        throw new HttpError(400, 'Recipe ID must contain only digits.')
      }

      const meal = await mealDbService.getMealById(id)
      if (!meal) throw new HttpError(404, 'Recipe not found.')

      response.json({ meals: [meal] })
    },
  }
}
