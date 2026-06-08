import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ExplorationsView from "../ExplorationsView"

import type { Camp, Exploration, Inventory, Person, ResourceItem } from "../../types"
import type { MapCoordPickerProps } from "@/features/map-test/components/MapCoordPicker"

vi.mock("@/features/map-test/components/ExplorationZoneMap", () => ({
  ExplorationZoneMap: () => <div data-testid="mock-zone-map">Zone Map</div>,
}))

vi.mock("@/features/map-test/components/MapCoordPicker", () => ({
  MapCoordPicker: ({ onChange }: MapCoordPickerProps) => (
    <button type="button" data-testid="mock-coord-picker" onClick={() => onChange(9.95, -84.1)}>
      Pick Coordinates
    </button>
  ),
}))

vi.mock("@/features/map-test/components/TransferRouteMap", () => ({
  TransferRouteMap: () => <div data-testid="mock-route-map">Route Map</div>,
}))

const mockCamps: Camp[] = [
  { id: 1, name: "Campamento Alpha", latitude: 10, longitude: -84 },
] as Camp[]

const mockResources: ResourceItem[] = [
  { id: 1, name: "Agua", unit: "L", category: "water" },
  { id: 2, name: "Comida", unit: "Raciones", category: "food" },
] as ResourceItem[]

const mockInventory: Inventory[] = [
  {
    camp_id: 1,
    resource_id: 1,
    current_quantity: 100,
    minimum_stock_required: 50,
    alert_active: false,
    resource: mockResources[0] as ResourceItem,
  } as Inventory,
  {
    camp_id: 1,
    resource_id: 2,
    current_quantity: 5,
    minimum_stock_required: 20,
    alert_active: true,
    resource: mockResources[1] as ResourceItem,
  } as Inventory,
]

const mockPersons: Person[] = [
  {
    id: 10,
    first_name: "Joel",
    last_name: "Miller",
    status: "active",
    can_work: true,
    profession: { id: 1, name: "Medico", can_explore: true },
  } as Person,
]

const mockExplorations: Exploration[] = [
  {
    id: 1,
    camp_id: 1,
    name: "Exp Norte",
    destination_description: "Zona Norte [10.0, -84.0]",
    departure_date: "2026-06-08T10:00:00Z",
    estimated_days: 3,
    grace_days: 1,
    real_return_date: undefined,
    status: "scheduled",
    notes: "No comments",
    explorationPersons: [{ is_leader: true, person: mockPersons[0] }],
    explorationResources: [],
    camp: { id: 1, name: "Campamento de Prueba" } as Camp,
  },
  {
    id: 2,
    camp_id: 1,
    name: "Exp Sur",
    destination_description: "Zona Sur",
    departure_date: "2026-06-08T10:00:00Z",
    estimated_days: 5,
    grace_days: 2,
    real_return_date: undefined,
    status: "in_progress",
    notes: "",
    explorationPersons: [{ is_leader: true, person: mockPersons[0] }],
    explorationResources: [],
    camp: { id: 1, name: "Campamento de Prueba" } as Camp,
  },
]

describe("ExplorationsView Component", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onCreate: any, onDepart: any, onReturn: any, onCancel: any

  beforeEach(() => {
    onCreate = vi.fn()
    onDepart = vi.fn()
    onReturn = vi.fn()
    onCancel = vi.fn()
  })

  it("renders explorations and filters by status", () => {
    render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    expect(screen.getByText("EXPLORACIONES EN LA ZONA MUERTA")).toBeInTheDocument()
    expect(screen.getByText("Exp Norte")).toBeInTheDocument()
    expect(screen.getByText("Exp Sur")).toBeInTheDocument()

    // Filter by Progress
    const inProgressBtn = screen.getByRole("button", { name: /en curso/i })
    fireEvent.click(inProgressBtn)
    expect(screen.queryByText("Exp Norte")).not.toBeInTheDocument()
    expect(screen.getByText("Exp Sur")).toBeInTheDocument()
  })

  it("handles cancelling a scheduled expedition", () => {
    render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    // First exploration is scheduled and has a cancel button
    const cancelBtn = screen.getByRole("button", { name: /cancelar/i })
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledWith(1)
  })

  it("handles creating a new expedition with validation", async () => {
    const { container } = render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: /nueva expedición/i }))
    expect(screen.getByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).toBeInTheDocument()

    const form = screen.getByText("REGISTRAR PLAN EN CENTRAL").closest("form")!
    fireEvent.submit(form)

    expect(screen.getByText("COMPLETE TODOS LOS CAMPOS RESALTADOS.")).toBeInTheDocument()

    // Fill fields
    const nameInput = screen.getByPlaceholderText(/búsqueda de antíxidas/i)
    const destInput = screen.getByPlaceholderText(/hospital universitario/i)

    fireEvent.change(nameInput, { target: { value: "Mision Alfa" } })
    fireEvent.change(destInput, { target: { value: "Valle Gris" } })

    fireEvent.submit(form)
    expect(screen.getByText("DEBE ASIGNAR AL MENOS UN EXCURSIONISTA.")).toBeInTheDocument()

    // Select crew member Joel
    const joelCheckbox = screen.getByText("Joel Miller").closest("div")!
    fireEvent.click(joelCheckbox)

    // Trigger resource checks (Comida has max 5, let's provision 10)
    const numberInputs = container.querySelectorAll("input[type='number']")
    const foodInput = numberInputs[2] as HTMLInputElement
    fireEvent.change(foodInput, { target: { value: "10" } })

    fireEvent.submit(form)
    expect(screen.getByText(/recursos insuficientes/i)).toBeInTheDocument()

    // Adjust food supply back to stable amount
    fireEvent.change(foodInput, { target: { value: "2" } })

    // Change estimated days and grace days
    const estDaysInput = numberInputs[0] as HTMLInputElement
    const graceDaysInput = numberInputs[1] as HTMLInputElement
    fireEvent.change(estDaysInput, { target: { value: "5" } })
    fireEvent.change(graceDaysInput, { target: { value: "2" } })

    // Add notes
    const notesInput = screen.getByLabelText(/comentario extra/i)
    fireEvent.change(notesInput, { target: { value: "Exploration notes" } })

    // Optional coordinate picker click
    const picker = screen.getByTestId("mock-coord-picker")
    fireEvent.click(picker)

    fireEvent.submit(form)
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          camp_id: 1,
          name: "Mision Alfa",
          destination_description: "Valle Gris [9.95000, -84.10000]",
          estimated_days: 5,
          grace_days: 2,
          notes: "Exploration notes",
        }),
      )
    })
  })

  it("handles safe return submission", async () => {
    render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    // Exp Sur is in_progress and has a return button
    const returnBtn = screen.getByRole("button", { name: /registrar retorno/i })
    fireEvent.click(returnBtn)

    expect(screen.getByText(/hoja de registro de retorno/i)).toBeInTheDocument()

    const notesTextarea = screen.getByLabelText(/informe del líder de operación/i)
    fireEvent.change(notesTextarea, { target: { value: "Found medicine" } })

    const form = screen.getByText(/registrar ingreso en almacén/i).closest("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(onReturn).toHaveBeenCalledWith(2, {
        notes: "Found medicine",
        foundResources: expect.arrayContaining([
          { resource_id: 2, quantity: 40 }, // food
          { resource_id: 1, quantity: 30 }, // water
        ]),
      })
    })
  })

  it("filters explorations by search query", () => {
    render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )
    const searchInput = screen.getByPlaceholderText(/buscar ruta/i)
    fireEvent.change(searchInput, { target: { value: "Norte" } })
    expect(screen.getByText("Exp Norte")).toBeInTheDocument()
    expect(screen.queryByText("Exp Sur")).not.toBeInTheDocument()
  })

  it("handles various interactive callbacks in new/return modals", async () => {
    const { container } = render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    // 1. Open and close new expedition modal
    fireEvent.click(screen.getByRole("button", { name: /nueva expedición/i }))
    expect(screen.getByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "[X]" }))
    expect(screen.queryByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).not.toBeInTheDocument()

    // 2. Open again and test selecting/deselecting person, pressing Enter, etc.
    fireEvent.click(screen.getByRole("button", { name: /nueva expedición/i }))
    const joelDiv = screen.getByText("Joel Miller").closest("div")!

    // Select
    fireEvent.click(joelDiv)
    // Deselect
    fireEvent.click(joelDiv)
    // Select again using Enter keydown
    fireEvent.keyDown(joelDiv, { key: "Enter" })

    // Provision stocks inputs (food and water)
    const numberInputs = container.querySelectorAll("input[type='number']")
    const foodInput = numberInputs[2] as HTMLInputElement
    const waterInput = numberInputs[3] as HTMLInputElement

    fireEvent.change(foodInput, { target: { value: "6" } })
    fireEvent.change(waterInput, { target: { value: "8" } })

    // Coordinate picker clear
    const picker = screen.getByTestId("mock-coord-picker")
    fireEvent.click(picker) // sets lat 9.95, lng -84.1
    expect(screen.getByText(/◉ COORDENADAS: 9.95000, -84.10000/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "[LIMPIAR]" }))
    expect(screen.queryByText(/◉ COORDENADAS:/i)).not.toBeInTheDocument()

    // Click RETORNAR button to close
    fireEvent.click(screen.getByRole("button", { name: "RETORNAR" }))
    expect(screen.queryByText("CREAR HOJA DE MISIÓN EXCURSIONISTA")).not.toBeInTheDocument()

    // 3. Open Return modal and test modifying salvaged quantities
    fireEvent.click(screen.getByRole("button", { name: /registrar retorno/i }))
    expect(screen.getByText(/hoja de registro de retorno/i)).toBeInTheDocument()

    // Modify salvaged quantities
    const returnNumberInputs = container.querySelectorAll("input[type='number']")
    const salvageAguaInput = returnNumberInputs[0] as HTMLInputElement
    fireEvent.change(salvageAguaInput, { target: { value: "25" } })

    // Close Return modal using X
    fireEvent.click(screen.getByRole("button", { name: "[X]" }))
    expect(screen.queryByText(/hoja de registro de retorno/i)).not.toBeInTheDocument()

    // 4. Open Return modal again and test closing with RETORNAR button
    fireEvent.click(screen.getByRole("button", { name: /registrar retorno/i }))
    fireEvent.click(screen.getByRole("button", { name: "RETORNAR" }))
    expect(screen.queryByText(/hoja de registro de retorno/i)).not.toBeInTheDocument()
  })

  it("handles API error when creating an exploration", async () => {
    onCreate.mockRejectedValueOnce({
      response: { data: { message: ["Backend Validation Error"] } },
    })

    const { container } = render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /nueva expedición/i }))
    const form = screen.getByText("REGISTRAR PLAN EN CENTRAL").closest("form")!

    // Fill minimum required fields
    fireEvent.change(screen.getByPlaceholderText(/búsqueda de antíxidas/i), {
      target: { value: "Mision Alfa" },
    })
    fireEvent.change(screen.getByPlaceholderText(/hospital universitario/i), {
      target: { value: "Valle Gris" },
    })

    // Select crew member Joel
    const joelCheckbox = screen.getByText("Joel Miller").closest("div")!
    fireEvent.click(joelCheckbox)

    // Adjust food supply to avoid insufficient stocks validation error
    const numberInputs = container.querySelectorAll("input[type='number']")
    const foodInput = numberInputs[2] as HTMLInputElement
    fireEvent.change(foodInput, { target: { value: "2" } })

    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText("Backend Validation Error")).toBeInTheDocument()
    })
  })

  it("handles API error when returning an exploration", async () => {
    onReturn.mockRejectedValueOnce(new Error("Return API Error"))

    render(
      <ExplorationsView
        explorations={mockExplorations}
        activePersons={mockPersons}
        inventory={mockInventory}
        resources={mockResources}
        camps={mockCamps}
        myCampId={1}
        onCreateExploration={onCreate}
        onDepartExploration={onDepart}
        onReturnExploration={onReturn}
        onCancelExploration={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /registrar retorno/i }))
    const form = screen.getByText(/registrar ingreso en almacén/i).closest("form")!

    fireEvent.submit(form)

    await waitFor(() => {
      expect(onReturn).toHaveBeenCalled()
      expect(screen.getByText(/hoja de registro de retorno/i)).toBeInTheDocument()
    })
  })
})
