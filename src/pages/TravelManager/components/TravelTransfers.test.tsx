import * as reactQuery from "@tanstack/react-query"
import { fireEvent } from "@testing-library/dom"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import TravelTransfers from "./TravelTransfers"

import { useAuthStore } from "@/store/useAuthStore"

const mutationMocks = vi.hoisted(() => ({
  create: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  invalidateQueries: vi.fn(),
}))

const socketMock = vi.hoisted(() => ({
  on: vi.fn(),
  disconnect: vi.fn(),
}))

const authState = vi.hoisted(() => ({
  token: "fake-token",
}))

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: vi.fn((selector) => selector({ token: authState.token })),
}))

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock),
}))

vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(() => []),
}))

vi.mock("@/features/inventory/services/inventory.service", () => ({
  getInventory: vi.fn(() => []),
}))

vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(() => ({ data: [] })),
}))

vi.mock("@/features/transfers/services/transfers.service", () => ({
  cancelTransfer: vi.fn(),
  confirmTransferArrival: vi.fn(),
  createTransferRequest: vi.fn(),
  getCampTransfers: vi.fn(() => []),
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

const mockTransfers = [
  {
    id: "t1",
    camp_origin_id: "CAMP-1",
    camp_destination_id: "CAMP-2",
    status: "pending",
    type: "resources",
    travel_days: 2,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    request_date: "2026-01-01T00:00:00.000Z",
    resourceDetails: [
      {
        resource_id: "RES-1",
        requested_quantity: 5,
        resource: { name: "Agua", category: "water", unit: "L" },
      },
    ],
    personDetails: [],
    notes: "Enviar agua",
    approvals: [{ status: "approved", user: { username: "chief" } }],
  },
  {
    id: "t2",
    camp_origin_id: "CAMP-3",
    camp_destination_id: "CAMP-1",
    status: "in_transit",
    type: "people",
    travel_days: 1,
    created_at: "2026-01-02T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    request_date: "2026-01-02T00:00:00.000Z",
    personDetails: [
      {
        person_id: "P-2",
        is_leader: true,
        person: { first_name: "Alex", last_name: "Rios" },
      },
    ],
    resourceDetails: [],
  },
  {
    id: "t3",
    camp_origin_id: "CAMP-1",
    camp_destination_id: "CAMP-4",
    status: "completed",
    type: "both",
    travel_days: 3,
    created_at: "2026-01-03T00:00:00.000Z",
    updated_at: "2026-01-03T00:00:00.000Z",
    request_date: "2026-01-03T00:00:00.000Z",
    resourceDetails: [],
    personDetails: [],
  },
  {
    id: "t4",
    camp_origin_id: "CAMP-1",
    camp_destination_id: "CAMP-5",
    status: "approved",
    type: "cargo",
    travel_days: 4,
    created_at: "2026-01-04T00:00:00.000Z",
    updated_at: "2026-01-04T00:00:00.000Z",
    request_date: "2026-01-04T00:00:00.000Z",
    departure_date: "2026-01-05T00:00:00.000Z",
    arrival_date: "2026-01-09T00:00:00.000Z",
    resourceDetails: [
      {
        resource_id: "RES-2",
        requested_quantity: 4,
        resource: { name: "Comida", category: "food", unit: "uds" },
      },
      {
        resource_id: "RES-3",
        requested_quantity: 1,
        resource: { name: "Botiquín", category: "medical", unit: "kit" },
      },
      {
        resource_id: "RES-4",
        requested_quantity: 2,
        resource: { name: "Herramientas", category: "tool", unit: "set" },
      },
      {
        resource_id: "RES-5",
        requested_quantity: 3,
        resource: { name: "Combustible", category: "fuel", unit: "L" },
      },
      {
        resource_id: "RES-6",
        requested_quantity: 6,
        resource: { name: "Munición", category: "ammo", unit: "box" },
      },
      {
        resource_id: "RES-7",
        requested_quantity: 8,
        resource: { name: "Varios", category: "misc", unit: "u" },
      },
    ],
    personDetails: [],
    notes: "",
    approvals: [{ status: "rejected", user: null }],
  },
  {
    id: "t5",
    camp_origin_id: "CAMP-1",
    camp_destination_id: "CAMP-2",
    status: "rejected",
    type: "resources",
    travel_days: 2,
    created_at: "2026-01-05T00:00:00.000Z",
    updated_at: "2026-01-05T00:00:00.000Z",
    request_date: "2026-01-05T00:00:00.000Z",
    resourceDetails: [],
    personDetails: [],
  },
  {
    id: "t6",
    camp_origin_id: "CAMP-1",
    camp_destination_id: "CAMP-3",
    status: "cancelled",
    type: "people",
    travel_days: 1,
    created_at: "2026-01-06T00:00:00.000Z",
    updated_at: "2026-01-06T00:00:00.000Z",
    request_date: "2026-01-06T00:00:00.000Z",
    resourceDetails: [],
    personDetails: [],
  },
  {
    id: "t7",
    camp_origin_id: "CAMP-6",
    camp_destination_id: "CAMP-1",
    status: "rerouted",
    type: "medical",
    travel_days: 1,
    created_at: "2026-01-07T00:00:00.000Z",
    updated_at: "2026-01-07T00:00:00.000Z",
    request_date: "2026-01-07T00:00:00.000Z",
    resourceDetails: [
      {
        resource_id: "RES-8",
        requested_quantity: 1,
        resource: { name: "Paquete raro", category: undefined, unit: undefined },
      },
    ],
    personDetails: [
      {
        person_id: "P-9",
        is_leader: false,
        person: { first_name: "Noa", last_name: "Vega" },
      },
    ],
    approvals: [{ status: "waiting", user: undefined }],
  },
]

let transfersData = mockTransfers
let transfersError: Error | null = null
let createMutationError: unknown = null

function renderTransfers(initialEntries = ["/travel/transfers"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TravelTransfers />
    </MemoryRouter>,
  )
}

describe("TravelTransfers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.token = "fake-token"
    transfersData = mockTransfers
    transfersError = null
    createMutationError = null
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { camp_id: "CAMP-1" },
    })
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "transfers")
          return { data: transfersData, error: transfersError, refetch: vi.fn() }
        if (queryKey[0] === "camps")
          return {
            data: [
              { id: "CAMP-1", name: "Alpha Camp" },
              { id: "CAMP-2", name: "Bravo Camp" },
              { id: "CAMP-3", name: "Charlie Camp" },
              { id: "CAMP-4", name: "Delta Camp" },
              { id: "CAMP-5", name: "Echo Camp" },
            ],
          }
        if (queryKey[0] === "inventory")
          return {
            data: [
              {
                resource_id: "RES-1",
                resource: { name: "Agua", category: "water", unit: "L" },
                current_quantity: 100,
              },
            ],
          }
        if (queryKey[0] === "persons")
          return {
            data: {
              data: [
                {
                  id: "P-1",
                  first_name: "Jane",
                  last_name: "Doe",
                  camp_id: "CAMP-1",
                  profession: { name: "Operario" },
                  status: "active",
                },
              ],
            },
          }
        return { data: [] }
      },
    )
    ;(reactQuery.useMutation as ReturnType<typeof vi.fn>).mockImplementation((config) => {
      const mutationSource = String(config.mutationFn)
      const isCreate =
        !mutationSource.includes("cancelTransfer") &&
        !mutationSource.includes("confirmTransferArrival")
      const target = mutationSource.includes("cancelTransfer")
        ? mutationMocks.cancel
        : mutationSource.includes("confirmTransferArrival")
          ? mutationMocks.confirm
          : mutationMocks.create
      return {
        mutate: vi.fn((variables) => {
          config.mutationFn?.(variables)
          target(variables)
          if (isCreate && createMutationError) {
            config.onError?.(createMutationError)
          } else {
            config.onSuccess?.()
          }
        }),
        isPending: false,
      }
    })
  })

  it("renders the transfer list", () => {
    renderTransfers()

    expect(screen.getAllByText(/Traslados/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BASE CAMP-2/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BASE CAMP-3/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/PENDIENTE/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/TR/i).length).toBeGreaterThan(0)
  })

  it("filters transfers by status", () => {
    renderTransfers()

    const statusSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(statusSelect, { target: { value: "pending" } })

    expect(screen.getAllByText(/BASE CAMP-2/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/BASE CAMP-3/i)).not.toBeInTheDocument()
  })

  it("filters transfers by role and search text", () => {
    renderTransfers()

    const searchInput = screen.getByPlaceholderText(/Buscar por ID o base/i)
    fireEvent.change(searchInput, { target: { value: "camp-3" } })

    expect(screen.getAllByText(/BASE CAMP-3/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/BASE CAMP-2/i)).not.toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: "" } })
    const roleSelect = screen.getAllByRole("combobox")[1]
    fireEvent.change(roleSelect, { target: { value: "destination" } })

    expect(screen.getAllByText(/BASE CAMP-3/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/BASE CAMP-2/i)).not.toBeInTheDocument()
  })

  it("opens the new transfer modal when the button is clicked", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Campamento Destino/i)).toBeInTheDocument()
    expect(screen.getByText(/Tipo de Traslado/i)).toBeInTheDocument()
  })

  it("shows an offline alert when transfers query fails", () => {
    transfersError = new Error("offline")

    renderTransfers()

    expect(screen.getByText(/Modo fuera de/i)).toBeInTheDocument()
  })

  it("shows an empty state and opens the modal from it", async () => {
    transfersData = []

    renderTransfers()

    expect(screen.getByText(/Sin traslados registrados/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText("Nuevo Traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })
  })

  it("handles form submission for a mixed transfer", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.change(screen.getByLabelText(/Tipo de Traslado/i), {
      target: { value: "both" },
    })
    fireEvent.click(screen.getByText(/Jane/i))
    const waterOptions = screen.getAllByText(/Agua/i)
    fireEvent.click(waterOptions[waterOptions.length - 1])
    const quantityInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(quantityInputs[quantityInputs.length - 1], { target: { value: "10" } })
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(mutationMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "both",
        travel_days: 1,
        resource_details: [{ resource_id: expect.any(Number), requested_quantity: 10 }],
        person_details: [{ person_id: expect.any(Number) }],
      }),
    )
  })

  it("shows validation errors for incomplete transfer requests", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Solicitar Traslado/i))
    expect(screen.getByText(/Seleccione un campamento de destino/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))
    expect(screen.getByText(/Debe incluir al menos un recurso/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Tipo de Traslado/i), {
      target: { value: "people" },
    })
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))
    expect(screen.getByText(/Debe incluir al menos una persona/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Tipo de Traslado/i), {
      target: { value: "both" },
    })
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))
    expect(screen.getByText(/traslado mixto requiere/i)).toBeInTheDocument()
  })

  it("creates a people transfer with notes and travel days", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.change(screen.getByLabelText(/Tipo de Traslado/i), {
      target: { value: "people" },
    })
    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "4" },
    })
    fireEvent.change(screen.getByLabelText(/Notas/i), {
      target: { value: "Mover personal medico" },
    })
    fireEvent.click(screen.getByText(/Jane/i))
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(mutationMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "people",
        notes: "Mover personal medico",
        travel_days: 4,
        resource_details: undefined,
        person_details: [{ person_id: expect.any(Number) }],
      }),
    )
  })

  it("clamps resource quantities before submitting", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    const waterOptions = screen.getAllByText(/Agua/i)
    fireEvent.click(waterOptions[waterOptions.length - 1])
    const quantityInputs = screen.getAllByRole("spinbutton")
    fireEvent.click(quantityInputs[quantityInputs.length - 1])
    fireEvent.change(quantityInputs[quantityInputs.length - 1], { target: { value: "999" } })
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(mutationMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_details: [{ resource_id: expect.any(Number), requested_quantity: 100 }],
      }),
    )
  })

  it("shows success confirmation after creating a transfer", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.click(screen.getAllByText(/Agua/i).at(-1)!)
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(screen.getByText("Traslado Creado")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Aceptar"))
  })

  it("shows API validation errors when transfer creation fails", async () => {
    createMutationError = {
      response: { data: { message: ["Cantidad inválida desde API"] } },
    }

    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.click(screen.getAllByText(/Agua/i).at(-1)!)
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(screen.getByText("Cantidad inválida desde API")).toBeInTheDocument()
  })

  it("shows fallback errors when transfer creation fails without API message", async () => {
    createMutationError = new Error("boom")

    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.click(screen.getAllByText(/Agua/i).at(-1)!)
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(screen.getByText(/Error al crear el traslado/i)).toBeInTheDocument()
  })

  it("shows string API errors when transfer creation fails", async () => {
    createMutationError = {
      response: { data: { message: "Destino bloqueado por la central" } },
    }

    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Campamento Destino/i), {
      target: { value: "CAMP-2" },
    })
    fireEvent.click(screen.getAllByText(/Agua/i).at(-1)!)
    fireEvent.click(screen.getByText(/Solicitar Traslado/i))

    expect(screen.getByText("Destino bloqueado por la central")).toBeInTheDocument()
  })

  it("discards a draft transfer from the confirmation dialog", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Cancelar"))
    expect(screen.getByText("Descartar Solicitud")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Aceptar"))

    await waitFor(() => {
      expect(screen.queryByText(/Nueva Solicitud de Traslado/i)).not.toBeInTheDocument()
    })
  })

  it("closes a confirmation dialog when cancel is clicked", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Cancelar"))
    expect(screen.getByText("Descartar Solicitud")).toBeInTheDocument()

    fireEvent.click(screen.getAllByText("Cancelar")[0])

    expect(screen.queryByText("Descartar Solicitud")).not.toBeInTheDocument()
  })

  it("refetches transfers from the socket notification", () => {
    const refetchMock = vi.fn()
    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(
      ({ queryKey, queryFn }) => {
        queryFn?.()

        if (queryKey[0] === "transfers")
          return { data: transfersData, error: transfersError, refetch: refetchMock }
        if (queryKey[0] === "camps") return { data: [] }
        if (queryKey[0] === "inventory") return { data: [] }
        if (queryKey[0] === "persons") return { data: { data: [] } }
        return { data: [] }
      },
    )

    renderTransfers()

    const requestedHandler = socketMock.on.mock.calls.find(
      ([eventName]) => eventName === "transfer.requested",
    )?.[1]
    requestedHandler?.()

    expect(refetchMock).toHaveBeenCalled()
  })

  it("toggles selected resources and people off in the transfer form", async () => {
    renderTransfers()

    fireEvent.click(screen.getByText("Nuevo traslado"))

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Tipo de Traslado/i), {
      target: { value: "both" },
    })

    fireEvent.click(screen.getByText(/Jane/i))
    expect(screen.getByText(/1 seleccionada/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Jane/i))
    expect(screen.getByText(/0 seleccionada/i)).toBeInTheDocument()

    const waterOptions = screen.getAllByText(/Agua/i)
    fireEvent.click(waterOptions[waterOptions.length - 1])
    expect(screen.getByText(/1 seleccionado/i)).toBeInTheDocument()
    fireEvent.click(waterOptions[waterOptions.length - 1])
    expect(screen.getByText(/0 seleccionado/i)).toBeInTheDocument()
  })

  it("loads more transfers when the transfer list is paginated", () => {
    transfersData = Array.from({ length: 55 }, (_, index) => ({
      id: index < 50 ? `page-one-transfer-${index + 1}` : `late-transfer-${index + 1}`,
      camp_origin_id: "CAMP-1",
      camp_destination_id: "CAMP-2",
      status: index % 2 === 0 ? "pending" : "approved",
      type: "resources",
      travel_days: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      request_date: "2026-01-01T00:00:00.000Z",
      resourceDetails: [],
      personDetails: [],
    }))

    renderTransfers()

    expect(screen.queryByText(/LATE-TRA/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /CARGAR M/i }))

    expect(screen.getAllByText(/LATE-TRA/i).length).toBeGreaterThan(0)
  })

  it("cancels a pending sent transfer after confirmation", () => {
    renderTransfers()

    fireEvent.click(screen.getByText(/Cancelar Traslado/i))
    expect(screen.getAllByText("Cancelar Traslado").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText("Aceptar"))

    expect(mutationMocks.cancel).toHaveBeenCalledWith("t1")
  })

  it("handles receiving a transfer", () => {
    renderTransfers()

    fireEvent.click(screen.getAllByText(/BASE CAMP-3/i)[0])
    fireEvent.click(screen.getByText(/Confirmar Llegada/i))
    fireEvent.click(screen.getByText("Aceptar"))

    expect(mutationMocks.confirm).toHaveBeenCalledWith("t2")
  })

  it("shows the archived message for completed transfers", () => {
    renderTransfers()

    fireEvent.click(screen.getByText(/BASE CAMP-4/i))

    expect(screen.getByText(/Traslado archivado/i)).toBeInTheDocument()
  })

  it("renders approved transfers with resource category variants", () => {
    renderTransfers()

    fireEvent.click(screen.getByText(/BASE CAMP-5/i))

    expect(screen.getAllByText(/APROBADO/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/CARGA: CARGO/i)).toBeInTheDocument()
    expect(screen.getByText(/Comida/i)).toBeInTheDocument()
    expect(screen.getByText(/Botiquín/i)).toBeInTheDocument()
    expect(screen.getByText(/Herramientas/i)).toBeInTheDocument()
    expect(screen.getByText(/Combustible/i)).toBeInTheDocument()
    expect(screen.getByText(/Munición/i)).toBeInTheDocument()
    expect(screen.getByText(/Varios/i)).toBeInTheDocument()
    expect(screen.getAllByText(/RECHAZADO/i).length).toBeGreaterThan(0)
  })

  it("renders unknown transfer status and type fallbacks", () => {
    renderTransfers()

    fireEvent.click(screen.getByText(/BASE CAMP-6/i))

    expect(screen.getAllByText(/REROUTED/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/CARGA: MEDICAL/i)).toBeInTheDocument()
    expect(screen.getByText(/Paquete raro/i)).toBeInTheDocument()
    expect(screen.getByText(/Noa Vega/i)).toBeInTheDocument()
  })

  it("does not connect the socket when the token is missing", () => {
    authState.token = ""

    renderTransfers()

    expect(socketMock.on).not.toHaveBeenCalled()
  })

  it("opens modal and selects a transfer from router state", async () => {
    renderTransfers([
      {
        pathname: "/travel/transfers",
        state: { openNewTransfer: true, selectedTransferId: "t2" },
      } as unknown as string,
    ])

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    expect(screen.getAllByText(/BASE CAMP-3/i).length).toBeGreaterThan(0)
  })
})
