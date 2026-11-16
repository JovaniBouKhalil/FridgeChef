import { beforeEach, expect, it, vi } from 'vitest'
import { publicApiFetch } from './client'
import { getRecipe, searchRecipes } from './recipes'

vi.mock('./client', () => ({ publicApiFetch: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

it('loads discovery and name searches from the custom Express API', async () => {
  publicApiFetch.mockResolvedValue({ meals: [] })
  await searchRecipes({})
  expect(publicApiFetch).toHaveBeenLastCalledWith('/api/recipes/discover', {
    signal: undefined,
  })
  await searchRecipes({ query: 'pasta & tomato' })
  expect(publicApiFetch).toHaveBeenLastCalledWith(
    '/api/recipes/search?name=pasta%20%26%20tomato',
    { signal: undefined },
  )
})

it('uses live recipe details outside explicitly selected demo mode', async () => {
  const live = { idMeal: '52771', strMeal: 'Live recipe response' }
  publicApiFetch.mockResolvedValue({ meals: [live] })
  expect(await getRecipe('52771')).toEqual(live)
  expect(publicApiFetch).toHaveBeenCalledWith('/api/recipes/52771', {
    signal: undefined,
  })
  publicApiFetch.mockClear()
  expect((await getRecipe('52771', { demo: true })).strMeal).toBe(
    'Spicy Arrabiata Penne',
  )
  expect(publicApiFetch).not.toHaveBeenCalled()
})
