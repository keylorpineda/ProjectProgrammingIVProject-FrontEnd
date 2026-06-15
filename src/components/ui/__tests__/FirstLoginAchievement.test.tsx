import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import FirstLoginAchievement from "../FirstLoginAchievement"

import api from "@/config/api"

vi.mock("@/config/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

describe("FirstLoginAchievement", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not render without a user id", () => {
    const { container } = render(<FirstLoginAchievement userId="" />)

    act(() => vi.advanceTimersByTime(900))

    expect(container).toBeEmptyDOMElement()
  })

  it("does not render when the achievement was already seen", () => {
    localStorage.setItem("gdf_first_login_9", "1")

    const { container } = render(<FirstLoginAchievement userId="9" />)
    act(() => vi.advanceTimersByTime(900))

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the first login achievement and dismisses it", () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    render(<FirstLoginAchievement userId="9" userName="Ana" />)
    act(() => vi.advanceTimersByTime(800))

    expect(screen.getByText("PRIMER TRABAJO")).toBeInTheDocument()
    expect(screen.getByText(/BIENVENIDO, ANA/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /aceptar/i }))

    expect(localStorage.getItem("gdf_first_login_9")).toBe("1")
    expect(api.post).toHaveBeenCalledWith("/users/me/achievements/first-login")
    expect(screen.queryByText("PRIMER TRABAJO")).not.toBeInTheDocument()
  })

  it("dismisses from the overlay and ignores api failures", () => {
    vi.mocked(api.post).mockRejectedValue(new Error("network"))

    const { container } = render(<FirstLoginAchievement userId="10" />)
    act(() => vi.advanceTimersByTime(800))

    expect(screen.getByText("PRIMER TRABAJO")).toBeInTheDocument()
    fireEvent.click(container.firstElementChild as HTMLElement)

    expect(localStorage.getItem("gdf_first_login_10")).toBe("1")
    expect(api.post).toHaveBeenCalledWith("/users/me/achievements/first-login")
  })
})
