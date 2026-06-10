import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BadgeRegister } from "../BadgeRegister"

describe("BadgeRegister", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderBadge = (props: Partial<React.ComponentProps<typeof BadgeRegister>> = {}) =>
    render(
      <BadgeRegister
        onRegister={vi.fn()}
        isProcessing={false}
        registerStatus="waiting"
        {...props}
      />,
    )

  it("hangs after the intro timer and submits valid credentials", () => {
    const onRegister = vi.fn()
    const { container } = renderBadge({ onRegister })

    const username = document.querySelector("#br-username") as HTMLInputElement
    const password = document.querySelector("#br-password") as HTMLInputElement

    expect(username).toBeDisabled()
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(username).not.toBeDisabled()

    fireEvent.change(username, { target: { value: "nuevo" } })
    fireEvent.change(password, { target: { value: "clave" } })
    fireEvent.click(screen.getByRole("button", { name: /establecer identidad/i }))

    expect(onRegister).toHaveBeenCalledWith("nuevo", "clave")
  })

  it("does not submit when required fields are missing and can reveal the password", () => {
    const onRegister = vi.fn()
    renderBadge({ onRegister })
    act(() => vi.advanceTimersByTime(300))

    const password = document.querySelector("#br-password") as HTMLInputElement
    fireEvent.click(screen.getByRole("button", { name: "" }))
    expect(password).toHaveAttribute("type", "text")

    fireEvent.submit(screen.getByRole("button", { name: /establecer identidad/i }).closest("form")!)

    expect(onRegister).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(500))
  })

  it("shows processing, granted and denied states", () => {
    const { rerender } = renderBadge({ isProcessing: true, registerStatus: "processing" })

    expect(screen.getByText("VERIFICANDO...")).toBeInTheDocument()

    rerender(<BadgeRegister onRegister={vi.fn()} isProcessing={false} registerStatus="granted" />)
    expect(screen.getByText("AUTORIZADO")).toBeInTheDocument()

    rerender(<BadgeRegister onRegister={vi.fn()} isProcessing={false} registerStatus="denied" />)
    expect(screen.getByText("DENEGADO")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(500))
  })

  it("applies submit button hover styles", () => {
    renderBadge()
    act(() => vi.advanceTimersByTime(300))

    const submit = screen.getByRole("button", { name: /establecer identidad/i })
    fireEvent.mouseEnter(submit)
    expect(submit).toHaveStyle({ color: "#3b82f6" })
    fireEvent.mouseLeave(submit)
    expect(submit).toHaveStyle({ color: "#cccccc" })
  })
})
