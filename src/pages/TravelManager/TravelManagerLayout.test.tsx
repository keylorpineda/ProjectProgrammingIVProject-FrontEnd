import { render, screen, fireEvent, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

import TravelManagerLayout from "./TravelManagerLayout"

import { useAuthStore } from "@/store/useAuthStore"

// Mock the InactivityGuard component to just render its children
vi.mock("@/components/ui/InactivityGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/hooks/useAlertSocket", () => ({
  useAlertSocket: vi.fn(),
}))

// Mock the Auth Store
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: vi.fn((selector) => selector({ token: "fake-token" })),
}))

const mockLogout = vi.fn()

describe("TravelManagerLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock implementation of useAuthStore
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

  it("renders the layout correctly for authenticated user", () => {
    render(
      <MemoryRouter initialEntries={["/travel-manager/dashboard"]}>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    // Check if the title exists
    expect(screen.getAllByText(/GESTIÓN VIAJES/i).length).toBeGreaterThan(0)

    // Check if username/role elements appear
    expect(screen.getByText("TEST_MANAGER")).toBeInTheDocument()
    expect(screen.getByText("BASE::CAMP-A1")).toBeInTheDocument()
    expect(screen.getByText("TRAVEL MANAGER")).toBeInTheDocument()
  })

  it("displays the navigation menu items", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    // Check if navigation links exist
    expect(screen.getByText("TABLERO")).toBeInTheDocument()
    expect(screen.getByText("EXPEDICIONES")).toBeInTheDocument()
    expect(screen.getByText("EQUIPO")).toBeInTheDocument()
    expect(screen.getByText("TRASLADOS")).toBeInTheDocument()
    expect(screen.getByText("RECURSOS")).toBeInTheDocument()
    expect(screen.getByText("PERFIL")).toBeInTheDocument()
  })

  it("calls logout when logout button is clicked", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    // Find the desktop logout button
    const logoutButtons = screen.getAllByRole("button", { name: /CERRAR SESIÓN/i })

    // Click the desktop logout button
    fireEvent.click(logoutButtons[0])

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it("updates UTC time correctly", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // There isn't an easy way to check the exact time string without matching the format,
    // but the test confirms the interval logic doesn't crash the component
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThan(0)
  })

  it("opens mobile sidebar when menu button is clicked", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    // Click the open menu button (visible only in mobile view typically, but in JSDOM it exists in DOM)
    const menuButton = screen.getByLabelText("Abrir menú")
    fireEvent.click(menuButton)

    // Check if the close sidebar button appears
    expect(screen.getAllByLabelText("Cerrar menú").length).toBeGreaterThan(0)
  })

  it("closes the mobile sidebar from the backdrop keyboard handler", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByLabelText(/Abrir/i))
    const closeBackdrop = screen.getAllByLabelText(/Cerrar/i)[1]

    fireEvent.keyDown(closeBackdrop, { key: "Enter" })

    expect(screen.queryAllByLabelText(/Cerrar/i)).toHaveLength(1)
  })

  it("renders fallback identity values when user data is partial", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "tm-fallback" },
      logout: mockLogout,
    })

    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    expect(screen.getAllByText("BASE::N/A").length).toBeGreaterThan(0)
    expect(screen.getByText("TM-FALLBACK")).toBeInTheDocument()
    expect(screen.getByText("T")).toBeInTheDocument()
  })

  it("closes the mobile sidebar from the backdrop space key", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByLabelText(/Abrir/i))
    const closeBackdrop = screen.getAllByLabelText(/Cerrar/i)[1]

    fireEvent.keyDown(closeBackdrop, { key: " " })

    expect(screen.queryAllByLabelText(/Cerrar/i)).toHaveLength(1)
  })

  it("keeps the mobile sidebar open for unrelated backdrop keys", () => {
    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByLabelText(/Abrir/i))
    const closeBackdrop = screen.getAllByLabelText(/Cerrar/i)[1]

    fireEvent.keyDown(closeBackdrop, { key: "Escape" })

    expect(screen.queryAllByLabelText(/Cerrar/i)).toHaveLength(3)
  })

  it("renders anonymous identity fallbacks without user data", () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      logout: mockLogout,
    })

    render(
      <MemoryRouter>
        <TravelManagerLayout />
      </MemoryRouter>,
    )

    expect(screen.getAllByText("BASE::N/A").length).toBeGreaterThan(0)
    expect(screen.getByText("TRAVEL MGR")).toBeInTheDocument()
    expect(screen.getByText("T")).toBeInTheDocument()
  })
})
