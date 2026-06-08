import { test, expect } from "../fixtures/auth.fixture"

test.describe("Dashboard Manager Navigation & Auth", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    // Overwrite the initial state to simulate unauthenticated
    await page.addInitScript(() => {
      window.localStorage.removeItem("auth-user-storage")
      window.sessionStorage.removeItem("auth-token-session")
    })

    await page.goto("/camp-manager")
    // Since there's no user, InactivityGuard or DashboardManager should redirect to /login
    await expect(page).toHaveURL(/.*\/login/)
  })

  test("should show signal interrupted screen if campId is null", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "auth-user-storage",
        JSON.stringify({
          state: {
            user: {
              id: "1",
              name: "CommanderE2E",
              email: "e2e@doomsday.com",
              role: "admin",
              camp_id: null,
            },
            isAuthenticated: true,
          },
          version: 0,
        }),
      )
    })

    await page.goto("/camp-manager")
    await expect(page.locator("text=SEÑAL INTERRUMPIDA")).toBeVisible()
    await expect(page.locator("text=Esperando Señal del Campamento...")).toBeVisible()
  })

  test("should render sidebar and allow navigation between tabs", async ({ page }) => {
    await page.goto("/camp-manager")

    // Default tab is Overview
    await expect(page.locator("text=TABLERO DE COMBATE")).toBeVisible()

    // Navigate to Inventory
    await page.click('button:has-text("BODEGA")')
    await expect(page.locator("text=BODEGA CENTRAL")).toBeVisible()
    await expect(page.locator("text=Gasolina").first()).toBeVisible()

    // Navigate to Catalog
    await page.click('button:has-text("CATÁLOGO")')
    await expect(page.locator("text=CATÁLOGO DE RECURSOS")).toBeVisible()

    // Navigate to Ranking
    await page.click('button:has-text("RANKING")')
    await expect(page.locator("text=RANKING DE PRODUCTIVIDAD")).toBeVisible()

    // Navigate to Workforce
    await page.click('button:has-text("PERSONAL")')
    await expect(page.locator("text=ADMINISTRACIÓN DE PERSONAL")).toBeVisible()

    // Navigate to Logistics
    await page.click('button:has-text("TRASLADOS")')
    await expect(page.locator("text=CONTROL DE TRASLADOS")).toBeVisible()
  })

  test("should logout when clicking logout button", async ({ page }) => {
    await page.goto("/camp-manager")

    // Click the LogOut button (it has title CERRAR SESIÓN)
    await page.click('button[title="CERRAR SESIÓN"]')

    // Should navigate to login
    await expect(page).toHaveURL(/.*\/login/)
  })
})
