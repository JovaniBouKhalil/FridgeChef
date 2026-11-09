import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('fridgechef.demo', 'true'),
  )
})

test('suggestions support keyboard choice, clearing, history removal, and Escape', async ({
  page,
}) => {
  await page.goto('/')
  const input = page.getByRole('combobox', { name: 'Search recipes by name' })
  await input.fill('Pan')
  await expect(page.getByRole('listbox')).toBeVisible()
  await input.press('ArrowDown')
  const activeId = await input.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await input.press('Enter')
  await expect(input).toHaveValue('Pancakes')
  await expect(input).toBeFocused()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear recipe search' }).click()
  await expect(page.getByRole('article')).toHaveCount(8)
  await input.click()
  await expect(
    page.getByRole('option', { name: 'Pancakes Recent' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Remove recent search Pancakes' })
    .click()
  await expect(
    page.getByRole('option', { name: 'Pancakes Try it' }),
  ).toBeVisible()
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(input).toBeFocused()
  await input.click()
  await page
    .getByRole('heading', { name: 'Something good is cooking.' })
    .click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.reload()
  await input.click()
  await expect(
    page.getByRole('button', { name: 'Remove recent search Pancakes' }),
  ).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 500 })
  await input.press('ArrowUp')
  const last = page.getByRole('option', { name: 'Salmon Try it' })
  await expect(last).toHaveAttribute('aria-selected', 'true')
  await expect
    .poll(async () => {
      const option = await last.boundingBox()
      const popup = await page.locator('.search-suggestions').boundingBox()
      return option.y + option.height <= popup.y + popup.height + 1
    })
    .toBe(true)
})

test('signup validates touched fields, focuses errors, and shows genuine pending/error states', async ({
  page,
}) => {
  let release
  const responseReady = new Promise((resolve) => {
    release = resolve
  })
  await page.route('http://localhost:3000/api/auth/signup', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    }
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    await responseReady
    return route.fulfill({
      status: 503,
      headers,
      json: { error: 'The kitchen is taking a short break. Please try again.' },
    })
  })
  await page.goto('/signup')
  const email = page.getByLabel('Email address')
  await email.fill('unfinished')
  await expect(email).toHaveAttribute('aria-invalid', 'false')
  await email.press('Tab')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Create my kitchen' }).click()
  await expect(page.getByLabel('Your name')).toBeFocused()
  await page.getByLabel('Your name').fill('Jovani')
  await email.fill('jovani@example.com')
  await page.getByLabel('Password', { exact: true }).fill('example-password')
  await page.getByLabel('Confirm password').fill('example-password')
  await page.getByRole('button', { name: 'Create my kitchen' }).click()
  await expect(page.getByRole('button', { name: 'One moment…' })).toBeDisabled()
  await expect(page.locator('form[aria-busy="true"] .spinner')).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText(
    'The kitchen is taking a short break.',
  )
  await expect(
    page.getByRole('button', { name: 'Create my kitchen' }),
  ).toBeEnabled()
  await expect(email).toHaveValue('jovani@example.com')
})

test('breadcrumbs, reduced motion, observer fallback, and back-to-top work on long pages', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    window.IntersectionObserver = undefined
  })
  await page.goto('/recipes/52771')
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
    'Spicy Arrabiata Penne',
  )
  await breadcrumb.getByRole('link', { name: 'Discover', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(8)
  const hero = page.locator('.discovery-hero')
  await expect(hero).toBeVisible()
  expect(
    await hero.evaluate((element) => getComputedStyle(element).opacity),
  ).toBe('1')
  await page
    .getByRole('button', { name: 'Save Spicy Arrabiata Penne', exact: true })
    .click()
  const heart = page.getByRole('article').first().locator('.heart-confirmation')
  await expect(heart).toBeVisible()
  expect(
    await heart.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none')
  await page.locator('.page-footer').scrollIntoViewIfNeeded()
  const backToTop = page.getByRole('button', { name: 'Back to top' })
  await expect(backToTop).toBeVisible()
  expect(
    await backToTop.evaluate(
      (element) => getComputedStyle(element).animationName,
    ),
  ).toBe('none')
  if (await page.locator('.mobile-nav').isVisible()) {
    const control = await backToTop.boundingBox()
    const navigation = await page.locator('.mobile-nav').boundingBox()
    expect(control.y + control.height).toBeLessThan(navigation.y - 8)
  }
  await backToTop.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.locator('#main-content')).toBeFocused()
  await expect(backToTop).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
