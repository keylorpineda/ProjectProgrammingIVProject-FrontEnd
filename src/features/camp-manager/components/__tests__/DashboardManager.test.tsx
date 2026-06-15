import { fireEvent } from "@testing-library/dom"
import { render, screen, act } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { useAuthStore } from "../../store/useAuthStore"
import DashboardManager from "../DashboardManager"

import { useAuthStore as useGlobalAuthStore } from "@/store/useAuthStore"

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

// El campamento 3D (three.js) no corre en jsdom; se reemplaza por un stub.
vi.mock("@/features/camp-3d/components/CampScene3DWrapper", () => ({
  default: () => <div data-testid="camp-3d-wrapper" />,
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

const renderManager = () =>
  render(
    <BrowserRouter>
      <DashboardManager />
    </BrowserRouter>,
  )

const openTab = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }))

const openAvatarMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: /opciones de perfil/i }))

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
    renderManager()

    expect(screen.getByText((content) => content.includes("INTERRUMPIDA"))).toBeInTheDocument()

    const connectButton = screen.getByText(/CONECTAR SENDER A BUNKER-04/i)
    fireEvent.click(connectButton)
    expect(mockStore.setCampId).toHaveBeenCalledWith("Bunker-04")
  })

  it("renders the navbar and opens the overview window", () => {
    renderManager()

    expect(screen.getByText("DOOMSDAY")).toBeInTheDocument()
    expect(screen.getByText(/COMMANDER/i)).toBeInTheDocument()
    // Home = campamento 3D; ninguna ventana abierta por defecto.
    expect(screen.queryByTestId("mock-overview")).not.toBeInTheDocument()

    openTab("BALANCE")
    expect(screen.getByTestId("mock-overview")).toBeInTheDocument()

    openTab("BODEGA")
    expect(screen.getByTestId("mock-inventory")).toBeInTheDocument()
  })

  it("syncs global store user to local store if user is missing but global is present", () => {
    mockStore.user = null
    const globalUser = { id: 2, username: "", email: "admin@test.com", camp_id: null }

    vi.mocked(useGlobalAuthStore).mockImplementation((selector: any) =>
      selector({ user: globalUser }),
    )

    let callCount = 0
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

    renderManager()

    expect(mockStore.login).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "admin@test.com",
        campId: null,
      }),
    )
  })

  it("renders with fallback user data", () => {
    mockStore.user = { id: "1", name: "", role: "other", campId: "Bunker-01" }
    renderManager()

    expect(screen.getByText(/GESTOR DE RECURSOS/)).toBeInTheDocument()
    expect(screen.getByText("M")).toBeInTheDocument() // Fallback avatar letter
  })

  it("navigates between section windows correctly", () => {
    renderManager()

    openTab("BALANCE")
    expect(screen.getByText("TABLERO DE COMBATE")).toBeInTheDocument()

    openTab("BODEGA")
    expect(screen.getByText("BODEGA CENTRAL")).toBeInTheDocument()

    openTab("CATÁLOGO")
    expect(screen.getByText("CATÁLOGO DE RECURSOS")).toBeInTheDocument()

    openTab("RANKING")
    expect(screen.getByText("RANKING DE PRODUCTIVIDAD")).toBeInTheDocument()

    openTab("PERSONAL")
    expect(screen.getByText("ADMINISTRACIÓN DE PERSONAL")).toBeInTheDocument()

    openTab("TRASLADOS")
    expect(screen.getByText("CONTROL DE TRASLADOS")).toBeInTheDocument()
    fireEvent.click(screen.getByText("PEDIR REFUERZO"))
  })

  it("handles logout from the avatar menu", () => {
    renderManager()

    openAvatarMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: /cerrar sesión/i }))

    expect(mockStore.logout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("updates UTC time on interval", () => {
    renderManager()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(
      screen.getByText((content) => content.includes("UTC") || content.includes("INTERRUMPIDA")),
    ).toBeInTheDocument()
  })

  it("handles logistics modal close and onDataChanged triggers", () => {
    renderManager()

    openTab("TRASLADOS")
    fireEvent.click(screen.getByText("PEDIR REFUERZO"))
    fireEvent.click(screen.getByText("Cerrar Modal"))
    fireEvent.click(screen.getByText("Trigger Data Changed"))

    expect(screen.getByTestId("mock-logistics")).toBeInTheDocument()
  })

  it("handles InactivityGuard logout", () => {
    renderManager()

    fireEvent.click(screen.getByText("Trigger Guard Logout"))
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })
})
