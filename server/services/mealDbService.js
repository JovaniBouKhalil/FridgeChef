import { HttpError } from '../utils/HttpError.js'

const DEFAULT_BASE_URL = 'https://www.themealdb.com/api/json/v1/1'
const DEFAULT_TIMEOUT_MS = 10_000

function upstreamError(cause) {
  return new HttpError(
    502,
    'The recipe service is currently unavailable. Please try again later.',
    { cause },
  )
}

export function createMealDbService({
  baseUrl = process.env.MEALDB_URL || DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const origin = baseUrl.replace(/\/$/, '')

  async function request(path, parameters) {
    const url = new URL(`${origin}${path}`)
    for (const [name, value] of Object.entries(parameters)) {
      url.searchParams.set(name, value)
    }

    let response
    try {
      response = await fetchImpl(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      throw upstreamError(error)
    }

    if (!response.ok) throw upstreamError()

    let body
    try {
      body = await response.json()
    } catch (error) {
      throw upstreamError(error)
    }

    if (!body || !Object.hasOwn(body, 'meals')) throw upstreamError()
    if (body.meals !== null && !Array.isArray(body.meals)) throw upstreamError()

    return body.meals || []
  }

  return {
    searchMealsByName(name) {
      return request('/search.php', { s: name })
    },

    async getMealById(id) {
      const meals = await request('/lookup.php', { i: id })
      return meals[0] || null
    },

    filterMealsByIngredient(ingredient) {
      return request('/filter.php', {
        i: ingredient.replaceAll(' ', '_'),
      })
    },
  }
}
