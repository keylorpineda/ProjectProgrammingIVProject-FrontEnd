import * as reactQuery from "@tanstack/react-query"
import { fireEvent } from "@testing-library/dom"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import TravelResources from "./TravelResources"

import { useAuthStore } from "@/store/useAuthStore"

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

// Mock Auth
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(() => []),
}))

vi.mock("@/features/inventory/services/inventory.service", () => ({
  getInventory: vi.fn(() => []),
}))

vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(() => ({ data: [] })),
}))

// Mock React Query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

describe("TravelResources", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockClear()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { camp_id: "CAMP-1" },
    })

    const mockInventory = [
      {
        resource_id: "r1",
        resource: { name: "Botella de Agua", category: "water", unit: "L" },
        camp_id: "CAMP-1",
        current_quantity: 50,
        minimum_stock_required: 10,
        alert_active: false,
      },
      {
        resource_id: "r2",
        resource: { name: "Raciones de Comida", category: "food", unit: "KG" },
        camp_id: "CAMP-1",
        current_quantity: 25,
        minimum_stock_required: 20,
        alert_active: false,
      },
      {
        resource_id: "r3",
        resource: { name: "Balas", category: "weaponry", unit: "UNID" },
        camp_id: "CAMP-1",
        current_quantity: 0,
        minimum_stock_required: 100,
        alert_active: true,
      },
      {
        resource_id: "r4",
        resource: { name: "Vendas", category: "medicine", unit: "UNID" },
        camp_id: "CAMP-1",
        current_quantity: 50,
        minimum_stock_required: 100,
        alert_active: true,
      },
      {
        resource_id: "r5",
        resource: { name: "Herramientas", category: "tools", unit: "SET" },
        camp_id: "CAMP-1",
        current_quantity: 15,
        minimum_stock_required: 20,
        alert_active: false,
      },
      {
        resource_id: "r6",
        resource: { name: "Combustible", category: "fuel", unit: "L" },
        camp_id: "CAMP-1",
        current_quantity: 80,
        minimum_stock_required: 100,
        alert_active: true,
      },
    ]

    const mockPersons = [
      { id: "p1", camp_id: "CAMP-1", status: "active", profession: { can_explore: true } },
      { id: "p2", camp_id: "CAMP-1", status: "injured", profession: { can_explore: false } },
    ]

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
        if (queryKey[0] === "inventory") return { data: mockInventory }
        if (queryKey[0] === "persons") return { data: { data: mockPersons } }
        return { data: [] }
      },
    )
  })

  it("renders resources list with calculated statuses", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    // Check resource names
    expect(screen.getAllByText("Botella de Agua").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Raciones de Comida").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Balas").length).toBeGreaterThan(0)

    // Check statuses
    expect(screen.getByText("SUFICIENTE")).toBeInTheDocument() // Botella de agua
    expect(screen.getAllByText("CRÍTICO").length).toBeGreaterThan(0)
    expect(screen.getAllByText("SIN STOCK").length).toBeGreaterThan(0)
  })

  it("filters resources by search query", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    const searchInput = screen.getByPlaceholderText(/Buscar recurso.../i)
    fireEvent.change(searchInput, { target: { value: "Agua" } })

    expect(screen.getAllByText("Botella de Agua").length).toBeGreaterThan(0)
    expect(screen.queryByText("Raciones de Comida")).not.toBeInTheDocument()
  })

  it("filters resources by category selection", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    const categorySelect = screen.getByRole("combobox")
    // "Comida" category
    fireEvent.change(categorySelect, { target: { value: "Comida" } })

    expect(screen.getAllByText("Raciones de Comida").length).toBeGreaterThan(0)
    expect(screen.queryByText("Botella de Agua")).not.toBeInTheDocument()
  })

  it("opens and closes resource details", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText("Vendas")[0])

    expect(screen.getAllByText("Vendas").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Medicina/i).length).toBeGreaterThan(0)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[buttons.length - 1])

    expect(screen.queryByRole("heading", { name: "Vendas" })).not.toBeInTheDocument()
  })

  it("opens resource details from the row action button", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    const detailsButtons = screen.getAllByRole("button", { name: /Ver Ficha/i })
    fireEvent.click(detailsButtons[0])

    expect(screen.getByRole("heading", { name: "Botella de Agua" })).toBeInTheDocument()
  })

  it("closes resource details when the backdrop is clicked", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText("Vendas")[0])
    expect(screen.getByRole("heading", { name: "Vendas" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("heading", { name: "Vendas" }).closest(".fixed")!)

    expect(screen.queryByRole("heading", { name: "Vendas" })).not.toBeInTheDocument()
  })

  it("loads additional resources when the visible list is paginated", () => {
    const largeInventory = Array.from({ length: 55 }, (_, index) => ({
      resource_id: `bulk-${index + 1}`,
      resource: {
        name: `Recurso ${index + 1}`,
        category: index % 2 === 0 ? "tools" : "fuel",
        unit: "UNID",
      },
      camp_id: "CAMP-1",
      current_quantity: 20,
      minimum_stock_required: 5,
      alert_active: false,
    }))

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
        if (queryKey[0] === "inventory") return { data: largeInventory }
        if (queryKey[0] === "persons") return { data: { data: [] } }
        return { data: [] }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.queryByText("Recurso 55")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /CARGAR M/i }))

    expect(screen.getByText("Recurso 55")).toBeInTheDocument()
  })

  it("navigates to prepare an exploration when viable", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
        if (queryKey[0] === "inventory")
          return {
            data: [
              {
                resource_id: "r1",
                resource: { name: "Botella de Agua", category: "water", unit: "L" },
                camp_id: "CAMP-1",
                current_quantity: 100,
                minimum_stock_required: 10,
                alert_active: false,
              },
              {
                resource_id: "r2",
                resource: { name: "Raciones de Comida", category: "food", unit: "KG" },
                camp_id: "CAMP-1",
                current_quantity: 100,
                minimum_stock_required: 20,
                alert_active: false,
              },
            ],
          }
        if (queryKey[0] === "persons")
          return {
            data: {
              data: [
                {
                  id: "p1",
                  camp_id: "CAMP-1",
                  status: "active",
                  profession: { can_explore: true },
                },
              ],
            },
          }
        return { data: [] }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/Preparar Exploración/i))

    expect(navigateMock).toHaveBeenCalledWith("/travel-manager/expeditions", {
      state: { openNewExploration: true },
    })
  })

  it("keeps exploration preparation disabled when readiness is too low", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /Preparar/i }))

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it("calculates limited medicine readiness and excludes resources from other camps", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
        if (queryKey[0] === "inventory")
          return {
            data: [
              {
                resource_id: "med-low",
                resource: { name: "Analgésicos", category: "medicine", unit: "UNID" },
                camp_id: "CAMP-1",
                current_quantity: 12,
                minimum_stock_required: 10,
                alert_active: false,
              },
              {
                resource_id: "other-camp",
                resource: { name: "Radio externo", category: "tools", unit: "UNID" },
                camp_id: "CAMP-2",
                current_quantity: 50,
                minimum_stock_required: 10,
                alert_active: false,
              },
            ],
          }
        if (queryKey[0] === "persons")
          return {
            data: {
              data: [
                {
                  id: "p1",
                  camp_id: "CAMP-1",
                  status: "exploring",
                  profession: { can_explore: true },
                },
              ],
            },
          }
        return { data: [] }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.getByText("Analgésicos")).toBeInTheDocument()
    expect(screen.queryByText("Radio externo")).not.toBeInTheDocument()
    expect(screen.getAllByText(/LIMITADA/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText(/TODOS/i))
    expect(screen.getByText("Analgésicos")).toBeInTheDocument()
  })

  it("renders fallback resource values and unknown categories", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
        if (queryKey[0] === "inventory")
          return {
            data: [
              {
                resource_id: "missing-resource",
                resource: null,
                camp_id: "",
                current_quantity: 0,
                minimum_stock_required: undefined,
                alert_active: false,
              },
              {
                resource_id: "rare-resource",
                resource: { name: "Cable", category: "rare parts", unit: "" },
                camp_id: "CAMP-1",
                current_quantity: undefined,
                minimum_stock_required: undefined,
                alert_active: false,
              },
            ],
          }
        if (queryKey[0] === "persons") return { data: undefined }
        return { data: [] }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.getAllByText("Recurso Desconocido").length).toBeGreaterThan(0)
    expect(screen.getByText("Cable")).toBeInTheDocument()
    expect(screen.getAllByText(/SIN STOCK/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText("Cable"))

    expect(screen.getAllByText("rare parts").length).toBeGreaterThan(0)
    expect(screen.getAllByText("UNID").length).toBeGreaterThan(0)
  })

  it("renders the base fallback when the user has no camp", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
    })
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "inventory") return { data: [] }
        return { data: [], isError: false }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Base:/i)).toBeInTheDocument()
    expect(screen.getByText(/Sin recursos registrados/i)).toBeInTheDocument()
  })

  it("filters resources by status tabs", () => {
    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    // Click "Suficientes" tab
    const sufficientTab = screen.getAllByText(/SUFICIENTES \(\d\)/i)[0]
    fireEvent.click(sufficientTab)

    expect(screen.getAllByText("Botella de Agua").length).toBeGreaterThan(0)
    expect(screen.queryByText("Raciones de Comida")).not.toBeInTheDocument()
  })

  it("handles empty inventory state", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "inventory") return { data: [] }
        return { data: [] }
      },
    )

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Sin recursos registrados/i)).toBeInTheDocument()
  })
})
