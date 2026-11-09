import { Router } from 'express'

import { createRecipeController } from '../controllers/recipeController.js'

export function createRecipeRouter({ mealDbService }) {
  const router = Router()
  const controller = createRecipeController({ mealDbService })

  // Keep the named route before /:id so "search" is not interpreted as an ID.
  router.get('/search', controller.search)
  router.get('/', controller.filterByIngredient)
  router.get('/:id', controller.getById)

  return router
}
