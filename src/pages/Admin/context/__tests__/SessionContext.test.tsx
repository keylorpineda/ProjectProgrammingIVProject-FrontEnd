import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser } from "../../../../test/fixtures"
import { AuthProvider } from "../AuthContext"
import { SessionProvider, useSession } from "../SessionContext"

import { getSessionStatus, logout as logoutService } from "@/features/auth/services/auth.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/auth/services/auth.service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getSessionStatus: vi.fn(),
  switchCamp: vi.fn(),
}))

const mockedGetSessionStatus = getSessionStatus as unknown as ReturnType<typeof vi.fn>
const mockedLogout = logoutService as unknown as ReturnType<typeof vi.fn>

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <SessionProvider>{children}</SessionProvider>
  </AuthProvider>
)

describe("Admin SessionContext", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    mockedGetSessionStatus.mockReset()
    mockedLogout.mockReset()
    mockedLogout.mockResolvedValue(undefined)
    mockedGetSessionStatus.mockResolvedValue({
      isActive: true,
      lastActivity: new Date().toISOString(),
      minutesUntilExpiration: 20,
      willExpireSoon: false,
    })
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it("throws when useSession is called outside SessionProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/i)
    spy.mockRestore()
  })

  it("initializes with full idle window remaining when authenticated", () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useSession(), { wrapper })
    expect(result.current.secondsUntilLogout).toBe(20 * 60)
    expect(result.current.isWarning).toBe(false)
  })

  it("counts down the idle timer every second", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useSession(), { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(5_000)
    })

    expect(result.current.secondsUntilLogout).toBeLessThanOrEqual(20 * 60 - 5)
    expect(result.current.secondsUntilLogout).toBeGreaterThan(20 * 60 - 10)
  })

  it("isWarning becomes true under 60s remaining", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useSession(), { wrapper })

    await act(async () => {
      await vi.advanceTimersByTimeAsync((20 * 60 - 55) * 1000)
    })

    expect(result.current.isWarning).toBe(true)
  })

  it("logs out automatically when idle time reaches zero", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useSession(), { wrapper })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60 * 1000 + 1000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    void result.current
  })

  it("resetActivity bumps the countdown back to the full window", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useSession(), { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(5_000)
    })
    const before = result.current.secondsUntilLogout
    expect(before).toBeLessThan(20 * 60)

    act(() => {
      result.current.resetActivity()
    })

    await act(async () => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.secondsUntilLogout).toBeGreaterThan(before)
  })

  it("mousemove on window resets activity", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useSession(), { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    const beforeMove = result.current.secondsUntilLogout

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove"))
    })
    await act(async () => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.secondsUntilLogout).toBeGreaterThan(beforeMove)
  })

  it("polls /auth/session-status every minute and triggers logout when inactive", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetSessionStatus.mockResolvedValueOnce({
      isActive: true,
      lastActivity: new Date().toISOString(),
      minutesUntilExpiration: 20,
      willExpireSoon: false,
    })
    mockedGetSessionStatus.mockResolvedValueOnce({
      isActive: false,
      lastActivity: new Date().toISOString(),
      minutesUntilExpiration: 0,
      willExpireSoon: true,
    })

    renderHook(() => useSession(), { wrapper })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    // Drain residual promises (the polled response triggers logout)
    await act(async () => {
      await Promise.resolve()
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("does not start the timers when there is no authenticated user", () => {
    renderHook(() => useSession(), { wrapper })

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000 + 1000)
    })
    expect(mockedLogout).not.toHaveBeenCalled()
  })
})
