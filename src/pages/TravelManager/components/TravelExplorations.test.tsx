import * as reactQuery from "@tanstack/react-query"
import { fireEvent } from "@testing-library/dom"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { mockInventory, mockPersons } from "./TravelDashboardMockData"
import TravelExplorations from "./TravelExplorations"

import { useAuthStore } from "@/store/useAuthStore"

const mutationMocks = vi.hoisted(() => ({
  create: vi.fn(),
  depart: vi.fn(),
  returnExp: vi.fn(),
  cancel: vi.fn(),
  invalidateQueries: vi.fn(),
}))

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
  }),
}))

vi.mock("@/features/map-test/components/MapCoordPicker", () => ({
  MapCoordPicker: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => (
    <button type="button" data-testid="map-coord-picker" onClick={() => onChange(10.5, -84.2)}>
      Seleccionar destino
    </button>
  ),
}))

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: vi.fn((selector) => selector({ token: "fake-token" })),
}))

vi.mock("@/features/explorations/services/explorations.service", () => ({
  cancelExploration: vi.fn(),
  createExploration: vi.fn(),
  departExploration: vi.fn(),
  getExplorations: vi.fn(() => []),
  returnExploration: vi.fn(),
}))

vi.mock("@/features/inventory/services/inventory.service", () => ({
  getInventory: vi.fn(() => []),
}))

vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(() => ({ data: [] })),
}))

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: () => ({
      invalidateQueries: mutationMocks.invalidateQueries,
    }),
  }
})

const baseExplorations = [
  {
    id: "e1",
    name: "Forest Search",
    status: "active",
    target_latitude: 10,
    target_longitude: 20,
    destination_description: "Forest zone [10.00000, 20.00000]",
    estimated_days: 3,
    grace_days: 1,
    departure_date: "2026-01-01T00:00:00.000Z",
    real_return_date: null,
    notes: "Primary trail",
    camp: { latitude: 9.9, longitude: -84.1 },
    explorationPersons: [
      {
        person_id: "P-10",
        person: {
          id: "P-10",
          first_name: "John",
          last_name: "Doe",
          profession: { name: "Operario" },
        },
      },
      { person_id: "P-11", person: { id: "P-11", first_name: "Ana", last_name: "Sol" } },
      { person_id: "P-12", person: { id: "P-12", first_name: "Luis", last_name: "Mar" } },
      { person_id: "P-13", person: { id: "P-13", first_name: "Mia", last_name: "Sur" } },
    ],
    explorationResources: [
      {
        resource_id: "RES-1",
        flow: "out",
        quantity: 10,
        resource: { name: "Water", unit: "L", category: "water" },
      },
      {
        resource_id: "RES-2",
        flow: "in",
        quantity: 2,
        resource: { name: "Food", unit: "uds", category: "food" },
      },
    ],
  },
  {
    id: "e2",
    name: "Mountain Recon",
    status: "scheduled",
    target_latitude: 15,
    target_longitude: 25,
    destination_description: "Mountain pass",
    estimated_days: 2,
    grace_days: 0,
    departure_date: "2099-01-01T00:00:00.000Z",
    explorationPersons: [],
    explorationResources: [],
  },
  {
    id: "e3",
    name: "Returned Run",
    status: "completed",
    destination_description: "Old bridge",
    estimated_days: 1,
    grace_days: 0,
    real_return_date: "2026-01-05T00:00:00.000Z",
    explorationPersons: [],
    explorationResources: [],
  },
  {
    id: "e4",
    name: "Cancelled Run",
    status: "cancelled",
    destination_description: "Closed ridge",
    estimated_days: 1,
    grace_days: 0,
    explorationPersons: [],
    explorationResources: [],
  },
] as any[]

let explorationsData = baseExplorations
let explorationsError: Error | null = null
let personsData = mockPersons.map((person) => ({
  ...person,
  can_work: true,
  profession: { ...person.profession, can_explore: true },
}))
let inventoryData = [
  {
    ...mockInventory[0],
    current_quantity: 100,
    resource: { ...mockInventory[0].resource, category: "water", unit: "L" },
  },
  {
    ...mockInventory[1],
    current_quantity: 100,
    resource: { ...mockInventory[1].resource, category: "food", unit: "uds" },
  },
]
let createMutationError: unknown = null

function renderExplorations(initialEntries = ["/travel-manager/expeditions"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TravelExplorations />
    </MemoryRouter>,
  )
}

async function openNewExplorationModal() {
  fireEvent.click(screen.getByText(/Nueva exploración/i))

  await waitFor(() => {
    expect(screen.getByText(/Nueva Expedición/i)).toBeInTheDocument()
  })
}

describe("TravelExplorations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    explorationsData = baseExplorations
    explorationsError = null
    createMutationError = null
    personsData = mockPersons.map((person) => ({
      ...person,
      can_work: true,
      profession: { ...person.profession, can_explore: true },
    }))
    inventoryData = [
      {
        ...mockInventory[0],
        current_quantity: 100,
        resource: { ...mockInventory[0].resource, category: "water", unit: "L" },
      },
      {
        ...mockInventory[1],
        current_quantity: 100,
        resource: { ...mockInventory[1].resource, category: "food", unit: "uds" },
      },
    ]
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { camp_id: "CAMP-A1" },
    })
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "explorations")
          return { data: explorationsData, error: explorationsError, refetch: vi.fn() }
        if (queryKey[0] === "inventory") return { data: inventoryData }
        if (queryKey[0] === "persons") return { data: { data: personsData } }
        return { data: [] }
      },
    )
    ;(reactQuery.useMutation as ReturnType<typeof vi.fn>).mockImplementation((config) => {
      const source = String(config.mutationFn)
      const target = source.includes("departExploration")
        ? mutationMocks.depart
        : source.includes("returnExploration")
          ? mutationMocks.returnExp
          : source.includes("cancelExploration")
            ? mutationMocks.cancel
            : mutationMocks.create

      return {
        mutate: vi.fn((variables) => {
          target(variables)
          config.mutationFn?.(variables)
          if (target === mutationMocks.create && createMutationError) {
            config.onError?.(createMutationError)
          } else {
            config.onSuccess?.()
          }
        }),
        isPending: false,
      }
    })
  })

  it("renders, filters, and selects explorations", () => {
    renderExplorations()

    expect(screen.getByText("Operaciones de Campo")).toBeInTheDocument()
    expect(screen.getAllByText(/Forest Search/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Mountain Recon/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/En curso/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Programada/i).length).toBeGreaterThan(0)

    fireEvent.change(screen.getByPlaceholderText(/Buscar ruta o destino/i), {
      target: { value: "Mountain" },
    })

    expect(screen.getAllByText(/Mountain Recon/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Forest Search/i)).not.toBeInTheDocument()
  })

  it("filters by status and shows archived expedition details", () => {
    renderExplorations()

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "completed" } })

    expect(screen.getAllByText(/Returned Run/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Forest Search/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByText(/Returned Run/i)[0])

    expect(screen.getByText(/archivada/i)).toBeInTheDocument()
  })

  it("shows offline and empty states", async () => {
    explorationsError = new Error("offline")
    explorationsData = []

    renderExplorations()

    expect(screen.getByText(/Modo fuera de línea/i)).toBeInTheDocument()
    expect(screen.getByText(/Sin expediciones registradas/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByText(/Nueva Exploración/i).at(-1)!)

    await waitFor(() => {
      expect(screen.getByText(/Nueva Expedición/i)).toBeInTheDocument()
    })
  })

  it("opens and discards the new exploration modal", async () => {
    renderExplorations()
    await openNewExplorationModal()

    fireEvent.click(screen.getAllByText("Cancelar")[0])
    expect(screen.getByText("Descartar Expedición")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Aceptar"))

    await waitFor(() => {
      expect(screen.queryByText(/Nueva Expedición/i)).not.toBeInTheDocument()
    })
  })

  it("validates required fields before creating an exploration", async () => {
    renderExplorations()
    await openNewExplorationModal()

    fireEvent.click(screen.getByText(/Crear Expedición/i))
    expect(screen.getByText(/Escriba un nombre/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Nombre de la Expedición/i), {
      target: { value: "No destination" },
    })
    fireEvent.click(screen.getByText(/Crear Expedición/i))
    expect(screen.getByText(/Describa el destino/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Descripción del Destino/i), {
      target: { value: "Unknown road" },
    })
    fireEvent.click(screen.getByText(/Crear Expedición/i))
    expect(screen.getByText(/Seleccione un punto/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("map-coord-picker"))
    fireEvent.click(screen.getByText(/Crear Expedición/i))
    expect(screen.getByText(/Incluya al menos/i)).toBeInTheDocument()
  })

  it("validates insufficient supplies and clears selected coordinates", async () => {
    inventoryData = inventoryData.map((item) => ({ ...item, current_quantity: 1 }))

    renderExplorations()
    await openNewExplorationModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la Expedición/i), {
      target: { value: "Long run" },
    })
    fireEvent.change(screen.getByLabelText(/Descripción del Destino/i), {
      target: { value: "Far ridge" },
    })
    fireEvent.change(screen.getByLabelText(/Días estimados/i), {
      target: { value: "5" },
    })
    fireEvent.click(screen.getByTestId("map-coord-picker"))
    expect(screen.getByText(/COORDENADAS REGISTRADAS/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/limpiar/i))
    fireEvent.click(screen.getByTestId("map-coord-picker"))
    fireEvent.click(screen.getByText(/Jane/i))
    fireEvent.click(screen.getByText(/Crear Expedición/i))

    expect(screen.getByText(/Insumos insuficientes/i)).toBeInTheDocument()
  })

  it("toggles selected people and resources in the create form", async () => {
    renderExplorations()
    await openNewExplorationModal()

    fireEvent.click(screen.getByText(/Jane/i))
    expect(screen.getByText("LÍDER ✓")).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Jane/i))
    expect(screen.queryByText("LÍDER ✓")).not.toBeInTheDocument()

    fireEvent.click(screen.getByText(/Agua/i))
    expect(screen.getByDisplayValue("1")).toBeInTheDocument()
    const resourceQuantity = screen.getAllByRole("spinbutton").at(-1)!
    fireEvent.change(resourceQuantity, { target: { value: "4" } })
    expect(screen.getByDisplayValue("4")).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Agua/i))
    expect(screen.queryByDisplayValue("4")).not.toBeInTheDocument()
  })

  it("shows API errors when exploration creation fails", async () => {
    createMutationError = {
      response: { data: { message: ["Ruta inválida", "Equipo inválido"] } },
    }

    renderExplorations()
    await openNewExplorationModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la Expedición/i), {
      target: { value: "Broken Expedition" },
    })
    fireEvent.change(screen.getByLabelText(/Descripción del Destino/i), {
      target: { value: "Bad route" },
    })
    fireEvent.click(screen.getByTestId("map-coord-picker"))
    fireEvent.click(screen.getByText(/Jane/i))
    fireEvent.click(screen.getByText(/Crear Expedición/i))

    expect(screen.getByText(/Ruta inválida, Equipo inválido/i)).toBeInTheDocument()
  })

  it("shows the no-capable-personnel state", async () => {
    personsData = personsData.map((person) => ({
      ...person,
      can_work: false,
      profession: { ...person.profession, can_explore: false },
    }))

    renderExplorations()
    await openNewExplorationModal()

    expect(screen.getByText(/Sin personal capacitado/i)).toBeInTheDocument()
  })

  it("shows the loading-personnel state when the people list is empty", async () => {
    personsData = []

    renderExplorations()
    await openNewExplorationModal()

    expect(screen.getByText(/Cargando personas disponibles/i)).toBeInTheDocument()
  })

  it("handles form submission for a new exploration", async () => {
    renderExplorations()
    await openNewExplorationModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la Expedición/i), {
      target: { value: "Test Expedition" },
    })
    fireEvent.change(screen.getByLabelText(/Descripción del Destino/i), {
      target: { value: "Test Destination" },
    })
    fireEvent.change(screen.getByLabelText(/Fecha de Salida/i), {
      target: { value: "2026-06-09T09:30" },
    })
    fireEvent.change(screen.getByLabelText(/Días estimados/i), {
      target: { value: "5" },
    })
    fireEvent.change(screen.getByLabelText(/Gracia/i), {
      target: { value: "2" },
    })
    fireEvent.click(screen.getByTestId("map-coord-picker"))

    fireEvent.click(screen.getByText(/Jane/i))
    const johnToggle = screen.getAllByText(/John/i)[1].closest('[role="button"]')!
    fireEvent.keyDown(johnToggle, { key: "Enter" })
    fireEvent.keyDown(johnToggle, { key: "Enter" })
    fireEvent.click(await screen.findByText("LÍDER ✓"))
    fireEvent.click(screen.getByText(/Agua/i))
    fireEvent.keyDown(screen.getByText(/Comida/i).closest('[role="button"]')!, { key: "Enter" })
    fireEvent.keyDown(screen.getByText(/Comida/i).closest('[role="button"]')!, { key: "Enter" })
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "5" } })
    fireEvent.click(screen.getByText(/Crear Expedición/i))

    expect(mutationMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Expedition",
        persons: expect.any(Array),
        resources: expect.any(Array),
      }),
    )

    expect(screen.getByText(/Creada/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText("Aceptar"))
  })

  it("renders unknown statuses and loads more explorations", () => {
    explorationsData = Array.from({ length: 55 }, (_, index) => ({
      id: index < 50 ? `page-one-exp-${index + 1}` : `late-exp-${index + 1}`,
      name: index < 50 ? `Route ${index + 1}` : `Late Route ${index + 1}`,
      status: index === 54 ? "mystery" : "scheduled",
      destination_description: "Ruta externa",
      estimated_days: 1,
      grace_days: 0,
      explorationPersons: [],
      explorationResources: [],
    }))

    renderExplorations()

    expect(screen.queryByText(/Late Route 55/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /CARGAR M/i }))

    expect(screen.getByText(/Late Route 55/i)).toBeInTheDocument()
    expect(screen.getAllByText(/mystery/i).length).toBeGreaterThan(0)
  })

  it("handles return registration for active explorations", () => {
    renderExplorations()

    fireEvent.click(screen.getAllByText(/Forest Search/i)[0])
    fireEvent.click(screen.getByText(/Registrar Retorno/i))
    fireEvent.change(screen.getByLabelText(/Fecha Real de Retorno/i), {
      target: { value: "2026-06-08" },
    })
    fireEvent.change(screen.getByPlaceholderText(/Condiciones del retorno/i), {
      target: { value: "All good" },
    })
    fireEvent.click(screen.getByText(/Agua/i))
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } })
    fireEvent.click(screen.getByText(/Confirmar Retorno/i))

    expect(mutationMocks.returnExp).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "e1",
        body: expect.objectContaining({
          notes: "All good",
          found_resources: expect.any(Array),
        }),
      }),
    )
  })

  it("toggles return resources with keyboard and ignores quantity input clicks", () => {
    renderExplorations()

    fireEvent.click(screen.getAllByText(/Forest Search/i)[0])
    fireEvent.click(screen.getByText(/Registrar Retorno/i))

    const waterToggle = screen.getByText(/Agua/i).closest('[role="button"]')!
    fireEvent.keyDown(waterToggle, { key: "Enter" })

    const quantityInput = screen.getByDisplayValue("1")
    fireEvent.click(quantityInput)
    fireEvent.change(quantityInput, { target: { value: "3" } })
    expect(screen.getByDisplayValue("3")).toBeInTheDocument()

    fireEvent.keyDown(waterToggle, { key: "Enter" })

    expect(screen.queryByDisplayValue("3")).not.toBeInTheDocument()
  })

  it("closes return modal without submitting", () => {
    renderExplorations()

    fireEvent.click(screen.getAllByText(/Forest Search/i)[0])
    fireEvent.click(screen.getByText(/Registrar Retorno/i))
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }))

    expect(screen.queryByText(/Confirmar Retorno/i)).not.toBeInTheDocument()
  })

  it("confirms early departure and cancellation for scheduled explorations", () => {
    renderExplorations()

    fireEvent.click(screen.getAllByText(/Mountain Recon/i)[0])
    fireEvent.click(screen.getByText(/Marcar Salida/i))
    fireEvent.click(screen.getByText("Aceptar"))
    expect(mutationMocks.depart).toHaveBeenCalledWith("e2")

    fireEvent.click(screen.getByText(/Cancelar/i))
    fireEvent.click(screen.getByText("Aceptar"))
    expect(mutationMocks.cancel).toHaveBeenCalledWith("e2")
  })

  it("marks departure immediately when the scheduled departure date has passed", () => {
    explorationsData = [
      {
        ...baseExplorations[1],
        id: "past-scheduled",
        name: "Past Scheduled",
        departure_date: "2020-01-01T00:00:00.000Z",
        target_latitude: 15,
        target_longitude: 25,
      } as (typeof baseExplorations)[number],
    ]

    renderExplorations()

    fireEvent.click(screen.getAllByText(/Past Scheduled/i)[0])
    fireEvent.click(screen.getByText(/Marcar Salida/i))

    expect(mutationMocks.depart).toHaveBeenCalledWith("past-scheduled")
  })

  it("closes an exploration confirmation dialog without confirming", () => {
    renderExplorations()

    fireEvent.click(screen.getAllByText(/Mountain Recon/i)[0])
    fireEvent.click(screen.getByText(/Marcar Salida/i))
    expect(screen.getAllByText(/Salida Anticipada/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByText("Cancelar")[0])

    expect(screen.queryByText(/Salida Anticipada/i)).not.toBeInTheDocument()
  })

  it("opens a selected exploration from router state", () => {
    renderExplorations([{ pathname: "/", state: { selectedExpeditionId: "e2" } } as any])

    expect(screen.getAllByText(/Mountain Recon/i).length).toBeGreaterThan(0)
  })
})
