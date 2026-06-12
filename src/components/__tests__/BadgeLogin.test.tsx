import { fireEvent } from "@testing-library/dom"
import { act, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BadgeLogin } from "../BadgeLogin"

const navigate = vi.fn()

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe("BadgeLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderBadge = (props: Partial<React.ComponentProps<typeof BadgeLogin>> = {}) =>
    render(
      <MemoryRouter>
        <BadgeLogin onLogin={vi.fn()} isProcessing={false} loginStatus="waiting" {...props} />
      </MemoryRouter>,
    )

  it("hangs after the intro timer and submits valid credentials", () => {
    const onLogin = vi.fn()
    renderBadge({ onLogin })

    const username = document.querySelector("#bl-username") as HTMLInputElement
    const password = document.querySelector("#bl-password") as HTMLInputElement

    expect(username).toBeDisabled()
    act(() => vi.advanceTimersByTime(300))
    expect(username).not.toBeDisabled()

    fireEvent.change(username, { target: { value: "jordy" } })
    fireEvent.change(password, { target: { value: "secret1" } })
    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }))

    expect(onLogin).toHaveBeenCalledWith("jordy", "secret1")
  })

  it("does not submit invalid credentials and can reveal the password", () => {
    const onLogin = vi.fn()
    renderBadge({ onLogin })
    act(() => vi.advanceTimersByTime(300))

    const username = document.querySelector("#bl-username") as HTMLInputElement
    const password = document.querySelector("#bl-password") as HTMLInputElement
    fireEvent.change(username, { target: { value: "jordy" } })
    fireEvent.change(password, { target: { value: "123" } })

    fireEvent.click(screen.getByTitle("Mostrar"))
    expect(password).toHaveAttribute("type", "text")

    fireEvent.submit(screen.getByRole("button", { name: /iniciar/i }).closest("form")!)

    expect(onLogin).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(500))
  })

  it("shows processing, granted and denied states", () => {
    const { rerender } = render(
      <MemoryRouter>
        <BadgeLogin onLogin={vi.fn()} isProcessing loginStatus="processing" />
      </MemoryRouter>,
    )

    expect(screen.getByText("PROCESANDO...")).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <BadgeLogin onLogin={vi.fn()} isProcessing={false} loginStatus="granted" />
      </MemoryRouter>,
    )
    expect(screen.getByText("APROBADO")).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <BadgeLogin onLogin={vi.fn()} isProcessing={false} loginStatus="denied" />
      </MemoryRouter>,
    )
    expect(screen.getByText("DENEGADO")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(500))
  })

  it("navigates to admissions and applies hover styles", () => {
    renderBadge()
    act(() => vi.advanceTimersByTime(300))

    const submit = screen.getByRole("button", { name: /iniciar/i })
    fireEvent.mouseEnter(submit)
    expect(submit).toHaveStyle({ color: "#f59e0b" })
    fireEvent.mouseLeave(submit)
    expect(submit).toHaveStyle({ color: "#cccccc" })

    const joinButton = screen.getByRole("button", { name: /unirse a un campamento/i })
    fireEvent.mouseEnter(joinButton)
    expect(joinButton).toHaveStyle({ color: "#f59e0b" })
    fireEvent.mouseLeave(joinButton)
    expect(joinButton).toHaveStyle({ color: "#2a2a2a" })

    fireEvent.click(joinButton)
    expect(navigate).toHaveBeenCalledWith("/admissions/new")
  })
})
