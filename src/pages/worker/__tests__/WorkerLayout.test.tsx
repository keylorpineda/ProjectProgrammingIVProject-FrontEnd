import { screen, waitFor } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerLayout from "../WorkerLayout"

import type { ReactNode } from "react"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders, userEvent } from "@/test/test-utils"
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

vi.mock("@/components/ui/InactivityGuard", () => ({
  default: ({ children, onLogout }: { children: ReactNode; onLogout: () => void }) => (
    <div>
      <button type="button" onClick={onLogout}>
        IDLE LOGOUT
      </button>
      {children}
    </div>
  ),
}))

vi.mock("@/features/worker/services/workerService", () => ({
  default: svc,
  workerService: svc,
  setAuthToken: vi.fn(),
  handleApiError: vi.fn(),
}))

const renderLayout = (route = "/worker/dashboard") =>
  renderWithProviders(
    <Routes>
      <Route path="/worker/*" element={<WorkerLayout />} />
    </Routes>,
    { user: workerUser, token: "tk", route },
  )

describe("Worker → Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress the first-login achievement modal (and its API call).
    window.localStorage.setItem(`gdf_first_login_${workerUser.id}`, "1")
    svc.getCampById.mockResolvedValue(workerCamp)
    svc.getInventory.mockResolvedValue(workerInventory)
    svc.getProfessions.mockResolvedValue(workerProfessions)
    svc.getDailyBalance.mockResolvedValue(workerBalance)
    svc.getMyBadges.mockResolvedValue(workerBadges)
  })

  it("renders the sidebar, top bar and footer chrome", () => {
    renderLayout()
    expect(screen.getByText("GESTIÓN DEL FIN")).toBeInTheDocument()
    expect(screen.getByText("ID-AUTH: VALIDADO")).toBeInTheDocument()
    expect(screen.getByText(/ENLACE ESTABLECIDO/)).toBeInTheDocument()
  })

  it("mounts the nested dashboard route inside the layout", async () => {
    renderLayout()
    expect(await screen.findByText(/TABLERO - Campamento Alpha/i)).toBeInTheDocument()
  })

  it("navigates from the sidebar to another worker section", async () => {
    svc.getInventoryMovements.mockResolvedValue([])

    renderLayout()

    await userEvent.click(screen.getByRole("button", { name: /ALMACEN/i }))
    expect(
      await screen.findByRole("heading", { name: /MANIFIESTO DE ALMACÉN/i }),
    ).toBeInTheDocument()
  })

  it("redirects unknown worker routes to the dashboard", async () => {
    renderLayout("/worker/unknown")
    expect(await screen.findByText(/TABLERO - Campamento Alpha/i)).toBeInTheDocument()
  })

  it("uses the camp id fallback when camp details are unavailable", async () => {
    svc.getCampById.mockResolvedValue({ camp: null, metrics: workerCamp.metrics })

    renderLayout("/worker/profile")

    expect(await screen.findByText("CAMPAMENTO #1")).toBeInTheDocument()
    expect(await screen.findByText("#1")).toBeInTheDocument()
  })

  it("handles topbar logout", async () => {
    renderLayout()

    await userEvent.click(screen.getByRole("button", { name: /CERRAR/i }))
    await waitFor(() => expect(screen.queryByText("ID-AUTH: VALIDADO")).not.toBeInTheDocument())
  })

  it("handles inactivity logout", async () => {
    renderLayout()

    await userEvent.click(screen.getByRole("button", { name: "IDLE LOGOUT" }))
    await waitFor(() => expect(screen.queryByText("ID-AUTH: VALIDADO")).not.toBeInTheDocument())
  })
})
