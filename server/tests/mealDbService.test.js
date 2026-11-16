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

test("one retry recovers a temporary network or provider failure", async () => {
  for (const firstAttempt of ["network", "provider"]) {
    let calls = 0;
    const service = createMealDbService({
      retryDelayMs: 0,
      fetchImpl: async () => {
        calls++;
        if (calls === 1) {
          if (firstAttempt === "network")
            throw new TypeError("temporary connection failure");
          return new Response(null, { status: 503 });
        }
        return jsonResponse({ meals: [{ idMeal: "52771" }] });
      },
    });
    assert.equal((await service.getMealById("52771")).idMeal, "52771");
    assert.equal(calls, 2);
  }
});

test("persistent provider failures stop after two attempts with a safe 502", async () => {
  let calls = 0;
  const service = createMealDbService({
    retryDelayMs: 0,
    fetchImpl: async () => {
      calls++;
      throw new TypeError("private connection detail");
    },
  });
  await assert.rejects(
    service.getMealById("52771"),
    (error) => error.status === 502 && !error.message.includes("private"),
  );
  assert.equal(calls, 2);
});

test("successful public requests are cached by full URL and refresh after one minute", async (context) => {
  let clock = Date.now();
  context.mock.method(Date, "now", () => clock);
  let calls = 0;
  const service = createMealDbService({
    fetchImpl: async (url) => {
      calls++;
      return jsonResponse({ meals: [{ idMeal: url.searchParams.get("i") }] });
    },
  });
  assert.equal((await service.getMealById("52771")).idMeal, "52771");
  assert.equal((await service.getMealById("52771")).idMeal, "52771");
  assert.equal(calls, 1);
  assert.equal((await service.getMealById("52959")).idMeal, "52959");
  assert.equal(calls, 2);
  clock += 60_001;
  await service.getMealById("52771");
  assert.equal(calls, 3);
});

test("upstream rate-limit errors are not retried or cached", async () => {
  let calls = 0;
  const service = createMealDbService({
    retryDelayMs: 0,
    fetchImpl: async () => {
      calls++;
      return calls === 1
        ? new Response(null, { status: 429 })
        : jsonResponse({ meals: [{ idMeal: "52771" }] });
    },
  });
  await assert.rejects(
    service.getMealById("52771"),
    (error) => error.status === 502,
  );
  assert.equal(calls, 1);
  assert.equal((await service.getMealById("52771")).idMeal, "52771");
  await service.getMealById("52771");
  assert.equal(calls, 2);
});
