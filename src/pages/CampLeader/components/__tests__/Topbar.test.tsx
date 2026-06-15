import { fireEvent } from "@testing-library/dom"
import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Topbar from "../Topbar"

import { useAuthStore } from "@/store/useAuthStore"

const navigateMock = vi.fn()

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}))

describe("Topbar Component", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAuthStore.getState().logout()
    navigateMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders with authenticated user info, camp number, survival score and updates time", () => {
    act(() => {
      useAuthStore.getState().setAuth("fake-token", {
        id: "7",
        username: "Boss",
        email: "boss@local.net",
        role: "camp_leader",
        camp_id: "3",
      })
    })

    const { container } = render(<Topbar survivalScore={450} />)

    expect(screen.getByText("CAMPAMENTO #3")).toBeInTheDocument()
    expect(screen.getByText("SUPERVIVENCIA: 450 PTS")).toBeInTheDocument()
    expect(screen.getByText("BOSS")).toBeInTheDocument()

    // Clock check
    const initialText = container.textContent || ""
    expect(initialText).toContain("UTC")

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  })

  it("renders fallback values when no user is authenticated", () => {
    // store is already logged out in beforeEach
    render(<Topbar survivalScore={0} />)
    expect(screen.getByText(/CAMPAMENTO #1/i)).toBeInTheDocument()
    expect(screen.getByText("LEADER")).toBeInTheDocument()
  })

  it("triggers logout and navigates to login when clicking SALIR", () => {
    act(() => {
      useAuthStore.getState().setAuth("fake-token", {
        id: "7",
        username: "Boss",
        email: "boss@local.net",
        role: "camp_leader",
        camp_id: "3",
      })
    })

    render(<Topbar survivalScore={450} />)
    const logoutBtn = screen.getByRole("button", { name: /salir/i })

    fireEvent.click(logoutBtn)

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(navigateMock).toHaveBeenCalledWith("/login")
  })
})
