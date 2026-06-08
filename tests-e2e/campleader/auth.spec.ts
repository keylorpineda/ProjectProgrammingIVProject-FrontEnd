import { test, expect } from "../fixtures/auth.fixture"

test.describe("Camp Leader Navigation & Auth", () => {
  test("should redirect to login if not authenticated", async ({ browser }) => {
    // Use an isolated context to ensure unauthenticated state
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto("/campleader")
    await expect(page).toHaveURL(/.*\/login/)
    await context.close()
  })

  test("should render sidebar and allow navigation between tabs", async ({ page }) => {
    await page.goto("/campleader")

    // Default view is Dashboard
    await expect(page.locator("text=TABLERO DE MANDO - RESUMEN OPERATIVO")).toBeVisible()

    // Click Explorations
    await page.click('button:has-text("EXPLORACIONES")')
    await expect(page.locator("text=EXPLORACIONES EN LA ZONA MUERTA")).toBeVisible()

    // Click Transfers
    await page.click('button:has-text("TRASLADOS")')
    await expect(page.locator("text=TRASLADOS INTER-CAMPAMENTOS")).toBeVisible()

    // Click Inventory
    await page.click('button:has-text("INVENTARIO")')
    await expect(page.locator("text=BODEGA CENTRAL DE SUMINISTROS")).toBeVisible()

    // Click Members
    await page.click('button:has-text("MIEMBROS")')
    await expect(page.locator("text=EXPEDIENTES DEL PERSONAL")).toBeVisible()

    // Click Profile
    await page.click('button:has-text("PERFIL")')
    await expect(page.locator("text=EXPEDIENTE DEL COMANDANTE")).toBeVisible()
  })

  test("should logout when clicking logout button", async ({ page }) => {
    await page.goto("/campleader")

    // Check Topbar for username
    await expect(page.locator("text=LEADER")).toBeVisible()

    // Click Log Out
    await page.click('button:has-text("SALIR")')

    // Should navigate to login
    await expect(page).toHaveURL(/.*\/login/)
  })
})
