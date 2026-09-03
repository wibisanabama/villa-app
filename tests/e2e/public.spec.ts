import { expect, test } from "@playwright/test";
test("public catalogue remains usable on every viewport", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tempat untuk tinggal");
  await expect(page.getByLabel("Lokasi atau nama villa")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cari villa" })).toBeVisible();
});
