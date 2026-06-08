import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerDashboard from "../WorkerDashboard"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"
import {
  workerBadges,
  workerBalance,
  workerCamp,
  workerInventory,
  workerProfessions,
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
  renderWithProviders(<WorkerDashboard />, {
    user: workerUser,
    token: "tk",
    route: "/worker/dashboard",
  })

describe("Worker → Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.getInventory.mockResolvedValue(workerInventory)
    svc.getProfessions.mockResolvedValue(workerProfessions)
    svc.getDailyBalance.mockResolvedValue(workerBalance)
    svc.getMyBadges.mockResolvedValue(workerBadges)
    svc.getCampById.mockResolvedValue(workerCamp)
  })

  it("renders the cork board titled with the camp name", async () => {
    renderPage()
    expect(await screen.findByText(/TABLERO - Campamento Alpha/i)).toBeInTheDocument()
  })

  it("renders the five summary cards", async () => {
    renderPage()
    expect(await screen.findByText("RECURSOS OK")).toBeInTheDocument()
    expect(screen.getByText("BAJO MINIMO")).toBeInTheDocument()
    expect(screen.getByText("RECURSOS CRITICOS")).toBeInTheDocument()
    expect(screen.getByText("PROFESIONES DEFICIT")).toBeInTheDocument()
    expect(screen.getByText("MIS INSIGNIAS")).toBeInTheDocument()
  })

  it("renders the daily balance section once balance data loads", async () => {
    renderPage()
    expect(await screen.findByText("BALANCE DIARIO DEL SECTOR")).toBeInTheDocument()
    expect(screen.getByText(/12 PERSONAS EN OPERACIÓN/i)).toBeInTheDocument()
    expect(screen.getByText(/COMIDA NET/i)).toBeInTheDocument()
    expect(screen.getByText(/AGUA NET/i)).toBeInTheDocument()
  })
})
