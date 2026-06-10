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

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

// Mock the Auth Store
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(() => []),
}))

vi.mock("@/features/explorations/services/explorations.service", () => ({
  getExplorations: vi.fn(() => []),
}))

vi.mock("@/features/inventory/services/inventory.service", () => ({
  getInventory: vi.fn(() => []),
}))

vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(() => ({ data: [] })),
}))

vi.mock("@/features/transfers/services/transfers.service", () => ({
  getCampTransfers: vi.fn(() => []),
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
    navigateMock.mockClear()

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
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") {
          return { data: [{ id: "CAMP-A1", name: "Campamento Base Alpha" }], isError: false }
        }
        return { data: [], isError: false }
      },
    )
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
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps")
          return { data: [{ id: "CAMP-A1", name: "Campamento Base Alpha" }], isError: false }
        if (queryKey[0] === "explorations") return { data: mockExplorations, isError: false }
        if (queryKey[0] === "transfers") return { data: mockTransfers, isError: false }
        if (queryKey[0] === "inventory") return { data: mockInventory, isError: false }
        if (queryKey[0] === "persons") return { data: { data: mockPersons }, isError: false }
        return { data: [], isError: false }
      },
    )

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
    fireEvent.click(screen.getByRole("button", { name: /PENDIENTES/i }))
    fireEvent.click(screen.getByText("Revisar"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/transfers", {
      state: { selectedTransferId: "TR-2" },
    })

    // Check resources
    const resourcesTab = screen.getByRole("button", { name: /RECURSOS/i })
    fireEvent.click(resourcesTab)
    expect(screen.getByText("Agua")).toBeInTheDocument()
    expect(screen.getByText("Comida")).toBeInTheDocument()

    // Test buttons navigate
    fireEvent.click(transitTab)
    const verExpBtn = screen.getAllByText("Ver")[0]
    fireEvent.click(verExpBtn)
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/transfers", {
      state: { selectedTransferId: "TR-1" },
    })

    // There are multiple navigation buttons in the dashboard, test one of them:
    const verLinkBtn = screen.getByText("Revisar inventario completo")
    fireEvent.click(verLinkBtn)
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/inventory")

    fireEvent.click(screen.getByText("Ver Enlace de Traslados"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/transfers")
  })

  it("navigates through dashboard action buttons", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps")
          return { data: [{ id: "CAMP-A1", name: "Campamento Base Alpha" }], isError: false }
        if (queryKey[0] === "explorations") return { data: mockExplorations, isError: false }
        if (queryKey[0] === "transfers") return { data: mockTransfers, isError: false }
        if (queryKey[0] === "inventory")
          return {
            data: [
              ...mockInventory,
              {
                camp_id: "CAMP-A1",
                resource_id: "RES-3",
                resource: { name: "Medicina" },
                current_quantity: 40,
                minimum_stock_required: 100,
                alert_active: true,
              },
            ],
            isError: false,
          }
        if (queryKey[0] === "persons")
          return {
            data: {
              data: [
                ...mockPersons,
                { id: "P-3", status: "exploring", first_name: "Alex", last_name: "Field" },
                { id: "P-4", status: "idle", first_name: "Sam", last_name: "Base" },
              ],
            },
            isError: false,
          }
        return { data: [], isError: false }
      },
    )

    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText("Gestionar traslados"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/transfers")

    fireEvent.click(screen.getByText("Nueva solicitud"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/transfers", {
      state: { openNewTransfer: true },
    })

    fireEvent.click(screen.getByRole("button", { name: /EXPLORACIONES/i }))
    fireEvent.click(screen.getAllByText("Ver").at(-1)!)
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/expeditions", {
      state: { selectedExpeditionId: "EXP-2" },
    })

    fireEvent.click(screen.getByText("Preparar exploración"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/expeditions")

    fireEvent.click(screen.getByText("Ver equipo"))
    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/personnel")
  })

  it("renders fallback dashboard data and mid level resource bars", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
    })
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [], isError: false }
        if (queryKey[0] === "explorations")
          return {
            data: [
              {
                id: "EXP-FALLBACK",
                status: "scheduled",
                destination: "North Gate",
                risk_level: "medium",
              },
            ],
            isError: false,
          }
        if (queryKey[0] === "transfers")
          return {
            data: [
              {
                id: "TR-FALLBACK",
                status: "approved",
                type: "people",
                camp_origin_id: "CAMP-X",
                camp_destination_id: "CAMP-Y",
              },
              {
                id: "TR-BOTH",
                status: "pending",
                type: "both",
                camp_origin_id: "CAMP-X",
                camp_destination_id: "CAMP-Z",
              },
            ],
            isError: false,
          }
        if (queryKey[0] === "inventory")
          return {
            data: [
              {
                resource_id: "RES-MID",
                resource: null,
                current_quantity: 5,
                minimum_stock_required: 10,
                alert_active: true,
              },
            ],
            isError: false,
          }
        if (queryKey[0] === "persons")
          return {
            data: {
              data: [
                { id: "P-MISSING", status: undefined },
                { id: "P-IDLE", status: "idle" },
              ],
            },
            isError: false,
          }
        return { data: [], isError: false }
      },
    )

    render(
      <MemoryRouter>
        <TravelDashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText(/TABLERO/i)).toBeInTheDocument()
    expect(screen.getByText(/Base #CAMP-Z/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/EN TR/i))
    expect(screen.getByText(/Personal/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /RECURSOS/i }))
    expect(screen.getByText("Recurso")).toBeInTheDocument()
    expect(screen.getByText("Bajo")).toBeInTheDocument()
  })
})
