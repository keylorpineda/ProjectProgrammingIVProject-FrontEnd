import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, inventory } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import Resources from "../Resources"

vi.mock("@/features/inventory/services/inventory.service", () => ({
  getInventory: vi.fn(),
  getInventoryAlerts: vi.fn(),
  updateInventoryItem: vi.fn(),
  createMovement: vi.fn(),
  getMovements: vi.fn(),
  runDailyProcess: vi.fn(),
  runDailyProduction: vi.fn(),
  getResources: vi.fn().mockResolvedValue([]),
  getResourceById: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))

const mockedGetInventory = getInventory as unknown as ReturnType<typeof vi.fn>
const mockedGetMovements = getMovements as unknown as ReturnType<typeof vi.fn>
const mockedRunDaily = runDailyProcess as unknown as ReturnType<typeof vi.fn>
const mockedCreateMovement = createMovement as unknown as ReturnType<typeof vi.fn>
const mockedUpdateInventoryItem = updateInventoryItem as unknown as ReturnType<typeof vi.fn>

import { getCamps } from "@/features/camps/services/camps.service"
import {
  createMovement,
  getInventory,
  getMovements,
  runDailyProcess,
  updateInventoryItem,
} from "@/features/inventory/services/inventory.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const renderResources = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <Resources />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → Resources", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetInventory.mockReset()
    mockedGetMovements.mockReset()
    mockedRunDaily.mockReset()
    mockedCreateMovement.mockReset()
    mockedUpdateInventoryItem.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetInventory.mockResolvedValue(inventory)
    mockedGetMovements.mockResolvedValue([])
  })

  describe("listing", () => {
    it("renders the page heading and action buttons", async () => {
      renderResources()
      expect(await screen.findByText(/MANIFIESTO DE ALMACÉN/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /HISTORIAL/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /PROCESO DIARIO/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /\+ REGISTRAR MOVIMIENTO/i })).toBeInTheDocument()
    })

    it("renders inventory rows from the API", async () => {
      renderResources()
      expect(await screen.findByText(/Agua/i)).toBeInTheDocument()
    })
  })

  describe("create movement (regression: camp_id + resource_id must be NUMBERS)", () => {
    it("opens the movement modal and sends numeric IDs", async () => {
      const user = userEvent.setup()
      mockedCreateMovement.mockResolvedValue({ id: "999" })
      renderResources()
      await user.click(await screen.findByRole("button", { name: /\+ REGISTRAR MOVIMIENTO/i }))

      const modal = (
        await screen.findByRole("heading", { name: /^REGISTRAR MOVIMIENTO$/i })
      ).closest(".modal-card") as HTMLElement

      const selects = within(modal).getAllByRole("combobox")
      await user.selectOptions(selects[0], "1")
      await user.selectOptions(selects[1], "addition")
      await user.type(within(modal).getByRole("spinbutton"), "25")

      await user.click(within(modal).getByRole("button", { name: /^REGISTRAR$/i }))
      await waitFor(() => expect(mockedCreateMovement).toHaveBeenCalled())
      const body = mockedCreateMovement.mock.calls[0][0]
      expect(body.camp_id).toBe(1)
      expect(body.resource_id).toBe(1)
      expect(body.quantity).toBe(25)
      expect(body.type).toBe("addition")
      expect(typeof body.camp_id).toBe("number")
      expect(typeof body.resource_id).toBe("number")
    })

    it("blocks submit when quantity is 0", async () => {
      const user = userEvent.setup()
      renderResources()
      await user.click(await screen.findByRole("button", { name: /\+ REGISTRAR MOVIMIENTO/i }))
      const modal = (
        await screen.findByRole("heading", { name: /^REGISTRAR MOVIMIENTO$/i })
      ).closest(".modal-card") as HTMLElement

      const selects = within(modal).getAllByRole("combobox")
      await user.selectOptions(selects[0], "1")
      await user.click(within(modal).getByRole("button", { name: /^REGISTRAR$/i }))

      expect(mockedCreateMovement).not.toHaveBeenCalled()
      expect(within(modal).getByText(/La cantidad debe ser mayor a 0/i)).toBeInTheDocument()
    })
  })

  describe("adjust stock min (regression: resource_id from row, NUMERIC)", () => {
    it("opens the AJUSTAR STOCK MÍNIMO modal from the per-row AJUSTAR button", async () => {
      const user = userEvent.setup()
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^AJUSTAR$/i }))
      expect(
        await screen.findByRole("heading", { name: /AJUSTAR STOCK MÍNIMO/i }),
      ).toBeInTheDocument()
    })

    it("submit calls updateInventoryItem(activeCampId, resourceId, {minimum_stock_required: NUMBER})", async () => {
      const user = userEvent.setup()
      mockedUpdateInventoryItem.mockResolvedValue(inventory[0])
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^AJUSTAR$/i }))
      const modal = (await screen.findByRole("heading", { name: /AJUSTAR STOCK MÍNIMO/i })).closest(
        ".modal-card",
      ) as HTMLElement

      const input = within(modal).getByRole("spinbutton") as HTMLInputElement
      await user.clear(input)
      await user.type(input, "750")
      await user.click(within(modal).getByRole("button", { name: /CONFIRMAR AJUSTE/i }))

      await waitFor(() => expect(mockedUpdateInventoryItem).toHaveBeenCalled())
      const [campId, resourceId, body] = mockedUpdateInventoryItem.mock.calls[0]
      expect(campId).toBe("1")
      expect(resourceId).toBe("1")
      expect(body.minimum_stock_required).toBe(750)
      expect(typeof body.minimum_stock_required).toBe("number")
    })

    it("rejects negative stock values", async () => {
      const user = userEvent.setup()
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^AJUSTAR$/i }))
      const modal = (await screen.findByRole("heading", { name: /AJUSTAR STOCK MÍNIMO/i })).closest(
        ".modal-card",
      ) as HTMLElement
      const input = within(modal).getByRole("spinbutton") as HTMLInputElement
      await user.clear(input)
      await user.type(input, "-5")
      await user.click(within(modal).getByRole("button", { name: /CONFIRMAR AJUSTE/i }))
      expect(
        within(modal).getByText(/El stock mínimo debe ser un número positivo/i),
      ).toBeInTheDocument()
      expect(mockedUpdateInventoryItem).not.toHaveBeenCalled()
    })
  })

  describe("movements history", () => {
    it("opens the HISTORIAL modal and fetches getMovements(campId, 30)", async () => {
      const user = userEvent.setup()
      mockedGetMovements.mockResolvedValue([])
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^HISTORIAL$/i }))
      expect(
        await screen.findByRole("heading", { name: /HISTORIAL DE MOVIMIENTOS/i }),
      ).toBeInTheDocument()
      await waitFor(() => expect(mockedGetMovements).toHaveBeenCalledWith("1", 30))
    })

    it("shows 'SIN MOVIMIENTOS REGISTRADOS' when the list is empty", async () => {
      const user = userEvent.setup()
      mockedGetMovements.mockResolvedValue([])
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^HISTORIAL$/i }))
      expect(await screen.findByText(/SIN MOVIMIENTOS REGISTRADOS/i)).toBeInTheDocument()
    })

    it("renders movement rows when history has entries", async () => {
      const user = userEvent.setup()
      mockedGetMovements.mockResolvedValue([
        {
          id: "m1",
          type: "addition",
          resource_id: "1",
          quantity: 50,
          date: "2026-03-10T00:00:00.000Z",
          description: "Reabastecimiento",
          resource: { name: "Agua", unit: "litros" },
        },
      ])
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^HISTORIAL$/i }))
      const modal = (
        await screen.findByRole("heading", { name: /HISTORIAL DE MOVIMIENTOS/i })
      ).closest(".modal-card") as HTMLElement
      expect(within(modal).getByText(/Reabastecimiento/i)).toBeInTheDocument()
      expect(within(modal).getByText(/50/)).toBeInTheDocument()
    })

    it("includes description field in movement creation form", async () => {
      const user = userEvent.setup()
      mockedCreateMovement.mockResolvedValue({ id: "m99" })
      renderResources()
      await user.click(await screen.findByRole("button", { name: /\+ REGISTRAR MOVIMIENTO/i }))

      const modal = (
        await screen.findByRole("heading", { name: /^REGISTRAR MOVIMIENTO$/i })
      ).closest(".modal-card") as HTMLElement

      const selects = within(modal).getAllByRole("combobox")
      await user.selectOptions(selects[0], "1")
      await user.selectOptions(selects[1], "addition")
      await user.type(within(modal).getByRole("spinbutton"), "10")
      await user.type(within(modal).getByPlaceholderText(/Razón del movimiento/i), "Test desc")

      await user.click(within(modal).getByRole("button", { name: /^REGISTRAR$/i }))
      await waitFor(() => expect(mockedCreateMovement).toHaveBeenCalled())
      const body = mockedCreateMovement.mock.calls[0][0]
      expect(body.description).toBe("Test desc")
    })

    it("CANCELAR button in the movement modal closes the modal", async () => {
      const user = userEvent.setup()
      renderResources()
      await user.click(await screen.findByRole("button", { name: /\+ REGISTRAR MOVIMIENTO/i }))
      await screen.findByRole("heading", { name: /^REGISTRAR MOVIMIENTO$/i })
      await user.click(screen.getByRole("button", { name: /^CANCELAR$/i }))
      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /^REGISTRAR MOVIMIENTO$/i }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe("daily process", () => {
    it("runs the daily process and shows success state", async () => {
      const user = userEvent.setup()
      mockedRunDaily.mockResolvedValue(undefined)
      renderResources()
      await user.click(await screen.findByRole("button", { name: /^PROCESO DIARIO$/i }))
      const modal = (await screen.findByRole("button", { name: /CONFIRMAR PROCESO/i })).closest(
        ".modal-card",
      ) as HTMLElement
      await user.click(within(modal).getByRole("button", { name: /CONFIRMAR PROCESO/i }))
      await waitFor(() => expect(mockedRunDaily).toHaveBeenCalledWith("1"))
    })
  })
})
