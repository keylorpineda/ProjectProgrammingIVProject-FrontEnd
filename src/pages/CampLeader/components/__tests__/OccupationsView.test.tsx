import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import OccupationsView from "../OccupationsView"

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
    achievements: [],
    previous_skills: "",
    photo_url: "http://example.com/joel.jpg",
  },
  {
    id: 2,
    first_name: "Ellie",
    last_name: "Williams",
    status: "active",
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
    first_name: "Tess",
    last_name: "Servopoulos",
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
  {
    id: 4,
    first_name: "Bill",
    last_name: "Town",
    status: "active",
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

describe("OccupationsView Component", () => {
  it("renders occupation counts and statistics correctly", () => {
    render(<OccupationsView residents={mockResidents} />)

    expect(screen.getByText("OCUPACIONES DEL CAMPAMENTO")).toBeInTheDocument()
    expect(screen.getByText("TOTAL PERSONAL")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument() // 4 total people

    // Medico profession group
    expect(screen.getByText(/medico/i)).toBeInTheDocument()
    // Explorador profession group
    expect(screen.getByText(/explorador/i)).toBeInTheDocument()

    // Test image rendering for Joel
    const joelImg = screen.getByAltText("JM")
    expect(joelImg).toBeInTheDocument()
    expect(joelImg).toHaveAttribute("src", "http://example.com/joel.jpg")

    // Test initials rendering for Ellie (no photo_url)
    expect(screen.getByText("EW")).toBeInTheDocument()
  })

  it("handles empty residents array gracefully", () => {
    render(<OccupationsView residents={[]} />)
    expect(screen.getByText("TOTAL PERSONAL")).toBeInTheDocument()
  })
})
