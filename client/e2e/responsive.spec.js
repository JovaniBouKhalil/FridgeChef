import { expect, test } from '@playwright/test'

const screens = [
  { width: 320, height: 640 },
  { width: 360, height: 740 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
]

for (const screen of screens) {
  test(`pages remain usable at ${screen.width}px with long user content`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(screen)
    await page.addInitScript(() => {
      sessionStorage.setItem('fridgechef.demo', 'true')
      localStorage.setItem(
        'fridgechef.demoKitchen.v1',
        JSON.stringify({
          pantry: [
            {
              _id: 'long-pantry',
              ingredientName: 'Ingredient'.repeat(8),
              quantity: 'A large container in the fridge',
            },
          ],
          favorites: [
            {
              _id: 'saved-recipe',
              recipeId: '52959',
              recipeName: 'Baked salmon with fennel & tomatoes',
            },
          ],
          shopping: [
            {
              _id: 'long-shopping',
              ingredientName:
                'A long ingredient name to check wrapping on a small screen',
              checked: false,
            },
          ],
        }),
      )
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    for (const path of [
      '/',
      '/featured',
      '/pantry',
      '/recipes/52959',
      '/favorites',
      '/shopping',
      '/signup',
      '/login',
    ]) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      await expect(page.locator('.mobile-brand')).toBeVisible()
      await expect(
        page.getByRole('navigation', { name: 'Mobile navigation' }),
      ).toBeVisible()
      if (path === '/pantry') {
        await expect(
          page.getByRole('button', { name: 'Add ingredient', exact: true }),
        ).toHaveCount(0)
        await page
          .getByRole('button', { name: 'Add an ingredient', exact: true })
          .click()
        await expect(
          page.getByLabel('Ingredient', { exact: true }),
        ).toBeFocused()
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `No horizontal page scroll on ${path}`,
      ).toBe(true)

      const controls = page.locator(
        'main button:visible, .topbar button:visible, .mobile-nav a:visible',
      )
      for (const control of await controls.all()) {
        const box = await control.boundingBox()
        expect(
          box.width,
          `Touch width on ${path}: ${(await control.getAttribute('aria-label')) || (await control.innerText())}`,
        ).toBeGreaterThanOrEqual(43.5)
        expect(box.height, `Touch height on ${path}`).toBeGreaterThanOrEqual(
          43.5,
        )
      }

      for (const input of await page
        .locator('main input:visible:not([type="checkbox"])')
        .all()) {
        expect(
          await input.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          ),
        ).toBeGreaterThanOrEqual(16)
        const box = await input.boundingBox()
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(screen.width + 1)
      }

      if (path === '/') {
        const search = page.getByRole('combobox', {
          name: 'Search recipes by name',
        })
        expect((await search.boundingBox()).y).toBeLessThan(screen.height - 60)
        await page.screenshot({
          path: testInfo.outputPath('recipes.png'),
          animations: 'disabled',
        })
      }
      if (path === '/signup') {
        await page
          .getByRole('button', { name: 'Create account', exact: true })
          .click()
        await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
      }
    }
    expect(errors).toEqual([])
  })
}
