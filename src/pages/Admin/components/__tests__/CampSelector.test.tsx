import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import CampSelector from "../CampSelector"

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
}))

const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>
const mockedSwitchCamp = switchCampService as unknown as ReturnType<typeof vi.fn>

const renderSelector = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <CampSelector />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → CampSelector", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetCamps.mockReset()
    mockedSwitchCamp.mockReset()
    mockedGetCamps.mockResolvedValue(camps)
  })

  it("shows 'CARGANDO...' while camps are loading", async () => {
    let resolve: (v: typeof camps) => void = () => {}
    mockedGetCamps.mockImplementation(() => new Promise((r) => (resolve = r)))
    renderSelector()
    expect(screen.getByText(/CARGANDO\.\.\./i)).toBeInTheDocument()
    resolve(camps)
    await waitFor(() => expect(screen.queryByText(/CARGANDO\.\.\./i)).not.toBeInTheDocument())
  })

  it("renders one option per camp once loaded", async () => {
    renderSelector()
    await waitFor(() => {
      const select = screen.getByRole("combobox") as HTMLSelectElement
      expect(select.options.length).toBe(camps.length)
    })
    expect(screen.getByText(/Campamento Alpha/i)).toBeInTheDocument()
    expect(screen.getByText(/Refugio Beta/i)).toBeInTheDocument()
  })

  it("selecting another camp calls switchCamp with the NUMERIC id", async () => {
    const user = userEvent.setup()
    mockedSwitchCamp.mockResolvedValue({
      access_token: "new-tk",
      user: { ...adminUser, camp_id: "2" },
    })
    renderSelector()
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement
    await user.selectOptions(select, "2")
    await waitFor(() => expect(mockedSwitchCamp).toHaveBeenCalled())
    expect(mockedSwitchCamp).toHaveBeenCalledWith({ camp_id: 2 })
  })

  it("the selected option matches the active camp id", async () => {
    renderSelector()
    await waitFor(() => {
      const select = screen.getByRole("combobox") as HTMLSelectElement
      expect(select.value).toBe(adminUser.camp_id)
    })
  })

  it("shows 'CAMBIANDO...' while a switch is in flight", async () => {
    const user = userEvent.setup()
    let resolveSwitch: (v: unknown) => void = () => {}
    mockedSwitchCamp.mockImplementation(() => new Promise((r) => (resolveSwitch = r)))
    renderSelector()
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement
    await user.selectOptions(select, "2")
    expect(await screen.findByText(/CAMBIANDO\.\.\./i)).toBeInTheDocument()
    expect(select).toBeDisabled()
    resolveSwitch({ access_token: "tk", user: { ...adminUser, camp_id: "2" } })
  })

  it("re-enables the selector when the switch fails", async () => {
    const user = userEvent.setup()
    mockedSwitchCamp.mockRejectedValue(new Error("nope"))
    renderSelector()
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement
    await user.selectOptions(select, "2")
    await waitFor(() => expect(select).not.toBeDisabled())
  })
})
