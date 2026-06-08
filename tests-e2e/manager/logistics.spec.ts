import { test, expect } from "../fixtures/auth.fixture"

test.describe("Manager Logistics E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/camp-manager")
    await page.click('button:has-text("TRASLADOS")')
    await expect(page.locator("text=CONTROL DE TRASLADOS")).toBeVisible()
  })

  test("should display logistics layout and request reinforcement", async ({ page }) => {
    // The "PEDIR REFUERZO" button is in the top header
    await page.click('button:has-text("PEDIR REFUERZO")')

    // It should open a modal to propose a transfer or convoy
    await expect(page.locator("text=SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA")).toBeVisible()

    // Fill convoy request form
    await page.selectOption("select#targetCamp", "2") // Some destination
    await page.selectOption("select#resourceId", "1") // Gasolina
    await page.fill("input#quantity", "50")

    // Submit
    await page.click('button:has-text("FIRMAR ORDEN")')

    // The modal should close and mock network returns 201 Created
    await expect(page.locator("text=SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA")).not.toBeVisible()
  })
})
