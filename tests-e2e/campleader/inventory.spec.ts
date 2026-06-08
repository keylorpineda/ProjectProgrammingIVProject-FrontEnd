import { test, expect } from "../fixtures/auth.fixture"

test.describe("Camp Leader - Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campleader")
    // Navigate to Inventory tab
    await page.click('button:has-text("INVENTARIO")')
    await expect(page.locator("text=BODEGA CENTRAL DE SUMINISTROS")).toBeVisible()
  })

  test("should display inventory items and allow filtering", async ({ page }) => {
    // Wait for inventory items to render
    // Filter by COMIDA
    await page.getByRole("button", { name: "🌽 COMIDA" }).click()

    // We expect the food items (like "Raciones Secas" from mock) to be visible
    // "Raciones Secas" is in the mock data
    await expect(page.getByText("Agua", { exact: true })).toBeVisible()

    // The Gasolina item should not be visible when looking at COMIDA
    await expect(page.getByText("Gasolina")).not.toBeVisible()

    // Click on TODO
    await page.getByRole("button", { name: "TODO" }).click()
    await expect(page.getByText("Gasolina")).toBeVisible()
    await expect(page.getByText("Agua", { exact: true })).toBeVisible()
  })

  test("should show alert badges for low stock", async ({ page }) => {
    // The mock has a low stock item (Agua, alert_active: true)
    // Verify that "BAJO MÍN." badge is visible
    const lowStockBadge = page.locator("text=BAJO MÍN.").first()
    await expect(lowStockBadge).toBeVisible()
  })
})
