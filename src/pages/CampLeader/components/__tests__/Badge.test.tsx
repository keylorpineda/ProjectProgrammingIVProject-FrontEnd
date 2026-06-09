import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Badge from "../Badge"

describe("Badge Component", () => {
  it("renders null if code is invalid", () => {
    const { container } = render(<Badge code="INVALID_CODE" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders badge elements with matching style for valid code", () => {
    render(<Badge code="SOBREVIVIENTE_ELITE" />)
    const badge = screen.getByTitle(/Sobreviviente Elite - Capitan experto de bunker/i)
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({
      color: "rgb(252, 163, 17)", // hex #fca311
    })
    expect(screen.getByText("🏆")).toBeInTheDocument()
    expect(screen.queryByText("SOBREVIVIENTE ELITE")).not.toBeInTheDocument()
  })

  it("renders description text when showText is true", () => {
    render(<Badge code="VETERANO_PARAMO" showText={true} />)
    expect(screen.getByText(/Veterano del Paramo/i)).toBeInTheDocument()
  })

  it("renders PRIMEROS_AUXILIOS_AVANZADOS badge with correct icon and color", () => {
    render(<Badge code="PRIMEROS_AUXILIOS_AVANZADOS" />)
    const badge = screen.getByTitle(/Primeros Auxilios Avanzados/i)
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({ color: "#10b981" })
    expect(screen.getByText("💉")).toBeInTheDocument()
    expect(screen.queryByText(/Primeros Auxilios Avanzados/i)).not.toBeInTheDocument()
  })
})
