import { expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const meals = JSON.parse(
  await readFile(
    new URL('../../src/data/demoMeals.json', import.meta.url),
    'utf8',
  ),
)

// Only browser tests use this fixture; normal mode calls the real Express API.
export async function mockRecipes(page) {
  // Browser tests intercept their local API fixture here. Production requests
  // use the public API origin supplied at build time.
  await page.route('http://localhost:3000/api/recipes**', (route) => {
    expect(route.request().headers().authorization).toBeUndefined()
    const url = new URL(route.request().url())
    const id = url.pathname.match(/\/recipes\/(\d+)$/)?.[1]
    const query = url.searchParams.get('name') || ''
    return route.fulfill({
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: {
        meals: id
          ? meals.filter((meal) => meal.idMeal === id)
          : meals.filter((meal) =>
              meal.strMeal.toLowerCase().includes(query.toLowerCase()),
            ),
      },
    })
  })
}
