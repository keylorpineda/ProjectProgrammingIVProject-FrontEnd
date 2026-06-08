import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PinnedCard } from "../PinnedCard"

describe("PinnedCard", () => {
  it("renders title, value and label", () => {
    render(<PinnedCard title="RECURSOS OK" value={42} label="Items en niveles normales" />)
    expect(screen.getByText("RECURSOS OK")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("Items en niveles normales")).toBeInTheDocument()
  })

  it("resolves a bare pin color into a wv-pin-* class", () => {
    const { container } = render(<PinnedCard title="X" value={1} pinColor="red" />)
    expect(container.querySelector(".wv-pin.wv-pin-red")).toBeInTheDocument()
  })

  it("accepts an already-prefixed pin class unchanged", () => {
    const { container } = render(<PinnedCard title="X" value={1} pinColor="wv-pin-gold" />)
    expect(container.querySelector(".wv-pin.wv-pin-gold")).toBeInTheDocument()
  })

  it("omits the pin when pinColor is 'none'", () => {
    const { container } = render(<PinnedCard title="X" value={1} pinColor="none" />)
    expect(container.querySelector(".wv-pin")).toBeNull()
  })

  it("renders arbitrary children", () => {
    render(
      <PinnedCard>
        <span>cuerpo libre</span>
      </PinnedCard>,
    )
    expect(screen.getByText("cuerpo libre")).toBeInTheDocument()
  })
})
