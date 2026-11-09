import cors from 'cors'
import express from 'express'

import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createRecipeRouter } from './routes/recipeRoutes.js'
import { createMealDbService } from './services/mealDbService.js'

export function createApp({
  mealDbService = createMealDbService(),
  clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
} = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    cors({
      origin: clientOrigin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })
  app.use('/api/recipes', createRecipeRouter({ mealDbService }))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
