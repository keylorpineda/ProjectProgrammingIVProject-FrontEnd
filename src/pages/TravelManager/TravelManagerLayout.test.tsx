import { fireEvent } from "@testing-library/dom"
import { render, screen, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

import TravelManagerLayout from "./TravelManagerLayout"

import { useAuthStore } from "@/store/useAuthStore"

vi.mock("@/components/ui/InactivityGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/hooks/useAlertSocket", () => ({
  useAlertSocket: vi.fn(),
}))

// El campamento 3D (three.js) no corre en jsdom; se reemplaza por un stub.
vi.mock("@/features/camp-3d/components/CampScene3DWrapper", () => ({
  default: () => <div data-testid="camp-3d-wrapper" />,
}))

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: vi.fn((selector) => selector({ token: "fake-token" })),
}))

const mockLogout = vi.fn()

const renderLayout = (route = "/travel-manager/dashboard") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <TravelManagerLayout />
    </MemoryRouter>,
  )

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: /opciones de perfil/i }))

describe("TravelManagerLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: "TM-001",
        username: "test_manager",
        role: "TRAVEL_MANAGER",
        camp_id: "CAMP-A1",
      },
      logout: mockLogout,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the navbar chrome for an authenticated user", () => {
    renderLayout()
    expect(screen.getByText(/GESTIÓN VIAJES/i)).toBeInTheDocument()
    expect(screen.getByText("TEST_MANAGER")).toBeInTheDocument()
    expect(screen.getByText("BASE :: CAMP-A1")).toBeInTheDocument()
    expect(screen.getByText("GESTOR DE VIAJES")).toBeInTheDocument()
  })

  it("displays the navigation menu items", () => {
    // En la home (camp) no hay ventana, así que las etiquetas del nav son únicas.
    renderLayout("/travel-manager/camp")
    expect(screen.getByText("TABLERO")).toBeInTheDocument()
    expect(screen.getByText("EXPEDICIONES")).toBeInTheDocument()
    expect(screen.getByText("EQUIPO")).toBeInTheDocument()
    expect(screen.getByText("TRASLADOS")).toBeInTheDocument()
    expect(screen.getByText("RECURSOS")).toBeInTheDocument()
  })

  it("calls logout from the avatar menu", () => {
    renderLayout()
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: /cerrar sesión/i }))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it("exposes the profile option in the avatar menu", () => {
    renderLayout()
    openMenu()
    expect(screen.getByRole("menuitem", { name: /ver perfil/i })).toBeInTheDocument()
  })

  it("updates UTC time without crashing", () => {
    renderLayout()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThan(0)
  })

  it("renders fallback identity values when user data is partial", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "tm-fallback" },
      logout: mockLogout,
    })
    renderLayout()
    expect(screen.getByText("BASE :: N/A")).toBeInTheDocument()
    expect(screen.getByText("TM-FALLBACK")).toBeInTheDocument()
  })

  it("renders anonymous identity fallbacks without user data", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      logout: mockLogout,
    })
    renderLayout()
    expect(screen.getByText("BASE :: N/A")).toBeInTheDocument()
    expect(screen.getByText("TRAVEL MGR")).toBeInTheDocument()
  })
})
