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

// El campamento 3D (three.js) no corre en jsdom; se reemplaza por un stub.
vi.mock("@/features/camp-3d/components/CampScene3DWrapper", () => ({
  default: () => <div data-testid="camp-3d-wrapper" />,
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

const openProfileMenu = async () =>
  userEvent.click(await screen.findByRole("button", { name: /opciones de perfil/i }))

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

  it("renders the navbar chrome with the operator brand and avatar", () => {
    renderLayout()
    expect(screen.getAllByText("OPERARIO").length).toBeGreaterThan(0)
    expect(screen.getByText("ID-AUTH: VALIDADO")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /opciones de perfil/i })).toBeInTheDocument()
  })

  it("mounts the nested dashboard route inside the layout window", async () => {
    renderLayout()
    expect(await screen.findByText(/TABLERO - Campamento Alpha/i)).toBeInTheDocument()
  })

  it("navigates from the navbar to another worker section", async () => {
    svc.getInventoryMovements.mockResolvedValue([])
    renderLayout()
    // cspell:disable-next-line
    await userEvent.click(screen.getByRole("button", { name: /ALMAC[EÉ]N/i }))
    expect(
      await screen.findByRole("heading", { name: /MANIFIESTO DE ALMACÉN/i }),
    ).toBeInTheDocument()
  })

  it("redirects unknown worker routes to the camp home", async () => {
    renderLayout("/worker/unknown")
    // La home es el campamento 3D (stub); no se abre ninguna ventana de sección.
    expect(await screen.findByTestId("camp-3d-wrapper")).toBeInTheDocument()
  })

  it("opens the profile from the avatar menu", async () => {
    renderLayout()
    await openProfileMenu()
    expect(screen.getByRole("menuitem", { name: /ver perfil/i })).toBeInTheDocument()
  })

  it("handles logout from the avatar menu", async () => {
    renderLayout()
    await openProfileMenu()
    await userEvent.click(screen.getByRole("menuitem", { name: /cerrar sesión/i }))
    await waitFor(() => expect(screen.queryByText("ID-AUTH: VALIDADO")).not.toBeInTheDocument())
  })

  it("handles inactivity logout", async () => {
    renderLayout()
    await userEvent.click(screen.getByRole("button", { name: "IDLE LOGOUT" }))
    await waitFor(() => expect(screen.queryByText("ID-AUTH: VALIDADO")).not.toBeInTheDocument())
  })
})
