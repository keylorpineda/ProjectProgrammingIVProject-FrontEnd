import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import StampButton from "../StampButton"

describe("StampButton", () => {
  it("renders with the given label", () => {
    render(<StampButton label="ACEPTAR" type="accept" onClick={vi.fn()} />)
    expect(screen.getByRole("button", { name: /ACEPTAR/i })).toBeInTheDocument()
  })

  it("applies the 'accept' class", () => {
    render(<StampButton label="ACEPTAR" type="accept" onClick={vi.fn()} />)
    expect(screen.getByRole("button")).toHaveClass("accept")
  })

  it("applies the 'reject' class", () => {
    render(<StampButton label="RECHAZAR" type="reject" onClick={vi.fn()} />)
    expect(screen.getByRole("button")).toHaveClass("reject")
  })

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<StampButton label="ACEPTAR" type="accept" onClick={handleClick} />)
    await user.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("is disabled and does not call onClick when disabled prop is true", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<StampButton label="ACEPTAR" type="accept" onClick={handleClick} disabled />)
    const btn = screen.getByRole("button")
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("renders enabled by default (no disabled prop)", () => {
    render(<StampButton label="ACEPTAR" type="accept" onClick={vi.fn()} />)
    expect(screen.getByRole("button")).not.toBeDisabled()
  })
})
