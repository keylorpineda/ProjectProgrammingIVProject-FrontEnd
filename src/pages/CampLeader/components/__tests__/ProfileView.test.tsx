import { fireEvent, render, screen } from "@testing-library/react"
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
})
