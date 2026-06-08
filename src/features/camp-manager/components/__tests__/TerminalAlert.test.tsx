import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import TerminalAlert from "../TerminalAlert"

describe("TerminalAlert", () => {
  it("renders with default props", () => {
    render(<TerminalAlert message="Test alert message" />)
    expect(screen.getByText("SYSTEM ALERT")).toBeInTheDocument()
    expect(screen.getByText("Test alert message")).toBeInTheDocument()
    expect(screen.getByText("BUNKER RECV DECRYPTED OK")).toBeInTheDocument()
    expect(screen.getByText("LATENCY: ~320MS")).toBeInTheDocument()
  })

  it("renders with specific title and type (error)", () => {
    const { container } = render(
      <TerminalAlert message="Error occurred" title="CRITICAL" type="error" />,
    )
    expect(screen.getByText("CRITICAL")).toBeInTheDocument()
    expect(screen.getByText("Error occurred")).toBeInTheDocument()
    // error class should be present
    expect(container.firstChild).toHaveClass("border-[#9c2720]")
  })

  it("renders with specific title and type (success)", () => {
    const { container } = render(
      <TerminalAlert message="All good" title="SUCCESS" type="success" />,
    )
    expect(screen.getByText("SUCCESS")).toBeInTheDocument()
    expect(screen.getByText("All good")).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border-emerald-600")
  })

  it("renders with specific title and type (system)", () => {
    const { container } = render(<TerminalAlert message="System boot" title="INFO" type="system" />)
    expect(screen.getByText("INFO")).toBeInTheDocument()
    expect(screen.getByText("System boot")).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border-zinc-700")
  })

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn()
    render(<TerminalAlert message="Closable message" onClose={handleClose} />)

    // find button (which renders when onClose is provided)
    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("does not render close button if onClose is not provided", () => {
    render(<TerminalAlert message="No close button" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
