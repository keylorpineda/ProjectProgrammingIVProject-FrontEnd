import { beforeEach, describe, expect, it, vi } from "vitest"

import { workerService, setAuthToken, handleApiError } from "../workerService"

import type { InventoryItem } from "@/types/worker.api.types"

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock("@/config/api", () => ({ default: apiMock }))

const ok = (data: unknown) => apiMock.get.mockResolvedValueOnce({ data })

const item = (over: Partial<InventoryItem>): InventoryItem =>
  ({
    camp_id: "1",
    resource_id: "1",
    current_quantity: 100,
    minimum_stock_required: 50,
    alert_active: false,
    last_update: "",
    resource: undefined,
    created_at: "",
    updated_at: "",
    ...over,
  }) as unknown as InventoryItem

describe("workerService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  describe("setAuthToken", () => {
    it("is a no-op kept for call-site compatibility", () => {
      expect(() => setAuthToken("tk")).not.toThrow()
      expect(() => setAuthToken(null)).not.toThrow()
    })
  })

  describe("handleApiError", () => {
    it("maps an axios error to status / message / error", () => {
      const axiosErr = Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 503, data: { message: "down", error: "ServiceUnavailable" } },
      })
      expect(handleApiError(axiosErr)).toEqual({
        statusCode: 503,
        message: "down",
        error: "ServiceUnavailable",
      })
    })

    it("falls back to 500 / message for an axios error with no response", () => {
      const axiosErr = Object.assign(new Error("network"), { isAxiosError: true })
      expect(handleApiError(axiosErr)).toEqual({
        statusCode: 500,
        message: "network",
        error: "Unknown Error",
      })
    })

    it("maps a generic Error to a 500 internal error", () => {
      expect(handleApiError(new Error("kaboom"))).toEqual({
        statusCode: 500,
        message: "kaboom",
        error: "Internal Server Error",
      })
    })

    it("handles a non-Error throwable", () => {
      expect(handleApiError("weird")).toEqual({
        statusCode: 500,
        message: "Unknown error occurred",
        error: "Internal Server Error",
      })
    })
  })

  describe("stock helpers", () => {
    it("isResourceCritical is true on alert or below minimum", () => {
      expect(workerService.isResourceCritical(item({ alert_active: true }))).toBe(true)
      expect(
        workerService.isResourceCritical(
          item({ current_quantity: 10, minimum_stock_required: 50 }),
        ),
      ).toBe(true)
      expect(
        workerService.isResourceCritical(
          item({ current_quantity: 80, minimum_stock_required: 50 }),
        ),
      ).toBe(false)
    })

    it("getResourceStatus covers every branch", () => {
      expect(workerService.getResourceStatus(item({ current_quantity: 0 }))).toBe("CRITICAL")
      expect(workerService.getResourceStatus(item({ alert_active: true }))).toBe("CRITICAL")
      expect(
        workerService.getResourceStatus(item({ current_quantity: 60, minimum_stock_required: 50 })),
      ).toBe("LOW")
      expect(
        workerService.getResourceStatus(
          item({ current_quantity: 200, minimum_stock_required: 50 }),
        ),
      ).toBe("OK")
    })

    it("getStockPercentage handles a zero minimum and a normal ratio", () => {
      expect(workerService.getStockPercentage(item({ minimum_stock_required: 0 }))).toBe(100)
      expect(
        workerService.getStockPercentage(
          item({ current_quantity: 50, minimum_stock_required: 50 }),
        ),
      ).toBe(50)
    })
  })

  describe("GET endpoints — happy path", () => {
    it("getAssignedResources returns a bare array", async () => {
      ok([{ id: 1 }])
      await expect(workerService.getAssignedResources()).resolves.toEqual([{ id: 1 }])
      expect(apiMock.get).toHaveBeenCalledWith("/users/me/assigned-resources")
    })

    it("getAssignedResources unwraps a { resources } envelope", async () => {
      ok({ resources: [{ id: 2 }] })
      await expect(workerService.getAssignedResources()).resolves.toEqual([{ id: 2 }])
    })

    it("getAssignedResources returns [] for an empty envelope", async () => {
      ok({})
      await expect(workerService.getAssignedResources()).resolves.toEqual([])
    })

    it("getProfessions unwraps a { professions } envelope", async () => {
      ok({ professions: [{ id: "1" }] })
      await expect(workerService.getProfessions()).resolves.toEqual([{ id: "1" }])
      expect(apiMock.get).toHaveBeenCalledWith("/users/professions")
    })

    it("getProfessions returns a bare array or [] for an empty envelope", async () => {
      ok([{ id: "2" }])
      await expect(workerService.getProfessions()).resolves.toEqual([{ id: "2" }])
      ok({})
      await expect(workerService.getProfessions()).resolves.toEqual([])
    })

    it("getResources forwards pagination + category params", async () => {
      ok([{ id: "r1" }])
      await expect(workerService.getResources(2, 10, "food")).resolves.toEqual([{ id: "r1" }])
      expect(apiMock.get).toHaveBeenCalledWith("/resources", {
        params: { page: 2, limit: 10, category: "food" },
      })
    })

    it("getResources unwraps a { data } envelope", async () => {
      ok({ data: [{ id: "r2" }] })
      await expect(workerService.getResources()).resolves.toEqual([{ id: "r2" }])
    })

    it("getResources returns [] for an empty envelope", async () => {
      ok({})
      await expect(workerService.getResources()).resolves.toEqual([])
    })

    it("getInventory unwraps { inventory_items }", async () => {
      ok({ camp_id: 1, inventory_items: [{ resource_id: "9" }] })
      await expect(workerService.getInventory(1)).resolves.toEqual([{ resource_id: "9" }])
      expect(apiMock.get).toHaveBeenCalledWith("/resources/inventory/1")
    })

    it("getInventory returns a bare array or [] for an empty envelope", async () => {
      ok([{ resource_id: "10" }])
      await expect(workerService.getInventory(1)).resolves.toEqual([{ resource_id: "10" }])
      ok({})
      await expect(workerService.getInventory(1)).resolves.toEqual([])
    })

    it("getInventoryMovements forwards the limit and unwraps { movements }", async () => {
      ok({ movements: [{ id: "m1" }] })
      await expect(workerService.getInventoryMovements(1, 25)).resolves.toEqual([{ id: "m1" }])
      expect(apiMock.get).toHaveBeenCalledWith("/resources/movements/1", { params: { limit: 25 } })
    })

    it("getInventoryMovements returns a bare array or [] for an empty envelope", async () => {
      ok([{ id: "m2" }])
      await expect(workerService.getInventoryMovements(1)).resolves.toEqual([{ id: "m2" }])
      ok({})
      await expect(workerService.getInventoryMovements(1)).resolves.toEqual([])
    })

    it("getMyBadges unwraps { badges }", async () => {
      ok({ badges: [{ id: 1 }] })
      await expect(workerService.getMyBadges()).resolves.toEqual([{ id: 1 }])
      expect(apiMock.get).toHaveBeenCalledWith("/users/me/badges")
    })

    it("getMyBadges returns a bare array or [] for an empty envelope", async () => {
      ok([{ id: 2 }])
      await expect(workerService.getMyBadges()).resolves.toEqual([{ id: 2 }])
      ok({})
      await expect(workerService.getMyBadges()).resolves.toEqual([])
    })

    it("getDailyBalance returns the raw object", async () => {
      const balance = {
        production: { food: 1, water: 1 },
        consumption: { food: 0, water: 0 },
        balance: { food: 1, water: 1 },
        persons: 3,
      }
      ok(balance)
      await expect(workerService.getDailyBalance(7)).resolves.toEqual(balance)
      expect(apiMock.get).toHaveBeenCalledWith("/users/camp/7/balance")
    })

    it("getMyProfile returns the raw object", async () => {
      ok({ id: 1, username: "w" })
      await expect(workerService.getMyProfile()).resolves.toMatchObject({ username: "w" })
      expect(apiMock.get).toHaveBeenCalledWith("/users/me/profile")
    })

    it("getCampById returns the raw object", async () => {
      ok({ camp: { id: 1 } })
      await expect(workerService.getCampById(1)).resolves.toMatchObject({ camp: { id: 1 } })
      expect(apiMock.get).toHaveBeenCalledWith("/camps/1")
    })

    it("getCampExplorations coerces campId and unwraps { data }", async () => {
      ok({ data: [{ id: "e1" }] })
      await expect(workerService.getCampExplorations("4")).resolves.toEqual([{ id: "e1" }])
      expect(apiMock.get).toHaveBeenCalledWith("/explorations", { params: { campId: 4 } })
    })

    it("getCampExplorations returns a bare array or [] for an empty envelope", async () => {
      ok([{ id: "e2" }])
      await expect(workerService.getCampExplorations(4)).resolves.toEqual([{ id: "e2" }])
      ok({})
      await expect(workerService.getCampExplorations(4)).resolves.toEqual([])
    })

    it("getMyAchievements returns the array or [] for a non-array body", async () => {
      ok([{ achievement_name: "PRIMER_TRABAJO", obtained_at: null }])
      await expect(workerService.getMyAchievements()).resolves.toHaveLength(1)
      ok({ not: "an array" })
      await expect(workerService.getMyAchievements()).resolves.toEqual([])
    })
  })

  describe("GET endpoints — error path", () => {
    it("rethrows a normalized ApiError when the request fails", async () => {
      apiMock.get.mockRejectedValueOnce(new Error("offline"))
      await expect(workerService.getProfessions()).rejects.toEqual({
        statusCode: 500,
        message: "offline",
        error: "Internal Server Error",
      })
    })

    it("normalizes an axios failure on the inventory endpoint", async () => {
      apiMock.get.mockRejectedValueOnce(
        Object.assign(new Error("teapot"), {
          isAxiosError: true,
          response: { status: 418, data: { message: "nope", error: "Teapot" } },
        }),
      )
      await expect(workerService.getInventory(1)).rejects.toMatchObject({
        statusCode: 418,
        error: "Teapot",
      })
    })

    it.each<[string, () => Promise<unknown>]>([
      ["getAssignedResources", () => workerService.getAssignedResources()],
      ["getProfessions", () => workerService.getProfessions()],
      ["getResources", () => workerService.getResources()],
      ["getInventory", () => workerService.getInventory(1)],
      ["getInventoryMovements", () => workerService.getInventoryMovements(1)],
      ["getMyBadges", () => workerService.getMyBadges()],
      ["getDailyBalance", () => workerService.getDailyBalance(1)],
      ["getMyProfile", () => workerService.getMyProfile()],
      ["getCampById", () => workerService.getCampById(1)],
      ["getCampExplorations", () => workerService.getCampExplorations(1)],
      ["getMyAchievements", () => workerService.getMyAchievements()],
    ])("%s rejects with a normalized ApiError when the request fails", async (_name, call) => {
      apiMock.get.mockRejectedValueOnce(new Error("boom"))
      await expect(call()).rejects.toMatchObject({ statusCode: 500 })
    })
  })
})
