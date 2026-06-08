import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CorkBoard } from "../CorkBoard"

describe("CorkBoard", () => {
  it("renders the board title and children", () => {
    render(
      <CorkBoard title="TABLERO - Campamento Alpha">
        <div>contenido del tablero</div>
      </CorkBoard>,
    )
    expect(screen.getByText("TABLERO - Campamento Alpha")).toBeInTheDocument()
    expect(screen.getByText("contenido del tablero")).toBeInTheDocument()
  })

  it("renders the optional right element", () => {
    render(
      <CorkBoard title="TABLERO" rightElement={<span>12:00:00Z</span>}>
        <div>x</div>
      </CorkBoard>,
    )
    expect(screen.getByText("12:00:00Z")).toBeInTheDocument()
  })
})
