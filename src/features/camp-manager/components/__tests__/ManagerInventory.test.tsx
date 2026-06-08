import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
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
    id: 1,
    resource_id: 1,
    camp_id: 1,
    name: "Comida",
    category: "food",
    minimum_stock_required: 15,
    current_stock: 12,
    unit: "Raciones",
  },
  {
    id: 2,
    resource_id: 2,
    camp_id: 1,
    name: "Medicina",
    category: "medic",
    minimum_stock_required: 5,
    current_stock: 10,
    unit: "Dosis",
  },
  {
    id: 3,
    resource_id: 3,
    camp_id: 1,
    name: "Armas",
    category: "weapon",
    minimum_stock_required: 2,
    current_stock: 5,
    unit: "Unidades",
  },
  {
    id: 4,
    resource_id: 4,
    camp_id: 1,
    name: "Gasolina",
    category: "fuel",
    minimum_stock_required: 100,
    current_stock: 50,
    unit: "Galones",
  },
  {
    id: 5,
    resource_id: 5,
    camp_id: 1,
    name: "Herramientas",
    category: "tool",
    minimum_stock_required: 10,
    current_stock: 20,
    unit: "Sets",
  },
  {
    id: 6,
    resource_id: 6,
    camp_id: 1,
    name: "Ropa",
    category: "cloth",
    minimum_stock_required: 50,
    current_stock: 50,
    unit: "Piezas",
  },
  {
    id: 7,
    resource_id: 7,
    camp_id: 1,
    name: "Misterio",
    category: "unknown",
    minimum_stock_required: 1,
    current_stock: 1,
    unit: "Cajas",
  },
]
const mockMovements = [
  {
    id: 101,
    resource_id: 1,
    quantity: 5,
    type: "income",
    created_at: "2026-06-08T10:00:00.000Z",
  },
  {
    id: 102,
    resource_id: 1,
    quantity: 5,
    type: "unknown",
    created_at: "invalid-date",
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

    const resourceSelect = screen.getByLabelText(/RECURSO:/i)
    await user.selectOptions(resourceSelect, "1")

    const opSelect = screen.getByLabelText(/TIPO DE OPERACIÓN:/i)
    await user.selectOptions(opSelect, "income")

    const qtyInput = screen.getByPlaceholderText("0.000")
    await user.clear(qtyInput)
    await user.type(qtyInput, "50")

    const descInput = screen.getByPlaceholderText(/Recepción convoy/i)
    await user.type(descInput, "A test note")

    await user.click(screen.getByText(/CONFIRMAR OPERACIÓN/i))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled()
    })
  })

  it("shows SANO badge for ... wait, it renders category icons", async () => {
    // wait for render
    await screen.findByText(/Raciones de Combate/i)
    expect(screen.getByText("Medicina")).toBeInTheDocument()
    expect(screen.getByText("Armas")).toBeInTheDocument()
    expect(screen.getByText("Gasolina")).toBeInTheDocument()
    expect(screen.getByText("Herramientas")).toBeInTheDocument()
    expect(screen.getByText("Ropa")).toBeInTheDocument()
    expect(screen.getByText("Misterio")).toBeInTheDocument()
  })

  it("handles negative minimum stock error", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="1" onDataChanged={vi.fn()} refreshTrigger={0} />)

    const editButtons = await screen.findAllByText("EDITAR")
    await user.click(editButtons[0])

    const minStockInput = screen.getByDisplayValue("15")
    await user.clear(minStockInput)
    await user.type(minStockInput, "-10")

    const saveBtn = screen.getByText("GUARDAR")
    await user.click(saveBtn)

    expect(
      await screen.findByText("El umbral de reserva mínimo no puede ser negativo."),
    ).toBeInTheDocument()
  })

  it("clears daily processing states after timeout", async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ManagerInventory campId="1" onDataChanged={vi.fn()} refreshTrigger={0} />)

    const cycleBtn = screen.getByText("CICLO SOLAR")
    await user.click(cycleBtn)

    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockResolvedValueOnce({ data: { message: "Ciclo Diario ejecutado con éxito" } })

    const confirmBtn = screen.getByText("CONFIRMAR EJECUCIÓN")
    await user.click(confirmBtn)

    // Wait for the modal to show success message
    expect(await screen.findByText(/Ciclo Diario ejecutado con éxito/i)).toBeInTheDocument()

    // advance timers by 4000ms
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    // Modal should be closed now
    expect(screen.queryByText(/Ciclo Diario ejecutado con éxito/i)).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it("refetches data when refreshTrigger changes", () => {
    const { rerender } = render(
      <ManagerInventory campId="1" onDataChanged={vi.fn()} refreshTrigger={0} />,
    )

    // clear previous mock calls
    const mockGet = api.get as ReturnType<typeof vi.fn>
    mockGet.mockClear()

    rerender(<ManagerInventory campId="1" onDataChanged={vi.fn()} refreshTrigger={1} />)
    // refetch should be called again for inventory and movements
    expect(mockGet).toHaveBeenCalled()
  })

  it("shows error when api to fetch inventory fails", async () => {
    mockGet.mockRejectedValue(new Error("Network Error"))
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument()
    })
  })

  it("shows error when saving minimum stock fails", async () => {
    mockPatch.mockRejectedValue(new Error("Fallo al actualizar stock"))
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

    expect(await screen.findByText(/Fallo al actualizar stock/i)).toBeInTheDocument()
  })

  it("shows error when confirming movement fails", async () => {
    mockPost.mockRejectedValue(new Error("Fallo al registrar movimiento"))
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
      const errorEls = screen.getAllByText(/Fallo al registrar movimiento/i)
      expect(errorEls.length).toBeGreaterThan(0)
    })
  })

  it("executes daily process successfully", async () => {
    mockPost.mockResolvedValue({
      data: {
        message: "Proceso completado",
        metrics: { foodProduced: 10, foodConsumed: 5, waterProduced: 10, waterConsumed: 5 },
      },
    })
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/CICLO SOLAR/i))
    await user.click(screen.getByText(/CICLO SOLAR/i))

    const execBtn = screen.getByRole("button", { name: /EJECUTAR CONSUMOS/i })
    await user.click(execBtn)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/resources/daily-process/7")
      expect(screen.getByText(/PROCESO COMPLETADO/i)).toBeInTheDocument()
    })
  })

  it("shows error when daily process fails", async () => {
    mockPost.mockRejectedValue(new Error("Fallo proceso diario"))
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/CICLO SOLAR/i))
    await user.click(screen.getByText(/CICLO SOLAR/i))

    const execBtn = screen.getByRole("button", { name: /EJECUTAR CONSUMOS/i })
    await user.click(execBtn)

    expect(await screen.findByText(/Fallo proceso diario/i)).toBeInTheDocument()
  })

  it("shows error if quantity is invalid when registering movement", async () => {
    const user = userEvent.setup()
    render(<ManagerInventory campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText(/REGISTRAR MOVIMIENTO/i))
    await user.click(screen.getByText(/REGISTRAR MOVIMIENTO/i))

    // Do not enter quantity or enter 0
    const qtyInput = screen.getByPlaceholderText("0.000")
    await user.clear(qtyInput)
    await user.type(qtyInput, "0")

    // Bypass HTML5 validation
    const submitBtn = screen.getByRole("button", { name: /CONFIRMAR OPERACIÓN/i })
    const form = submitBtn.closest("form")
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      const els = screen.getAllByText(/Selecciona un recurso y una cantidad válida/i)
      expect(els.length).toBeGreaterThan(0)
    })
  })
})
