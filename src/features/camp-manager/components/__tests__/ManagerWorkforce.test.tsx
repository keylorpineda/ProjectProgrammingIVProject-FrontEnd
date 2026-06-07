import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerWorkforce from "../ManagerWorkforce"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}))

const mockGet = api.get as ReturnType<typeof vi.fn>

const mockPersons = [
  {
    id: "1",
    name: "Carmen Lopez",
    status: "active",
    profession: "Almacenista",
    campId: "7",
    skills: [],
    dailyConsumptionFood: 2,
    dailyConsumptionWater: 3,
  },
  {
    id: "2",
    name: "Luis Martinez",
    status: "active",
    profession: "Ingeniero",
    campId: "7",
    skills: [],
    dailyConsumptionFood: 2,
    dailyConsumptionWater: 3,
  },
]

const mockAlerts = [
  { profession: "Recolector / Scavenger", neededCount: 0, severity: "low", impactDescription: "" },
  { profession: "Cocinero MRE", neededCount: 0, severity: "low", impactDescription: "" },
]

const mockProfessions = [
  { id: 1, name: "Almacenista" },
  { id: 2, name: "Ingeniero" },
]

function setupMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes("/users/persons"))
      return Promise.resolve({ data: { data: mockPersons, total: 2 } })
    if (url.includes("alerts/needing-workers")) return Promise.resolve({ data: mockAlerts })
    if (url.includes("/users/professions")) return Promise.resolve({ data: mockProfessions })
    return Promise.resolve({ data: {} })
  })
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = "Wrapper"
  return Wrapper
}

describe("ManagerWorkforce", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it("renders the IA analysis section header", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/SISTEMA IA/i)).toBeInTheDocument()
    })
  })

  it("renders the census table header", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/CENSO LABORAL/i)).toBeInTheDocument()
    })
  })

  it("renders table with exactly 3 columns: SOBREVIVIENTE, PROFESIÓN, ESTADO FÍSICO", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText("SOBREVIVIENTE")).toBeInTheDocument()
      expect(screen.getByText("PROFESIÓN")).toBeInTheDocument()
      expect(screen.getByText("ESTADO FÍSICO")).toBeInTheDocument()
    })
  })

  it("does NOT render an ACCIONES / ORDEN ROL column", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.queryByText("ACCIONES")).not.toBeInTheDocument()
      expect(screen.queryByText(/ORDEN ROL/i)).not.toBeInTheDocument()
    })
  })

  it("renders person names in the census table", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText("Carmen Lopez")).toBeInTheDocument()
      expect(screen.getByText("Luis Martinez")).toBeInTheDocument()
    })
  })

  it("renders profession alert cards in the IA grid", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/RECOLECTOR/i)).toBeInTheDocument()
      expect(screen.getByText(/COCINERO/i)).toBeInTheDocument()
    })
  })

  it("shows SANO status for active persons", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getAllByText(/SANO/i).length).toBeGreaterThan(0)
    })
  })

  it("shows total survivors count", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/2 SOBREVIVIENTES/i)).toBeInTheDocument()
    })
  })

  it("shows pagination controls", async () => {
    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/ANTERIOR/i)).toBeInTheDocument()
      expect(screen.getByText(/SIGUIENTE/i)).toBeInTheDocument()
    })
  })

  it("shows error message when api fails", async () => {
    mockGet.mockRejectedValue(new Error("Fallo de red"))

    render(<ManagerWorkforce campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/Fallo de red/i)).toBeInTheDocument()
    })
  })
})
