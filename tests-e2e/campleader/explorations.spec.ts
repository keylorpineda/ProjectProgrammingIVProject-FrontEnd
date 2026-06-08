import { test, expect } from "../fixtures/auth.fixture"

test.describe("Camp Leader - Explorations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campleader")
    // Navigate to Explorations tab
    await page.click('button:has-text("EXPLORACIONES")')
    await expect(page.locator("text=EXPLORACIONES EN LA ZONA MUERTA")).toBeVisible()
  })

  test("should create a new expedition", async ({ page }) => {
    // Open New Expedition Modal
    await page.getByRole("button", { name: "NUEVA EXPEDICIÓN", exact: true }).click()

    // Expect modal to be visible
    await expect(page.getByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).toBeVisible()

    // Fill form (using placeholders instead of labels since inputs don't have id)
    await page.getByPlaceholder("EJ. BÚSQUEDA DE ANTÍXIDAS EN VALLE GRIS").fill("Operación Cénit")
    await page.getByPlaceholder("EJ. HOSPITAL UNIVERSITARIO, PISOS INFERIORES").fill("Sector 7G")

    // Select first person available from the list
    const personCard = page.locator('.grid-cols-1 > div[role="button"]').first()
    await personCard.click()

    // Select a resource
    const qtyInputs = await page.getByRole("spinbutton").all()
    if (qtyInputs.length > 0) {
      await qtyInputs[0].fill("1")
    }

    // Submit
    await page.getByRole("button", { name: "REGISTRAR PLAN EN CENTRAL" }).click()

    // Check if modal closes
    await expect(page.getByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).not.toBeVisible()
  })

  test("should change expedition status", async ({ page }) => {
    // Look for an expedition in progress from our mock
    const expeditionCard = page.locator("div").filter({ hasText: "Expedición Alpha" }).first()
    await expect(expeditionCard).toBeVisible()

    // In Progress expeditions show a "REGISTRAR RETORNO" button
    const returnBtn = expeditionCard.getByRole("button", { name: "REGISTRAR RETORNO" }).first()
    if (await returnBtn.isVisible()) {
      await returnBtn.click()
      await expect(page.getByText("HOJA DE REGISTRO DE RETORNO Y EXCLUSIÓN DE ZONA")).toBeVisible()

      // Assuming there is a submit button in the modal to confirm
      await page.getByRole("button", { name: "REGISTRAR INGRESO EN ALMACÉN" }).click()
      await expect(
        page.getByText("HOJA DE REGISTRO DE RETORNO Y EXCLUSIÓN DE ZONA"),
      ).not.toBeVisible()
    }
  })
})
