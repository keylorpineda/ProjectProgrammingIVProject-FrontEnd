import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useAuthStore } from "../useAuthStore"

import { useAuthStore as useGlobalAuthStore } from "@/store/useAuthStore"

describe("CampLeader useAuthStore wrapper", () => {
  beforeEach(() => {
    act(() => {
      useGlobalAuthStore.getState().logout()
    })
  })

  it("returns null user and false authenticated status initially", () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("returns mapped user and true authenticated status when global store has user", () => {
    act(() => {
      useGlobalAuthStore.getState().setAuth("fake-token", {
        id: "42",
        username: "test_user",
        email: "test@domain.com",
        role: "camp_leader",
        camp_id: "7",
      })
    })

    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({
      id: 42,
      username: "test_user",
      role: "camp_leader",
      campId: 7,
    })
  })

  it("handles missing or null fields in global user gracefully with default values", () => {
    act(() => {
      // Simulate partial user object from backend
      useGlobalAuthStore.getState().setAuth("fake-token", {
        id: undefined,
        username: undefined,
        email: "empty@domain.com",
        role: undefined,
        camp_id: undefined,
      } as any)
    })

    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({
      id: 0,
      username: "USUARIO",
      role: "camp_leader",
      campId: 1,
    })
  })
})
