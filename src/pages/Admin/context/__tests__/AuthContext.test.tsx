import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser } from "../../../../test/fixtures"
import { AuthProvider, useAuth } from "../AuthContext"

import {
  login as loginService,
  logout as logoutService,
} from "@/features/auth/services/auth.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/auth/services/auth.service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getSessionStatus: vi.fn(),
  switchCamp: vi.fn(),
}))

const mockedLogin = loginService as unknown as ReturnType<typeof vi.fn>
const mockedLogout = logoutService as unknown as ReturnType<typeof vi.fn>

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe("Admin AuthContext", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    mockedLogin.mockReset()
    mockedLogout.mockReset()
  })

  it("throws when useAuth is called outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow(
      /useAuth must be used within an AuthProvider/i,
    )
    spy.mockRestore()
  })

  it("exposes initial state when no one is logged in", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("login() calls the service, stores token + user, flips isAuthenticated", async () => {
    mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: adminUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ username: "admin", password: "123456" })
    })

    expect(mockedLogin).toHaveBeenCalledWith({ username: "admin", password: "123456" })
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })
    expect(result.current.user?.username).toBe("admin")
    expect(useTokenStore.getState().getToken()).toBe("tk")
  })

  it("logout() clears local state immediately and best-effort hits the API", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedLogout.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(useTokenStore.getState().getToken()).toBeNull()
    expect(mockedLogout).toHaveBeenCalled()
  })

  it("logout() still clears local state when the API call fails", async () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockedLogout.mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
      await Promise.resolve()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(useTokenStore.getState().getToken()).toBeNull()
    warn.mockRestore()
  })

  it("login() propagates the service error", async () => {
    mockedLogin.mockRejectedValueOnce(new Error("401"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(result.current.login({ username: "bad", password: "badpass" })).rejects.toThrow(
      "401",
    )
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("refreshToken is always exposed as null (cookie-based refresh)", () => {
    useAuthStore.getState().setAuth("tk", adminUser)
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.refreshToken).toBeNull()
  })
})
