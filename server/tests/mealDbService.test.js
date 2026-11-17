import assert from "node:assert/strict";
import { test } from "node:test";

import { createMealDbService } from "../services/mealDbService.js";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

test("searchMealsByName calls the name-search endpoint with encoded input", async () => {
  let requestedUrl;
  const service = createMealDbService({
    baseUrl: "https://mealdb.test/v1/",
    fetchImpl: async (url) => {
      requestedUrl = url;
      return jsonResponse({ meals: [{ idMeal: "1" }] });
    },
  });

  const meals = await service.searchMealsByName("fish & chips");

  assert.deepEqual(meals, [{ idMeal: "1" }]);
  assert.equal(
    requestedUrl.toString(),
    "https://mealdb.test/v1/search.php?s=fish+%26+chips",
  );
});

test("getMealById calls the lookup endpoint and returns the first meal", async () => {
  let requestedUrl;
  const service = createMealDbService({
    baseUrl: "https://mealdb.test/v1",
    fetchImpl: async (url) => {
      requestedUrl = url;
      return jsonResponse({ meals: [{ idMeal: "52771" }] });
    },
  });

  const meal = await service.getMealById("52771");

  assert.deepEqual(meal, { idMeal: "52771" });
  assert.equal(
    requestedUrl.toString(),
    "https://mealdb.test/v1/lookup.php?i=52771",
  );
});

test("filterMealsByIngredient converts spaces for TheMealDB filter syntax", async () => {
  let requestedUrl;
  const service = createMealDbService({
    baseUrl: "https://mealdb.test/v1",
    fetchImpl: async (url) => {
      requestedUrl = url;
      return jsonResponse({ meals: [] });
    },
  });

  await service.filterMealsByIngredient("chicken breast");

  assert.equal(
    requestedUrl.toString(),
    "https://mealdb.test/v1/filter.php?i=chicken_breast",
  );
});

test("TheMealDB meals: null is normalized to an empty collection", async () => {
  const service = createMealDbService({
    fetchImpl: async () => jsonResponse({ meals: null }),
  });

  assert.deepEqual(await service.searchMealsByName("nothing"), []);
  assert.equal(await service.getMealById("99999999"), null);
});

test("repeated upstream reads use a short bounded cache and expire", async () => {
  let calls = 0;
  let clock = 1_000;
  const service = createMealDbService({
    cacheTtlMs: 500,
    cacheLimit: 2,
    now: () => clock,
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ meals: [{ idMeal: String(calls) }] });
    },
  });

  assert.deepEqual(await service.searchMealsByName("pasta"), [{ idMeal: "1" }]);
  assert.deepEqual(await service.searchMealsByName("pasta"), [{ idMeal: "1" }]);
  assert.equal(calls, 1);

  clock += 501;
  assert.deepEqual(await service.searchMealsByName("pasta"), [{ idMeal: "2" }]);
  assert.equal(calls, 2);
});

for (const fetchImpl of [
  async () => jsonResponse({ unexpected: [] }),
  async () => jsonResponse({ meals: "not-an-array" }),
  async () => new Response(null, { status: 503 }),
  async () => {
    throw new TypeError("network unavailable");
  },
]) {
  test("invalid or failed upstream responses become safe 502 errors", async () => {
    const service = createMealDbService({ fetchImpl });

    await assert.rejects(service.searchMealsByName("pasta"), (error) => {
      assert.equal(error.status, 502);
      assert.equal(
        error.message,
        "The recipe service is currently unavailable. Please try again later.",
      );
      return true;
    });
  });
}
