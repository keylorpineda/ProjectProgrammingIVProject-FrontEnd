import type { Page } from "@playwright/test"

export async function mockManagerApis(page: Page) {
  // Catch-all to prevent real network requests from leaking and causing 401 logouts
  await page.route(/doomsday-system-api|\/api\/|localhost:3000/, async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    // --------------------------------------------------------
    // DASHBOARD / OVERVIEW
    // --------------------------------------------------------
    if (url.includes("/dashboard/")) {
      return route.fulfill({
        status: 200,
        json: {
          balances: [
            { camp_id: 1, resource: { name: "Agua" }, current_quantity: 10 },
            { camp_id: 1, resource: { name: "Gasolina" }, current_quantity: 136 },
          ],
          statistics: { total_persons: 10 },
        },
      })
    }

    if (url.includes("/transfers/statistics/")) {
      return route.fulfill({
        status: 200,
        json: {
          pending_transfers: 1,
          approved_transfers: 2,
          completed_transfers: 3,
        },
      })
    }

    // --------------------------------------------------------
    // INVENTORY
    // --------------------------------------------------------
    if (url.includes("/resources/inventory/")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: [
            {
              id: 1,
              resource_id: 1,
              resource: { id: 1, name: "Gasolina", category: "combustible", unit: "Galón" },
              current_quantity: 136,
              minimum_stock_required: 50,
              alert_active: false,
            },
            {
              id: 2,
              resource_id: 2,
              resource: { id: 2, name: "Agua", category: "food", unit: "Litros" },
              current_quantity: 10,
              minimum_stock_required: 50,
              alert_active: true,
            },
          ],
        })
      } else if (method === "PATCH") {
        return route.fulfill({ status: 200, json: { success: true } })
      }
    }

    if (url.includes("/resources/movements/")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: {
            data: [
              {
                id: "101",
                resource_id: "1",
                resource: { name: "Gasolina" },
                quantity: 5,
                type: "income",
                date: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          },
        })
      } else if (method === "POST") {
        return route.fulfill({ status: 201, json: { success: true } })
      }
    }

    if (url.includes("/resources/daily-process/")) {
      return route.fulfill({
        status: 200,
        json: {
          message: "Ciclo Diario ejecutado con éxito",
          metrics: { foodProduced: 10, foodConsumed: 5, waterProduced: 10, waterConsumed: 5 },
        },
      })
    }

    // --------------------------------------------------------
    // CATALOG
    // --------------------------------------------------------
    if (
      url.includes("/resources") &&
      !url.includes("/inventory") &&
      !url.includes("/movements") &&
      !url.includes("/production-ranking")
    ) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: {
            data: [
              {
                id: "1",
                name: "Gasolina",
                category: "combustible",
                unit: "Galón",
              },
            ],
            total: 1,
            page: 1,
            limit: 100,
          },
        })
      } else if (method === "POST") {
        return route.fulfill({ status: 201, json: { success: true } })
      }
    }

    // --------------------------------------------------------
    // RANKING
    // --------------------------------------------------------
    if (url.includes("/resources/production-ranking/")) {
      return route.fulfill({
        status: 200,
        json: [
          {
            rank: 1,
            person_id: 1,
            name: "Juan Perez",
            profession: "farmer",
            food_production: 50,
            water_production: 10,
            total_production: 60,
            experience_level: 5,
          },
          {
            rank: 2,
            person_id: 2,
            name: "Maria Gomez",
            profession: "doctor",
            food_production: 0,
            water_production: 0,
            total_production: 0,
            experience_level: 8,
          },
        ],
      })
    }

    // --------------------------------------------------------
    // EXPLORATIONS
    // --------------------------------------------------------
    if (url.includes("/explorations")) {
      if (url.includes("/return") && method === "PATCH") {
        return route.fulfill({ status: 200, json: { success: true } })
      }
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: [
            {
              id: 1,
              camp_id: 1,
              name: "Expedición Alpha",
              destination_description: "Ciudad Abandonada",
              status: "in_progress",
              departure_date: "2026-06-08T10:00:00Z",
              estimated_days: 3,
              grace_days: 1,
              explorationPersons: [],
              explorationResources: [],
            },
            {
              id: 2,
              camp_id: 1,
              name: "Búsqueda de Suministros",
              destination_description: "Bosque Oscuro",
              status: "in_progress",
              departure_date: "2026-06-08T08:00:00Z",
              estimated_days: 2,
              grace_days: 0,
              explorationPersons: [
                {
                  person: { first_name: "Ana", last_name: "Gomez" },
                  is_leader: true,
                },
              ],
              explorationResources: [],
            },
          ],
        })
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        return route.fulfill({ status: 200, json: { success: true } })
      }
    }

    // --------------------------------------------------------
    // WORKFORCE
    // --------------------------------------------------------
    if (url.includes("/users/persons")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: {
            data: [
              {
                id: 1,
                first_name: "Juan",
                last_name: "Perez",
                profession: { name: "Mechanic", can_explore: true },
                status: "active",
                role: "worker",
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          },
        })
      }
    }

    if (url.includes("/users/professions")) {
      return route.fulfill({ status: 200, json: [] })
    }

    if (url.includes("/role") && method === "PATCH") {
      return route.fulfill({ status: 200, json: { success: true } })
    }

    // --------------------------------------------------------
    // LOGISTICS
    // --------------------------------------------------------
    if (url.includes("/camps")) {
      return route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Bunker Norte" },
          { id: 2, name: "Bunker Sur" },
        ],
      })
    }

    // --------------------------------------------------------
    // EXPLORATIONS
    // --------------------------------------------------------
    if (url.includes("/explorations")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: [
            {
              id: 1,
              camp_id: 1,
              name: "Expedición Alpha",
              destination_description: "Ciudad Abandonada",
              status: "in_progress",
              departure_date: "2026-06-08T10:00:00Z",
              estimated_days: 3,
              grace_days: 1,
              explorationPersons: [],
              explorationResources: [],
            },
            {
              id: 2,
              camp_id: 1,
              name: "Búsqueda de Suministros",
              destination_description: "Bosque Oscuro",
              status: "in_progress",
              departure_date: "2026-06-08T08:00:00Z",
              estimated_days: 2,
              grace_days: 0,
              explorationPersons: [
                {
                  person: { first_name: "Ana", last_name: "Gomez" },
                  is_leader: true,
                },
              ],
              explorationResources: [],
            },
          ],
        })
      } else if (method === "POST") {
        return route.fulfill({ status: 201, json: { success: true } })
      } else if (method === "PUT" || method === "PATCH") {
        return route.fulfill({ status: 200, json: { success: true } })
      }
    }

    if (url.includes("/transfers/requests")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          json: [
            {
              id: 1,
              camp_origin_id: 1,
              camp_destination_id: 2,
              resource_id: 1,
              quantity: 50,
              status: "pending",
              notes: "Necesitamos agua urgente",
              requested_by_user_id: 1,
              resourceDetails: [
                {
                  resource_id: 1,
                  requested_quantity: 50,
                  resource: { name: "Gasolina", category: "combustible", unit: "Galón" },
                },
              ],
            },
            {
              id: 2,
              camp_origin_id: 2,
              camp_destination_id: 1,
              resource_id: 2,
              quantity: 50,
              status: "in_transit",
              notes: "Enviando suministros",
              requested_by_user_id: 1,
              resourceDetails: [
                {
                  resource_id: 2,
                  requested_quantity: 50,
                  resource: { name: "Agua", category: "food", unit: "Litros" },
                },
              ],
            },
          ],
        })
      } else if (method === "POST" || method === "PATCH" || method === "PUT") {
        return route.fulfill({ status: 201, json: { success: true } })
      }
    }

    // Fallback for any other API call to prevent real network
    console.log(`[Mock] Unhandled API request: ${method} ${url}`)
    return route.fulfill({ status: 200, json: {} })
  })
}
