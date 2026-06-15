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
  TransfersViewProps,
} from "../components/types"

import { useAuthStore } from "@/store/useAuthStore"

// El campamento 3D (three.js) no corre en jsdom; se reemplaza por un stub.
vi.mock("@/features/camp-3d/components/CampScene3DWrapper", () => ({
  default: () => <div data-testid="camp-3d-wrapper" />,
}))

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

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

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

/** Abre una sección haciendo clic en su botón de la navbar y espera el view. */
const openTab = async (buttonName: RegExp, testId: string) => {
  fireEvent.click(screen.getByRole("button", { name: buttonName }))
  return screen.findByTestId(testId)
}

describe("CampLeaderLayout Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    capturedExplorationsProps = null
    capturedTransfersProps = null
    capturedDashboardProps = null
  })

  it("renders the navbar and shows the camp home by default", async () => {
    renderLayout()
    expect(screen.getByRole("button", { name: /opciones de perfil/i })).toBeInTheDocument()
    // La home es el campamento 3D (stub); ninguna ventana de sección abierta.
    expect(await screen.findByTestId("camp-3d-wrapper")).toBeInTheDocument()
    expect(screen.queryByTestId("mock-dashboard-view")).not.toBeInTheDocument()
  })

  it("opens the dashboard window from the navbar after data resolves", async () => {
    renderLayout()
    expect(await openTab(/^TABLERO$/, "mock-dashboard-view")).toBeInTheDocument()
  })

  it("switches between section windows from the navbar", async () => {
    renderLayout()
    expect(await openTab(/^INVENTARIO$/, "mock-inventory-view")).toBeInTheDocument()
    expect(await openTab(/^RANKING$/, "mock-ranking-view")).toBeInTheDocument()
    expect(await openTab(/^MIEMBROS$/, "mock-members-view")).toBeInTheDocument()
    expect(await openTab(/^OCUPACIONES$/, "mock-occupations-view")).toBeInTheDocument()
  })

  it("opens the profile from the avatar menu", async () => {
    renderLayout()
    fireEvent.click(screen.getByRole("button", { name: /opciones de perfil/i }))
    fireEvent.click(screen.getByRole("menuitem", { name: /ver perfil/i }))
    expect(await screen.findByTestId("mock-profile-view")).toBeInTheDocument()
  })

  it("gracefully catches data load failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(usersService.getCampDashboard).mockRejectedValueOnce(new Error("API Down"))
    renderLayout()
    expect(await openTab(/^TABLERO$/, "mock-dashboard-view")).toBeInTheDocument()
  })

  it("handles explorations operations successfully and triggers reload", async () => {
    renderLayout()
    await openTab(/^EXPLORACIONES$/, "mock-explorations-view")
    expect(capturedExplorationsProps).not.toBeNull()

    const createData = { name: "Search A" }
    await act(async () => {
      await capturedExplorationsProps!.onCreateExploration(createData)
    })
    expect(explorationsService.createExploration).toHaveBeenCalledWith(createData)

    await act(async () => {
      await capturedExplorationsProps!.onDepartExploration(123)
    })
    expect(explorationsService.departExploration).toHaveBeenCalledWith(123)

    const returnData = { notes: "Found supplies" }
    await act(async () => {
      await capturedExplorationsProps!.onReturnExploration(123, returnData)
    })
    expect(explorationsService.returnExploration).toHaveBeenCalledWith(123, returnData)

    await act(async () => {
      await capturedExplorationsProps!.onCancelExploration(123)
    })
    expect(explorationsService.cancelExploration).toHaveBeenCalledWith(123)
  })

  it("handles transfers operations successfully and triggers reload", async () => {
    renderLayout()
    await openTab(/^TRASLADOS$/, "mock-transfers-view")
    expect(capturedTransfersProps).not.toBeNull()

    const trData = { resource_id: 1, quantity: 10 }
    await act(async () => {
      await capturedTransfersProps!.onCreateTransferRequest(trData)
    })
    expect(transfersService.createTransferRequest).toHaveBeenCalledWith(trData)

    await act(async () => {
      await capturedTransfersProps!.onApproveTransferRequest(100, true)
    })
    expect(transfersService.handleTransferApproval).toHaveBeenCalledWith(
      100,
      true,
      expect.any(Number),
    )

    await act(async () => {
      await capturedTransfersProps!.onCancelTransferRequest(100)
    })
    expect(transfersService.cancelTransferRequest).toHaveBeenCalledWith(100)
  })

  it("handles inactivity logout", async () => {
    renderLayout()
    await screen.findByTestId("camp-3d-wrapper")
    expect(useAuthStore.getState().user).not.toBeNull()
    act(() => {
      capturedOnLogout()
    })
    expect(useAuthStore.getState().user).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("handles dashboard navigation callback", async () => {
    renderLayout()
    await openTab(/^TABLERO$/, "mock-dashboard-view")
    expect(capturedDashboardProps).not.toBeNull()
    act(() => {
      capturedDashboardProps!.onNavigate("inventory")
    })
    expect(await screen.findByTestId("mock-inventory-view")).toBeInTheDocument()
  })

  it("gracefully catches fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Fetch failed"))
    renderLayout()
    expect(await openTab(/^TABLERO$/, "mock-dashboard-view")).toBeInTheDocument()
  })

  it("silently ignores phase 2 data loading failures", async () => {
    vi.mocked(resourcesService.getInventoryMovements).mockRejectedValueOnce(
      new Error("Phase 2 fail"),
    )
    renderLayout()
    expect(await openTab(/^TABLERO$/, "mock-dashboard-view")).toBeInTheDocument()
  })

  it("shows ACTUALIZANDO overlay while an action is pending", async () => {
    let resolveCreate!: (v: unknown) => void
    vi.mocked(explorationsService.createExploration).mockImplementationOnce(
      () => new Promise((res) => (resolveCreate = res)),
    )
    renderLayout()
    await openTab(/^EXPLORACIONES$/, "mock-explorations-view")
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
