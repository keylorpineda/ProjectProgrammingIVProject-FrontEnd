import * as reactQuery from "@tanstack/react-query"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import TravelDashboard from "./TravelDashboard"
import {
  mockExplorations,
  mockTransfers,
  mockInventory,
  mockPersons,
} from "./TravelDashboardMockData"

import { useAuthStore } from "@/store/useAuthStore"

// Mock the Auth Store
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}))

// Mock React Query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

describe("TravelDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock implementation of useAuthStore
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: "TM-001",
        username: "test_manager",
        role: "TRAVEL_MANAGER",
        camp_id: "CAMP-A1",
      },
    })

    // Mock useQuery to return empty arrays to prevent mapping errors
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "camps") {
        return { data: [{ id: "CAMP-A1", name: "Campamento Base Alpha" }], isError: false }
      }
      return { data: [], isError: false }
    })
  })

  it("renders the dashboard title correctly", () => {
    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText(/TABLERO — CAMPAMENTO BASE ALPHA/i)).toBeInTheDocument()
  })

  it("renders all pinned metric cards", () => {
    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText("Exploraciones en curso")).toBeInTheDocument()
    expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument()
    expect(screen.getByText("Recursos bajos")).toBeInTheDocument()
    expect(screen.getByText("Equipo en campo")).toBeInTheDocument()
  })

  it("renders the logistics and operations tabs and handles clicks", async () => {
    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    // Wait for the components to render
    expect(screen.getAllByText(/PENDIENTES/i).length).toBeGreaterThan(0)

    // Initial state: Pending is active
    expect(screen.getByText("Sin solicitudes pendientes")).toBeInTheDocument()

    // Click on Transit tab
    const transitTab = screen.getByText(/EN TRÁNSITO/i)
    fireEvent.click(transitTab)
    expect(screen.getByText("Sin movimientos activos")).toBeInTheDocument()

    // Initial state: Explorations is active
    expect(screen.getByText("Sin operaciones registradas")).toBeInTheDocument()

    // Click on Resources tab
    const resourcesTab = screen.getByRole("button", { name: /RECURSOS/i })
    fireEvent.click(resourcesTab)
    expect(screen.getByText("Sin recursos registrados")).toBeInTheDocument()
  })

  it("handles error state", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isError: true })
    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument()
  })

  it("renders populated data and handles navigations", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "camps")
        return { data: [{ id: "CAMP-A1", name: "Campamento Base Alpha" }], isError: false }
      if (queryKey[0] === "explorations") return { data: mockExplorations, isError: false }
      if (queryKey[0] === "transfers") return { data: mockTransfers, isError: false }
      if (queryKey[0] === "inventory") return { data: mockInventory, isError: false }
      if (queryKey[0] === "persons") return { data: { data: mockPersons }, isError: false }
      return { data: [], isError: false }
    })

    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    // Check explorations are rendered
    expect(screen.getByText("MOCK EXPLORATION 1")).toBeInTheDocument()
    expect(screen.getByText("MOCK EXPLORATION 2")).toBeInTheDocument()

    // Check transfers
    expect(screen.getByText(/Base #CAMP-B2/i)).toBeInTheDocument() // pending
    const transitTab = screen.getByText(/EN TRÁNSITO/i)
    fireEvent.click(transitTab)
    expect(screen.getAllByText(/Campamento Base Alpha/i).length).toBeGreaterThan(0) // in transit

    // Check resources
    const resourcesTab = screen.getByRole("button", { name: /RECURSOS/i })
    fireEvent.click(resourcesTab)
    expect(screen.getByText("Agua")).toBeInTheDocument()
    expect(screen.getByText("Comida")).toBeInTheDocument()

    // Test buttons navigate
    const verExpBtn = screen.getAllByText("Ver")[0]
    fireEvent.click(verExpBtn)

    // There are multiple navigation buttons in the dashboard, test one of them:
    const verLinkBtn = screen.getByText("Revisar inventario completo")
    fireEvent.click(verLinkBtn)
  })
})
