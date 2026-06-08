import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps } from "../../../../test/fixtures"
import { AuthProvider } from "../AuthContext"
import { CampProvider, useCamp } from "../CampContext"

import { switchCamp as switchCampService } from "@/features/auth/services/auth.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/auth/services/auth.service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getSessionStatus: vi.fn(),
  switchCamp: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
  getCampById: vi.fn(),
  createCamp: vi.fn(),
  updateCamp: vi.fn(),
  deleteCamp: vi.fn(),
}))

const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>
const mockedSwitchCamp = switchCampService as unknown as ReturnType<typeof vi.fn>

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <CampProvider>{children}</CampProvider>
  </AuthProvider>
)

describe("Admin CampContext", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    mockedGetCamps.mockReset()
    mockedSwitchCamp.mockReset()
  })

  it("throws when useCamp is called outside CampProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useCamp())).toThrow(/useCamp must be used within a CampProvider/i)
    spy.mockRestore()
  })

  it("starts with isLoading=true and an empty camps list, then loads from API", async () => {
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.camps).toEqual(camps)
  })

  it("picks the user.camp_id as activeCampId when no stored selection exists", async () => {
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", { ...adminUser, camp_id: "2" })

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe("2")
  })

  it("falls back to the first camp when the user has no camp_id", async () => {
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", { ...adminUser, camp_id: null })

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe("1")
  })

  it("respects the stored localStorage selection when it points to a valid camp", async () => {
    window.localStorage.setItem("active-camp-id", "2")
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe("2")
  })

  it("setActiveCampId updates state and persists to localStorage", async () => {
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setActiveCampId("2"))

    await waitFor(() => expect(result.current.activeCampId).toBe("2"))
    expect(window.localStorage.getItem("active-camp-id")).toBe("2")
  })

  it("switchActiveCamp(id) calls PATCH /auth/switch-camp with NUMERIC camp_id and rotates tokens", async () => {
    mockedGetCamps.mockResolvedValue(camps)
    mockedSwitchCamp.mockResolvedValueOnce({
      access_token: "new-tk",
      user: { ...adminUser, camp_id: "2" },
    })
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.switchActiveCamp("2")
    })

    expect(mockedSwitchCamp).toHaveBeenCalledWith({ camp_id: 2 })
    expect(useTokenStore.getState().getToken()).toBe("new-tk")
    expect(useAuthStore.getState().user?.camp_id).toBe("2")
    expect(window.localStorage.getItem("active-camp-id")).toBe("2")
    expect(result.current.activeCampId).toBe("2")
  })

  it("switchActiveCamp throws when the id is not a positive number", async () => {
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.switchActiveCamp("not-a-number")).rejects.toThrow(
      /Invalid camp id/i,
    )
    await expect(result.current.switchActiveCamp("-1")).rejects.toThrow(/Invalid camp id/i)
  })

  it("falls back to an empty camp list when the API rejects", async () => {
    mockedGetCamps.mockRejectedValueOnce(new Error("net down"))
    useAuthStore.getState().setAuth("tk", adminUser)

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.camps).toEqual([])
  })

  it("falls back to data[0] when stored camp is not in the loaded list", async () => {
    window.localStorage.setItem("active-camp-id", "99")
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", { ...adminUser, camp_id: "1" })

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe("1")
  })

  it("falls back to data[0] when stored camp and user camp_id are both absent from the list", async () => {
    window.localStorage.setItem("active-camp-id", "99")
    mockedGetCamps.mockResolvedValueOnce(camps)
    useAuthStore.getState().setAuth("tk", { ...adminUser, camp_id: "88" })

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe(camps[0].id)
  })

  it("sets activeCampId to empty string when there are no camps and no stored id", async () => {
    mockedGetCamps.mockResolvedValueOnce([])
    useAuthStore.getState().setAuth("tk", { ...adminUser, camp_id: null })

    const { result } = renderHook(() => useCamp(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeCampId).toBe("")
  })
})
