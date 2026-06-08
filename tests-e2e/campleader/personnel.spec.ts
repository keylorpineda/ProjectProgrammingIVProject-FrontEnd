import { test, expect } from "../fixtures/auth.fixture"

test.describe("Camp Leader - Personnel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campleader")
    // Navigate to Members tab
    await page.click('button:has-text("MIEMBROS")')
    await expect(page.locator("text=EXPEDIENTES DEL PERSONAL")).toBeVisible()
  })

  test("should display personnel records", async ({ page }) => {
    // Check if the mock personnel are rendered
    // Mock user is Juan (first_name)
    await expect(page.getByText("Juan")).toBeVisible()
  })
})
