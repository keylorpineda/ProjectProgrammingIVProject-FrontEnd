import { test, expect } from "../fixtures/auth.fixture"

test.describe("Manager Catalog E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/camp-manager")
    await page.click('button:has-text("CATÁLOGO")')
    await expect(page.locator("text=CATÁLOGO DE RECURSOS")).toBeVisible()
  })

  test("should display catalog items correctly", async ({ page }) => {
    // Should see Gasolina from mockManagerApis
    await expect(page.locator("text=Gasolina").first()).toBeVisible()
    await expect(page.locator("text=Galón").first()).toBeVisible()
  })

  test("should open add resource modal and submit new resource", async ({ page }) => {
    await page.click("text=NUEVO RECURSO")

    // Wait for the modal
    await expect(page.locator("text=REGISTRAR NUEVO RECURSO")).toBeVisible()

    // Fill form
    await page.fill("input#catalog-name", "Balas 9mm")
    await page.selectOption("select#catalog-category", "weapons")
    await page.fill("input#catalog-unit", "Unidades")
    await page.fill("textarea#catalog-desc", "Munición estándar")

    // Submit
    await page.click('button:has-text("REGISTRAR")')

    // Success response
    await expect(page.locator("text=REGISTRAR NUEVO RECURSO")).not.toBeVisible()
  })
})
