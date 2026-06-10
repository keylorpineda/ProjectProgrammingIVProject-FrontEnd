import { QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  workerInventory,
  workerProfessions,
  workerBadges,
  workerCamp,
} from "../../../../test/workerFixtures"

import {
  useAssignedResources,
  useResources,
  useInventory,
  useInventoryMovements,
  useProfessionMetrics,
  useInventoryStatus,
  useMyBadges,
  useDailyBalance,
  useCamp,
  useMyProfile,
  useCampExplorations,
  useMyAchievements,
} from "@/features/worker/hooks/useWorkerAPI"
import { useTokenStore } from "@/store/useAuthStore"
import { makeQueryClient } from "@/test/test-utils"

const svc = vi.hoisted(() => ({
  getAssignedResources: vi.fn(),
  getProfessions: vi.fn(),
  getResources: vi.fn(),
  getInventory: vi.fn(),
  getInventoryMovements: vi.fn(),
  getMyBadges: vi.fn(),
  getDailyBalance: vi.fn(),
  getMyProfile: vi.fn(),
  getCampById: vi.fn(),
  getCampExplorations: vi.fn(),
  getMyAchievements: vi.fn(),
}))

vi.mock("@/features/worker/services/workerService", () => ({
  default: svc,
  workerService: svc,
  setAuthToken: vi.fn(),
  handleApiError: vi.fn(),
}))

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: makeQueryClient() }, children)

describe("useWorkerAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTokenStore.getState().setToken("tk")
    svc.getProfessions.mockResolvedValue(workerProfessions)
    svc.getInventory.mockResolvedValue(workerInventory)
    svc.getMyBadges.mockResolvedValue(workerBadges)
    svc.getCampById.mockResolvedValue(workerCamp)
  })

  describe("useProfessionMetrics", () => {
    it("derives OK / DÉFICIT / CRÍTICO status from the active roster", async () => {
      const { result } = renderHook(() => useProfessionMetrics(), { wrapper })

      await waitFor(() => expect(result.current.metrics).toHaveLength(3))

      const byName = Object.fromEntries(result.current.metrics.map((m) => [m.name, m.status]))
      expect(byName).toEqual({ Medico: "DÉFICIT", Vigia: "OK", Panadero: "CRÍTICO" })
    })

    it("counts active persons per profession", async () => {
      const { result } = renderHook(() => useProfessionMetrics(), { wrapper })
      await waitFor(() => expect(result.current.metrics).toHaveLength(3))

      const medico = result.current.metrics.find((m) => m.name === "Medico")
      expect(medico?.activePersons).toBe(1)
      expect(medico?.minimum).toBe(2)
    })

    it("returns an empty metrics list when professions resolve empty", async () => {
      svc.getProfessions.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProfessionMetrics(), { wrapper })

      await waitFor(() => expect(result.current.metrics).toEqual([]))
    })

    it("uses 100 percent when a profession has no minimum requirement", async () => {
      svc.getProfessions.mockResolvedValue([
        { ...workerProfessions[0], minimum_active_required: 0, persons: [] },
      ])

      const { result } = renderHook(() => useProfessionMetrics(), { wrapper })
      await waitFor(() => expect(result.current.metrics).toHaveLength(1))

      expect(result.current.metrics[0].percentage).toBe(100)
      expect(result.current.metrics[0].status).toBe("OK")
    })
  })

  describe("useInventoryStatus", () => {
    it("classifies inventory into ok / low / critical buckets", async () => {
      const { result } = renderHook(() => useInventoryStatus("1"), { wrapper })

      await waitFor(() => expect(result.current.stats.total).toBe(3))
      expect(result.current.stats.okItems).toBe(1)
      expect(result.current.stats.lowItems).toBe(1)
      expect(result.current.stats.criticalItems).toBe(1)
    })

    it("does not hit the service when there is no camp id (disabled query)", async () => {
      const { result } = renderHook(() => useInventoryStatus(null), { wrapper })
      expect(svc.getInventory).not.toHaveBeenCalled()
      // Stats stay a well-formed object even while the query is disabled.
      expect(result.current.stats).toMatchObject({ total: expect.any(Number) })
    })

    it("returns zeroed inventory stats when inventory resolves empty", async () => {
      svc.getInventory.mockResolvedValue(undefined)

      const { result } = renderHook(() => useInventoryStatus("1"), { wrapper })

      await waitFor(() =>
        expect(result.current.stats).toEqual({
          total: 0,
          okItems: 0,
          lowItems: 0,
          criticalItems: 0,
        }),
      )
    })
  })

  describe("fetch hooks", () => {
    it("useAssignedResources returns placeholder resources then service data", async () => {
      svc.getAssignedResources.mockResolvedValue([{ id: 99, name: "Kit" }])

      const { result } = renderHook(() => useAssignedResources(), { wrapper })

      expect(result.current.data?.length).toBeGreaterThan(0)
      await waitFor(() => expect(result.current.data?.[0]).toMatchObject({ name: "Kit" }))
    })

    it("useResources forwards default and custom params", async () => {
      svc.getResources.mockResolvedValue([{ id: "r1" }])

      const { result } = renderHook(() => useResources({ page: 3, limit: 5, category: "food" }), {
        wrapper,
      })

      await waitFor(() => expect(result.current.data).toEqual([{ id: "r1" }]))
      expect(svc.getResources).toHaveBeenCalledWith(3, 5, "food")
    })

    it("useInventory and useInventoryMovements resolve their service data", async () => {
      svc.getInventoryMovements.mockResolvedValue([{ id: "m1" }])

      const { result: inventory } = renderHook(() => useInventory("1"), { wrapper })
      const { result: movements } = renderHook(() => useInventoryMovements("1", 7), { wrapper })

      await waitFor(() => expect(inventory.current.data).toHaveLength(3))
      await waitFor(() => expect(movements.current.data).toEqual([{ id: "m1" }]))
      expect(svc.getInventoryMovements).toHaveBeenCalledWith("1", 7)
    })

    it("useMyBadges returns the badges from the service", async () => {
      const { result } = renderHook(() => useMyBadges(), { wrapper })
      await waitFor(() => expect(result.current.data).toHaveLength(1))
      expect(result.current.data?.[0].asset.name).toBe("Primer Trabajo")
    })

    it("useDailyBalance, useMyProfile, useCampExplorations and useMyAchievements resolve data", async () => {
      svc.getDailyBalance.mockResolvedValue({ persons: 2 })
      svc.getMyProfile.mockResolvedValue({ username: "worker" })
      svc.getCampExplorations.mockResolvedValue([{ id: 1 }])
      svc.getMyAchievements.mockResolvedValue([{ achievement_name: "FIRST", obtained_at: null }])

      const { result: balance } = renderHook(() => useDailyBalance("1"), { wrapper })
      const { result: profile } = renderHook(() => useMyProfile(), { wrapper })
      const { result: explorations } = renderHook(() => useCampExplorations("1"), { wrapper })
      const { result: achievements } = renderHook(() => useMyAchievements(), { wrapper })

      await waitFor(() => expect(balance.current.data).toMatchObject({ persons: 2 }))
      await waitFor(() => expect(profile.current.data).toMatchObject({ username: "worker" }))
      await waitFor(() => expect(explorations.current.data).toEqual([{ id: 1 }]))
      await waitFor(() => expect(achievements.current.data).toHaveLength(1))
    })

    it("useCamp resolves the camp detail", async () => {
      const { result } = renderHook(() => useCamp("1"), { wrapper })
      await waitFor(() => expect(result.current.data?.camp.name).toBe("Campamento Alpha"))
      expect(svc.getCampById).toHaveBeenCalledWith("1")
    })

    it("useCamp stays disabled without a token", async () => {
      useTokenStore.getState().setToken(null)
      const { result } = renderHook(() => useCamp("1"), { wrapper })
      expect(result.current.fetchStatus).toBe("idle")
      expect(svc.getCampById).not.toHaveBeenCalled()
    })

    it("camp-scoped hooks stay disabled without a camp id", () => {
      renderHook(() => useDailyBalance(null), { wrapper })
      renderHook(() => useCampExplorations(null), { wrapper })

      expect(svc.getDailyBalance).not.toHaveBeenCalled()
      expect(svc.getCampExplorations).not.toHaveBeenCalled()
    })

    it("camp-scoped hooks report a required camp id if manually refetched while disabled", async () => {
      const { result: inventory } = renderHook(() => useInventory(null), { wrapper })
      const { result: movements } = renderHook(() => useInventoryMovements(null), { wrapper })
      const { result: balance } = renderHook(() => useDailyBalance(null), { wrapper })
      const { result: camp } = renderHook(() => useCamp(null), { wrapper })
      const { result: explorations } = renderHook(() => useCampExplorations(null), { wrapper })

      const results = await Promise.all([
        inventory.current.refetch(),
        movements.current.refetch(),
        balance.current.refetch(),
        camp.current.refetch(),
        explorations.current.refetch(),
      ])

      for (const result of results) {
        expect(result.error).toMatchObject({ message: "Camp ID is required" })
      }
    })
  })
})
