import { HttpError } from "../utils/HttpError.js";

const DEFAULT_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
// Two bounded attempts fit inside the frontend's 20-second request timeout.
const DEFAULT_TIMEOUT_MS = 7_000;
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 100;

function upstreamError(cause) {
  return new HttpError(
    502,
    "The recipe service is currently unavailable. Please try again later.",
    { cause },
  );
}

export function createMealDbService({
  baseUrl = process.env.MEALDB_URL || DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retryDelayMs = 250,
} = {}) {
  const origin = baseUrl.replace(/\/$/, "");
  // Chapter 22: cache only public provider data; private collections stay uncached.
  const cache = new Map();

  async function retryPause() {
    if (retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  async function request(path, parameters) {
    const url = new URL(`${origin}${path}`);
    for (const [name, value] of Object.entries(parameters)) {
      url.searchParams.set(name, value);
    }
    const key = url.toString();
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.meals;
    cache.delete(key);

    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetchImpl(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (attempt === 1) throw upstreamError(error);
        await retryPause();
        continue;
      }
      if (response.ok) break;
      if (attempt === 1 || response.status < 500) throw upstreamError();
      await response.body?.cancel();
      await retryPause();
    }

    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw upstreamError(error);
    }

    if (!body || !Object.hasOwn(body, "meals")) throw upstreamError();
    if (body.meals !== null && !Array.isArray(body.meals))
      throw upstreamError();

    const meals = body.meals || [];
    if (cache.size >= MAX_CACHE_ENTRIES)
      cache.delete(cache.keys().next().value);
    cache.set(key, { meals, expires: Date.now() + CACHE_TTL_MS });
    return meals;
  }

  return {
    searchMealsByName(name) {
      return request("/search.php", { s: name });
    },

    async getMealById(id) {
      const meals = await request("/lookup.php", { i: id });
      return meals[0] || null;
    },

    filterMealsByIngredient(ingredient) {
      return request("/filter.php", {
        i: ingredient.replaceAll(" ", "_"),
      });
    },
  };
}
