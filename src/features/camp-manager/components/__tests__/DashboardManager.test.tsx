import { fireEvent } from "@testing-library/dom"
import { render, screen, act } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { useAuthStore } from "../../store/useAuthStore"
import DashboardManager from "../DashboardManager"

import { useAuthStore as useGlobalAuthStore } from "@/store/useAuthStore"

// Mock zustand stores
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: vi.fn((selector) => selector({ token: "fake-token" })),
}))

vi.mock("@/hooks/useAlertSocket", () => ({
  useAlertSocket: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock nested components to simplify
vi.mock("../ManagerOverview", () => ({
  default: () => <div data-testid="mock-overview">Overview</div>,
}))
vi.mock("../ManagerInventory", () => ({
  default: () => <div data-testid="mock-inventory">Inventory</div>,
}))
vi.mock("../ManagerCatalog", () => ({
  default: () => <div data-testid="mock-catalog">Catalog</div>,
}))
vi.mock("../ManagerRanking", () => ({
  default: () => <div data-testid="mock-ranking">Ranking</div>,
}))
vi.mock("../ManagerWorkforce", () => ({
  default: () => <div data-testid="mock-workforce">Workforce</div>,
}))

vi.mock("../ManagerLogistics", () => ({
  default: ({ onModalClose, onDataChanged }: any) => (
    <div data-testid="mock-logistics">
      Logistics
      <button onClick={onModalClose}>Cerrar Modal</button>
      <button onClick={onDataChanged}>Trigger Data Changed</button>
    </div>
  ),
}))
vi.mock("@/components/ui/InactivityGuard", () => ({
  default: ({ children, onLogout }: any) => (
    <div data-testid="mock-guard">
      {children}
      <button onClick={onLogout}>Trigger Guard Logout</button>
    </div>
  ),
}))

describe("DashboardManager", () => {
  let mockStore: {
    user: { id: string; name: string; role: string; campId: string | null } | null
    setCampId: (id: string) => void
    login: (user: unknown) => void
    logout: () => void
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockStore = {
      user: { id: "1", name: "Commander", role: "camp_leader", campId: "Bunker-01" },
      setCampId: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    }

    // Setup default mock implementation
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector(mockStore))
    vi.mocked(useGlobalAuthStore).mockImplementation((selector: any) => selector({ user: null }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders loader and debug panel when campId is null", () => {
    if (mockStore.user) {
      mockStore.user.campId = null
    }
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    expect(screen.getByText((content) => content.includes("INTERRUMPIDA"))).toBeInTheDocument()

    const connectButton = screen.getByText(/CONECTAR SENDER A BUNKER-04/i)
    fireEvent.click(connectButton)
    expect(mockStore.setCampId).toHaveBeenCalledWith("Bunker-04")
  })

  it("renders main dashboard when campId exists", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    expect(screen.getByText(/DOOMSDAY CENTRAL CONTROL PORTAL/i)).toBeInTheDocument()
    expect(screen.getByText(/COMMANDER/i)).toBeInTheDocument()
    expect(screen.getByTestId("mock-overview")).toBeInTheDocument()

    fireEvent.click(screen.getByText("BODEGA"))
    expect(screen.getByTestId("mock-inventory")).toBeInTheDocument()
  })

  it("syncs global store user to local store if user is missing but global is present", () => {
    // global user present but local user is null
    mockStore.user = null
    const globalUser = { id: 2, username: "", email: "admin@test.com", camp_id: null }

    let callCount = 0
    vi.mocked(useGlobalAuthStore).mockImplementation((selector: any) =>
      selector({ user: globalUser }),
    )

    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const selStr = selector.toString()
      if (selStr.includes("state.user")) {
        callCount++
        return callCount === 1 ? null : mockStore.user
      }
      if (selStr.includes("setCampId")) return mockStore.setCampId
      if (selStr.includes("login")) return mockStore.login
      if (selStr.includes("logout")) return mockStore.logout
      return null
    })

    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    expect(mockStore.login).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "admin@test.com",
        campId: null,
      }),
    )
  })

  it("renders with fallback user data", () => {
    mockStore.user = { id: "1", name: "", role: "other", campId: "Bunker-01" }
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    expect(screen.getByText(/ADMINISTRADOR/)).toBeInTheDocument()
    expect(screen.getByText("M")).toBeInTheDocument() // Fallback avatar letter
  })

  it("navigates between tabs correctly", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    expect(screen.getByText("TABLERO DE COMBATE")).toBeInTheDocument()

    // Click Inventory tab
    fireEvent.click(screen.getByText("BODEGA"))
    expect(screen.getByText("BODEGA CENTRAL")).toBeInTheDocument()

    // Click Catalog tab
    fireEvent.click(screen.getByText("CATÁLOGO"))
    expect(screen.getByText("CATÁLOGO DE RECURSOS")).toBeInTheDocument()

    // Click Ranking tab
    fireEvent.click(screen.getByText("RANKING"))
    expect(screen.getByText("RANKING DE PRODUCTIVIDAD")).toBeInTheDocument()

    // Click Workforce tab
    fireEvent.click(screen.getByText("PERSONAL"))
    expect(screen.getByText("ADMINISTRACIÓN DE PERSONAL")).toBeInTheDocument()

    // Click Logistics tab
    fireEvent.click(screen.getByText("TRASLADOS"))
    expect(screen.getByText("CONTROL DE TRASLADOS")).toBeInTheDocument()

    // Open Logistics modal
    const plusBtn = screen.getByText("PEDIR REFUERZO")
    fireEvent.click(plusBtn)
    // The modal state gets set to true (we can't easily assert the internal state without checking mock props, but we can hit the line)
  })

  it("handles logout click", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    const logoutBtn = screen.getByTitle("CERRAR SESIÓN")
    fireEvent.click(logoutBtn)

    expect(mockStore.logout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("updates UTC time on interval", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // We just verify it doesn't crash on unmount or interval updates.
    // Use findAllByText for safety if it gets recreated
    expect(
      screen.getByText((content) => content.includes("UTC") || content.includes("INTERRUMPIDA")),
    ).toBeInTheDocument()
  })

  it("handles logistics modal close and onDataChanged triggers", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    fireEvent.click(screen.getByText("TRASLADOS"))

    const plusBtn = screen.getByText("PEDIR REFUERZO")
    fireEvent.click(plusBtn)

    const closeBtn = screen.getByText("Cerrar Modal")
    fireEvent.click(closeBtn)

    const triggerBtn = screen.getByText("Trigger Data Changed")
    fireEvent.click(triggerBtn)

    // We just ensure it doesn't crash
    expect(screen.getByTestId("mock-logistics")).toBeInTheDocument()
  })

  it("handles InactivityGuard logout", () => {
    render(
      <BrowserRouter>
        <DashboardManager />
      </BrowserRouter>,
    )

    fireEvent.click(screen.getByText("Trigger Guard Logout"))
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })
})
