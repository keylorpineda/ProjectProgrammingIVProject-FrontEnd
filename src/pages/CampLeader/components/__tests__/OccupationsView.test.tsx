import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import OccupationsView from "../OccupationsView"

import type { Person, PersonStatus } from "../../types"

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

  it("shows EXPLORAN badge for professions with can_explore = true", () => {
    render(<OccupationsView residents={mockResidents} />)
    expect(screen.getByText("EXPLORAN")).toBeInTheDocument()
  })

  it("shows REDUCIDO status when roughly half the group is active", () => {
    // Explorador group: Ellie (active) + Tess (deceased) → 1/2 = 50% → REDUCIDO
    render(<OccupationsView residents={mockResidents} />)
    expect(screen.getByText("REDUCIDO")).toBeInTheDocument()
  })

  it("shows CRÍTICO status when all members in a group are inactive", () => {
    const criticalResidents: Person[] = [
      {
        id: 10,
        first_name: "Dead",
        last_name: "Guy",
        status: "deceased" as PersonStatus,
        can_work: false,
        role: "almacenista",
        campId: 1,
        experience_points: 0,
        expeditionsSurvived: 0,
        experience_level: 1,
        profession: { id: 5, name: "Almacenista", can_explore: false },
        achievements: [],
        previous_skills: "",
      },
    ]
    render(<OccupationsView residents={criticalResidents} />)
    expect(screen.getByText("CRÍTICO")).toBeInTheDocument()
  })

  it("shows SIN ASIGNAR group for persons without a profession", () => {
    const noProf: Person[] = [
      {
        id: 20,
        first_name: "Unknown",
        last_name: "Person",
        status: "active" as PersonStatus,
        can_work: true,
        role: "worker",
        campId: 1,
        experience_points: 0,
        expeditionsSurvived: 0,
        experience_level: 1,
        profession: undefined as unknown as Person["profession"],
        achievements: [],
        previous_skills: "",
      },
    ]
    render(<OccupationsView residents={noProf} />)
    expect(screen.getByText("SIN ASIGNAR")).toBeInTheDocument()
  })

  it("shows +N overflow avatar when a profession group has more than 10 members", () => {
    const manyPersons: Person[] = Array.from({ length: 11 }, (_, i) => ({
      id: 100 + i,
      first_name: `Person${i}`,
      last_name: "A",
      status: "active" as PersonStatus,
      can_work: true,
      role: "medico",
      campId: 1,
      experience_points: 100,
      expeditionsSurvived: 1,
      experience_level: 1,
      profession: { id: 1, name: "Medico", can_explore: false },
      achievements: [],
      previous_skills: "",
    }))
    render(<OccupationsView residents={manyPersons} />)
    expect(screen.getByText("+1")).toBeInTheDocument()
  })
})
