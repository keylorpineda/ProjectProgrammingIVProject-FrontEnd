import * as reactQuery from "@tanstack/react-query"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import TravelResources from "./TravelResources"

import { useAuthStore } from "@/store/useAuthStore"

// Mock Auth
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

describe("TravelResources", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
        current_quantity: 5,
        minimum_stock_required: 20,
        alert_active: true,
      },
      {
        resource_id: "r3",
        resource: { name: "Balas", category: "weaponry", unit: "UNID" },
        camp_id: "CAMP-1",
        current_quantity: 0,
        minimum_stock_required: 100,
        alert_active: true,
      },
    ]

    const mockPersons = [
      { id: "p1", camp_id: "CAMP-1", status: "active", profession: { can_explore: true } },
    ]

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "camps") return { data: [{ id: "CAMP-1", name: "Alpha Camp" }] }
      if (queryKey[0] === "inventory") return { data: mockInventory }
      if (queryKey[0] === "persons") return { data: { data: mockPersons } }
      return { data: [] }
    })
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
    expect(screen.getByText("CRÍTICO")).toBeInTheDocument() // Raciones de comida
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
    expect(screen.getAllByText("Raciones de Comida").length).toBe(1)
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
    expect(screen.getAllByText("Raciones de Comida").length).toBe(1)
  })

  it("handles empty inventory state", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "inventory") return { data: [] }
      return { data: [] }
    })

    render(
      <MemoryRouter>
        <TravelResources />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Sin recursos registrados/i)).toBeInTheDocument()
  })
})
