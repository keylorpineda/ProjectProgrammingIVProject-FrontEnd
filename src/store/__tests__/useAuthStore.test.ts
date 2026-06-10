import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore, useTokenStore } from "../useAuthStore"

import { adminUser } from "@/test/fixtures"

const buildToken = (exp: number) => {
  const payload = btoa(JSON.stringify({ exp }))
  return `header.${payload}.signature`
}

describe("root auth stores", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
  })

  it("stores and reads the session token", () => {
    useTokenStore.getState().setToken("token-1")

    expect(useTokenStore.getState().token).toBe("token-1")
    expect(useTokenStore.getState().getToken()).toBe("token-1")
  })

  it("sets auth state and clears it on logout", () => {
    useAuthStore.getState().setAuth("token-2", adminUser)

    expect(useTokenStore.getState().getToken()).toBe("token-2")
    expect(useAuthStore.getState().user).toEqual(adminUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().logout()

    expect(useTokenStore.getState().getToken()).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("tracks session expiration and token expiration states", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))

    useAuthStore.getState().setSessionExpired(true)
    expect(useAuthStore.getState().sessionExpired).toBe(true)

    expect(useAuthStore.getState().isTokenExpired()).toBe(true)

    useTokenStore.getState().setToken(buildToken(Date.now() / 1000 + 60))
    expect(useAuthStore.getState().isTokenExpired()).toBe(false)

    useTokenStore.getState().setToken(buildToken(Date.now() / 1000 - 60))
    expect(useAuthStore.getState().isTokenExpired()).toBe(true)

    useTokenStore.getState().setToken("invalid-token")
    expect(useAuthStore.getState().isTokenExpired()).toBe(true)
  })

  it("keeps refresh token setter as a compatibility no-op", () => {
    useAuthStore.getState().setRefreshToken("refresh-token")

    expect(useAuthStore.getState().user).toBeNull()
  })
})
