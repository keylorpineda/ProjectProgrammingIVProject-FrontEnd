import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, dashboardMetrics } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import AdminProfile from "../AdminProfile"

import { getMe, updateMyAvatar, uploadAvatarImage } from "@/features/auth/services/auth.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/auth/services/auth.service", () => ({
  getMe: vi.fn(),
  updateMyAvatar: vi.fn(),
  uploadAvatarImage: vi.fn(),
  switchCamp: vi.fn(),
  getSessionStatus: vi.fn().mockResolvedValue({
    isActive: true,
    lastActivity: new Date().toISOString(),
    minutesUntilExpiration: 20,
    willExpireSoon: false,
  }),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/dashboard/services/dashboard.service", () => ({
  getDashboardMetrics: vi.fn(),
}))

const mockedGetMe = getMe as unknown as ReturnType<typeof vi.fn>
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>
const mockedGetDashboard = getDashboardMetrics as unknown as ReturnType<typeof vi.fn>
const mockedUploadAvatar = uploadAvatarImage as unknown as ReturnType<typeof vi.fn>
const mockedUpdateMyAvatar = updateMyAvatar as unknown as ReturnType<typeof vi.fn>

const renderAdminProfile = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <AdminProfile />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → AdminProfile", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetCamps.mockResolvedValue(camps)
    mockedGetMe.mockResolvedValue({ avatar_url: null })
    mockedGetDashboard.mockResolvedValue(dashboardMetrics)
  })

  it("renders the profile page header", async () => {
    renderAdminProfile()
    expect(await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)).toBeInTheDocument()
  })

  it("shows the user's username in the ID card", async () => {
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0)
  })

  it("shows the ID code derived from username and id", async () => {
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    expect(await screen.findByText(/ADM-ADM-/i)).toBeInTheDocument()
  })

  it("shows the rank label", async () => {
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    // Admin starts with 0 completed transfers → rank RECLUTA
    expect(await screen.findAllByText(/RECLUTA/i)).not.toHaveLength(0)
  })

  it("renders stat cards with dashboard data", async () => {
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    await waitFor(() => {
      expect(screen.getAllByText(/12/i).length).toBeGreaterThan(0)
    })
  })

  it("renders the trophy hall section", async () => {
    renderAdminProfile()
    expect(await screen.findByText(/SALA DE TROFEOS/i)).toBeInTheDocument()
  })

  it("renders all trophies in the grid", async () => {
    renderAdminProfile()
    await screen.findByText(/SALA DE TROFEOS/i)
    expect(await screen.findByText(/PRIMER MANDO/i)).toBeInTheDocument()
  })

  it("unlocks PRIMER MANDO trophy (always unlocked for admin)", async () => {
    renderAdminProfile()
    await screen.findByText(/PRIMER MANDO/i)
    // Should show badge count with at least 1 unlocked
    expect(screen.getByText(/\d+\/10 OBTENIDOS/i)).toBeInTheDocument()
  })

  it("opens trophy modal when a trophy card is clicked", async () => {
    const user = userEvent.setup()
    renderAdminProfile()
    const trophyCard = await screen.findByText(/PRIMER MANDO/i)
    await user.click(trophyCard)
    expect(await screen.findByText(/ACCEDISTE AL SISTEMA COMO ADMINISTRADOR/i)).toBeInTheDocument()
  })

  it("closes trophy modal when CERRAR button is clicked", async () => {
    const user = userEvent.setup()
    renderAdminProfile()
    const trophyCard = await screen.findByText(/PRIMER MANDO/i)
    await user.click(trophyCard)
    await screen.findByText(/ACCEDISTE AL SISTEMA COMO ADMINISTRADOR/i)
    await user.click(screen.getByRole("button", { name: /CERRAR/i }))
    await waitFor(() => {
      expect(screen.queryByText(/ACCEDISTE AL SISTEMA COMO ADMINISTRADOR/i)).not.toBeInTheDocument()
    })
  })

  it("closes trophy modal when clicking the ✕ button", async () => {
    const user = userEvent.setup()
    renderAdminProfile()
    const trophyCard = await screen.findByText(/PRIMER MANDO/i)
    await user.click(trophyCard)
    await screen.findByText(/ACCEDISTE AL SISTEMA COMO ADMINISTRADOR/i)
    await user.click(screen.getByRole("button", { name: /✕/i }))
    await waitFor(() => {
      expect(screen.queryByText(/ACCEDISTE AL SISTEMA COMO ADMINISTRADOR/i)).not.toBeInTheDocument()
    })
  })

  it("shows locked trophy with progress bar", async () => {
    renderAdminProfile()
    await screen.findByText(/SALA DE TROFEOS/i)
    // PRIMERA GESTIÓN requires 1 completed transfer; fixture has 0 → locked
    expect(await screen.findByText(/PRIMERA GESTIÓN/i)).toBeInTheDocument()
  })

  it("shows progress info in modal for a locked trophy", async () => {
    const user = userEvent.setup()
    renderAdminProfile()
    const lockedTrophy = await screen.findByText(/PRIMERA GESTIÓN/i)
    await user.click(lockedTrophy)
    expect(await screen.findByText(/PROGRESO/i)).toBeInTheDocument()
  })

  it("shows avatar initial when no avatar_url is set", async () => {
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    // The avatar shows the first character of the username
    await waitFor(() => {
      expect(screen.getAllByText("A").length).toBeGreaterThan(0)
    })
  })

  it("shows avatar image when avatar_url is provided", async () => {
    mockedGetMe.mockResolvedValue({ avatar_url: "https://example.com/avatar.png" })
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    await waitFor(() => {
      expect(screen.getByRole("img", { name: /avatar/i })).toBeInTheDocument()
    })
  })

  it("uploads avatar and updates the displayed image", async () => {
    const user = userEvent.setup()
    const newUrl = "https://example.com/new-avatar.png"
    mockedUploadAvatar.mockResolvedValue({
      url: newUrl,
      publicId: "pid",
      thumbnailUrl: newUrl,
    })
    mockedUpdateMyAvatar.mockResolvedValue(undefined)

    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["img"], "avatar.png", { type: "image/png" })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockedUploadAvatar).toHaveBeenCalledWith(file)
      expect(mockedUpdateMyAvatar).toHaveBeenCalledWith(newUrl, "pid")
    })
    expect(await screen.findByRole("img", { name: /avatar/i })).toHaveAttribute("src", newUrl)
  })

  it("shows NOTAS DE MANDO section", async () => {
    renderAdminProfile()
    expect(await screen.findByText(/NOTAS DE MANDO/i)).toBeInTheDocument()
  })

  it("shows CONFIDENCIAL badge", async () => {
    renderAdminProfile()
    expect(await screen.findByText(/CONFIDENCIAL/i)).toBeInTheDocument()
  })

  it("shows EN LÍNEA status indicator", async () => {
    renderAdminProfile()
    expect(await screen.findByText(/EN LÍNEA/i)).toBeInTheDocument()
  })

  it("XPBar shows RANGO MÁX when score reaches max tier", async () => {
    mockedGetDashboard.mockResolvedValue({
      ...dashboardMetrics,
      transfers: { ...dashboardMetrics.transfers, completed_transfers: 50 },
    })
    renderAdminProfile()
    await screen.findByText(/EXPEDIENTE DEL ADMINISTRADOR/i)
    await waitFor(() => {
      expect(screen.getAllByText(/LEYENDA ADM\./i).length).toBeGreaterThan(0)
    })
  })
})
