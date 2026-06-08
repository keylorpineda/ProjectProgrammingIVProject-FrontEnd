import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import MapTest from "../MapTest"

vi.mock("@/features/map-test/components/MapDashboardWrapper", () => ({
  default: () => <div data-testid="map-dashboard-wrapper" />,
}))

describe("Admin → MapTest", () => {
  it("renders MapDashboardWrapper inside a full-size container", () => {
    render(<MapTest />)
    expect(screen.getByTestId("map-dashboard-wrapper")).toBeInTheDocument()
  })

  it("wrapping div has 100% width and height styles", () => {
    const { container } = render(<MapTest />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.width).toBe("100%")
    expect(wrapper.style.height).toBe("100%")
  })
})
