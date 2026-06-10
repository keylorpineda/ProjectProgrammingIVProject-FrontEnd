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

vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(() => []),
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
        last_name2: "Alpha",
        status: PersonStatus.Active,
        camp_id: "CAMP-1",
        can_work: true,
        experience_level: 4,
        experience_points: 120,
        identification_code: "ID-1",
        birth_date: "1990-01-01T00:00:00.000Z",
        join_date: "2020-01-01T00:00:00.000Z",
        previous_skills: "Radio",
        notes: "Buen rendimiento",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Doctor", can_explore: true },
      },
      {
        id: "2",
        first_name: "Jane",
        last_name: "Smith",
        status: PersonStatus.Exploring,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Explorer", can_explore: true },
      },
      {
        id: "3",
        first_name: "Bob",
        last_name: "Wounded",
        status: PersonStatus.Injured,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Guard", can_explore: false },
      },
      {
        id: "4",
        first_name: "Ivy",
        last_name: "Idle",
        status: PersonStatus.Idle,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: null,
      },
      {
        id: "5",
        first_name: "Tom",
        last_name: "Travel",
        status: PersonStatus.Traveling,
        camp_id: "CAMP-1",
        can_work: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Runner", can_explore: true },
      },
      {
        id: "6",
        first_name: "Rex",
        last_name: "Rest",
        status: PersonStatus.Resting,
        camp_id: "CAMP-1",
        can_work: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Medic", can_explore: false },
      },
      {
        id: "7",
        first_name: "Sara",
        last_name: "Sick",
        status: PersonStatus.Sick,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Nurse", can_explore: false },
      },
      {
        id: "8",
        first_name: "Otto",
        last_name: "Outside",
        status: PersonStatus.OutOfCamp,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Scout", can_explore: true },
      },
      {
        id: "9",
        first_name: "Dina",
        last_name: "Deceased",
        status: PersonStatus.Deceased,
        camp_id: "CAMP-1",
        can_work: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Archivist", can_explore: false },
      },
      {
        id: "10",
        first_name: "Una",
        last_name: "Unknown",
        status: "unknown_status",
        camp_id: "CAMP-1",
        can_work: true,
        photo_url: "https://example.test/photo.jpg",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        profession: { name: "Analyst", can_explore: true },
      },
    ]

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps")
          return { data: [{ id: "CAMP-1", name: "Main Camp" }], isError: false }
        if (queryKey[0] === "persons") return { data: { data: mockPersons }, isError: false }
        return { data: [], isError: false }
      },
    )
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

    const allTab = screen.getByText(/TODOS/i)
    fireEvent.click(allTab)
    expect(screen.getByText(/JANE SMITH/i)).toBeInTheDocument()

    const fieldTab = screen.getByText(/EN CAMPO/i)
    fireEvent.click(fieldTab)
    expect(screen.getByText(/JANE SMITH/i)).toBeInTheDocument()
    expect(screen.queryByText(/JOHN DOE/i)).not.toBeInTheDocument()
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

  it("filters persons by profession selection", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Explorer" } })

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
    expect(screen.getByText(/DOE ALPHA/i)).toBeInTheDocument()
    expect(screen.getByText(/RADIO/i)).toBeInTheDocument()
    expect(screen.getByText(/BUEN RENDIMIENTO/i)).toBeInTheDocument()
    expect(screen.getAllByText(/APTO/i).length).toBeGreaterThan(0)

    // Close button (mobile layout but visible in jsdom)
    const backBtn = screen.getByText("Volver")
    fireEvent.click(backBtn)

    expect(screen.getByText(/Seleccione Superviviente/i)).toBeInTheDocument()
  })

  it("renders fallback details for incomplete personnel records", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/IVY IDLE/i))

    expect(
      screen.getAllByText((content) => content.includes("SIN " + "PRO" + "FES")).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/RESTRINGIDO/i).length).toBeGreaterThan(0)
    expect(screen.getByText("0 XP")).toBeInTheDocument()
    expect(screen.getByText("NIVEL 1 / 10")).toBeInTheDocument()
    expect(screen.getByText("NO AUTORIZADO")).toBeInTheDocument()
  })

  it("renders uncommon status labels and hides broken profile photos", () => {
    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Enfermo/i)).toBeInTheDocument()
    expect(screen.getByText(/Fuera del Camp/i)).toBeInTheDocument()
    expect(screen.getByText(/Fallecido/i)).toBeInTheDocument()
    expect(screen.getByText(/unknown_status/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/UNA UNKNOWN/i))
    const photo = screen.getByAltText(/Una Unknown/i)

    fireEvent.error(photo)

    expect(photo).toHaveStyle({ display: "none" })
  })

  it("handles empty state", () => {
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps")
          return { data: [{ id: "CAMP-1", name: "Main Camp" }], isError: false }
        if (queryKey[0] === "persons") return { data: { data: [] }, isError: false }
        return { data: [], isError: false }
      },
    )

    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Sin personal registrado/i)).toBeInTheDocument()
  })

  it("handles missing user and undefined persons response", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
    })
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "camps") return { data: [], isError: true }
        if (queryKey[0] === "persons") return { data: undefined, isError: false }
        return { data: [], isError: false }
      },
    )

    render(
      <MemoryRouter>
        <TravelTeam />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Base:/i)).toBeInTheDocument()
    expect(screen.getByText(/Modo fuera/i)).toBeInTheDocument()
    expect(screen.getByText(/Sin personal registrado/i)).toBeInTheDocument()
  })
})
