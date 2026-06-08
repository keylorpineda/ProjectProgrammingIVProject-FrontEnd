import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerLayout from "../WorkerLayout"

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

const renderLayout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/worker/*" element={<WorkerLayout />} />
    </Routes>,
    { user: workerUser, token: "tk", route: "/worker/dashboard" },
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
})
