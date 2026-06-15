import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createPerson,
  createTemporaryAssignment,
  deletePerson,
  endTemporaryAssignment,
  getCampBalance,
  getCampConsumption,
  getCampProduction,
  getMyAssignedResources,
  getMyBadges,
  getPersonById,
  getPersonStatsByProfession,
  getPersonStatsByStatus,
  getPersons,
  getProfessions,
  getProfessionsNeedingWorkers,
  getProfessionsWithExcess,
  getTemporaryAssignments,
  toggleBadgeDisplay,
  updatePerson,
  updatePersonStatus,
} from "../persons.service"

import api from "@/config/api"

vi.mock("@/config/api", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const mockedApi = api as unknown as {
  delete: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
}

describe("persons service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("handles person CRUD and status updates", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "person-1" }] } })
    await expect(getPersons({ campId: "1" })).resolves.toEqual({ data: [{ id: "person-1" }] })
    expect(mockedApi.get).toHaveBeenCalledWith("/users/persons", { params: { campId: "1" } })

    mockedApi.get.mockResolvedValueOnce({ data: { id: "person-1" } })
    await expect(getPersonById("person-1")).resolves.toEqual({ id: "person-1" })

    const createBody = { first_name: "Ana", last_name: "Stone" }
    mockedApi.post.mockResolvedValueOnce({ data: { id: "person-2" } })
    await expect(createPerson(createBody)).resolves.toEqual({ id: "person-2" })
    expect(mockedApi.post).toHaveBeenCalledWith("/users/persons", createBody)

    mockedApi.put.mockResolvedValueOnce({ data: { first_name: "Ann" } })
    await expect(updatePerson("person-2", { first_name: "Ann" })).resolves.toEqual({
      first_name: "Ann",
    })

    mockedApi.put.mockResolvedValueOnce({ data: { status: "injured" } })
    await expect(updatePersonStatus("person-2", { status: "injured" as any })).resolves.toEqual({
      status: "injured",
    })

    mockedApi.delete.mockResolvedValueOnce({ data: undefined })
    await deletePerson("person-2")
    expect(mockedApi.delete).toHaveBeenCalledWith("/users/persons/person-2")
  })

  it("gets person statistics and professions", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { active: 2 } })
    await expect(getPersonStatsByStatus("1")).resolves.toEqual({ active: 2 })

    mockedApi.get.mockResolvedValueOnce({ data: { Medic: 1 } })
    await expect(getPersonStatsByProfession("1")).resolves.toEqual({ Medic: 1 })

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "profession-1" }] })
    await expect(getProfessions()).resolves.toEqual([{ id: "profession-1" }])

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "need-1" }] })
    await expect(getProfessionsNeedingWorkers()).resolves.toEqual([{ id: "need-1" }])

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "excess-1" }] })
    await expect(getProfessionsWithExcess()).resolves.toEqual([{ id: "excess-1" }])
  })

  it("handles temporary assignments and camp resource summaries", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: "assignment-1" } })
    await expect(
      createTemporaryAssignment({
        person_id: "person-1",
        profession_temporary_id: "profession-1",
      }),
    ).resolves.toEqual({ id: "assignment-1" })

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "assignment-1" }] })
    await expect(getTemporaryAssignments("1")).resolves.toEqual([{ id: "assignment-1" }])
    expect(mockedApi.get).toHaveBeenCalledWith("/users/temporary-assignments", {
      params: { campId: "1" },
    })

    mockedApi.put.mockResolvedValueOnce({ data: undefined })
    await endTemporaryAssignment("assignment-1")
    expect(mockedApi.put).toHaveBeenCalledWith("/users/temporary-assignments/assignment-1/end")

    mockedApi.get.mockResolvedValueOnce({ data: { water: 10 } })
    await expect(getCampProduction("1")).resolves.toEqual({ water: 10 })

    mockedApi.get.mockResolvedValueOnce({ data: { food: 3 } })
    await expect(getCampConsumption("1")).resolves.toEqual({ food: 3 })

    mockedApi.get.mockResolvedValueOnce({ data: { balance: 7 } })
    await expect(getCampBalance("1")).resolves.toEqual({ balance: 7 })
  })

  it("gets personal resources, badges, and toggles badge display", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "resource-1" }] })
    await expect(getMyAssignedResources()).resolves.toEqual([{ id: "resource-1" }])

    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "badge-1" }] })
    await expect(getMyBadges()).resolves.toEqual([{ id: "badge-1" }])

    mockedApi.post.mockResolvedValueOnce({ data: undefined })
    await toggleBadgeDisplay("badge-1", { is_displayed: true })
    expect(mockedApi.post).toHaveBeenCalledWith("/users/me/badges/badge-1/display", {
      is_displayed: true,
    })
  })
})
