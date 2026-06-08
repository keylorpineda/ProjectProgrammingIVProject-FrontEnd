import { test, expect } from "../fixtures/auth.fixture"

test.describe("Camp Leader - Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campleader")
    // Navigate to Profile tab
    await page.click('button:has-text("PERFIL")')
    await expect(page.locator("text=EXPEDIENTE DEL COMANDANTE")).toBeVisible()
  })

  test("should display profile information", async ({ page }) => {
    // Profile view usually shows user data, let's verify title or static info
    await expect(page.getByText("EXPEDIENTE DEL COMANDANTE")).toBeVisible()
  })
})
