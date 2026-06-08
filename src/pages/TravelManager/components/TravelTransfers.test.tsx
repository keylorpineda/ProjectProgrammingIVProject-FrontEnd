import * as reactQuery from "@tanstack/react-query"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import TravelTransfers from "./TravelTransfers"

import { useAuthStore } from "@/store/useAuthStore"

// Mock Auth
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: vi.fn(),
  useTokenStore: () => ({ token: "fake-token" }),
}))

// Mock React Query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query")
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

describe("TravelTransfers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { camp_id: "CAMP-1" },
    })

    const mockTransfers = [
      {
        id: "t1",
        camp_origin_id: "CAMP-1",
        camp_destination_id: "CAMP-2",
        status: "pending",
        type: "resources",
        travel_days: 2,
      },
      {
        id: "t2",
        camp_origin_id: "CAMP-3",
        camp_destination_id: "CAMP-1",
        status: "in_transit",
        type: "people",
        travel_days: 1,
      },
    ]

    ;(reactQuery.useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "transfers") return { data: mockTransfers, refetch: vi.fn() }
      if (queryKey[0] === "camps")
        return {
          data: [
            { id: "CAMP-1", name: "Alpha Camp" },
            { id: "CAMP-2", name: "Bravo Camp" },
            { id: "CAMP-3", name: "Charlie Camp" },
          ],
        }
      if (queryKey[0] === "inventory")
        return {
          data: [{ resource_id: "RES-1", resource: { name: "Agua" }, current_quantity: 100 }],
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
    })
    ;(reactQuery.useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
    })
  })

  it("renders the transfer list", () => {
    render(
      <MemoryRouter>
        <TravelTransfers />
      </MemoryRouter>,
    )

    expect(screen.getByText("Gestión de Traslados")).toBeInTheDocument()

    // Check transfers
    expect(screen.getByText("➔ BASE CAMP-2")).toBeInTheDocument() // sent
    expect(screen.getByText("← BASE CAMP-3")).toBeInTheDocument() // received

    // Status badges
    expect(screen.getAllByText("PENDIENTE").length).toBeGreaterThan(0)
    expect(screen.getAllByText("EN TRÁNSITO").length).toBeGreaterThan(0)
  })

  it("filters transfers by status", () => {
    render(
      <MemoryRouter>
        <TravelTransfers />
      </MemoryRouter>,
    )

    const statusSelect = screen.getAllByRole("combobox")[0] // First select is status
    fireEvent.change(statusSelect, { target: { value: "pending" } })

    expect(screen.getByText("➔ BASE CAMP-2")).toBeInTheDocument()
    expect(screen.queryByText("← BASE CAMP-3")).not.toBeInTheDocument()
  })

  it("opens the new transfer modal when 'Nuevo traslado' is clicked", async () => {
    render(
      <MemoryRouter>
        <TravelTransfers />
      </MemoryRouter>,
    )

    const newTransferBtn = screen.getByText("Nuevo traslado")
    fireEvent.click(newTransferBtn)

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    // Test the form elements
    expect(screen.getByText(/Campamento Destino \*/i)).toBeInTheDocument()
    expect(screen.getByText(/Tipo de Traslado \*/i)).toBeInTheDocument()
  })

  it("handles form submission for new transfer", async () => {
    render(
      <MemoryRouter>
        <TravelTransfers />
      </MemoryRouter>,
    )

    const newTransferBtn = screen.getByText("Nuevo traslado")
    fireEvent.click(newTransferBtn)

    await waitFor(() => {
      expect(screen.getByText(/Nueva Solicitud de Traslado/i)).toBeInTheDocument()
    })

    const destSelect = screen.getByLabelText(/Campamento Destino/i)
    fireEvent.change(destSelect, { target: { value: "CAMP-2" } })

    const typeSelect = screen.getByLabelText(/Tipo de Traslado/i)
    fireEvent.change(typeSelect, { target: { value: "both" } })

    const personRow = screen.getByText(/Jane/i)
    fireEvent.click(personRow)

    const resourceRow = screen.getByText(/Agua/i)
    fireEvent.click(resourceRow)

    const resourceInput = screen.getAllByRole("spinbutton")[0]
    fireEvent.change(resourceInput, { target: { value: "10" } })

    const submitBtn = screen.getByText(/Solicitar Traslado/i)
    fireEvent.click(submitBtn)
  })

  it("handles receiving a transfer", () => {
    render(
      <MemoryRouter>
        <TravelTransfers />
      </MemoryRouter>,
    )

    // Wait, the in_transit transfer is to CAMP-1 from CAMP-3. So we are the destination!
    // If we are destination and it is in_transit, we can mark it as received (completed).
    const transitRow = screen.getAllByText(/BASE CAMP-3/i)[0]
    fireEvent.click(transitRow)

    const receiveBtn = screen.getByText(/Confirmar Llegada/i)
    fireEvent.click(receiveBtn)
  })
})
