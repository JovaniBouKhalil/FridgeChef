import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Optional real-service check. Reuses the verifier's generated account and
// keeps credentials in memory; no mocks, stored sessions, or traces are used.
export async function verifyLiveBrowser(frontend, account, password, passed) {
  const requireClient = createRequire(
    new URL("../client/package.json", import.meta.url),
  );
  const { chromium, expect } = requireClient("@playwright/test");
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${frontend}/login`);
        await page.getByLabel("Email address").fill(account.email);
        await page.getByLabel("Password", { exact: true }).fill(password);
        await page
          .getByRole("button", { name: "Sign in", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "My pantry", exact: true }),
        ).toBeVisible();
        // Wait for the real pantry load before interacting with disabled forms.
        await expect(
          page.locator(".pantry-item").filter({ hasText: "Tomatoes" }),
        ).toBeVisible();
        const openForm = () =>
          page
            .getByRole("button", { name: "Add an ingredient", exact: true })
            .click();
        if (viewport.width < 800) await openForm();
        await page.getByLabel("Ingredient", { exact: true }).fill("Salt");
        await page.getByLabel("Quantity", { exact: true }).fill("0.5");
        await page.getByLabel("Unit", { exact: true }).selectOption("tsp");
        await page
          .getByRole("button", { name: "Add ingredient", exact: true })
          .click();
        const salt = page.locator(".pantry-item").filter({ hasText: "Salt" });
        await expect(salt).toContainText("0.5 tsp");
        await page.reload();
        await expect(salt).toContainText("0.5 tsp");
        if (viewport.width < 800) await openForm();
        await page.getByLabel("Ingredient", { exact: true }).fill("TOmatos");
        await page.getByLabel("Quantity", { exact: true }).fill("2");
        await page
          .getByRole("button", { name: "Add ingredient", exact: true })
          .click();
        await expect(page.getByRole("alert")).toContainText(
          "already in your pantry",
        );

        await page.goto(`${frontend}/shopping`);
        await page.getByLabel("Add to shopping list").fill("Carrots");
        await page.getByRole("button", { name: "Add", exact: true }).click();
        await page
          .getByRole("checkbox", { name: "Carrots", exact: true })
          .check();
        await expect(
          page.getByRole("checkbox", { name: "Carrots", exact: true }),
        ).toBeChecked();
        await page.goto(`${frontend}/pantry`);
        const carrots = page
          .locator(".pantry-item")
          .filter({ hasText: "Carrots" });
        await expect(carrots).toContainText("Not specified");
        await page
          .getByRole("button", { name: "Edit Salt", exact: true })
          .click();
        await expect(salt.getByLabel("Unit", { exact: true })).toHaveValue(
          "tsp",
        );
        await salt.getByLabel("Quantity", { exact: true }).fill("1");
        await salt.getByLabel("Unit", { exact: true }).selectOption("g");
        await salt
          .getByRole("button", { name: "Save changes", exact: true })
          .click();
        await expect(salt).toContainText("1 g");
        await page.reload();
        await expect(salt).toContainText("1 g");
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Live page must fit its viewport",
        );
        for (const name of ["Salt", "Carrots"]) {
          await page
            .getByRole("button", { name: `Remove ${name}`, exact: true })
            .click();
          await page
            .getByRole("button", { name: "Yes, remove", exact: true })
            .click();
          await expect(
            page.getByRole("button", { name: `Edit ${name}`, exact: true }),
          ).toHaveCount(0);
        }
        // A cleared checklist allows the same ingredient to be bought again.
        await page.goto(`${frontend}/shopping`);
        await page
          .getByRole("button", { name: "Clear picked up", exact: true })
          .click();
        await expect(
          page.getByRole("checkbox", { name: "Carrots", exact: true }),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "Log out", exact: true })
          .click();
        await page.goto(`${frontend}/pantry`);
        await expect(
          page.getByRole("heading", { name: "Sign in", exact: true }),
        ).toBeVisible();
        assert.deepEqual(
          errors,
          [],
          "Live browser must not throw uncaught errors",
        );
        passed(
          `real browser ${viewport.width}px: login, units, aliases, persisted edits, shopping transfer, deletion, logout, and layout`,
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
