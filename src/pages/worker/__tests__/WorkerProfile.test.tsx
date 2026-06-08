import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerProfile from "../WorkerProfile"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"
import {
  workerAssignedResources,
  workerBadges,
  workerCamp,
  workerProfile,
} from "@/test/workerFixtures"

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

const renderPage = () =>
  renderWithProviders(<WorkerProfile />, {
    user: workerUser,
    token: "tk",
    route: "/worker/profile",
  })

describe("Worker → Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    svc.getMyProfile.mockResolvedValue(workerProfile)
    svc.getMyBadges.mockResolvedValue(workerBadges)
    svc.getCampById.mockResolvedValue(workerCamp)
    svc.getAssignedResources.mockResolvedValue(workerAssignedResources)
    svc.getMyAchievements.mockResolvedValue([])
  })

  it("renders the survivor dossier heading", async () => {
    renderPage()
    expect(
      await screen.findByRole("heading", { name: /EXPEDIENTE DEL SUPERVIVIENTE/i }),
    ).toBeInTheDocument()
  })

  it("renders the badges and assigned-equipment sections", async () => {
    renderPage()
    expect(await screen.findByText("INSIGNIAS DEL SUPERVIVIENTE")).toBeInTheDocument()
    expect(screen.getByText("EQUIPO ASIGNADO PERSONALMENTE")).toBeInTheDocument()
  })

  it("lists the personally assigned equipment from the API", async () => {
    renderPage()
    expect(await screen.findByText("Ración semanal")).toBeInTheDocument()
  })
})
