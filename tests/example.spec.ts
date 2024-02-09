import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Action Statuses/);
});

test("can navigate through storybook", async ({ page }) => {
  await page.goto("/storybook");

  await page.getByRole("link", { name: "Branches" }).click();

  await page.getByRole("tab", { name: "Branches" }).click();

  await expect(page.getByRole("link", { name: "Create pr" })).toBeVisible();
});
