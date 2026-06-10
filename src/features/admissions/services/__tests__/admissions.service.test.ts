import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  archiveAdmission,
  completeRegistration,
  createAdmissionAccount,
  getAdmissionById,
  getAutoDecidedAdmissions,
  getPendingAdmissions,
  reviewAdmission,
  submitAdmission,
  trackAdmission,
} from "../admissions.service"

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

describe("admissions service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("submits and tracks admissions", async () => {
    const body = {
      first_name: "Ana",
      last_name: "Stone",
      age: 24,
      health_status: 8,
      physical_condition: 7,
      skills: ["radio"],
      criminal_record: false,
      camp_id: 1,
      contact_email: "ana@test.local",
    }
    mockedApi.post.mockResolvedValueOnce({ data: { id: "admission-1" } })
    await expect(submitAdmission(body)).resolves.toEqual({ id: "admission-1" })
    expect(mockedApi.post).toHaveBeenCalledWith("/ai/admissions/submit", body)

    mockedApi.get.mockResolvedValueOnce({ data: { tracking_code: "CODE" } })
    await expect(trackAdmission("CODE")).resolves.toEqual({ tracking_code: "CODE" })
    expect(mockedApi.get).toHaveBeenCalledWith("/ai/admissions/track/CODE")
  })

  it("gets pending admissions and auto decided admissions", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [], total: 0 } })
    await expect(getPendingAdmissions({ campId: "1", page: 2 })).resolves.toEqual({
      data: [],
      total: 0,
    })
    expect(mockedApi.get).toHaveBeenCalledWith("/ai/admissions/pending", {
      params: { campId: "1", page: 2 },
    })

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "auto-1" }] })
    await expect(getAutoDecidedAdmissions()).resolves.toEqual([{ id: "auto-1" }])

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "wrapped" }] } })
    await expect(getAutoDecidedAdmissions()).resolves.toEqual([])
  })

  it("archives, fetches, reviews, creates accounts, and completes registration", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: undefined })
    await archiveAdmission("admission-1")
    expect(mockedApi.patch).toHaveBeenCalledWith("/ai/admissions/admission-1/archive")

    mockedApi.get.mockResolvedValueOnce({ data: { id: "admission-1" } })
    await expect(getAdmissionById("admission-1")).resolves.toEqual({ id: "admission-1" })

    mockedApi.post.mockResolvedValueOnce({ data: { admission: { id: "admission-1" } } })
    await expect(
      reviewAdmission("admission-1", { decision: "accepted", notes: "ok" }),
    ).resolves.toEqual({ admission: { id: "admission-1" } })

    mockedApi.post.mockResolvedValueOnce({ data: { id: "account-1" } })
    await expect(
      createAdmissionAccount("admission-1", {
        username: "ana",
        email: "ana@test.local",
        password: "secret",
        role_id: 2,
      }),
    ).resolves.toEqual({ id: "account-1" })

    mockedApi.post.mockResolvedValueOnce({ data: { ok: true } })
    await expect(
      completeRegistration({
        token: "token",
        username: "ana",
        password: "secret",
        email: "",
      }),
    ).resolves.toEqual({ ok: true })
  })
})
