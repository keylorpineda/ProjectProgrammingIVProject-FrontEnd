import * as reactQuery from "@tanstack/react-query"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import TravelTeam from "./TravelTeam"

import { useAuthStore } from "@/store/useAuthStore"
import { PersonStatus } from "@/types/api.types"

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

describe("TravelTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        camp_id: "CAMP-1",
      },
    })

    const mockPersons = [
      {
        id: "1",
        first_name: "John",
        last_name: "Doe",
        status: PersonStatus.Active,
        profession: { name: "Doctor" },
      },
      {
        id: "2",
        first_name: "Jane",
        last_name: "Smith",
        status: PersonStatus.Exploring,
        profession: { name: "Explorer" },
      },
      {
        id: "3",
        first_name: "Bob",
        last_name: "Wounded",
        status: PersonStatus.Injured,
        profession: { name: "Guard" },
      },
    ]

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "camps")
        return { data: [{ id: "CAMP-1", name: "Main Camp" }], isError: false }
      if (queryKey[0] === "persons") return { data: { data: mockPersons }, isError: false }
      return { data: [], isError: false }
    })
  })

  it("renders the team roster with all persons", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    expect(screen.getByText("Personal Operativo")).toBeInTheDocument()
    expect(screen.getByText(/JOHN DOE/i)).toBeInTheDocument()
    expect(screen.getByText(/JANE SMITH/i)).toBeInTheDocument()
    expect(screen.getByText(/BOB WOUNDED/i)).toBeInTheDocument()
  })

  it("filters persons by status tabs", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    const injuredTab = screen.getByText(/HERIDOS/i)
    fireEvent.click(injuredTab)

    expect(screen.getByText(/BOB WOUNDED/i)).toBeInTheDocument()
    expect(screen.queryByText(/JOHN DOE/i)).not.toBeInTheDocument()

    const activeTab = screen.getByText(/DISPONIBLES/i)
    fireEvent.click(activeTab)

    expect(screen.getByText(/JOHN DOE/i)).toBeInTheDocument()
    expect(screen.queryByText(/JANE SMITH/i)).not.toBeInTheDocument()
  })

  it("filters persons by search input", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    const searchInput = screen.getByPlaceholderText(/Buscar nombre o ID.../i)
    fireEvent.change(searchInput, { target: { value: "jane" } })

    expect(screen.getByText(/JANE SMITH/i)).toBeInTheDocument()
    expect(screen.queryByText(/JOHN DOE/i)).not.toBeInTheDocument()
  })

  it("shows person details when clicked", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    // Initial state: select survivor message
    expect(screen.getByText(/Seleccione Superviviente/i)).toBeInTheDocument()

    // Click on a person
    const personRow = screen.getByText(/JOHN DOE/i)
    fireEvent.click(personRow)

    // Details should be visible
    expect(screen.getByText("EXPEDIENTE DE PERSONAL")).toBeInTheDocument()

    // Close button (mobile layout but visible in jsdom)
    const backBtn = screen.getByText("Volver")
    fireEvent.click(backBtn)

    expect(screen.getByText(/Seleccione Superviviente/i)).toBeInTheDocument()
  })

  it("handles empty state", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "camps")
        return { data: [{ id: "CAMP-1", name: "Main Camp" }], isError: false }
      if (queryKey[0] === "persons") return { data: { data: [] }, isError: false }
      return { data: [], isError: false }
    })

    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Sin personal registrado/i)).toBeInTheDocument()
  })
})
