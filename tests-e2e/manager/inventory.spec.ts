import { test, expect } from "../fixtures/auth.fixture"

test.describe("Manager Inventory E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the dashboard and switch to inventory tab
    await page.goto("/camp-manager")
    await page.click('button:has-text("BODEGA")')
    // Ensure we are in the inventory view
    await expect(page.locator("text=BODEGA CENTRAL")).toBeVisible()
  })

  test("should display inventory cards correctly", async ({ page }) => {
    // Check for resources provided by mockManagerApis
    await expect(page.locator("text=Gasolina").first()).toBeVisible()
    await expect(page.locator("text=136")).toBeVisible() // stock
    await expect(page.locator("text=mín. 50").first()).toBeVisible() // min stock

    await expect(page.locator("text=Agua").first()).toBeVisible()
    await expect(page.getByText("10", { exact: true }).first()).toBeVisible() // stock
    // Water is below minimum (10 < 50), so CRÍTICO badge should appear
    await expect(page.locator("text=⚠ CRÍTICO")).toBeVisible()
  })

  test("should edit minimum stock", async ({ page }) => {
    // Wait for the route and trigger edit mode
    await page.click("text=EDITAR")

    // Modal should open
    await expect(page.locator("text=REDIMENSIONAR RESERVA MÍNIMA")).toBeVisible()

    // Fill the number input
    await page.fill('input[type="number"]', "80")

    // Save
    await page.click('button:has-text("GUARDAR")')

    // Modal should close and UI updates. The mock network returns success.
    await expect(page.locator("text=REDIMENSIONAR RESERVA MÍNIMA")).not.toBeVisible()
  })

  test("should register a new movement", async ({ page }) => {
    await page.click("text=REGISTRAR MOVIMIENTO")

    // Wait for the movement modal
    await expect(page.locator("text=REGISTRAR MOVIMIENTO DE BODEGA")).toBeVisible()

    // Select Resource
    await page.selectOption("select#resourceSelect", "1") // Gasolina

    // Select Operation Type
    await page.selectOption("select#operationTypeSelect", "income")

    // Enter Quantity
    await page.fill('input[placeholder="0.000"]', "20")

    // Enter Description
    await page.fill("textarea", "Test Consumo")

    // Confirm
    await page.click('button:has-text("CONFIRMAR OPERACIÓN")')

    // The modal should close
    await expect(page.locator("text=REGISTRAR MOVIMIENTO DE BODEGA")).not.toBeVisible()
  })

  test("should execute daily solar cycle", async ({ page }) => {
    await page.click("text=CICLO SOLAR")

    // Wait for confirmation modal
    await expect(page.locator("text=AUTORIZACIÓN CRÍTICA")).toBeVisible()

    // Execute
    await page.click('button:has-text("EJECUTAR CONSUMOS")')

    // Should see success message
    await expect(page.locator("text=CICLO DIARIO EJECUTADO CON ÉXITO")).toBeVisible()
  })
})
