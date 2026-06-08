import { test, expect, type Page, type Route } from "@playwright/test"

// ---------------------------------------------------------------------------
// Worker flow E2E.
// The worker UI is auth-gated and pulls live data from the remote API. We seed
// a worker session into storage and stub every API call so the run is
// deterministic and offline.
// ---------------------------------------------------------------------------

const API_GLOB = "**/doomsday-system-api.onrender.com/**"

const b64url = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

const makeToken = () => {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: "1", exp, role: "worker" })}.sig`
}

const workerUser = { id: 1, username: "survivor_01", role: "worker", camp_id: 1 }

const camp = {
  camp: {
    id: 1,
    name: "Campamento Alpha",
    location_description: "Bunker",
    latitude: 9.9,
    longitude: -84,
    max_capacity: 500,
    active: true,
    foundation_date: "2026-01-01",
    logo_url: null,
  },
  metrics: { totalResources: 3, resourcesWithAlerts: 1, inventorySummary: [] },
}

const res = (id: string, name: string, unit: string, category: string) => ({
  id,
  name,
  unit,
  category,
  image_url: null,
  image_public_id: null,
  description: null,
})

const inventory = [
  {
    camp_id: "1",
    resource_id: "1",
    current_quantity: 1000,
    minimum_stock_required: 500,
    alert_active: false,
    resource: res("1", "Agua Potable", "L", "water"),
  },
  {
    camp_id: "1",
    resource_id: "2",
    current_quantity: 80,
    minimum_stock_required: 100,
    alert_active: false,
    resource: res("2", "Raciones", "uds", "food"),
  },
  {
    camp_id: "1",
    resource_id: "3",
    current_quantity: 10,
    minimum_stock_required: 50,
    alert_active: true,
    resource: res("3", "Vendas", "uds", "medicine"),
  },
]

const professions = [
  {
    id: "1",
    name: "Medico",
    can_explore: false,
    minimum_active_required: 2,
    persons: [
      {
        id: 1,
        first_name: "Ana",
        last_name: "R",
        status: "activo",
        experience_level: 2,
        can_work: true,
      },
    ],
  },
  {
    id: "2",
    name: "Vigia",
    can_explore: true,
    minimum_active_required: 1,
    persons: [
      {
        id: 2,
        first_name: "Beto",
        last_name: "C",
        status: "activo",
        experience_level: 3,
        can_work: true,
      },
    ],
  },
  { id: "3", name: "Panadero", can_explore: false, minimum_active_required: 2, persons: [] },
]

const balance = {
  production: { food: 120, water: 90 },
  consumption: { food: 80, water: 100 },
  balance: { food: 40, water: -10 },
  persons: 12,
}

const profile = {
  id: 1,
  username: "survivor_01",
  email: "w@s.local",
  camp_id: "1",
  person: {
    id: 1,
    first_name: "Survivor",
    last_name: "Uno",
    status: "activo",
    experience_level: 2,
    can_work: true,
    profession_id: 1,
    profession: { id: 1, name: "Medico", can_explore: false, minimum_active_required: 2 },
  },
}

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })

const stubApi = async (page: Page) => {
  await page.route(API_GLOB, (route) => {
    const url = route.request().url()
    if (url.includes("/auth/"))
      return json(route, { token: makeToken(), accessToken: makeToken(), user: workerUser })
    if (url.includes("/balance")) return json(route, balance)
    if (url.includes("/inventory/")) return json(route, inventory)
    if (url.includes("/movements/")) return json(route, [])
    if (url.includes("/professions")) return json(route, professions)
    if (url.includes("/me/profile")) return json(route, profile)
    if (url.includes("/me/badges")) return json(route, [])
    if (url.includes("/me/assigned-resources")) return json(route, [])
    if (url.includes("/me/achievements")) return json(route, [])
    if (url.includes("/explorations")) return json(route, [])
    if (url.includes("/camps/") || /\/camp\/\d+/.test(url)) return json(route, camp)
    return json(route, [])
  })
}

const seedSession = async (page: Page) => {
  await page.addInitScript((user) => {
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
    const enc = (o: unknown) =>
      btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
    const token = `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ sub: "1", exp, role: "worker" })}.sig`
    localStorage.setItem(
      "auth-user-storage",
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    )
    sessionStorage.setItem("auth-token-session", JSON.stringify({ state: { token }, version: 0 }))
    localStorage.setItem(`gdf_first_login_${(user as { id: number }).id}`, "1")
  }, workerUser)
}

test.describe("Worker portal", () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page)
    await seedSession(page)
  })

  test("dashboard renders the cork board and summary cards", async ({ page }) => {
    await page.goto("/worker/dashboard")
    await expect(page.getByText(/TABLERO - Campamento Alpha/i)).toBeVisible()
    await expect(page.getByText("RECURSOS OK")).toBeVisible()
    await expect(page.getByText("MIS INSIGNIAS")).toBeVisible()
    await expect(page.getByText("BALANCE DIARIO DEL SECTOR")).toBeVisible()
  })

  test("sidebar navigates to the warehouse", async ({ page }) => {
    await page.goto("/worker/dashboard")
    await page.getByRole("button", { name: /ALMACEN/i }).click()
    await expect(page).toHaveURL(/\/worker\/resources/)
    await expect(page.getByRole("heading", { name: /MANIFIESTO DE ALMACÉN/i })).toBeVisible()
    await expect(page.getByText("Agua Potable", { exact: true })).toBeVisible()
    // "Vendas" is critical, so its cell also holds an alert dot — match the
    // containing element rather than requiring an exact string.
    await expect(page.getByText("Vendas")).toBeVisible()
  })

  test("sidebar navigates to occupations and shows the worker's profession banner", async ({
    page,
  }) => {
    await page.goto("/worker/dashboard")
    await page.getByRole("button", { name: /OCUPACIONES/i }).click()
    await expect(page).toHaveURL(/\/worker\/professions/)
    await expect(page.getByRole("heading", { name: /MANDO OCUPACIONAL/i })).toBeVisible()
    await expect(page.getByText("TU PROFESIÓN", { exact: true })).toBeVisible()
    await expect(page.getByText("Vigia")).toBeVisible()
  })

  test("profile shows the survivor dossier", async ({ page }) => {
    await page.goto("/worker/profile")
    await expect(page.getByRole("heading", { name: /EXPEDIENTE DEL SUPERVIVIENTE/i })).toBeVisible()
    await expect(page.getByText("INSIGNIAS DEL SUPERVIVIENTE")).toBeVisible()
  })
})

test.describe("Worker portal — auth gate", () => {
  test("redirects to login without a session", async ({ page }) => {
    await stubApi(page)
    await page.goto("/worker/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})
