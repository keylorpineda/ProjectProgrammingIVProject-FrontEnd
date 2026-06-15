import { fireEvent } from "@testing-library/dom"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import TransfersView from "../TransfersView"

import type { Camp, Inventory, ResourceItem, Transfer } from "../../types"

// Mock the leaflet map feature component to isolate rendering
vi.mock("@/features/map-test/components/TransferRouteMap", () => ({
  TransferRouteMap: () => <div data-testid="mock-route-map">Route Map</div>,
}))

const mockCamps: Camp[] = [
  { id: 1, name: "Campamento Alpha", latitude: 10, longitude: -84 },
  { id: 2, name: "Refugio Beta", latitude: 11, longitude: -83 },
] as any

const mockResources: ResourceItem[] = [
  { id: 1, name: "Agua", unit: "L", category: "water" },
  { id: 2, name: "Comida", unit: "Raciones", category: "food" },
] as any

const mockInventory: Inventory[] = [
  {
    camp_id: 1,
    resource_id: 1,
    current_quantity: 100,
    minimum_stock_required: 50,
    alert_active: false,
    resource: mockResources[0] as any,
  } as any,
  {
    camp_id: 1,
    resource_id: 2,
    current_quantity: 5,
    minimum_stock_required: 20,
    alert_active: true,
    resource: mockResources[1] as any,
  } as any,
]

const mockTransfers: Transfer[] = [
  {
    id: 101,
    origin_camp_id: 2,
    destination_camp_id: 1,
    resource_id: 1,
    quantity: 100,
    status: "pending",
    requested_by_user_id: 1,
    notes: "Urgent need",
    origin_camp: mockCamps[1],
    destination_camp: mockCamps[0],
  },
  {
    id: 102,
    origin_camp_id: 1,
    destination_camp_id: 2,
    resource_id: 2,
    quantity: 50,
    status: "in_transit",
    requested_by_user_id: 1,
    notes: "Sending spare food",
    origin_camp: mockCamps[0],
    destination_camp: mockCamps[1],
  },
]

describe("TransfersView Component", () => {
  let onCreate: any, onApprove: any, onCancel: any

  beforeEach(() => {
    onCreate = vi.fn()
    onApprove = vi.fn()
    onCancel = vi.fn()
  })

  it("renders transfers and handles filters", () => {
    render(
      <TransfersView
        transfers={mockTransfers}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )

    expect(screen.getByText("TRASLADOS INTER-CAMPAMENTOS")).toBeInTheDocument()
    expect(screen.getByText("TRASLADO #101")).toBeInTheDocument()
    expect(screen.getByText("TRASLADO #102")).toBeInTheDocument()

    // Filter by Origin (We send)
    const originFilter = screen.getByRole("button", { name: /enviamos \(origen\)/i })
    fireEvent.click(originFilter)
    expect(screen.queryByText("TRASLADO #101")).not.toBeInTheDocument()
    expect(screen.getByText("TRASLADO #102")).toBeInTheDocument()

    // Click all status filter buttons to cover setFilterStatus branches
    const statuses = ["PENDIENTE", "APROBADO", "EN TRÁNSITO", "RECHAZADO", "CANCELADO", "VER TODOS"]
    statuses.forEach((statusName) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${statusName}$`, "i") }))
    })
  })

  it("triggers approve and reject on incoming pending requests", () => {
    render(
      <TransfersView
        transfers={mockTransfers}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )

    // Transfer 101 is incoming pending
    const approveBtn = screen.getByRole("button", { name: /aprobar/i })
    const rejectBtn = screen.getByRole("button", { name: /rechazar/i })

    fireEvent.click(approveBtn)
    expect(onApprove).toHaveBeenCalledWith(101, true)

    fireEvent.click(rejectBtn)
    expect(onApprove).toHaveBeenCalledWith(101, false)
  })

  it("triggers cancel on outgoing pending requests", () => {
    // Make 102 pending to trigger outgoing cancel button
    const pendingOutgoing = [{ ...mockTransfers[1], status: "pending" as const }]
    render(
      <TransfersView
        transfers={pendingOutgoing}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )

    const cancelBtn = screen.getByRole("button", { name: /cancelar solicitud/i })
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledWith(102)
  })

  it("shows CONVOY EN RUTA on incoming in-transit requests (no receive action)", () => {
    // Make 102 incoming in_transit
    const incomingTransit = [
      {
        ...mockTransfers[1],
        origin_camp_id: 2,
        destination_camp_id: 1,
        status: "in_transit" as const,
      },
    ]
    render(
      <TransfersView
        transfers={incomingTransit}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )

    expect(screen.getByText(/convoy en ruta/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /confirmar llegada/i })).not.toBeInTheDocument()
  })

  it("opens request modal and handles validation", async () => {
    render(
      <TransfersView
        transfers={mockTransfers}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: /solicitar traslado/i }))
    expect(screen.getByText("CREAR HOJA DE TRASLADO PENDIENTE")).toBeInTheDocument()

    // Test Validation: identical camps error (myCampId is 1, and default selected is targetCampId = 2, so let's select import type first, and then type check or same camp checks)
    // To trigger "LA CANTIDAD SOLICITADA DEBE SER MAYOR A CERO."
    const qtyInput = screen.getByLabelText(/cantidad dispuesta/i)
    fireEvent.change(qtyInput, { target: { value: 0 } })

    const form = screen.getByText("MEMORIZAR TRASLADO").closest("form")!
    fireEvent.submit(form)

    expect(screen.getByText("LA CANTIDAD SOLICITADA DEBE SER MAYOR A CERO.")).toBeInTheDocument()

    // Test Validation: insufficient stock for export
    // Select export operation direction
    fireEvent.click(screen.getByText("REGISTRAR SUMINISTRO (EXPORTACIÓN)"))
    // Set quantity to 50 for resource id 2 (Comida) which only has 5 items in inventory
    const resourceSelect = screen.getByLabelText(/recurso/i)
    fireEvent.change(resourceSelect, { target: { value: "2" } })
    fireEvent.change(qtyInput, { target: { value: "50" } })

    fireEvent.submit(form)
    expect(screen.getByText(/niveles de stock insuficientes/i)).toBeInTheDocument()

    // Test successful request creation
    // Change to import
    fireEvent.click(screen.getByText("SOLICITAR ENVÍO (IMPORTACIÓN)"))
    fireEvent.change(qtyInput, { target: { value: "200" } })

    fireEvent.submit(form)
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        origin_camp_id: 2,
        destination_camp_id: 1,
        resource_id: 2,
        quantity: 200,
        notes: "",
        requested_by_user_id: 77,
      })
    })
  })

  it("handles identical camps validation error", async () => {
    render(
      <TransfersView
        transfers={[]}
        camps={[mockCamps[0]]}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={2}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /solicitar traslado/i }))
    const form = screen.getByText("MEMORIZAR TRASLADO").closest("form")!
    fireEvent.submit(form)
    expect(await screen.findByText("LOS CAMPAMENTOS NO PUEDEN SER IDÉNTICOS.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "RETORNAR" }))
  })

  it("renders completed, rejected, cancelled, in-transit-outgoing status labels", () => {
    const variedTransfers: Transfer[] = [
      {
        id: 201,
        origin_camp_id: 1,
        destination_camp_id: 2,
        resource_id: 1,
        quantity: 20,
        status: "completed",
        requested_by_user_id: 1,
        notes: "",
        origin_camp: mockCamps[0],
        destination_camp: mockCamps[1],
      },
      {
        id: 202,
        origin_camp_id: 1,
        destination_camp_id: 2,
        resource_id: 1,
        quantity: 20,
        status: "rejected",
        requested_by_user_id: 1,
        notes: "",
        origin_camp: mockCamps[0],
        destination_camp: mockCamps[1],
      },
      {
        id: 203,
        origin_camp_id: 1,
        destination_camp_id: 2,
        resource_id: 1,
        quantity: 20,
        status: "cancelled",
        requested_by_user_id: 1,
        notes: "",
        origin_camp: mockCamps[0],
        destination_camp: mockCamps[1],
      },
      {
        id: 204,
        origin_camp_id: 1,
        destination_camp_id: 2,
        resource_id: 1,
        quantity: 20,
        status: "in_transit",
        requested_by_user_id: 1,
        notes: "",
        origin_camp: mockCamps[0],
        destination_camp: mockCamps[1],
      },
    ]
    render(
      <TransfersView
        transfers={variedTransfers}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    expect(screen.getByText("ENTREGADO — ARCHIVADO")).toBeInTheDocument()
    expect(screen.getByText("TRASLADO RECHAZADO")).toBeInTheDocument()
    expect(screen.getByText("— CONVOY CANCELADO —")).toBeInTheDocument()
    expect(screen.getByText("CONVOY EN RUTA")).toBeInTheDocument()
  })

  it("shows CONVOY EN RUTA for approved incoming transfer (no receive action)", () => {
    const approvedIncoming: Transfer[] = [
      {
        id: 205,
        origin_camp_id: 2,
        destination_camp_id: 1,
        resource_id: 1,
        quantity: 30,
        status: "approved",
        requested_by_user_id: 1,
        notes: "",
        origin_camp: mockCamps[1],
        destination_camp: mockCamps[0],
      },
    ]
    render(
      <TransfersView
        transfers={approvedIncoming}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    expect(screen.getByText("CONVOY EN RUTA")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /confirmar llegada/i })).not.toBeInTheDocument()
  })

  it("shows BASE DESCONOCIDA when camp not found in camps array and t.origin_camp is absent", () => {
    const unknownCampTransfer: Transfer[] = [
      {
        id: 206,
        origin_camp_id: 99,
        destination_camp_id: 1,
        resource_id: 1,
        quantity: 10,
        status: "pending",
        requested_by_user_id: 1,
        notes: "",
      },
    ]
    render(
      <TransfersView
        transfers={unknownCampTransfer}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    expect(screen.getByText("BASE DESCONOCIDA")).toBeInTheDocument()
  })

  it("shows t.resource.name when resource is not found in resources prop", () => {
    const noResItemTransfer: Transfer[] = [
      {
        id: 207,
        origin_camp_id: 2,
        destination_camp_id: 1,
        resource_id: 999,
        quantity: 5,
        status: "pending",
        requested_by_user_id: 1,
        notes: "",
        resource: { id: 999, name: "Medicamentos", unit: "Unidades", category: "medical" } as any,
        origin_camp: mockCamps[1],
        destination_camp: mockCamps[0],
      },
    ]
    render(
      <TransfersView
        transfers={noResItemTransfer}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    expect(screen.getByText("Medicamentos")).toBeInTheDocument()
  })

  it("handles creation error catch and target camp/notes changing", async () => {
    onCreate.mockRejectedValueOnce(new Error("API Error"))
    render(
      <TransfersView
        transfers={[]}
        camps={mockCamps}
        resources={mockResources}
        inventory={mockInventory}
        myCampId={1}
        onCreateTransferRequest={onCreate}
        onApproveTransferRequest={onApprove}
        onCancelTransferRequest={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /solicitar traslado/i }))
    const notesInput = screen.getByPlaceholderText(/motivos de suministro/i)
    fireEvent.change(notesInput, { target: { value: "some notes" } })

    // Change target camp option
    const campSelect = screen.getByLabelText(/campamento de destino/i)
    fireEvent.change(campSelect, { target: { value: "2" } })

    const form2 = screen.getByText("MEMORIZAR TRASLADO").closest("form")!
    fireEvent.submit(form2)

    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument()
    })

    // Cancel using the [X] close button
    fireEvent.click(screen.getByText("[X]"))
    expect(screen.queryByText("CREAR HOJA DE TRASLADO PENDIENTE")).not.toBeInTheDocument()
  })
})
