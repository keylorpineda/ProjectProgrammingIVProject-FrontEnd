import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerOverview from "../ManagerOverview"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn() },
}))

const mockApi = api.get as ReturnType<typeof vi.fn>

const mockBalance = {
  foodProduction: 120,
  foodConsumption: 80,
  waterProduction: 200,
  waterConsumption: 150,
  medicalSuppliesNeeded: 5,
  activeAlarmsCount: 2,
  detailedAlarms: ["Agua baja", "Comida crítica"],
}

const mockStats = {
  sentCount: 3,
  receivedCount: 7,
  totalTransferredResources: 500,
  pendingIncomingRequests: 1,
  totalFuelCostUsed: 50,
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = "Wrapper"
  return Wrapper
}

describe("ManagerOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all four dashboard panels", async () => {
    mockApi.mockResolvedValueOnce({ data: mockBalance }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("BALANCE ALIMENTARIO")).toBeInTheDocument()
      expect(screen.getByText("SUMINISTRO HÍDRICO")).toBeInTheDocument()
      expect(screen.getByText("LOGÍSTICA Y TRÁNSITOS")).toBeInTheDocument()
      expect(screen.getByText("BIOMETRÍA Y SEGURIDAD")).toBeInTheDocument()
    })
  })

  it("displays food production and consumption values", async () => {
    mockApi.mockResolvedValueOnce({ data: mockBalance }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("+120")).toBeInTheDocument()
      expect(screen.getByText("-80")).toBeInTheDocument()
    })
  })

  it("displays water production and consumption values", async () => {
    mockApi.mockResolvedValueOnce({ data: mockBalance }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("+200")).toBeInTheDocument()
      expect(screen.getByText("-150")).toBeInTheDocument()
    })
  })

  it("displays transfer logistics statistics", async () => {
    mockApi.mockResolvedValueOnce({ data: mockBalance }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("7")).toBeInTheDocument()
    })
  })

  it("displays active alarms count in security panel", async () => {
    mockApi.mockResolvedValueOnce({ data: mockBalance }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  it("shows zero values when api returns zeroed balance", async () => {
    const zeroed = {
      foodProduction: 0,
      foodConsumption: 0,
      waterProduction: 0,
      waterConsumption: 0,
      medicalSuppliesNeeded: 0,
      activeAlarmsCount: 0,
      detailedAlarms: [],
    }
    mockApi.mockResolvedValueOnce({ data: zeroed }).mockResolvedValueOnce({ data: mockStats })

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getAllByText("+0").length).toBeGreaterThan(0)
    })
  })

  it("calls api with correct camp balance endpoint", async () => {
    mockApi.mockResolvedValue({ data: mockBalance })

    render(<ManagerOverview campId="42" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith(expect.stringContaining("42"))
    })
  })

  it("calls refetch when RETRY LINK SIGNAL button is clicked", async () => {
    mockApi.mockRejectedValue(new Error("Telemetry Error"))
    const user = userEvent.setup()

    render(<ManagerOverview campId="1" refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    const retryBtn = await screen.findByText(/RETRY LINK SIGNAL/i)
    await user.click(retryBtn)

    // 2 times on mount (balance, stats) + 2 times on retry
    expect(mockApi).toHaveBeenCalledTimes(4)
  })

  it("shows error when api fails", async () => {
    mockApi.mockRejectedValue(new Error("Error de conexión"))

    render(<ManagerOverview campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument()
    })
  })

  it("handles loading state", () => {
    // We don't resolve the mock immediately to test the skeleton/loading state
    mockApi.mockReturnValue(new Promise(() => {}))

    const { container } = render(<ManagerOverview campId="7" refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    // the component renders an empty div with min-h-[400px] while loading
    expect(container.querySelector(".min-h-\\[400px\\]")).toBeInTheDocument()
  })
})
