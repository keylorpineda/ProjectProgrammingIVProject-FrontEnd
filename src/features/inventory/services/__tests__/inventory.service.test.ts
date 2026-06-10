import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createMovement,
  getInventory,
  getInventoryAlerts,
  getMovements,
  getResourceById,
  getResources,
  runDailyProcess,
  runDailyProduction,
  updateInventoryItem,
} from "../inventory.service"

import api from "@/config/api"

vi.mock("@/config/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe("inventory service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("gets inventory from array and paginated response shapes", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ resource_id: "water" }] })
    await expect(getInventory("1")).resolves.toEqual([{ resource_id: "water" }])
    expect(mockedApi.get).toHaveBeenCalledWith("/resources/inventory/1")

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ resource_id: "food" }] } })
    await expect(getInventory("1")).resolves.toEqual([{ resource_id: "food" }])

    mockedApi.get.mockResolvedValueOnce({ data: null })
    await expect(getInventory("1")).resolves.toEqual([])
  })

  it("gets alerts, movements, resources, and single resources", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "alert" }] })
    await expect(getInventoryAlerts("1")).resolves.toEqual([{ id: "alert" }])

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "movement" }] })
    await expect(getMovements("1", 10)).resolves.toEqual([{ id: "movement" }])
    expect(mockedApi.get).toHaveBeenCalledWith("/resources/movements/1", {
      params: { limit: 10 },
    })

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "resource" }] })
    await expect(getResources({ category: "water" })).resolves.toEqual([{ id: "resource" }])
    expect(mockedApi.get).toHaveBeenCalledWith("/resources", {
      params: { category: "water" },
    })

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "wrapped" }] } })
    await expect(getResources()).resolves.toEqual([{ id: "wrapped" }])

    mockedApi.get.mockResolvedValueOnce({ data: { id: "resource-1" } })
    await expect(getResourceById("resource-1")).resolves.toEqual({ id: "resource-1" })
  })

  it("updates inventory and creates movement or production actions", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { resource_id: "water" } })
    await expect(updateInventoryItem("1", "2", { current_quantity: 20 })).resolves.toEqual({
      resource_id: "water",
    })
    expect(mockedApi.patch).toHaveBeenCalledWith("/resources/inventory/1/2", {
      current_quantity: 20,
    })

    mockedApi.post.mockResolvedValueOnce({ data: { id: "movement" } })
    await expect(
      createMovement({ camp_id: 1, resource_id: 2, quantity: 5, type: "in" }),
    ).resolves.toEqual({ id: "movement" })

    mockedApi.post.mockResolvedValueOnce({ data: undefined })
    await runDailyProcess("1")
    expect(mockedApi.post).toHaveBeenCalledWith("/resources/daily-process/1")

    mockedApi.post.mockResolvedValueOnce({ data: undefined })
    await runDailyProduction("person-1", {
      resource_id: "2",
      quantity: 4,
      camp_id: "1",
    })
    expect(mockedApi.post).toHaveBeenCalledWith("/resources/daily-production/person-1", {
      resource_id: "2",
      quantity: 4,
      camp_id: "1",
    })
  })
})
