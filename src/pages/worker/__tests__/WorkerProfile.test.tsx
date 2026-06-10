import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import WorkerProfile from "../WorkerProfile"

import { workerUser } from "@/test/fixtures"
import { renderWithProviders, userEvent } from "@/test/test-utils"
import {
  workerAssignedResources,
  workerBadges,
  workerCamp,
  workerProfile,
} from "@/test/workerFixtures"

const svc = vi.hoisted(() => ({
  getAssignedResources: vi.fn(),
  getProfessions: vi.fn(),
  getResources: vi.fn(),
  getInventory: vi.fn(),
  getInventoryMovements: vi.fn(),
  getMyBadges: vi.fn(),
  getDailyBalance: vi.fn(),
  getMyProfile: vi.fn(),
  getCampById: vi.fn(),
  getCampExplorations: vi.fn(),
  getMyAchievements: vi.fn(),
}))

vi.mock("@/features/worker/services/workerService", () => ({
  default: svc,
  workerService: svc,
  setAuthToken: vi.fn(),
  handleApiError: vi.fn(),
}))

const renderPage = () =>
  renderWithProviders(<WorkerProfile />, {
    user: workerUser,
    token: "tk",
    route: "/worker/profile",
  })

describe("Worker → Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    svc.getMyProfile.mockResolvedValue(workerProfile)
    svc.getMyBadges.mockResolvedValue(workerBadges)
    svc.getCampById.mockResolvedValue(workerCamp)
    svc.getAssignedResources.mockResolvedValue(workerAssignedResources)
    svc.getMyAchievements.mockResolvedValue([])
  })

  it("renders the survivor dossier heading", async () => {
    renderPage()
    expect(
      await screen.findByRole("heading", { name: /EXPEDIENTE DEL SUPERVIVIENTE/i }),
    ).toBeInTheDocument()
  })

  it("renders the badges and assigned-equipment sections", async () => {
    renderPage()
    expect(await screen.findByText("INSIGNIAS DEL SUPERVIVIENTE")).toBeInTheDocument()
    expect(screen.getByText("EQUIPO ASIGNADO PERSONALMENTE")).toBeInTheDocument()
  })

  it("navigates back to the worker dashboard from the header action", async () => {
    renderPage()
    await userEvent.click(await screen.findByRole("button", { name: /TABLERO/i }))
    expect(screen.getByRole("button", { name: /TABLERO/i })).toBeInTheDocument()
  })

  it("lists the personally assigned equipment from the API", async () => {
    renderPage()
    expect(await screen.findByText("Ración semanal")).toBeInTheDocument()
  })
  it("shows empty equipment while badge placeholder data keeps the badge section usable", async () => {
    svc.getMyBadges.mockResolvedValue([])
    svc.getAssignedResources.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText(/SIN INSIGNIAS/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("SIN EQUIPO ASIGNADO")).toBeInTheDocument())
  })

  it("shows empty badges when no remote or first-login badge exists", async () => {
    svc.getMyBadges.mockResolvedValue([])
    svc.getAssignedResources.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText(/SIN INSIGNIAS/i)).toBeInTheDocument()
    expect(screen.getByText(/COMPLETE MISIONES/i)).toBeInTheDocument()
  })

  it("renders the first-login badge from localStorage and opens/closes its modal", async () => {
    window.localStorage.setItem(`gdf_first_login_${workerUser.id}`, "1")
    svc.getMyBadges.mockResolvedValue([])

    renderPage()

    const localBadge = await screen.findByRole("button", { name: /PRIMER TRABAJO/i })
    fireEvent.keyDown(localBadge, { key: "Escape" })
    expect(screen.queryByText("LOGRO DESBLOQUEADO")).not.toBeInTheDocument()

    fireEvent.keyDown(localBadge, { key: " " })
    expect(screen.getByText("LOGRO DESBLOQUEADO")).toBeInTheDocument()
    expect(screen.getByText("DEBUT")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "ACEPTAR" }))
    expect(screen.queryByText("LOGRO DESBLOQUEADO")).not.toBeInTheDocument()

    await userEvent.click(localBadge)
    expect(screen.getByText("LOGRO DESBLOQUEADO")).toBeInTheDocument()
  })

  it("renders the first-login badge from remote achievements", async () => {
    svc.getMyBadges.mockResolvedValue([])
    svc.getMyAchievements.mockResolvedValue([
      { achievement_name: "PRIMER_TRABAJO", obtained_at: "2026-02-04T00:00:00.000Z" },
    ])

    renderPage()

    const localBadge = await screen.findByRole("button", { name: /PRIMER TRABAJO/i })
    await userEvent.click(localBadge)

    expect(screen.getByText("LOGRO DESBLOQUEADO")).toBeInTheDocument()
    expect(screen.getByText("DEBUT")).toBeInTheDocument()
  })

  it("opens a backend badge with keyboard and handles image load failure", async () => {
    renderPage()

    const badge = await screen.findByRole("button", { name: /Primer Trabajo/i })
    const image = screen.getByAltText("Primer Trabajo")
    fireEvent.error(image)
    expect(image).toHaveStyle({ display: "none" })

    await userEvent.click(badge)
    expect(screen.getByText("LOGRO DESBLOQUEADO")).toBeInTheDocument()
    expect(screen.getAllByText(/EN EXHIBICIÓN/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("img", { name: "Primer Trabajo" }).length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole("button", { name: "ACEPTAR" }))
    fireEvent.keyDown(badge, { key: "Enter" })
    expect(screen.getByText("LOGRO DESBLOQUEADO")).toBeInTheDocument()
  })

  it("renders safe fallbacks when profile, camp and badge asset details are missing", async () => {
    svc.getMyProfile.mockResolvedValue({ ...workerProfile, person: null })
    svc.getCampById.mockResolvedValue({ camp: null, metrics: workerCamp.metrics })
    svc.getMyBadges.mockResolvedValue([
      {
        ...workerBadges[0],
        asset: null,
        acquired_at: null,
        is_displayed: false,
      },
    ])
    svc.getAssignedResources.mockResolvedValue([
      {
        ...workerAssignedResources[0],
        name: undefined,
        description: undefined,
        category: undefined,
        image_url: "https://example.test/equipment.png",
        asset: {
          name: "Linterna",
          description: "Luz de emergencia",
          category: "tools",
          rarity: 3,
          thumbnail_url: "https://example.test/thumb.png",
        },
      },
    ])

    renderPage()

    expect(await screen.findByText("Linterna")).toBeInTheDocument()
    expect(screen.getByText("CAMPAMENTO #1")).toBeInTheDocument()
    expect(screen.queryByText("NOMBRE COMPLETO")).not.toBeInTheDocument()
    expect(await screen.findByText("Insignia")).toBeInTheDocument()

    fireEvent.error(screen.getByAltText("Linterna"))
    expect(screen.getByAltText("Linterna")).toHaveStyle({ display: "none" })
  })

  it("renders generic equipment fallbacks when assigned resource fields are missing", async () => {
    svc.getAssignedResources.mockResolvedValue([
      {
        id: 987,
        asset: {},
      },
    ])

    renderPage()

    expect(await screen.findByText("Equipo")).toBeInTheDocument()
    expect(screen.getByText("GENERAL")).toBeInTheDocument()
  })
})
