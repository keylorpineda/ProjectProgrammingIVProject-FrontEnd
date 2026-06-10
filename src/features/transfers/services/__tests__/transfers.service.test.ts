import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  approveOrRejectTransfer,
  cancelTransfer,
  confirmTransferArrival,
  createTransferRequest,
  getCampTransfers,
  getPendingCampTransfers,
  getTransferById,
  getTransferStatistics,
} from "../transfers.service"

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

describe("transfers service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates and lists transfer requests", async () => {
    const body = {
      camp_origin_id: 1,
      camp_destination_id: 2,
      type: "resources" as const,
      resource_details: [{ resource_id: 5, requested_quantity: 3 }],
    }
    mockedApi.post.mockResolvedValueOnce({ data: { id: "transfer-1" } })
    await expect(createTransferRequest(body)).resolves.toEqual({ id: "transfer-1" })
    expect(mockedApi.post).toHaveBeenCalledWith("/transfers/requests", body)

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "direct" }] })
    await expect(getCampTransfers("1", "origin")).resolves.toEqual([{ id: "direct" }])
    expect(mockedApi.get).toHaveBeenCalledWith("/transfers/requests/camp/1", {
      params: { role: "origin" },
    })

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "wrapped" }] } })
    await expect(getCampTransfers("1")).resolves.toEqual([{ id: "wrapped" }])

    mockedApi.get.mockResolvedValueOnce({ data: null })
    await expect(getCampTransfers("1")).resolves.toEqual([])
  })

  it("gets pending, single transfer, and statistics", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "pending" }] })
    await expect(getPendingCampTransfers("1")).resolves.toEqual([{ id: "pending" }])

    mockedApi.get.mockResolvedValueOnce({ data: { id: "transfer-1" } })
    await expect(getTransferById("transfer-1")).resolves.toEqual({ id: "transfer-1" })

    mockedApi.get.mockResolvedValueOnce({ data: { pending: 1 } })
    await expect(getTransferStatistics("1")).resolves.toEqual({ pending: 1 })
  })

  it("updates transfer lifecycle actions", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { status: "approved" } })
    await expect(approveOrRejectTransfer("transfer-1", { status: "approved" })).resolves.toEqual({
      status: "approved",
    })

    mockedApi.patch.mockResolvedValueOnce({ data: { status: "cancelled" } })
    await expect(cancelTransfer("transfer-1")).resolves.toEqual({ status: "cancelled" })

    mockedApi.patch.mockResolvedValueOnce({ data: { status: "completed" } })
    await expect(confirmTransferArrival("transfer-1")).resolves.toEqual({ status: "completed" })
  })
})
