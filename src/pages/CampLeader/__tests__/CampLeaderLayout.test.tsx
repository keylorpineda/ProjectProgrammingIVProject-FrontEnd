import { fireEvent } from "@testing-library/dom"
import { act, screen, waitFor } from "@testing-library/react"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

import { campLeaderUser } from "../../../test/fixtures"
import { renderWithProviders } from "../../../test/test-utils"
import CampLeaderLayout from "../CampLeaderLayout"
import {
  explorationsService,
  resourcesService,
  transfersService,
  usersService,
} from "../lib/services"

import type {
  DashboardViewProps,
  ExplorationsViewProps,
  SidebarProps,
  TopbarProps,
  TransfersViewProps,
} from "../components/types"

import { useAuthStore } from "@/store/useAuthStore"

let capturedExplorationsProps: ExplorationsViewProps | null = null
vi.mock("../components/ExplorationsView", () => ({
  default: (props: ExplorationsViewProps) => {
    capturedExplorationsProps = props
    return <div data-testid="mock-explorations-view">Explorations View</div>
  },
}))

let capturedTransfersProps: TransfersViewProps | null = null
vi.mock("../components/TransfersView", () => ({
  default: (props: TransfersViewProps) => {
    capturedTransfersProps = props
    return <div data-testid="mock-transfers-view">Transfers View</div>
  },
}))

let capturedDashboardProps: DashboardViewProps | null = null
vi.mock("../components/DashboardView", () => ({
  default: (props: DashboardViewProps) => {
    capturedDashboardProps = props
    return <div data-testid="mock-dashboard-view">Dashboard View</div>
  },
}))

vi.mock("../components/InventoryView", () => ({
  default: () => <div data-testid="mock-inventory-view">Inventory View</div>,
}))

vi.mock("../components/RankingView", () => ({
  default: ({ campId }: { campId: number }) => (
    <div data-testid="mock-ranking-view">Ranking View for camp {campId}</div>
  ),
}))

vi.mock("../components/MembersView", () => ({
  default: () => <div data-testid="mock-members-view">Members View</div>,
}))

vi.mock("../components/OccupationsView", () => ({
  default: () => <div data-testid="mock-occupations-view">Occupations View</div>,
}))

vi.mock("../components/ProfileView", () => ({
  default: () => <div data-testid="mock-profile-view">Profile View</div>,
}))

vi.mock("../components/Topbar", () => ({
  default: ({ survivalScore }: TopbarProps) => (
    <div data-testid="mock-topbar">Topbar Score: {survivalScore}</div>
  ),
}))

vi.mock("../components/Footer", () => ({
  default: () => <div data-testid="mock-footer">Footer</div>,
}))

vi.mock("../components/Sidebar", () => ({
  default: ({ activeTab, setActiveTab, survivalScore }: SidebarProps) => (
    <div data-testid="mock-sidebar">
      Sidebar: Active = {activeTab}, Score = {survivalScore}
      <button onClick={() => setActiveTab("dashboard")}>TABLERO</button>
      <button onClick={() => setActiveTab("explorations")}>EXPLORACIONES</button>
      <button onClick={() => setActiveTab("transfers")}>TRASLADOS</button>
      <button onClick={() => setActiveTab("inventory")}>INVENTARIO</button>
      <button onClick={() => setActiveTab("ranking")}>RANKING</button>
      <button onClick={() => setActiveTab("members")}>MIEMBROS</button>
      <button onClick={() => setActiveTab("occupations")}>OCUPACIONES</button>
      <button onClick={() => setActiveTab("profile")}>PERFIL</button>
      <button onClick={() => setActiveTab("invalid-tab")}>INVALID</button>
    </div>
  ),
}))

vi.mock("../lib/services", () => ({
  explorationsService: {
    getExplorations: vi.fn().mockResolvedValue([]),
    createExploration: vi.fn().mockResolvedValue({}),
    departExploration: vi.fn().mockResolvedValue({}),
    returnExploration: vi.fn().mockResolvedValue({}),
    cancelExploration: vi.fn().mockResolvedValue({}),
  },
  transfersService: {
    getCampTransferRequests: vi.fn().mockResolvedValue([]),
    createTransferRequest: vi.fn().mockResolvedValue({}),
    handleTransferApproval: vi.fn().mockResolvedValue({}),
    cancelTransferRequest: vi.fn().mockResolvedValue({}),
    arriveTransferRequest: vi.fn().mockResolvedValue({}),
  },
  resourcesService: {
    getCampInventory: vi.fn().mockResolvedValue([]),
    getInventoryMovements: vi.fn().mockResolvedValue([]),
    getAllResources: vi.fn().mockResolvedValue([]),
  },
  usersService: {
    getCampPersons: vi.fn().mockResolvedValue([]),
    getCampDashboard: vi.fn().mockResolvedValue({
      balances: [],
      statistics: {
        total_persons: 0,
        active_workers: 0,
        injured_or_sick: 0,
        exploring: 0,
        deceased: 0,
        occupancy_rate: 0,
        explorations_completed: 0,
        survival_score: 100,
      },
    }),
  },
}))

let capturedOnLogout: any = null
vi.mock("@/components/ui/InactivityGuard", () => ({
  default: ({ children, onLogout }: any) => {
    capturedOnLogout = onLogout
    return <div>{children}</div>
  },
}))

// Mock window.fetch for loading camps raw endpoint
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [{ id: "1", name: "Camp Alpha", latitude: 10, longitude: -84 }],
})
vi.stubGlobal("fetch", mockFetch)

const renderLayout = () =>
  renderWithProviders(<CampLeaderLayout />, {
    user: campLeaderUser,
    route: "/campleader",
    withAdminAuthProvider: false,
  })

const originalLocation = window.location

describe("CampLeaderLayout Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    // @ts-expect-error: Mocking window.location for testing purposes
    delete window.location

    window.location = { ...originalLocation, href: "" } as any
  })

  afterEach(() => {
    // @ts-expect-error: restoring mocked window.location
    window.location = originalLocation
  })

  it("shows loading state and resolves Phase 1 data successfully", async () => {
    renderLayout()
    expect(screen.getByText(/cargando datos del campamento/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("mock-dashboard-view")).toBeInTheDocument()
  })

  it("gracefully catches data load failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(usersService.getCampDashboard).mockRejectedValueOnce(new Error("API Down"))

    renderLayout()

    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("mock-dashboard-view")).toBeInTheDocument()
  })

  it("switches tabs correctly when Sidebar is clicked", async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    // Click inventory tab button
    fireEvent.click(screen.getByRole("button", { name: "INVENTARIO" }))
    expect(screen.getByTestId("mock-inventory-view")).toBeInTheDocument()

    // Click ranking tab button
    fireEvent.click(screen.getByRole("button", { name: "RANKING" }))
    expect(screen.getByTestId("mock-ranking-view")).toBeInTheDocument()

    // Click members tab button
    fireEvent.click(screen.getByRole("button", { name: "MIEMBROS" }))
    expect(screen.getByTestId("mock-members-view")).toBeInTheDocument()

    // Click occupations tab button
    fireEvent.click(screen.getByRole("button", { name: "OCUPACIONES" }))
    expect(screen.getByTestId("mock-occupations-view")).toBeInTheDocument()

    // Click profile tab button
    fireEvent.click(screen.getByRole("button", { name: "PERFIL" }))
    expect(screen.getByTestId("mock-profile-view")).toBeInTheDocument()

    // Click invalid tab button
    fireEvent.click(screen.getByRole("button", { name: "INVALID" }))
    expect(screen.queryByTestId("mock-dashboard-view")).not.toBeInTheDocument()
    expect(screen.queryByTestId("mock-inventory-view")).not.toBeInTheDocument()
  })

  it("handles explorations operations successfully and triggers reload", async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    // Navigate to explorations tab to capture props
    fireEvent.click(screen.getByRole("button", { name: "EXPLORACIONES" }))

    expect(screen.getByTestId("mock-explorations-view")).toBeInTheDocument()
    expect(capturedExplorationsProps).not.toBeNull()

    // 1. Create Exploration
    const createData = { name: "Search A" }
    await act(async () => {
      await capturedExplorationsProps!.onCreateExploration(createData)
    })
    expect(explorationsService.createExploration).toHaveBeenCalledWith(createData)

    // 2. Depart Exploration
    await act(async () => {
      await capturedExplorationsProps!.onDepartExploration(123)
    })
    expect(explorationsService.departExploration).toHaveBeenCalledWith(123)

    // 3. Return Exploration
    const returnData = { notes: "Found supplies" }
    await act(async () => {
      await capturedExplorationsProps!.onReturnExploration(123, returnData)
    })
    expect(explorationsService.returnExploration).toHaveBeenCalledWith(123, returnData)

    // 4. Cancel Exploration
    await act(async () => {
      await capturedExplorationsProps!.onCancelExploration(123)
    })
    expect(explorationsService.cancelExploration).toHaveBeenCalledWith(123)
  })

  it("handles transfers operations successfully and triggers reload", async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    // Navigate to transfers tab to capture props
    fireEvent.click(screen.getByRole("button", { name: "TRASLADOS" }))

    expect(screen.getByTestId("mock-transfers-view")).toBeInTheDocument()
    expect(capturedTransfersProps).not.toBeNull()

    // 1. Create Transfer Request
    const trData = { resource_id: 1, quantity: 10 }
    await act(async () => {
      await capturedTransfersProps!.onCreateTransferRequest(trData)
    })
    expect(transfersService.createTransferRequest).toHaveBeenCalledWith(trData)

    // 2. Approve/Reject Transfer
    await act(async () => {
      await capturedTransfersProps!.onApproveTransferRequest(100, true)
    })
    expect(transfersService.handleTransferApproval).toHaveBeenCalledWith(
      100,
      true,
      expect.any(Number),
    )

    // 3. Cancel Transfer
    await act(async () => {
      await capturedTransfersProps!.onCancelTransferRequest(100)
    })
    expect(transfersService.cancelTransferRequest).toHaveBeenCalledWith(100)

    // 4. Arrive Transfer
    await act(async () => {
      await capturedTransfersProps!.onArriveTransferRequest(100)
    })
    expect(transfersService.arriveTransferRequest).toHaveBeenCalledWith(100)
  })

  it("handles inactivity logout", async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    expect(useAuthStore.getState().user).not.toBeNull()

    act(() => {
      capturedOnLogout()
    })

    expect(useAuthStore.getState().user).toBeNull()
    expect(window.location.href).toBe("/login")
  })

  it("handles dashboard navigation callback", async () => {
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })
    expect(capturedDashboardProps).not.toBeNull()
    act(() => {
      capturedDashboardProps!.onNavigate("inventory")
    })
    expect(screen.getByTestId("mock-inventory-view")).toBeInTheDocument()
  })

  it("gracefully catches fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Fetch failed"))
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("mock-dashboard-view")).toBeInTheDocument()
  })

  it("silently ignores phase 2 data loading failures", async () => {
    vi.mocked(resourcesService.getInventoryMovements).mockRejectedValueOnce(
      new Error("Phase 2 fail"),
    )
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("mock-dashboard-view")).toBeInTheDocument()
  })

  it("handles campsRaw as paginated object with .data property", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: "2", name: "Camp Beta" }] }),
    })
    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("mock-dashboard-view")).toBeInTheDocument()
  })

  it("shows ACTUALIZANDO overlay while an action is pending", async () => {
    let resolveCreate!: (v: unknown) => void
    vi.mocked(explorationsService.createExploration).mockImplementationOnce(
      () => new Promise((res) => (resolveCreate = res)),
    )

    renderLayout()
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos del campamento/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "EXPLORACIONES" }))

    act(() => {
      capturedExplorationsProps!.onCreateExploration({ name: "Test" })
    })

    await waitFor(() => {
      expect(screen.getByText(/ACTUALIZANDO REGISTRO CENTRAL/i)).toBeInTheDocument()
    })

    await act(async () => {
      resolveCreate({})
    })
  })
})
