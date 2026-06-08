import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, dashboardMetrics } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import Dashboard from "../Dashboard"

import { getPendingAdmissions } from "@/features/admissions/services/admissions.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/dashboard/services/dashboard.service", () => ({
  getDashboardMetrics: vi.fn(),
}))
vi.mock("@/features/admissions/services/admissions.service", () => ({
  getPendingAdmissions: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))

const mockedGetMetrics = getDashboardMetrics as unknown as ReturnType<typeof vi.fn>
const mockedGetPending = getPendingAdmissions as unknown as ReturnType<typeof vi.fn>
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const renderDashboard = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <Dashboard />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → Dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetMetrics.mockReset()
    mockedGetPending.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetMetrics.mockResolvedValue(dashboardMetrics)
    mockedGetPending.mockResolvedValue({
      data: [],
      total: 3,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
  })

  it("renders the TABLERO DE SITUACIÓN heading and server time", async () => {
    renderDashboard()
    expect(
      await screen.findByRole("heading", { name: /TABLERO DE SITUACIÓN/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/HORA DEL SISTEMA/i)).toBeInTheDocument()
  })

  it("renders the dashboard cards once metrics arrive", async () => {
    renderDashboard()
    expect(await screen.findByText(/POBLACIÓN/i)).toBeInTheDocument()
    expect(screen.getByText(/SOLICITUDES ADMISIÓN/i)).toBeInTheDocument()
    expect(screen.getByText(/MOVIMIENTOS ACORDADOS/i)).toBeInTheDocument()
    expect(screen.getByText(/CUERPOS EXPLORACIÓN/i)).toBeInTheDocument()
  })

  it("renders the pending admissions count from the API", async () => {
    renderDashboard()
    expect(await screen.findByText("3")).toBeInTheDocument()
  })

  it("renders the pending transfers count from the dashboard metrics", async () => {
    renderDashboard()
    expect(await screen.findByText(/TRANSFERENCIAS PENDIENTES/i)).toBeInTheDocument()
    expect(await screen.findByText("1")).toBeInTheDocument()
  })

  it("shows an error message when the dashboard API rejects", async () => {
    mockedGetMetrics.mockRejectedValue(new Error("server down"))
    renderDashboard()
    expect(await screen.findByText(/No se pudo cargar el tablero/i)).toBeInTheDocument()
  })
})
