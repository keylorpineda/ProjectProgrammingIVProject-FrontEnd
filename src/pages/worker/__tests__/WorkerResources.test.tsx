import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerResources from "../WorkerResources"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"
import { workerCamp, workerInventory, workerMovements } from "@/test/workerFixtures"

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
  renderWithProviders(<WorkerResources />, {
    user: workerUser,
    token: "tk",
    route: "/worker/resources",
  })

describe("Worker → Resources", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.getInventory.mockResolvedValue(workerInventory)
    svc.getInventoryMovements.mockResolvedValue(workerMovements)
    svc.getCampById.mockResolvedValue(workerCamp)
  })

  it("renders the warehouse heading and camp breadcrumb", async () => {
    renderPage()
    expect(
      await screen.findByRole("heading", { name: /MANIFIESTO DE ALMACÉN/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText("Campamento Alpha")).toBeInTheDocument()
  })

  it("lists each inventory resource from the API", async () => {
    renderPage()
    expect(await screen.findByText("Agua Potable")).toBeInTheDocument()
    expect(screen.getByText("Raciones")).toBeInTheDocument()
    expect(screen.getByText("Vendas")).toBeInTheDocument()
  })

  it("shows the critical alert banner when an item is in alert", async () => {
    renderPage()
    expect(await screen.findByText(/ALERTA — 1 RECURSO/i)).toBeInTheDocument()
  })

  it("renders the stat cards (NORMALES / ESCASOS / CRÍTICOS / TOTAL)", async () => {
    renderPage()
    expect(await screen.findByText("NORMALES")).toBeInTheDocument()
    expect(screen.getByText("ESCASOS")).toBeInTheDocument()
    expect(screen.getByText("CRÍTICOS")).toBeInTheDocument()
    expect(screen.getByText("TOTAL ÍTEMS")).toBeInTheDocument()
  })

  it("renders the movement log with translated movement types", async () => {
    renderPage()
    expect(await screen.findByText("HISTORIAL DE MOVIMIENTOS")).toBeInTheDocument()
    expect(screen.getByText("ENTRADA")).toBeInTheDocument()
    expect(screen.getByText("SALIDA")).toBeInTheDocument()
  })

  it("shows the empty state when the inventory is empty", async () => {
    svc.getInventory.mockResolvedValue([])
    svc.getInventoryMovements.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText("SIN INVENTARIO REGISTRADO")).toBeInTheDocument()
  })
})
