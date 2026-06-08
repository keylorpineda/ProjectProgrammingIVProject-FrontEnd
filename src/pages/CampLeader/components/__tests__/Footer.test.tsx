import { render, screen, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Footer from "../Footer"

describe("Footer Component", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders correctly with initial signal state", () => {
    const { container } = render(<Footer />)
    expect(screen.getByText("DOOMSDAY-SYS v2.48")).toBeInTheDocument()
    expect(screen.getByText(/Freq. emergencia: 94.2/i)).toBeInTheDocument()
    const radioIcon =
      container.querySelector('[data-testid="icon-Radio"]') ||
      container.querySelector(".lucide-radio")
    const cpuIcon =
      container.querySelector('[data-testid="icon-Cpu"]') || container.querySelector(".lucide-cpu")
    expect(radioIcon).toBeInTheDocument()
    expect(cpuIcon).toBeInTheDocument()
  })

  it("updates signal frequency via setInterval", () => {
    render(<Footer />)
    expect(screen.getByText(/Freq. emergencia: 94.2/i)).toBeInTheDocument()

    // Fast-forward 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    // Frequency should have changed from 94.2 to some value between 85 and 100
    const textNode = screen.getByText(/Freq. emergencia:/i)
    expect(textNode).toBeInTheDocument()
    const signalMatch = textNode.textContent?.match(/Freq. emergencia: ([\d.]+) MHz/)
    expect(signalMatch).toBeTruthy()
    const signalVal = parseFloat(signalMatch![1])
    expect(signalVal).toBeGreaterThanOrEqual(85)
    expect(signalVal).toBeLessThanOrEqual(100)
  })
})
