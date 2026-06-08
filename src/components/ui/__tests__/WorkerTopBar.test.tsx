import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerTopBar from "../WorkerTopBar"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders, userEvent } from "@/test/test-utils"

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

describe("WorkerTopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.getMyBadges.mockResolvedValue([])
  })

  it("renders the validated auth block with the username and rank", () => {
    renderWithProviders(<WorkerTopBar campName="Campamento Alpha" activeLabel="ALMACÉN" />, {
      user: workerUser,
      token: "tk",
    })
    expect(screen.getByText("ID-AUTH: VALIDADO")).toBeInTheDocument()
    expect(screen.getByText("WORKER")).toBeInTheDocument()
    expect(screen.getByText(/RANGO:/)).toBeInTheDocument()
    expect(screen.getByText(/RECLUTA/)).toBeInTheDocument()
  })

  it("renders the camp name and the active section label", () => {
    renderWithProviders(<WorkerTopBar campName="Campamento Alpha" activeLabel="ALMACÉN" />, {
      user: workerUser,
      token: "tk",
    })
    expect(screen.getByText("Campamento Alpha")).toBeInTheDocument()
    expect(screen.getByText("ALMACÉN")).toBeInTheDocument()
  })

  it("invokes onLogout when the logout button is clicked", async () => {
    const onLogout = vi.fn()
    renderWithProviders(
      <WorkerTopBar campName="Alpha" activeLabel="TABLERO" onLogout={onLogout} />,
      {
        user: workerUser,
        token: "tk",
      },
    )
    await userEvent.click(screen.getByRole("button", { name: /CERRAR SESIÓN/i }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it.each([
    [2, "SOLDADO"],
    [4, "VETERANO"],
    [7, "ELITE"],
    [10, "LEYENDA"],
  ])("derives the rank from the badge count (%i → %s)", async (count, label) => {
    svc.getMyBadges.mockResolvedValue(Array.from({ length: count }, (_, i) => ({ id: i })))
    renderWithProviders(<WorkerTopBar campName="Alpha" activeLabel="TABLERO" />, {
      user: workerUser,
      token: "tk",
    })
    expect(await screen.findByText(new RegExp(label))).toBeInTheDocument()
  })
})
