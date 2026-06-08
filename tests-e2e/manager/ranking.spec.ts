import { test, expect } from "../fixtures/auth.fixture"

test.describe("Manager Ranking E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/camp-manager")
    await page.click('button:has-text("RANKING")')
    await expect(page.locator("text=RANKING DE PRODUCTIVIDAD")).toBeVisible()
  })

  test("should display leaderboard table correctly", async ({ page }) => {
    // Should see Juan Perez and Maria Gomez from mockManagerApis
    await expect(page.locator("text=Juan Perez").first()).toBeVisible()
    await expect(page.locator("text=60").first()).toBeVisible()

    await expect(page.locator("text=Maria Gomez").first()).toBeVisible()
    await expect(page.locator("text=0").first()).toBeVisible()
  })
})
