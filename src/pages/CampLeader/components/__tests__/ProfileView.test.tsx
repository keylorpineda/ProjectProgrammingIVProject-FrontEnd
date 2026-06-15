import { fireEvent } from "@testing-library/dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import ProfileView from "../ProfileView"

import type { CampStatistics } from "../../types"
import type { AuthUser } from "@/types/api.types"

const mockUser: AuthUser = {
  id: "7",
  username: "Big Boss",
  email: "boss@outerhaven.com",
  role: "camp_leader",
  camp_id: "2",
}

const mockStats: CampStatistics = {
  total_persons: 8,
  active_workers: 6,
  injured_or_sick: 1,
  exploring: 1,
  deceased: 0,
  occupancy_rate: 16,
  explorations_completed: 4,
  survival_score: 350, // This puts them in the VETERANO rank tier
}

describe("ProfileView Component", () => {
  it("renders commandant files, stats cards, and rank progress correctly", () => {
    render(<ProfileView user={mockUser} statistics={mockStats} residents={[]} />)

    expect(screen.getByText("EXPEDIENTE DEL COMANDANTE")).toBeInTheDocument()
    expect(screen.getByText("BIG BOSS")).toBeInTheDocument()
    expect(screen.getByText("CAMPAMENTO")).toBeInTheDocument()
    expect(screen.getByText("#2")).toBeInTheDocument()
    expect(screen.getByText("350 PTS")).toBeInTheDocument()

    // Rank should be VETERANO
    expect(screen.getAllByText("VETERANO").length).toBeGreaterThan(0)

    // Stats card checks
    expect(screen.getByText("EN CAMPO")).toBeInTheDocument()
    expect(screen.getAllByText("6").length).toBeGreaterThan(0) // active workers
  })

  it("opens a trophy detail modal when clicking a trophy, and closes it", () => {
    render(<ProfileView user={mockUser} statistics={mockStats} residents={[]} />)

    // Trophy "PRIMER MANDO" is unlocked by default
    const trophyBtn = screen.getByRole("button", { name: /primer mando/i })
    expect(trophyBtn).toBeInTheDocument()

    // Click it to open the modal
    fireEvent.click(trophyBtn)

    // Modal elements should be visible
    expect(screen.getByText(/desbloqueado/i)).toBeInTheDocument()
    expect(screen.getByText("Accediste al sistema como Líder de Campamento.")).toBeInTheDocument()

    // Close the modal via the '✕' close button
    const closeBtn = screen.getByRole("button", { name: "✕" })
    fireEvent.click(closeBtn)

    // Modal elements should be gone
    expect(
      screen.queryByText("Accediste al sistema como Líder de Campamento."),
    ).not.toBeInTheDocument()
  })

  it("handles keyboard navigation on trophies", () => {
    render(<ProfileView user={mockUser} statistics={mockStats} residents={[]} />)

    const trophyBtn = screen.getByRole("button", { name: /primer mando/i })

    // Press space — shouldn't open modal
    fireEvent.keyDown(trophyBtn, { key: "Space" })
    expect(screen.queryByText(/desbloqueado/i)).not.toBeInTheDocument()

    // Press Enter — should open modal
    fireEvent.keyDown(trophyBtn, { key: "Enter" })
    expect(screen.getByText(/desbloqueado/i)).toBeInTheDocument()
  })

  it("renders fallback values when user is null", () => {
    render(<ProfileView user={null} statistics={mockStats} residents={[]} />)
    expect(screen.getByText("CLR-LDR-0000")).toBeInTheDocument()
    expect(screen.getByText("N/D")).toBeInTheDocument()
    expect(screen.getByText("#?")).toBeInTheDocument()
  })

  it("shows RANGO MÁXIMO when survival_score is >= 900", () => {
    const maxStats = { ...mockStats, survival_score: 900 }
    render(<ProfileView user={mockUser} statistics={maxStats} residents={[]} />)
    expect(screen.getByText("RANGO MÁXIMO")).toBeInTheDocument()
  })

  it("closes the trophy modal via the CERRAR button", () => {
    render(<ProfileView user={mockUser} statistics={mockStats} residents={[]} />)

    fireEvent.click(screen.getByRole("button", { name: /primer mando/i }))
    expect(screen.getByText("Accediste al sistema como Líder de Campamento.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "CERRAR" }))
    expect(
      screen.queryByText("Accediste al sistema como Líder de Campamento."),
    ).not.toBeInTheDocument()
  })

  it("falls back to RECLUTA rank for negative survival scores", () => {
    const negativeStats = { ...mockStats, survival_score: -1 }
    render(<ProfileView user={mockUser} statistics={negativeStats} residents={[]} />)
    expect(screen.getAllByText("RECLUTA").length).toBeGreaterThan(0)
  })

  it("shows BLOQUEADO state and progress bar for a locked trophy", () => {
    // FUERZA LABORAL requires 10+ active_workers; mockStats has 6
    render(<ProfileView user={mockUser} statistics={mockStats} residents={[]} />)

    const lockedTrophy = screen.getByRole("button", { name: /fuerza laboral/i })
    fireEvent.click(lockedTrophy)

    expect(screen.getByText(/BLOQUEADO/i)).toBeInTheDocument()
    expect(screen.getByText("PROGRESO")).toBeInTheDocument()
    expect(screen.getByText("6/10")).toBeInTheDocument()
  })
})
