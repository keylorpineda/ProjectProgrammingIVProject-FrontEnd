import { expect, test as base } from "@playwright/test"

import type { Page } from "@playwright/test"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mockAdminApis(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // Dashboard metrics
    if (url.includes("/dashboard/")) {
      return route.fulfill({
        status: 200,
        json: {
          camp_id: "1",
          role: "admin",
          generated_at: new Date().toISOString(),
          camp: {
            total_people: 12,
            active_workers: 10,
            unavailable_people: 2,
            camp_capacity: 500,
            occupancy_rate: 2.4,
            active_explorations: 1,
            empty_professions: [],
          },
          warehouse: {
            total_resource_types: 8,
            resources_with_alerts: 1,
            inventory_total_quantity: 4500,
            critical_resources: [],
          },
          transfers: {
            pending_transfers: 1,
            approved_transfers: 0,
            completed_transfers: 0,
          },
        },
      })
    }

    // Leaderboard (admin dashboard uses it)
    if (url.includes("/dashboard/leaderboard")) {
      return route.fulfill({ status: 200, json: [] })
    }

    // AI Admissions
    if (
      url.includes("/ai/admissions/pending") ||
      (url.includes("/ai/admissions") && method === "GET")
    ) {
      return route.fulfill({
        status: 200,
        json: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      })
    }

    // Camps
    if (url.includes("/camps")) {
      return route.fulfill({
        status: 200,
        json: [
          {
            id: "1",
            name: "Campamento Alpha",
            location_description: "Bunker subterráneo",
            latitude: 9.93,
            longitude: -84.08,
            max_capacity: 500,
            active: true,
            foundation_date: "2026-01-01",
            logo_url: null,
            map_url: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "2",
            name: "Refugio Beta",
            location_description: "Montaña norte",
            latitude: 10.0,
            longitude: -84.0,
            max_capacity: 200,
            active: true,
            foundation_date: "2026-01-01",
            logo_url: null,
            map_url: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    }

    // Persons
    if (url.includes("/users/persons")) {
      return route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: "1",
              first_name: "Juan",
              last_name: "Pérez",
              status: "active",
              profession: { name: "Médico" },
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      })
    }

    // Professions
    if (url.includes("/users/professions")) {
      return route.fulfill({ status: 200, json: [] })
    }

    // Transfers
    if (url.includes("/transfers/requests")) {
      return route.fulfill({ status: 200, json: [] })
    }

    // Transfer statistics
    if (url.includes("/transfers/statistics")) {
      return route.fulfill({
        status: 200,
        json: { pending_transfers: 0, approved_transfers: 0, completed_transfers: 0 },
      })
    }

    // Explorations
    if (url.includes("/explorations")) {
      return route.fulfill({
        status: 200,
        json: { data: [], total: 0, page: 1, limit: 10 },
      })
    }

    // Resources
    if (url.includes("/resources/inventory")) {
      return route.fulfill({ status: 200, json: [] })
    }
    if (url.includes("/resources")) {
      return route.fulfill({
        status: 200,
        json: { data: [], total: 0, page: 1, limit: 10 },
      })
    }

    // Auth – getMe (profile)
    if (url.includes("/auth/me")) {
      return route.fulfill({ status: 200, json: { avatar_url: null } })
    }

    // Logout
    if (url.includes("/auth/logout")) {
      return route.fulfill({ status: 200, json: { success: true } })
    }

    // Fallback
    return route.fulfill({ status: 200, json: {} })
  })
}

// ─── Auth fixture ─────────────────────────────────────────────────────────────

const test = base.extend({
  page: async ({ page }, use) => {
    // eslint-disable-next-line no-console
    page.on("console", (msg) => console.log(`[Browser] ${msg.type()}: ${msg.text()}`))

    await page.addInitScript(() => {
      try {
        const fakeJwt =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
          btoa(JSON.stringify({ exp: 32503680000 })) +
          ".signature"

        window.sessionStorage.setItem(
          "auth-token-session",
          JSON.stringify({ state: { token: fakeJwt }, version: 0 }),
        )

        window.localStorage.setItem(
          "auth-user-storage",
          JSON.stringify({
            state: {
              user: {
                id: "5",
                username: "admin",
                email: "admin@system.local",
                role: "admin",
                camp_id: "1",
              },
              isAuthenticated: true,
            },
            version: 0,
          }),
        )

        window.localStorage.setItem("active-camp-id", "1")
      } catch {
        // ignore cross-origin iframes
      }
    })

    await mockAdminApis(page)
    await use(page)
  },
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Admin View — E2E", () => {
  test.describe("RequireAdmin guard", () => {
    test("redirects to /login when not authenticated", async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.removeItem("auth-user-storage")
        window.sessionStorage.removeItem("auth-token-session")
      })
      await page.goto("/admin/dashboard")
      await expect(page).toHaveURL(/.*\/login/)
    })

    test("redirects to /login when authenticated as non-admin role", async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem(
          "auth-user-storage",
          JSON.stringify({
            state: {
              user: {
                id: "6",
                username: "worker",
                email: "worker@system.local",
                role: "worker",
                camp_id: "1",
              },
              isAuthenticated: true,
            },
            version: 0,
          }),
        )
      })
      await page.goto("/admin/dashboard")
      await expect(page).toHaveURL(/.*\/login/)
    })

    test("renders admin layout when authenticated as admin", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.getByText("CERRAR SESIÓN").first()).toBeVisible()
    })
  })

  test.describe("Admin layout", () => {
    test("shows CONFIDENCIAL header badge", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.getByText("CONFIDENCIAL").first()).toBeVisible()
    })

    test("shows running UTC clock in the header", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("text=UTC")).toBeVisible()
    })

    test("shows admin username in the ID card block", async ({ page }) => {
      await page.goto("/admin/dashboard")
      // Wait for header to load, then check username display
      await expect(page.getByText(/RANGO: ADMINISTRADOR/i).first()).toBeVisible({ timeout: 10000 })
      await expect(page.getByText("ADMIN").first()).toBeVisible()
    })

    test("shows RANGO: ADMINISTRADOR badge", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.getByText(/RANGO: ADMINISTRADOR/i).first()).toBeVisible()
    })
  })

  test.describe("Sidebar navigation", () => {
    test("renders all 7 navigation tabs", async ({ page }) => {
      await page.goto("/admin/dashboard")
      // Wait for layout to be fully rendered before checking sidebar
      await expect(page.locator("text=UTC")).toBeVisible({ timeout: 10000 })
      const sidebar = page.locator("aside")
      await expect(sidebar.getByText("TABLERO")).toBeVisible()
      await expect(sidebar.getByText("ADMISIONES")).toBeVisible()
      await expect(sidebar.getByText("PERSONAL")).toBeVisible()
      await expect(sidebar.getByText("CAMPAMENTOS")).toBeVisible()
      await expect(sidebar.getByText("EXPLORACIONES")).toBeVisible()
      await expect(sidebar.getByText("RECURSOS")).toBeVisible()
      await expect(sidebar.getByText("TRASLADOS")).toBeVisible()
    })

    test("navigates to admissions view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("ADMISIONES").click()
      await expect(page).toHaveURL(/.*\/admin\/admissions/)
    })

    test("navigates to people view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("PERSONAL").click()
      await expect(page).toHaveURL(/.*\/admin\/people/)
    })

    test("navigates to camps view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("CAMPAMENTOS").click()
      await expect(page).toHaveURL(/.*\/admin\/camps/)
    })

    test("navigates to explorations view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("EXPLORACIONES").click()
      await expect(page).toHaveURL(/.*\/admin\/explorations/)
    })

    test("navigates to resources view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("RECURSOS").click()
      await expect(page).toHaveURL(/.*\/admin\/resources/)
    })

    test("navigates to transfers view", async ({ page }) => {
      await page.goto("/admin/dashboard")
      await expect(page.locator("aside")).toBeVisible()
      await page.locator("aside").getByText("TRASLADOS").click()
      await expect(page).toHaveURL(/.*\/admin\/transfers/)
    })
  })

  test.describe("Logout", () => {
    test("logs out and redirects to /login when CERRAR SESIÓN is clicked", async ({ page }) => {
      await page.goto("/admin/dashboard")
      const logoutBtn = page.getByRole("button", { name: /CERRAR SESIÓN/i })
      await expect(logoutBtn).toBeVisible({ timeout: 10000 })
      await logoutBtn.click()
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 })
    })
  })

  test.describe("Default route fallback", () => {
    test("/admin redirects to /admin/dashboard", async ({ page }) => {
      await page.goto("/admin")
      await expect(page.locator("text=UTC")).toBeVisible()
    })

    test("/admin/unknown-route falls through to dashboard", async ({ page }) => {
      await page.goto("/admin/non-existent-route")
      await expect(page.locator("text=UTC")).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe("Transfers view", () => {
    test("shows MANIFIESTOS DE TRANSPORTE heading", async ({ page }) => {
      await page.goto("/admin/transfers")
      await expect(page.getByText(/MANIFIESTOS DE TRANSPORTE/i).first()).toBeVisible()
    })

    test("shows empty state when no transfers exist", async ({ page }) => {
      await page.goto("/admin/transfers")
      await expect(page.getByText(/SIN CONVOYES EN LA COLA/i).first()).toBeVisible()
    })
  })

  test.describe("Admissions view", () => {
    test("shows LIBRO DE ADMISIONES or admissions heading", async ({ page }) => {
      await page.goto("/admin/admissions")
      await expect(page.getByText(/ADMISIONES|SOLICITUDES|SIN SOLICITUDES/i).first()).toBeVisible()
    })
  })

  test.describe("Profile view", () => {
    test("shows EXPEDIENTE DEL ADMINISTRADOR heading", async ({ page }) => {
      await page.goto("/admin/profile")
      await expect(page.getByText(/EXPEDIENTE DEL ADMINISTRADOR/i).first()).toBeVisible()
    })

    test("shows SALA DE TROFEOS section", async ({ page }) => {
      await page.goto("/admin/profile")
      await expect(page.getByText(/SALA DE TROFEOS/i).first()).toBeVisible()
    })
  })
})
