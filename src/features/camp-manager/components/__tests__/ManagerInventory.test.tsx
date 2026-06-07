import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerInventory from "../ManagerInventory"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}))

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>
const mockPatch = api.patch as ReturnType<typeof vi.fn>

const mockInventory = [
  {
    id: "1",
    resource_id: 1,
    name: "Gasolina",
    category: "combustible",
    current_stock: 136,
    minimum_stock_required: 50,
    is_below_minimum: false,
    unit: "Galón",
  },
  {
    id: "2",
    resource_id: 2,
    name: "Comida Enlatada",
    category: "food",
    current_stock: -89,
    minimum_stock_required: 50,
    is_below_minimum: true,
    unit: "Unidades",
  },
  {
    id: "3",
    resource_id: 3,
    name: "Agua Purificada",
    category: "water",
    current_stock: 185,
    minimum_stock_required: 50,
    is_below_minimum: false,
    unit: "Litros",
  },
]

const mockMovements = [
  {
    id: "m1",
    resource_id: "1",
    camp_id: "7",
    quantity: 50,
    type: "income",
    description: "Test suministro",
    date: "2026-06-07T00:00:00Z",
    resource: { name: "Gasolina", unit: "Galón" },
  },
]

function setupMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes("/resources/inventory")) return Promise.resolve({ data: mockInventory })
    if (url.includes("/resources/movements")) return Promise.resolve({ data: mockMovements })
    return Promise.resolve({ data: [] })
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

describe("ManagerInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it("renders inventory cards with resource names", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getAllByText("Gasolina").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Comida Enlatada").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Agua Purificada").length).toBeGreaterThan(0)
    })
  })

  it("shows CRÍTICO badge for items below minimum stock", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/CRÍTICO/i)).toBeInTheDocument()
    })
  })

  it("shows SEGURO badge for items above minimum stock", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getAllByText(/SEGURO/i).length).toBeGreaterThan(0)
    })
  })

  it("renders REGISTRAR MOVIMIENTO button", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/REGISTRAR MOVIMIENTO/i)).toBeInTheDocument()
    })
  })

  it("renders CICLO SOLAR button", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/CICLO SOLAR/i)).toBeInTheDocument()
    })
  })

  it("opens edit modal when EDITAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getAllByText("EDITAR"))
    await user.click(screen.getAllByText("EDITAR")[0])

    expect(screen.getByText(/REDIMENSIONAR RESERVA MÍNIMA/i)).toBeInTheDocument()
  })

  it("closes edit modal when CANCELAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getAllByText("EDITAR"))
    await user.click(screen.getAllByText("EDITAR")[0])
    expect(screen.getByText(/REDIMENSIONAR RESERVA MÍNIMA/i)).toBeInTheDocument()

    await user.click(screen.getByText("[CANCELAR]"))
    expect(screen.queryByText(/REDIMENSIONAR RESERVA MÍNIMA/i)).not.toBeInTheDocument()
  })

  it("opens movement modal when REGISTRAR MOVIMIENTO is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText(/REGISTRAR MOVIMIENTO/i))

    expect(screen.getByText(/REGISTRAR MOVIMIENTO DE BODEGA/i)).toBeInTheDocument()
  })

  it("movement modal contains resource selector and type selector", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText(/REGISTRAR MOVIMIENTO/i))

    expect(screen.getByText("RECURSO:")).toBeInTheDocument()
    expect(screen.getByText(/TIPO DE OPERACIÓN/i)).toBeInTheDocument()
    expect(screen.getByText(/CANTIDAD/i)).toBeInTheDocument()
  })

  it("closes movement modal when CANCELAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText("[CANCELAR]"))

    expect(screen.queryByText(/REGISTRAR MOVIMIENTO DE BODEGA/i)).not.toBeInTheDocument()
  })

  it("opens daily process confirmation modal when CICLO SOLAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/CICLO SOLAR/i))
    await user.click(screen.getByText(/CICLO SOLAR/i))

    expect(screen.getByText(/AUTORIZACIÓN CRÍTICA/i)).toBeInTheDocument()
  })

  it("closes daily process modal when ABORTAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/CICLO SOLAR/i))
    await user.click(screen.getByText(/CICLO SOLAR/i))
    await user.click(screen.getByText(/ABORTAR/i))

    expect(screen.queryByText(/AUTORIZACIÓN CRÍTICA/i)).not.toBeInTheDocument()
  })

  it("renders movement history section", async () => {
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/REGISTRO DE OPERACIONES RECIENTES/i)).toBeInTheDocument()
    })
  })

  it("calls PATCH when saving minimum stock", async () => {
    mockPatch.mockResolvedValue({ data: { ...mockInventory[0], minimum_stock_required: 80 } })
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getAllByText("EDITAR"))
    await user.click(screen.getAllByText("EDITAR")[0])

    const input = screen.getByDisplayValue("50")
    await user.clear(input)
    await user.type(input, "80")
    await user.click(screen.getByText(/GUARDAR/i))

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalled()
    })
  })

  it("calls POST when confirming a new movement", async () => {
    mockPost.mockResolvedValue({ data: { movement: { id: "99" }, inventory: mockInventory[0] } })
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText(/REGISTRAR MOVIMIENTO/i))

    const qtyInput = screen.getByPlaceholderText("0.000")
    await user.clear(qtyInput)
    await user.type(qtyInput, "50")
    await user.click(screen.getByText(/CONFIRMAR OPERACIÓN/i))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled()
    })
  })
})
