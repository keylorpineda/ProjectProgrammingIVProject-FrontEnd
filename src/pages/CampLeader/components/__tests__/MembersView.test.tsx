import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import MembersView from "../MembersView"

import type { Person } from "../../types"

const mockResidents: Person[] = [
  {
    id: 1,
    first_name: "Joel",
    last_name: "Miller",
    status: "active",
    can_work: true,
    role: "medico",
    campId: 1,
    experience_points: 150,
    expeditionsSurvived: 2,
    experience_level: 2,
    profession: { id: 1, name: "Medico", can_explore: false },
    achievements: ["Veterano del Paramo"],
    previous_skills: "",
    photo_url: "http://example.com/joel.jpg",
  },
  {
    id: 2,
    first_name: "Ellie",
    last_name: "Williams",
    status: "exploring",
    can_work: true,
    role: "explorador",
    campId: 1,
    experience_points: 300,
    expeditionsSurvived: 5,
    experience_level: 4,
    profession: { id: 2, name: "Explorador", can_explore: true },
    achievements: [],
    previous_skills: "",
  },
  {
    id: 3,
    first_name: "Bill",
    last_name: "Town",
    status: "sick",
    can_work: true,
    role: "desconocido",
    campId: 1,
    experience_points: 100,
    expeditionsSurvived: 1,
    experience_level: 1,
    profession: { id: 99, name: "Desconocido", can_explore: false },
    achievements: [],
    previous_skills: "",
  },
]

describe("MembersView Component", () => {
  it("renders headers and all members correctly", () => {
    render(<MembersView residents={mockResidents} />)

    expect(screen.getByText("EXPEDIENTES DEL PERSONAL")).toBeInTheDocument()
    expect(screen.getByText("Joel")).toBeInTheDocument()
    expect(screen.getByText("Ellie")).toBeInTheDocument()

    // Status mapping check
    expect(screen.getByText("ACTIVO")).toBeInTheDocument()
    expect(screen.getByText("ENFERMO")).toBeInTheDocument()
    expect(screen.getAllByText("EN CAMPO").length).toBe(2)

    // Achievement check
    expect(screen.getByText("★ Veterano del Paramo")).toBeInTheDocument()
  })

  it("filters members by status button clicks", () => {
    render(<MembersView residents={mockResidents} />)

    // Click 'EN CAMPO' (exploring) filter button
    const campoBtn = screen.getByRole("button", { name: /en campo/i })
    fireEvent.click(campoBtn)

    // Ellie is 'exploring', Joel is 'active'
    expect(screen.getByText("Ellie")).toBeInTheDocument()
    expect(screen.queryByText("Joel")).not.toBeInTheDocument()
  })

  it("filters members by search input value", () => {
    render(<MembersView residents={mockResidents} />)

    const searchInput = screen.getByPlaceholderText(/buscar nombre \/ rol/i)
    fireEvent.change(searchInput, { target: { value: "joel" } })

    expect(screen.getByText("Joel")).toBeInTheDocument()
    expect(screen.queryByText("Ellie")).not.toBeInTheDocument()

    // Search by profession
    fireEvent.change(searchInput, { target: { value: "explorador" } })
    expect(screen.getByText("Ellie")).toBeInTheDocument()
    expect(screen.queryByText("Joel")).not.toBeInTheDocument()
  })

  it("shows empty state when no members match", () => {
    render(<MembersView residents={mockResidents} />)

    const searchInput = screen.getByPlaceholderText(/buscar nombre \/ rol/i)
    fireEvent.change(searchInput, { target: { value: "nonexistent" } })

    expect(screen.getByText("SIN REGISTROS QUE COINCIDAN")).toBeInTheDocument()
  })

  it("renders LESIONADO and FALLECIDO status labels", () => {
    const extraResidents: Person[] = [
      ...mockResidents,
      {
        id: 4,
        first_name: "Tommy",
        last_name: "Miller",
        status: "injured",
        can_work: false,
        role: "guardia",
        campId: 1,
        experience_points: 80,
        expeditionsSurvived: 1,
        experience_level: 1,
        profession: { id: 3, name: "Guardia", can_explore: false },
        achievements: [],
        previous_skills: "",
      },
      {
        id: 5,
        first_name: "Tess",
        last_name: "X",
        status: "deceased",
        can_work: false,
        role: "explorador",
        campId: 1,
        experience_points: 0,
        expeditionsSurvived: 0,
        experience_level: 1,
        profession: { id: 2, name: "Explorador", can_explore: true },
        achievements: [],
        previous_skills: "",
      },
    ]
    render(<MembersView residents={extraResidents} />)
    expect(screen.getByText("LESIONADO")).toBeInTheDocument()
    expect(screen.getByText("FALLECIDO")).toBeInTheDocument()
  })

  it("renders a photo img tag when photo_url is present", () => {
    render(<MembersView residents={mockResidents} />)
    const joelImg = screen.getByRole("img", { name: /joel/i })
    expect(joelImg).toHaveAttribute("src", "http://example.com/joel.jpg")
  })

  it("resets filter to all members when TODOS is clicked after filtering", () => {
    render(<MembersView residents={mockResidents} />)

    fireEvent.click(screen.getByRole("button", { name: /en campo/i }))
    expect(screen.queryByText("Joel")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /todos/i }))
    expect(screen.getByText("Joel")).toBeInTheDocument()
    expect(screen.getByText("Ellie")).toBeInTheDocument()
  })
})
