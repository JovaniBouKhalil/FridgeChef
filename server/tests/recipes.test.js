import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { createApp } from '../app.js'

const openServers = new Set()

afterEach(async () => {
  await Promise.all(
    [...openServers].map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        }),
    ),
  )
  openServers.clear()
})

async function startApi(service = {}) {
  const app = createApp({
    mealDbService: {
      searchMealsByName: async () => [],
      getMealById: async () => null,
      filterMealsByIngredient: async () => [],
      ...service,
    },
    clientOrigin: 'http://localhost:5173',
  })
  const server = app.listen(0)
  openServers.add(server)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  return `http://127.0.0.1:${port}`
}

const sampleMeal = {
  idMeal: '52771',
  strMeal: 'Spicy Arrabiata Penne',
  strMealThumb: 'https://example.test/meal.jpg',
}

test('GET /api/health reports that the API is available', async () => {
  const baseUrl = await startApi()
  const response = await fetch(`${baseUrl}/api/health`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})

test('GET /api/recipes/search searches TheMealDB by a trimmed name', async () => {
  let receivedName
  const baseUrl = await startApi({
    searchMealsByName: async (name) => {
      receivedName = name
      return [sampleMeal]
    },
  })

  const response = await fetch(`${baseUrl}/api/recipes/search?name=%20pasta%20`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { meals: [sampleMeal] })
  assert.equal(receivedName, 'pasta')
})

test('GET /api/recipes/:id returns one full recipe', async () => {
  let receivedId
  const baseUrl = await startApi({
    getMealById: async (id) => {
      receivedId = id
      return sampleMeal
    },
  })

  const response = await fetch(`${baseUrl}/api/recipes/52771`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { meals: [sampleMeal] })
  assert.equal(receivedId, '52771')
})

test('GET /api/recipes filters recipes by a trimmed ingredient', async () => {
  let receivedIngredient
  const baseUrl = await startApi({
    filterMealsByIngredient: async (ingredient) => {
      receivedIngredient = ingredient
      return [sampleMeal]
    },
  })

  const response = await fetch(
    `${baseUrl}/api/recipes?ingredient=%20chicken%20breast%20`,
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { meals: [sampleMeal] })
  assert.equal(receivedIngredient, 'chicken breast')
})

for (const path of [
  '/api/recipes/search',
  '/api/recipes/search?name=%20',
  '/api/recipes',
  '/api/recipes?ingredient=%20',
]) {
  test(`${path} rejects a missing required query value`, async () => {
    const baseUrl = await startApi()
    const response = await fetch(`${baseUrl}${path}`)

    assert.equal(response.status, 400)
    assert.match((await response.json()).error, /required/i)
  })
}

test('GET /api/recipes/:id rejects an invalid TheMealDB ID', async () => {
  const baseUrl = await startApi()
  const response = await fetch(`${baseUrl}/api/recipes/not-a-number`)

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Recipe ID must contain only digits.' })
})

test('GET /api/recipes/:id returns 404 when the recipe does not exist', async () => {
  const baseUrl = await startApi()
  const response = await fetch(`${baseUrl}/api/recipes/99999999`)

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Recipe not found.' })
})

test('upstream failures become a controlled 502 JSON response', async () => {
  const baseUrl = await startApi({
    searchMealsByName: async () => {
      const error = new Error('private upstream detail')
      error.status = 502
      throw error
    },
  })

  const response = await fetch(`${baseUrl}/api/recipes/search?name=pasta`)

  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), {
    error: 'The recipe service is currently unavailable. Please try again later.',
  })
})

test('unknown API routes return a JSON 404', async () => {
  const baseUrl = await startApi()
  const response = await fetch(`${baseUrl}/api/does-not-exist`)

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Route not found.' })
})

test('CORS permits the configured frontend origin and request headers', async () => {
  const baseUrl = await startApi()
  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization, Content-Type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  )
  assert.match(
    response.headers.get('access-control-allow-headers'),
    /authorization/i,
  )
})
