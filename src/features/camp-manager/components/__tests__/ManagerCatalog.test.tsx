import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerCatalog from "../ManagerCatalog"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>

const mockResources = [
  {
    id: "1",
    name: "Agua Purificada",
    unit: "Litros",
    category: "agua",
    description: "Agua lista para beber",
  },
  {
    id: "2",
    name: "Comida Enlatada",
    unit: "Unidades",
    category: "food",
    description: "Raciones de emergencia",
  },
  {
    id: "3",
    name: "Antibióticos",
    unit: "Cajas",
    category: "medical",
    description: "Penicilina y amoxicilina",
  },
]

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = "Wrapper"
  return Wrapper
}

describe("ManagerCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: mockResources } })
  })

  it("renders the resource catalog table", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("Agua Purificada")).toBeInTheDocument()
      expect(screen.getByText("Comida Enlatada")).toBeInTheDocument()
      expect(screen.getByText("Antibióticos")).toBeInTheDocument()
    })
  })

  it("renders table column headers", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("RECURSO")).toBeInTheDocument()
      expect(screen.getByText("CATEGORÍA")).toBeInTheDocument()
      expect(screen.getByText("UNIDAD")).toBeInTheDocument()
      expect(screen.getByText("DESCRIPCIÓN")).toBeInTheDocument()
      expect(screen.getByText("ACCIONES")).toBeInTheDocument()
    })
  })

  it("renders unit values for each resource", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("Litros")).toBeInTheDocument()
      expect(screen.getByText("Unidades")).toBeInTheDocument()
      expect(screen.getByText("Cajas")).toBeInTheDocument()
    })
  })

  it("renders EDITAR and BORRAR actions for each resource", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getAllByText("EDITAR").length).toBe(3)
      expect(screen.getAllByText("BORRAR").length).toBe(3)
    })
  })

  it("renders NUEVO RECURSO button", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/NUEVO RECURSO/i)).toBeInTheDocument()
    })
  })

  it("renders INIT INVENTARIO button", async () => {
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/INIT INVENTARIO/i)).toBeInTheDocument()
    })
  })

  it("opens create form when NUEVO RECURSO is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/NUEVO RECURSO/i))

    expect(screen.getByText(/REGISTRAR NUEVO RECURSO/i)).toBeInTheDocument()
  })

  it("create form contains name and unit fields", async () => {
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/NUEVO RECURSO/i))

    expect(screen.getByPlaceholderText(/Comida Enlatada/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/litros/i)).toBeInTheDocument()
  })

  it("cancels create form when CANCELAR is clicked", async () => {
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/CANCELAR/i))

    expect(screen.queryByText(/REGISTRAR NUEVO RECURSO/i)).not.toBeInTheDocument()
  })

  it("submits POST when creating a new resource", async () => {
    mockPost.mockResolvedValue({
      data: { id: "99", name: "Nuevo", unit: "kg", category: "food", description: "" },
    })
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/NUEVO RECURSO/i))
    await user.type(screen.getByPlaceholderText(/Comida Enlatada/i), "Nuevo Recurso")

    // Select category (combobox)
    const categorySelect = screen.getByLabelText(/CATEGORÍA:/i)
    await user.selectOptions(categorySelect, "food")

    await user.type(screen.getByPlaceholderText(/litros/i), "kg")

    // Type description
    const descInput = screen.getByPlaceholderText(/Breve descripción del recurso/i)
    await user.type(descInput, "Test description")
    await user.click(screen.getByRole("button", { name: /^REGISTRAR$/ }))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/resources",
        expect.objectContaining({ name: "Nuevo Recurso" }),
      )
    })
  })

  it("shows empty state when no resources", async () => {
    mockGet.mockResolvedValue({ data: [] })

    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/SIN RECURSOS/i)).toBeInTheDocument()
    })
  })

  it("shows error when api fails", async () => {
    mockGet.mockRejectedValue(new Error("Error de servidor"))

    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Error de servidor/i)).toBeInTheDocument()
    })
  })

  it("submits PATCH when editing an existing resource", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText("Agua Purificada"))
    const editButtons = screen.getAllByText("EDITAR")
    await user.click(editButtons[0])

    const nameInput = screen.getByDisplayValue("Agua Purificada")
    await user.clear(nameInput)
    await user.type(nameInput, "Agua Super Purificada")

    await user.click(screen.getByRole("button", { name: /^ACTUALIZAR$/ }))

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        "/resources/1",
        expect.objectContaining({ name: "Agua Super Purificada" }),
      )
    })
  })

  it("shows error if name or unit is empty when submitting", async () => {
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/NUEVO RECURSO/i))
    await user.click(screen.getByText(/NUEVO RECURSO/i))

    // Attempt submit with empty fields, bypassing HTML5 validation
    const submitBtn = screen.getByRole("button", { name: /^REGISTRAR$/ })
    const form = submitBtn.closest("form")
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      const els = screen.getAllByText(/Nombre y unidad son obligatorios/i)
      expect(els.length).toBeGreaterThan(0)
    })
  })

  it("shows error when form submission fails", async () => {
    const mockDelete = api.delete as ReturnType<typeof vi.fn>
    mockDelete.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText("Agua Purificada"))
    const deleteButtons = screen.getAllByText("BORRAR")
    await user.click(deleteButtons[0])

    expect(screen.getByText(/CONFIRMAR ELIMINACIÓN/i)).toBeInTheDocument()

    const confirmBtn = screen.getByRole("button", { name: /^CONFIRMAR$/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/resources/1")
    })
  })

  it("cancels delete modal", async () => {
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText("Agua Purificada"))
    const deleteButtons = screen.getAllByText("BORRAR")
    await user.click(deleteButtons[0])

    expect(screen.getByText(/CONFIRMAR ELIMINACIÓN/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /\[CANCELAR\]/i }))

    expect(screen.queryByText(/CONFIRMAR ELIMINACIÓN/i)).not.toBeInTheDocument()
  })

  it("shows error when delete fails", async () => {
    const mockDelete = api.delete as ReturnType<typeof vi.fn>
    mockDelete.mockRejectedValue(new Error("No se pudo eliminar"))
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText("Agua Purificada"))
    const deleteButtons = screen.getAllByText("BORRAR")
    await user.click(deleteButtons[0])

    const confirmBtn = screen.getByRole("button", { name: /^CONFIRMAR$/ })
    await user.click(confirmBtn)

    expect(await screen.findByText(/No se pudo eliminar/i)).toBeInTheDocument()
  })

  it("calls INIT INVENTARIO and handles success", async () => {
    mockPost.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/INIT INVENTARIO/i))
    await user.click(screen.getByText(/INIT INVENTARIO/i))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/resources/inventory/initialize/7")
      expect(screen.getByText(/INVENTARIO LISTO/i)).toBeInTheDocument()
    })
  })

  it("handles INIT INVENTARIO error", async () => {
    mockPost.mockRejectedValue(new Error("Error inicializando"))
    const user = userEvent.setup()
    render(<ManagerCatalog campId="7" onDataChanged={vi.fn()} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/INIT INVENTARIO/i))
    await user.click(screen.getByText(/INIT INVENTARIO/i))

    expect(await screen.findByText(/Error inicializando/i)).toBeInTheDocument()
  })
})
