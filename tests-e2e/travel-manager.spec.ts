import { test, expect } from "@playwright/test"

test.describe("Travel Manager View", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the root so local storage can be set
    await page.goto("/")

    // A valid JWT structure with a future expiration date so `isTokenExpired` doesn't trigger a logout
    const futureExpToken = "header.eyJleHAiOjM4MTA5MDkwMDB9.signature"

    // Inject auth state into localStorage so we bypass the login screen
    await page.evaluate((token) => {
      const mockAuthState = {
        state: {
          user: {
            id: "TM-001",
            username: "e2e_manager",
            role: "TRAVEL_MANAGER",
            camp_id: "CAMP-A1",
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem("auth-user-storage", JSON.stringify(mockAuthState))
      sessionStorage.setItem("auth-token-session", JSON.stringify({ state: { token }, version: 0 }))
    }, futureExpToken)

    // Intercept refresh token requests to return a fake token so that 401s from the real backend don't trigger a logout
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({ status: 200, json: { access_token: futureExpToken } })
    })

    // Now go to the specific travel manager dashboard
    await page.goto("/travel-manager/dashboard")
  })

  test("should display the Travel Manager Layout", async ({ page }) => {
    // Check for the main title
    await expect(page.locator("text=GESTIÓN VIAJES").first()).toBeVisible()

    // Check for the role/username element
    await expect(page.locator("text=E2E_MANAGER").first()).toBeVisible()
    await expect(page.locator("text=BASE::CAMP-A1").first()).toBeVisible()

    // Check if navigation menu items are visible in the sidebar
    await expect(page.locator("text=TABLERO").first()).toBeVisible()
    await expect(page.locator("text=EXPEDICIONES").first()).toBeVisible()
    await expect(page.locator("text=EQUIPO").first()).toBeVisible()
    await expect(page.locator("text=TRASLADOS").first()).toBeVisible()
    await expect(page.locator("text=RECURSOS").first()).toBeVisible()
    await expect(page.locator("text=PERFIL").first()).toBeVisible()
  })

  test("should handle responsive sidebar opening", async ({ page }) => {
    // Resize the viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // The hamburger menu button should be visible (has aria-label="Abrir menú")
    const menuButton = page.locator('button[aria-label="Abrir menú"]')
    await expect(menuButton).toBeVisible()

    // Click it to open the mobile sidebar
    await menuButton.click()

    // The close button should now be visible
    const closeButton = page.locator('button[aria-label="Cerrar menú"]').last()
    await expect(closeButton).toBeVisible()
  })

  test("should navigate through all travel manager views", async ({ page }) => {
    // Navigate to Explorations
    await page.locator("a:has-text('EXPEDICIONES')").first().click()
    await expect(page).toHaveURL(/.*\/travel-manager\/expeditions/)
    await expect(page.locator("text=Operaciones de Campo").first()).toBeVisible()

    // Navigate to Team
    await page.locator("a:has-text('EQUIPO')").first().click()
    await expect(page).toHaveURL(/.*\/travel-manager\/personnel/)
    await expect(page.locator("text=Personal Operativo").first()).toBeVisible()

    // Navigate to Transfers
    await page.locator("a:has-text('TRASLADOS')").first().click()
    await expect(page).toHaveURL(/.*\/travel-manager\/transfers/)
    await expect(page.locator("text=Gestión de Traslados").first()).toBeVisible()

    // Navigate to Resources
    await page.locator("a:has-text('RECURSOS')").first().click()
    await expect(page).toHaveURL(/.*\/travel-manager\/inventory/)
    await expect(page.locator("text=Recursos de Viaje").first()).toBeVisible()

    // Navigate to Profile
    await page.locator("a:has-text('PERFIL')").first().click()
    await expect(page).toHaveURL(/.*\/travel-manager\/profile/)
    await expect(page.locator("text=EXPEDIENTE DEL COORDINADOR").first()).toBeVisible()
  })

  test("should logout properly", async ({ page }) => {
    // Click the logout button
    // It has the title "CERRAR SESIÓN"
    const logoutButton = page.locator('button[title="CERRAR SESIÓN"]')
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()

    // It should navigate to /login or root
    await expect(page).toHaveURL(/.*\/login|.*\//)
  })
})
