import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const meals = JSON.parse(
  await readFile(
    new URL('../src/data/demoMeals.json', import.meta.url),
    'utf8',
  ),
)

test.beforeEach(async ({ page }) => {
  await page.route('https://www.themealdb.com/api/**', (route) => {
    const url = new URL(route.request().url())
    const id = url.searchParams.get('i')
    const query = url.searchParams.get('s') || ''
    return route.fulfill({
      json: {
        meals: id
          ? meals.filter((meal) => meal.idMeal === id)
          : meals.filter((meal) =>
              meal.strMeal.toLowerCase().includes(query.toLowerCase()),
            ),
      },
    })
  })
})

test('guest discovery searches and filters and keeps private routes protected', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Something good is cooking.' }),
  ).toBeVisible()
  await page
    .getByRole('searchbox', { name: 'Search recipes by name' })
    .fill('Spicy')
  await page.getByRole('button', { name: 'Find recipes', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('Spicy Arrabiata Penne')
  await page
    .getByRole('searchbox', { name: 'Search recipes by name' })
    .fill('Sushi')
  await page.getByRole('button', { name: 'Find recipes', exact: true }).click()
  await expect(page.getByRole('article')).toContainText('Sushi')
  await page.goBack()
  await expect(
    page.getByRole('searchbox', { name: 'Search recipes by name' }),
  ).toHaveValue('Spicy')
  await expect(page.getByRole('article')).toContainText('Spicy Arrabiata Penne')
  await page.getByRole('button', { name: 'Dessert', exact: true }).click()
  await expect(page.getByText('No recipes on the menu yet.')).toBeVisible()
  await page.goto('/pantry')
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back.' }),
  ).toBeVisible()
})

test('demo kitchen supports pantry CRUD, saving, and a deduplicated shopping checklist', async ({
  page,
}, testInfo) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Explore the demo kitchen' }).click()
  await expect(
    page.getByRole('heading', { name: 'Good things in your pantry.' }),
  ).toBeVisible()
  await page.getByLabel('Ingredient', { exact: true }).fill('Carrots')
  await page.getByLabel('Quantity', { exact: true }).fill('3 whole')
  await page.getByRole('button', { name: 'Add ingredient' }).click()
  await page.getByRole('button', { name: 'Edit Carrots' }).click()
  await page.getByLabel('Quantity', { exact: true }).last().fill('5 whole')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.reload()
  await expect(page.getByText('5 whole', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remove Carrots' }).click()
  await page.getByRole('button', { name: 'Yes, remove' }).click()
  await expect(page.getByText('Carrots', { exact: true })).toHaveCount(0)
  await page.goto('/recipes/52771')
  await page
    .getByRole('button', { name: 'Save this recipe', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Saved to your recipes' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Add missing to shopping list' })
    .click()
  await expect(page.getByRole('status')).toContainText('ingredients added')
  await page
    .getByRole('button', { name: 'Add missing to shopping list' })
    .click()
  await expect(page.getByRole('status')).toContainText(
    'already on your shopping list',
  )
  await page.getByRole('link', { name: 'View shopping list' }).click()
  const count = await page.getByRole('checkbox').count()
  expect(count).toBeGreaterThan(0)
  await page.getByRole('checkbox').first().check()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.getByRole('button', { name: 'Clear picked up' }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(count - 1)
  await page.goto('/favorites')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('Spicy Arrabiata Penne')
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(8)
  await expect(page.getByRole('article').first().locator('img')).toBeVisible()
  await page.locator('.recipe-photo').evaluateAll((images) =>
    images.forEach((image) => {
      image.loading = 'eager'
    }),
  )
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.recipe-photo')].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('discover.png'),
    fullPage: true,
  })
  await expect(
    page.getByRole('button', { name: 'Exit demo', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Exit demo', exact: true }).click()
  await page.goto('/favorites')
  await expect(page).toHaveURL(/\/login$/)
  expect(pageErrors).toEqual([])
})

test('real API mode signs in, writes with a bearer token, and handles session expiry', async ({
  page,
}) => {
  let expired = false
  const pantry = []
  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      })
    const path = new URL(request.url()).pathname
    if (path === '/api/auth/login')
      return route.fulfill({
        json: {
          token: 'integration-test-token',
          user: { name: 'Jovani', email: 'jovani@example.com' },
        },
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    expect(request.headers().authorization).toBe(
      'Bearer integration-test-token',
    )
    if (expired)
      return route.fulfill({
        status: 401,
        json: { error: 'Session expired' },
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    if (path === '/api/pantry' && request.method() === 'POST') {
      pantry.push({ ...request.postDataJSON(), _id: 'pantry-1' })
      return route.fulfill({
        status: 201,
        json: pantry[0],
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }
    return route.fulfill({
      json: path === '/api/pantry' ? pantry : [],
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  })
  await page.goto('/pantry')
  await page.getByLabel('Email address').fill('jovani@example.com')
  await page.getByLabel('Password', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByLabel('Ingredient', { exact: true }).fill('Cucumber')
  await page.getByLabel('Quantity', { exact: true }).fill('2 whole')
  await page.getByRole('button', { name: 'Add ingredient' }).click()
  await expect(page.getByText('Cucumber', { exact: true })).toBeVisible()
  expect(pantry[0]).toMatchObject({
    ingredientName: 'Cucumber',
    quantity: '2 whole',
  })
  expired = true
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByText('Your session has expired. Please sign in again.'),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('fridgechef.token')),
  ).toBeNull()
})
