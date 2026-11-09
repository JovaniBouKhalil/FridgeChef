import { expect, test } from '@playwright/test'

async function demo(page) {
  await page.addInitScript(() =>
    sessionStorage.setItem('fridgechef.demo', 'true'),
  )
}

test('featured carousel navigates by arrows, thumbnails and keyboard, and cleans up on exit', async ({
  page,
}) => {
  await demo(page)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: 'Featured recipes' }),
  ).toHaveCount(0)
  await page
    .getByRole('link', { name: 'Featured recipes', exact: true })
    .click()
  const carousel = page.getByRole('region', { name: 'Featured recipes' })
  await expect(
    carousel.getByRole('heading', { name: 'Spicy arrabiata Penne' }),
  ).toBeVisible()
  await carousel
    .getByRole('button', { name: 'Next recipe', exact: true })
    .click()
  await expect(
    carousel.getByRole('heading', { name: 'Fennel & tomato Salmon' }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.locator('.dsh-orbit[data-active="true"]').evaluate((element) => {
        const matrix = new DOMMatrix(getComputedStyle(element).transform)
        return Math.abs(matrix.b) < 0.00001 && matrix.a > 0.99999
      }),
    )
    .toBe(true)
  await carousel
    .getByRole('button', { name: 'Previous recipe', exact: true })
    .click()
  await expect(
    carousel.getByRole('heading', { name: 'Spicy arrabiata Penne' }),
  ).toBeVisible()
  await carousel
    .getByRole('button', { name: 'Show Pancakes', exact: true })
    .click()
  await expect(
    carousel.getByRole('heading', { name: 'Weekend Pancakes' }),
  ).toBeVisible()
  await carousel.focus()
  await carousel.press('End')
  await expect(
    carousel.getByRole('heading', { name: 'Teriyaki chicken Casserole' }),
  ).toBeVisible()
  await carousel.press('ArrowRight')
  await expect(
    carousel.getByRole('heading', { name: 'Spicy arrabiata Penne' }),
  ).toBeVisible()
  const ingredients = carousel.getByRole('tab', {
    name: 'Ingredients',
    exact: true,
  })
  await ingredients.click()
  await expect(
    carousel.getByRole('tabpanel', { name: 'Ingredients' }),
  ).toContainText('garlic')
  await ingredients.press('ArrowLeft')
  await expect(
    carousel.getByRole('tab', { name: 'Overview', exact: true }),
  ).toBeFocused()
  await expect(
    carousel.getByRole('heading', { name: 'Spicy arrabiata Penne' }),
  ).toBeVisible()
  await carousel
    .getByRole('button', { name: 'Next recipe', exact: true })
    .click()
  await page
    .getByRole('link', { name: 'Browse all recipes', exact: true })
    .click()
  await expect(page).toHaveURL('http://localhost:5173/')
  await expect(
    page.getByRole('heading', { name: 'Recipes', exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('featured recipe actions save real recipes and open their full details', async ({
  page,
}) => {
  await demo(page)
  await page.goto('/featured')
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Saved recipe', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/favorites')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('Spicy Arrabiata Penne')
  await page.goto('/featured')
  await page.getByRole('button', { name: 'View recipe', exact: true }).click()
  await expect(page).toHaveURL(/\/recipes\/52771$/)
  await expect(
    page.getByRole('heading', { name: 'Spicy Arrabiata Penne', exact: true }),
  ).toBeVisible()
})

test('guest saving keeps the existing login and return-to-featured flow', async ({
  page,
}) => {
  await page.goto('/featured')
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Sign in', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Try demo kitchen', exact: true })
    .click()
  await expect(page).toHaveURL(/\/featured$/)
  await expect(
    page.getByRole('region', { name: 'Featured recipes' }),
  ).toBeVisible()
})

test('carousel supports swipes, reduced motion, and full-size touch controls', async ({
  page,
}, testInfo) => {
  await demo(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/featured')
  const plate = page.locator('.dsh-plates')
  await plate.scrollIntoViewIfNeeded()
  const box = await plate.boundingBox()
  const first = { x: box.x + box.width * 0.8, y: box.y + box.height / 2 }
  const second = { x: box.x + box.width * 0.2, y: first.y }
  if (testInfo.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [first],
    })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: (first.x + second.x) / 2, y: first.y }],
    })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [second],
    })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
  } else {
    await page.mouse.move(first.x, first.y)
    await page.mouse.down()
    await page.mouse.move(second.x, second.y, { steps: 5 })
    await page.mouse.up()
  }
  const carousel = page.getByRole('region', { name: 'Featured recipes' })
  await expect(
    carousel.getByRole('heading', { name: 'Fennel & tomato Salmon' }),
  ).toBeVisible()
  expect(
    await page
      .locator('.dsh-orbit[data-active="true"]')
      .evaluate((element) =>
        Math.abs(new DOMMatrix(getComputedStyle(element).transform).b),
      ),
  ).toBeLessThan(0.00001)
  for (const control of await carousel.locator('button:visible').all()) {
    const controlBox = await control.boundingBox()
    expect(controlBox.width).toBeGreaterThanOrEqual(43.5)
    expect(controlBox.height).toBeGreaterThanOrEqual(43.5)
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(
    await page
      .locator('.dsh-track-root')
      .evaluate((element) => element.offsetHeight),
  ).toBeLessThan(1800)
  await page.screenshot({
    path: testInfo.outputPath('featured.png'),
    fullPage: true,
  })
})
