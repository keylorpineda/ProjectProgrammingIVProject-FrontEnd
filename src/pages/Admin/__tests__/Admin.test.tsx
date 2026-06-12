import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, dashboardMetrics, workerUser } from "../../../test/fixtures"
import Admin from "../Admin"

import type * as ReactRouterDom from "react-router-dom"

import { logout as logoutService } from "@/features/auth/services/auth.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("react-leaflet-cluster", () => ({ default: () => null }))
vi.mock("@/features/map-test/components/ExplorationZoneMap", () => ({
  ExplorationZoneMap: () => <div data-testid="exploration-zone-map" />,
}))
vi.mock("@/features/map-test/components/MapCoordPicker", () => ({
  MapCoordPicker: () => <div data-testid="map-coord-picker" />,
}))
vi.mock("@/features/map-test/components/MapDashboardWrapper", () => ({
  default: () => <div data-testid="map-dashboard-wrapper" />,
}))
vi.mock("@/features/map-test/components/TransferRouteMap", () => ({
  TransferRouteMap: () => <div data-testid="transfer-route-map" />,
}))

vi.mock("@/features/auth/services/auth.service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getSessionStatus: vi.fn().mockResolvedValue({
    isActive: true,
    lastActivity: new Date().toISOString(),
    minutesUntilExpiration: 20,
    willExpireSoon: false,
  }),
  switchCamp: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
  getCampById: vi.fn(),
  createCamp: vi.fn(),
  updateCamp: vi.fn(),
  deleteCamp: vi.fn(),
}))
vi.mock("@/features/dashboard/services/dashboard.service", () => ({
  getDashboardMetrics: vi.fn(),
}))
vi.mock("@/features/admissions/services/admissions.service", () => ({
  getPendingAdmissions: vi
    .fn()
    .mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 }),
  getAdmissionById: vi.fn(),
  reviewAdmission: vi.fn(),
  createAdmissionAccount: vi.fn(),
  submitAdmission: vi.fn(),
  trackAdmission: vi.fn(),
  completeRegistration: vi.fn(),
}))

const mockedLogout = logoutService as unknown as ReturnType<typeof vi.fn>
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom")
  return { ...actual, useNavigate: () => navigateMock }
})

const mockedGetDashboard = getDashboardMetrics as unknown as ReturnType<typeof vi.fn>

const queryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })

const renderAdminAt = (route: string) =>
  render(
    <QueryClientProvider client={queryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe("Admin shell", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    navigateMock.mockClear()
    mockedLogout.mockReset()
    mockedLogout.mockResolvedValue(undefined)
    mockedGetCamps.mockReset()
    mockedGetCamps.mockResolvedValue(camps)
    mockedGetDashboard.mockReset()
    mockedGetDashboard.mockResolvedValue(dashboardMetrics)
  })

  describe("RequireAdmin guard", () => {
    it("renders nothing meaningful and redirects when not authenticated", () => {
      renderAdminAt("/admin/dashboard")
      expect(screen.queryByText(/cerrar sesión/i)).not.toBeInTheDocument()
    })

    it("renders the layout when authenticated as admin", async () => {
      useAuthStore.getState().setAuth("tk", adminUser)
      renderAdminAt("/admin/dashboard")
      expect(await screen.findByText(/cerrar sesión/i)).toBeInTheDocument()
    })

    it("redirects (renders no layout) when authenticated but role != admin", () => {
      useAuthStore.getState().setAuth("tk", workerUser)
      renderAdminAt("/admin/dashboard")
      expect(screen.queryByText(/cerrar sesión/i)).not.toBeInTheDocument()
    })
  })

  describe("layout", () => {
    beforeEach(() => {
      useAuthStore.getState().setAuth("tk", adminUser)
    })

    it("shows the user's username and ADMIN rank in the header", async () => {
      renderAdminAt("/admin/dashboard")
      expect(await screen.findByText(/rango: administrador/i)).toBeInTheDocument()
      expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0)
    })

    it("renders all admin sidebar tabs", async () => {
      renderAdminAt("/admin/dashboard")
      await waitFor(() => expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument())
      ;[
        /tablero/i,
        /admisiones/i,
        /personal/i,
        /campamentos/i,
        /exploraciones/i,
        /recursos/i,
        /traslados/i,
      ].forEach((label) => {
        expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1)
      })
    })

    it("renders the running UTC clock", async () => {
      renderAdminAt("/admin/dashboard")
      await waitFor(() => expect(screen.getByText(/utc$/i)).toBeInTheDocument())
    })

    it("logs out and navigates to /login when 'CERRAR SESIÓN' is clicked", async () => {
      const user = userEvent.setup()
      renderAdminAt("/admin/dashboard")
      const logoutBtn = await screen.findByRole("button", { name: /cerrar sesión/i })
      await user.click(logoutBtn)
      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login"))
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe("default route", () => {
    beforeEach(() => {
      useAuthStore.getState().setAuth("tk", adminUser)
    })

    it("/admin redirects to /admin/dashboard via the splat route", async () => {
      renderAdminAt("/admin")
      await waitFor(() => expect(screen.getByText(/utc$/i)).toBeInTheDocument())
    })

    it("/admin/unknown-route falls through to the dashboard", async () => {
      renderAdminAt("/admin/this-does-not-exist")
      await waitFor(() => expect(screen.getByText(/utc$/i)).toBeInTheDocument())
    })
  })

  describe("header avatar fallback", () => {
    it("uses the first character of user.id when username is absent", async () => {
      useAuthStore.getState().setAuth("tk", { ...adminUser, username: null as unknown as string })
      renderAdminAt("/admin/dashboard")
      await waitFor(() => expect(screen.getByText(/utc$/i)).toBeInTheDocument())
      expect(screen.getAllByText("5").length).toBeGreaterThan(0)
    })
  })
})
