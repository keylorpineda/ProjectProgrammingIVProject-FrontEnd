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
  useProfessionMetrics,
  useInventoryStatus,
  useMyBadges,
  useCamp,
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
  })

  describe("fetch hooks", () => {
    it("useMyBadges returns the badges from the service", async () => {
      const { result } = renderHook(() => useMyBadges(), { wrapper })
      await waitFor(() => expect(result.current.data).toHaveLength(1))
      expect(result.current.data?.[0].asset.name).toBe("Primer Trabajo")
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
  })
})
