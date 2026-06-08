import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerProfessions from "../WorkerProfessions"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"
import { workerCamp, workerProfessions, workerProfile } from "@/test/workerFixtures"

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
  renderWithProviders(<WorkerProfessions />, {
    user: workerUser,
    token: "tk",
    route: "/worker/professions",
  })

describe("Worker → Professions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.getProfessions.mockResolvedValue(workerProfessions)
    svc.getMyProfile.mockResolvedValue(workerProfile)
    svc.getCampById.mockResolvedValue(workerCamp)
  })

  it("renders the occupational command heading", async () => {
    renderPage()
    expect(await screen.findByRole("heading", { name: /MANDO OCUPACIONAL/i })).toBeInTheDocument()
  })

  it("renders the worker's own profession banner", async () => {
    renderPage()
    expect(await screen.findByText("TU PROFESIÓN")).toBeInTheDocument()
    expect(screen.getByText("MEDICO")).toBeInTheDocument()
    // "● OPERATIVO" is the banner status; the bare "OPERATIVO" role tags differ.
    expect(screen.getByText("● OPERATIVO")).toBeInTheDocument()
  })

  it("renders a card per profession from the API", async () => {
    renderPage()
    // Anchor on a real-only name so we wait past the fallback placeholder.
    expect(await screen.findByText("Vigia")).toBeInTheDocument()
    expect(screen.getByText("Medico")).toBeInTheDocument()
    expect(screen.getByText("Panadero")).toBeInTheDocument()
  })

  it("derives status badges and raises the critical alert", async () => {
    renderPage()
    // Wait for the real roster (replaces the fallback placeholder) before counting badges.
    expect(await screen.findByText("Panadero")).toBeInTheDocument()
    expect(screen.getByText(/ALERTA CRÍTICA/i)).toBeInTheDocument()
    expect(screen.getByText("DÉFICIT")).toBeInTheDocument()
    expect(screen.getByText("CRÍTICO")).toBeInTheDocument()
    expect(screen.getByText("OK")).toBeInTheDocument()
  })
})
