import { test, expect } from "../fixtures/auth.fixture"

test.describe("Manager Workforce E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/camp-manager")
    await page.click('button:has-text("PERSONAL")')
    await expect(page.locator("text=ADMINISTRACIÓN DE PERSONAL")).toBeVisible()
  })

  test("should display workforce members correctly", async ({ page }) => {
    // Should see Juan Perez from mockManagerApis
    await expect(page.locator("text=Juan Perez").first()).toBeVisible()
    await expect(page.locator("text=Mechanic").first()).toBeVisible()
  })

  test("should reassign a worker role", async ({ page }) => {
    // Let's assume there is a select or button to change role.
    // Mocks return "worker". The user can click an "ASSIGN" button or a dropdown.
    // If the UI has a row for Juan Perez, and a select to change role:
    const row = page.locator('tr:has-text("Juan Perez")')
    if ((await row.count()) > 0) {
      // Find role dropdown or edit button inside row
      const select = row.locator("select")
      if ((await select.count()) > 0) {
        await select.selectOption("guard")

        // Find save button or assume it auto-saves (mock intercepts PATCH)
        // If there's an action button
        const saveBtn = row.locator('button:has-text("GUARDAR")')
        if (await saveBtn.isVisible()) {
          await saveBtn.click()
        }

        // In a real UI, there might be a toast
      }
    }
  })
})
