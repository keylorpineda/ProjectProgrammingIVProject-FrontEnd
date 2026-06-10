import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  cancelExploration,
  createExploration,
  departExploration,
  getExplorationById,
  getExplorations,
  returnExploration,
} from "../explorations.service"

import api from "@/config/api"

vi.mock("@/config/api", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApi = api as unknown as {
  delete: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe("explorations service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates an exploration", async () => {
    const body = {
      camp_id: 1,
      name: "Ruta norte",
      destination_description: "Montanas",
      departure_date: "2026-06-10",
      estimated_days: 3,
      persons: [{ person_id: 5, is_leader: true }],
      resources: [{ resource_id: 2, flow: "out", quantity: 4 }],
    }
    mockedApi.post.mockResolvedValueOnce({ data: { id: "exp-1" } })

    await expect(createExploration(body)).resolves.toEqual({ id: "exp-1" })

    expect(mockedApi.post).toHaveBeenCalledWith("/explorations", body)
  })

  it("gets explorations from array and wrapped responses", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "exp-1" }] })

    await expect(getExplorations({ campId: "1", status: "planned" })).resolves.toEqual([
      { id: "exp-1" },
    ])
    expect(mockedApi.get).toHaveBeenCalledWith("/explorations", {
      params: { campId: "1", status: "planned" },
    })

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "exp-2" }] } })
    await expect(getExplorations()).resolves.toEqual([{ id: "exp-2" }])

    mockedApi.get.mockResolvedValueOnce({ data: null })
    await expect(getExplorations()).resolves.toEqual([])
  })

  it("fetches, departs, returns, and cancels explorations", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { id: "exp-1" } })
    await expect(getExplorationById("exp-1")).resolves.toEqual({ id: "exp-1" })
    expect(mockedApi.get).toHaveBeenCalledWith("/explorations/exp-1")

    mockedApi.patch.mockResolvedValueOnce({ data: { status: "in_progress" } })
    await expect(departExploration("exp-1")).resolves.toEqual({ status: "in_progress" })
    expect(mockedApi.patch).toHaveBeenCalledWith("/explorations/exp-1/depart")

    const returnBody = {
      real_return_date: "2026-06-12",
      notes: "ok",
      found_resources: [{ resource_id: 3, flow: "in", quantity: 2 }],
    }
    mockedApi.patch.mockResolvedValueOnce({ data: { status: "returned" } })
    await expect(returnExploration("exp-1", returnBody)).resolves.toEqual({ status: "returned" })
    expect(mockedApi.patch).toHaveBeenCalledWith("/explorations/exp-1/return", returnBody)

    mockedApi.delete.mockResolvedValueOnce({ data: undefined })
    await expect(cancelExploration("exp-1")).resolves.toBeUndefined()
    expect(mockedApi.delete).toHaveBeenCalledWith("/explorations/exp-1")
  })
})
