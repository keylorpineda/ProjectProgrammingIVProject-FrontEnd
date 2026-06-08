import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, explorations, personsPage, resources } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import Explorations from "../Explorations"

vi.mock("@/features/explorations/services/explorations.service", () => ({
  createExploration: vi.fn(),
  getExplorations: vi.fn(),
  getExplorationById: vi.fn(),
  departExploration: vi.fn(),
  returnExploration: vi.fn(),
  cancelExploration: vi.fn(),
}))
vi.mock("@/features/inventory/services/inventory.service", () => ({
  getResources: vi.fn(),
}))
vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))
vi.mock("@/features/map-test/components/ExplorationZoneMap", () => ({
  ExplorationZoneMap: () => <div data-testid="exploration-map" />,
}))

const mockedGetExplorations = getExplorations as unknown as ReturnType<typeof vi.fn>
const mockedCreate = createExploration as unknown as ReturnType<typeof vi.fn>
const mockedDepart = departExploration as unknown as ReturnType<typeof vi.fn>
const mockedReturn = returnExploration as unknown as ReturnType<typeof vi.fn>
const mockedCancel = cancelExploration as unknown as ReturnType<typeof vi.fn>
const mockedGetResources = getResources as unknown as ReturnType<typeof vi.fn>
const mockedGetPersons = getPersons as unknown as ReturnType<typeof vi.fn>

import { getCamps } from "@/features/camps/services/camps.service"
import {
  cancelExploration,
  createExploration,
  departExploration,
  getExplorations,
  returnExploration,
} from "@/features/explorations/services/explorations.service"
import { getResources } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const renderExplorations = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <Explorations />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → Explorations", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetExplorations.mockReset()
    mockedCreate.mockReset()
    mockedDepart.mockReset()
    mockedReturn.mockReset()
    mockedCancel.mockReset()
    mockedGetResources.mockReset()
    mockedGetPersons.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetExplorations.mockResolvedValue(explorations)
    mockedGetResources.mockResolvedValue(resources)
    mockedGetPersons.mockResolvedValue(personsPage)
  })

  describe("listing", () => {
    it("renders the page heading and 'NUEVA EXPEDICIÓN' button", async () => {
      renderExplorations()
      expect(
        await screen.findByRole("heading", { name: /BITÁCORAS DE CAMPO/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /\+ NUEVA EXPEDICIÓN/i })).toBeInTheDocument()
    })

    it("shows the scheduled exploration", async () => {
      renderExplorations()
      expect(await screen.findByText(/Búsqueda zona norte/i)).toBeInTheDocument()
      expect(screen.getAllByText(/PROGRAMADA/i).length).toBeGreaterThanOrEqual(1)
    })

    it("renders 'SIN EXPEDICIONES REGISTRADAS' on empty list", async () => {
      mockedGetExplorations.mockResolvedValue([])
      renderExplorations()
      expect(await screen.findByText(/SIN EXPEDICIONES REGISTRADAS/i)).toBeInTheDocument()
    })
  })

  describe("create exploration (regression: NUMERIC IDs in camp_id, person_id, resource_id)", () => {
    it("sends camp_id, person_id and resource_id as NUMBERS", async () => {
      const user = userEvent.setup()
      mockedCreate.mockResolvedValue({ ...explorations[0], id: "999" })

      renderExplorations()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVA EXPEDICIÓN/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVA EXPEDICIÓN$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/Ej:/i), "Test exp")
      const numberInputs = within(modal).getAllByRole("spinbutton") as HTMLInputElement[]
      await user.clear(numberInputs[0])
      await user.type(numberInputs[0], "5")
      const dateInputs = within(modal)
        .getAllByDisplayValue("")
        .filter((el) => (el as HTMLInputElement).type === "date") as HTMLInputElement[]
      await user.type(dateInputs[0], "2026-03-01")

      const personSelects = within(modal).getAllByRole("combobox")
      await user.selectOptions(personSelects[0], "10")

      await user.click(within(modal).getByRole("button", { name: /\+ AGREGAR RECURSO/i }))
      const updatedSelects = within(modal).getAllByRole("combobox")
      const resourceSelect = updatedSelects[updatedSelects.length - 1] as HTMLSelectElement
      await user.selectOptions(resourceSelect, "1")
      const qtyInput = within(modal).getByPlaceholderText(/Cant\./i) as HTMLInputElement
      await user.type(qtyInput, "5")

      await user.click(within(modal).getByRole("button", { name: /CREAR EXPEDICIÓN/i }))
      await waitFor(() => expect(mockedCreate).toHaveBeenCalled())

      const body = mockedCreate.mock.calls[0][0]
      expect(body.camp_id).toBe(1)
      expect(body.persons[0].person_id).toBe(10)
      expect(body.resources?.[0].resource_id).toBe(1)
      expect(body.resources?.[0].quantity).toBe(5)
      expect(body.resources?.[0].flow).toBe("out")
      expect(typeof body.camp_id).toBe("number")
      expect(typeof body.persons[0].person_id).toBe("number")
      expect(typeof body.resources?.[0].resource_id).toBe("number")
    })

    it("blocks submit when name is missing", async () => {
      const user = userEvent.setup()
      renderExplorations()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVA EXPEDICIÓN/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVA EXPEDICIÓN$/i })).closest(
        ".modal-card",
      ) as HTMLElement
      await user.click(within(modal).getByRole("button", { name: /CREAR EXPEDICIÓN/i }))
      expect(
        within(modal).getByText(/El nombre de la expedición es obligatorio/i),
      ).toBeInTheDocument()
      expect(mockedCreate).not.toHaveBeenCalled()
    })
  })

  describe("scheduled-exploration actions", () => {
    it("MARCAR SALIDA calls departExploration with the id", async () => {
      const user = userEvent.setup()
      mockedDepart.mockResolvedValue(explorations[0])
      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      await user.click(await screen.findByRole("button", { name: /MARCAR SALIDA/i }))
      await waitFor(() => expect(mockedDepart).toHaveBeenCalledWith("200"))
    })

    it("CANCELAR EXPEDICIÓN flow calls cancelExploration", async () => {
      const user = userEvent.setup()
      mockedCancel.mockResolvedValue(undefined)
      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      await user.click(await screen.findByRole("button", { name: /CANCELAR EXPEDICIÓN/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR CANCELACIÓN/i }))
      await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith("200"))
    })
  })

  describe("status branches", () => {
    it("shows REGISTRAR REGRESO instead of MARCAR SALIDA when status=in_progress", async () => {
      const user = userEvent.setup()
      mockedGetExplorations.mockResolvedValue([{ ...explorations[0], status: "in_progress" }])
      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      expect(await screen.findByRole("button", { name: /REGISTRAR REGRESO/i })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /MARCAR SALIDA/i })).not.toBeInTheDocument()
    })

    it("shows neither action when status=completed", async () => {
      const user = userEvent.setup()
      mockedGetExplorations.mockResolvedValue([{ ...explorations[0], status: "completed" }])
      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      expect(screen.queryByRole("button", { name: /MARCAR SALIDA/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /REGISTRAR REGRESO/i })).not.toBeInTheDocument()
    })

    it("blocks return submit when fecha is empty", async () => {
      const user = userEvent.setup()
      mockedGetExplorations.mockResolvedValue([{ ...explorations[0], status: "in_progress" }])
      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      await user.click(await screen.findByRole("button", { name: /REGISTRAR REGRESO/i }))
      const modal = (await screen.findByRole("heading", { name: /REGISTRAR REGRESO/i })).closest(
        ".modal-card",
      ) as HTMLElement
      const dateInput = within(modal)
        .getAllByDisplayValue(/2026/)
        .filter((el) => (el as HTMLInputElement).type === "date")[0] as HTMLInputElement
      await user.clear(dateInput)
      await user.click(within(modal).getByRole("button", { name: /CONFIRMAR REGRESO/i }))
      expect(within(modal).getByText(/La fecha de regreso es obligatoria/i)).toBeInTheDocument()
      expect(mockedReturn).not.toHaveBeenCalled()
    })
  })

  describe("return-from-exploration flow", () => {
    it("found_resources are sent as NUMERIC ids and flow='in'", async () => {
      const user = userEvent.setup()
      mockedGetExplorations.mockResolvedValue([{ ...explorations[0], status: "in_progress" }])
      mockedReturn.mockResolvedValue(explorations[0])

      renderExplorations()
      await user.click(await screen.findByText(/Búsqueda zona norte/i))
      await user.click(await screen.findByRole("button", { name: /REGISTRAR REGRESO/i }))

      const returnModal = (
        await screen.findByRole("heading", { name: /REGISTRAR REGRESO/i })
      ).closest(".modal-card") as HTMLElement

      await user.click(
        within(returnModal).getByRole("button", { name: /\+ AGREGAR RECURSO ENCONTRADO/i }),
      )
      const selects = within(returnModal).getAllByRole("combobox")
      await user.selectOptions(selects[selects.length - 1], "1")
      const qty = within(returnModal).getByPlaceholderText(/Cant\./i)
      await user.type(qty, "3")
      await user.click(within(returnModal).getByRole("button", { name: /CONFIRMAR REGRESO/i }))

      await waitFor(() => expect(mockedReturn).toHaveBeenCalled())
      const [id, body] = mockedReturn.mock.calls[0]
      expect(id).toBe("200")
      expect(body.found_resources?.[0].resource_id).toBe(1)
      expect(body.found_resources?.[0].flow).toBe("in")
      expect(typeof body.found_resources?.[0].resource_id).toBe("number")
    })
  })
})
