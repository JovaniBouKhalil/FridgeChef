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
      return jsonResponse({ meals: [{ idMeal: "1" }] });
    },
  });

  await service.filterMealsByIngredient("chicken breast");

  assert.equal(
    requestedUrl.toString(),
    "https://mealdb.test/v1/filter.php?i=chicken_breast",
  );
});

test("normalized ingredient searches resolve the provider's plural spelling", async () => {
  const requests = [];
  const service = createMealDbService({
    fetchImpl: async (url) => {
      requests.push(url.pathname + url.search);
      if (url.pathname.endsWith("/list.php"))
        return jsonResponse({
          meals: [
            { strIngredient: "Mushrooms" },
            { strIngredient: "Chilli Flakes" },
          ],
        });
      const name = url.searchParams.get("i");
      return jsonResponse({
        meals: ["Mushrooms", "Chilli_Flakes"].includes(name)
          ? [{ idMeal: name }]
          : null,
      });
    },
  });
  assert.deepEqual(await service.filterMealsByIngredient("mushroom"), [
    { idMeal: "Mushrooms" },
  ]);
  assert.deepEqual(await service.filterMealsByIngredient("chilli flake"), [
    { idMeal: "Chilli_Flakes" },
  ]);
  assert.equal(requests.filter((path) => path.includes("/list.php")).length, 1);
  assert.deepEqual(
    await service.filterMealsByIngredient("unknown vegetable"),
    [],
  );
});

test("concurrent normalized ingredient searches share the catalog request", async () => {
  let catalogReads = 0;
  const service = createMealDbService({
    fetchImpl: async (url) => {
      if (url.pathname.endsWith("/list.php")) {
        catalogReads += 1;
        return jsonResponse({ meals: [{ strIngredient: "Mushrooms" }] });
      }
      return jsonResponse({
        meals:
          url.searchParams.get("i") === "Mushrooms" ? [{ idMeal: "1" }] : null,
      });
    },
  });
  const results = await Promise.all([
    service.filterMealsByIngredient("mushroom"),
    service.filterMealsByIngredient("MUSHROOM"),
  ]);
  assert.equal(catalogReads, 1);
  assert.deepEqual(results, [[{ idMeal: "1" }], [{ idMeal: "1" }]]);
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
