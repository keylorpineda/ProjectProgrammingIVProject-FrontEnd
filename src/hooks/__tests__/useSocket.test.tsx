import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSocket } from "../useSocket"

import { useTokenStore } from "@/store/useAuthStore"

const disconnect = vi.fn()
const io = vi.fn()

vi.mock("socket.io-client", () => ({
  io: (...args: unknown[]) => io(...args),
}))

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    useTokenStore.getState().setToken(null)
    io.mockReturnValue({ connected: true, disconnect })
  })

  it("returns null when there is no token", () => {
    const { result } = renderHook(() => useSocket())

    expect(result.current).toBeNull()
    expect(io).not.toHaveBeenCalled()
  })

  it("creates one shared socket and disconnects after the last consumer unmounts", () => {
    act(() => useTokenStore.getState().setToken("token-1"))

    const first = renderHook(() => useSocket())
    const second = renderHook(() => useSocket())

    expect(io).toHaveBeenCalledTimes(1)
    expect(io).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: "token-1" },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    first.unmount()
    expect(disconnect).not.toHaveBeenCalled()

    second.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
