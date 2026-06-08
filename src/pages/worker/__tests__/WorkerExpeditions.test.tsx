import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerExpeditions from "../WorkerExpeditions"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"
import { workerCamp, workerExplorations, workerProfile } from "@/test/workerFixtures"

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

// The minimap pulls in Leaflet; stub it so the coords branch renders cleanly.
vi.mock("@/features/map-test/components/ExplorationZoneMap", () => ({
  ExplorationZoneMap: () => null,
}))

const renderPage = () =>
  renderWithProviders(<WorkerExpeditions />, {
    user: workerUser,
    token: "tk",
    route: "/worker/expeditions",
  })

describe("Worker → Expeditions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.getCampById.mockResolvedValue(workerCamp)
    svc.getMyProfile.mockResolvedValue(workerProfile)
    svc.getCampExplorations.mockResolvedValue([])
  })

  it("renders the expeditions heading and active-missions section", async () => {
    renderPage()
    expect(
      await screen.findByRole("heading", { name: /EXPEDICIONES DEL SECTOR/i }),
    ).toBeInTheDocument()
    expect(screen.getByText("MISIONES ACTIVAS Y PROGRAMADAS")).toBeInTheDocument()
  })

  it("shows the empty state when there are no expeditions", async () => {
    renderPage()
    expect(await screen.findByText("SIN EXPEDICIONES EN CURSO")).toBeInTheDocument()
  })

  it("renders active and scheduled missions with their status badges", async () => {
    svc.getCampExplorations.mockResolvedValue(workerExplorations)
    renderPage()
    expect(await screen.findByText("Avanzada Norte")).toBeInTheDocument()
    expect(screen.getByText("EN CURSO")).toBeInTheDocument()
    expect(screen.getByText("Reconocimiento Sur")).toBeInTheDocument()
    expect(screen.getByText("PROGRAMADA")).toBeInTheDocument()
    // The current person is on the team, so the "mine" marker shows.
    expect(screen.getByText("● TU MISIÓN")).toBeInTheDocument()
    // Coordinates are stripped from the destination label.
    expect(screen.getByText("Sector norte")).toBeInTheDocument()
  })

  it("renders the history section with completed and cancelled rows", async () => {
    svc.getCampExplorations.mockResolvedValue(workerExplorations)
    renderPage()
    expect(await screen.findByText("HISTORIAL DE EXPEDICIONES")).toBeInTheDocument()
    expect(screen.getByText("Mision Completada")).toBeInTheDocument()
    expect(screen.getByText("COMPLETADA")).toBeInTheDocument()
    expect(screen.getByText("Mision Cancelada")).toBeInTheDocument()
    expect(screen.getByText("CANCELADA")).toBeInTheDocument()
    expect(screen.getByText(/Retorno: 2026-02-03/)).toBeInTheDocument()
  })
})
