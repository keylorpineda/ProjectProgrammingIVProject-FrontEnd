import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, persons, personsPage, professions } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import People from "../People"

vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(),
  getPersonById: vi.fn(),
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
  updatePersonStatus: vi.fn(),
  deletePerson: vi.fn(),
  getProfessions: vi.fn(),
  getProfessionsNeedingWorkers: vi.fn(),
  getProfessionsWithExcess: vi.fn(),
  createTemporaryAssignment: vi.fn(),
  getTemporaryAssignments: vi.fn(),
  endTemporaryAssignment: vi.fn(),
  getCampProduction: vi.fn(),
  getCampConsumption: vi.fn(),
  getCampBalance: vi.fn(),
  getMyAssignedResources: vi.fn(),
  getMyBadges: vi.fn(),
  toggleBadgeDisplay: vi.fn(),
  getPersonStatsByStatus: vi.fn(),
  getPersonStatsByProfession: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/upload/services/upload.service", () => ({
  uploadPersonImage: vi.fn().mockResolvedValue({
    url: "https://cdn.test/x.jpg",
    publicId: "x",
    thumbnailUrl: "https://cdn.test/x_thumb.jpg",
  }),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))

const mockedGetPersons = getPersons as unknown as ReturnType<typeof vi.fn>
const mockedGetProfessions = getProfessions as unknown as ReturnType<typeof vi.fn>
const mockedCreatePerson = createPerson as unknown as ReturnType<typeof vi.fn>
const mockedUpdatePerson = updatePerson as unknown as ReturnType<typeof vi.fn>
const mockedUpdateStatus = updatePersonStatus as unknown as ReturnType<typeof vi.fn>
const mockedDeletePerson = deletePerson as unknown as ReturnType<typeof vi.fn>

import { getCamps } from "@/features/camps/services/camps.service"
import {
  createPerson,
  deletePerson,
  getPersons,
  getProfessions,
  updatePerson,
  updatePersonStatus,
} from "@/features/persons/services/persons.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const renderPeople = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <People />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → People", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)

    mockedGetPersons.mockReset()
    mockedGetProfessions.mockReset()
    mockedCreatePerson.mockReset()
    mockedUpdatePerson.mockReset()
    mockedUpdateStatus.mockReset()
    mockedDeletePerson.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetProfessions.mockResolvedValue(professions)
    mockedGetPersons.mockResolvedValue(personsPage)
  })

  describe("listing", () => {
    it("shows the loading state then the dossier cards", async () => {
      renderPeople()
      expect(await screen.findByText(/joel/i)).toBeInTheDocument()
      expect(screen.getByText(/ellie/i)).toBeInTheDocument()
    })

    it("renders 'SIN REGISTROS ENCONTRADOS' when the page is empty", async () => {
      mockedGetPersons.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })
      renderPeople()
      expect(await screen.findByText(/SIN REGISTROS ENCONTRADOS/i)).toBeInTheDocument()
    })

    it("renders the section header with the new register button", async () => {
      renderPeople()
      expect(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i })).toBeInTheDocument()
    })

    it("filters the in-memory list by name text", async () => {
      const user = userEvent.setup()
      renderPeople()
      await screen.findByText(/joel/i)
      await user.type(screen.getByPlaceholderText(/buscar por nombre/i), "ellie")
      expect(screen.queryByText(/joel/i)).not.toBeInTheDocument()
      expect(screen.getByText(/ellie/i)).toBeInTheDocument()
    })

    it("filters the list by status select", async () => {
      const user = userEvent.setup()
      renderPeople()
      await screen.findByText(/joel/i)
      const statusSelect = screen.getAllByRole("combobox")[0]
      await user.selectOptions(statusSelect, "sick")
      expect(screen.queryByText(/joel/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/ellie/i)).not.toBeInTheDocument()
    })
  })

  describe("create person modal (covers the IsInt/camp_id fix)", () => {
    it("opens the modal when clicking '+ NUEVO REGISTRO'", async () => {
      const user = userEvent.setup()
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))
      expect(await screen.findByRole("heading", { name: /^NUEVO REGISTRO$/i })).toBeInTheDocument()
    })

    it("blocks submit when name or surname is missing", async () => {
      const user = userEvent.setup()
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))
      await user.click(screen.getByRole("button", { name: /REGISTRAR PERSONA/i }))
      expect(mockedCreatePerson).not.toHaveBeenCalled()
      expect(screen.getByText(/Nombre y apellido son obligatorios/i)).toBeInTheDocument()
    })

    it("sends profession_id as a NUMBER (regression: was string, backend @IsInt)", async () => {
      const user = userEvent.setup()
      mockedCreatePerson.mockResolvedValue(persons[0])
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))

      const modal = (await screen.findByRole("heading", { name: /^NUEVO REGISTRO$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/primer nombre/i), "Test")
      await user.type(within(modal).getByPlaceholderText(/primer apellido/i), "Person")
      const professionSelect = within(modal).getByLabelText(/PROFESIÓN/i) as HTMLSelectElement
      await user.selectOptions(professionSelect, "1")

      await user.click(within(modal).getByRole("button", { name: /REGISTRAR PERSONA/i }))

      await waitFor(() => expect(mockedCreatePerson).toHaveBeenCalledTimes(1))
      const body = mockedCreatePerson.mock.calls[0][0]
      expect(body.first_name).toBe("Test")
      expect(body.last_name).toBe("Person")
      expect(body.profession_id).toBe(1)
      expect(typeof body.profession_id).toBe("number")
    })

    it("includes the active camp_id as a NUMBER in the body (regression: was missing)", async () => {
      const user = userEvent.setup()
      mockedCreatePerson.mockResolvedValue(persons[0])
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO REGISTRO$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/primer nombre/i), "X")
      await user.type(within(modal).getByPlaceholderText(/primer apellido/i), "Y")
      await user.click(within(modal).getByRole("button", { name: /REGISTRAR PERSONA/i }))

      await waitFor(() => expect(mockedCreatePerson).toHaveBeenCalled())
      const body = mockedCreatePerson.mock.calls[0][0]
      expect(body.camp_id).toBe(1)
      expect(typeof body.camp_id).toBe("number")
    })

    it("does NOT include profession_id when 'Sin asignar' is selected", async () => {
      const user = userEvent.setup()
      mockedCreatePerson.mockResolvedValue(persons[0])
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO REGISTRO$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/primer nombre/i), "Solo")
      await user.type(within(modal).getByPlaceholderText(/primer apellido/i), "Lobo")
      await user.click(within(modal).getByRole("button", { name: /REGISTRAR PERSONA/i }))

      await waitFor(() => expect(mockedCreatePerson).toHaveBeenCalled())
      expect(mockedCreatePerson.mock.calls[0][0].profession_id).toBeUndefined()
    })

    it("shows an error message when the create API rejects", async () => {
      const user = userEvent.setup()
      mockedCreatePerson.mockRejectedValue(new Error("400"))
      renderPeople()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO REGISTRO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO REGISTRO$/i })).closest(
        ".modal-card",
      ) as HTMLElement
      await user.type(within(modal).getByPlaceholderText(/primer nombre/i), "Err")
      await user.type(within(modal).getByPlaceholderText(/primer apellido/i), "Or")
      await user.click(within(modal).getByRole("button", { name: /REGISTRAR PERSONA/i }))
      expect(await within(modal).findByText(/No se pudo registrar la persona/i)).toBeInTheDocument()
    })
  })

  describe("detail / edit / status / delete", () => {
    it("opens the detail modal when a dossier card is clicked", async () => {
      const user = userEvent.setup()
      renderPeople()
      await user.click(await screen.findByText(/joel miller/i))
      expect(await screen.findByText(/DOSSIER CLASIFICADO/i)).toBeInTheDocument()
    })

    it("edit submit sends profession_id as a NUMBER", async () => {
      const user = userEvent.setup()
      mockedUpdatePerson.mockResolvedValue(persons[0])
      renderPeople()
      await user.click(await screen.findByText(/joel miller/i))
      await user.click(await screen.findByRole("button", { name: /^EDITAR$/i }))

      const editModal = (await screen.findByText(/EDITAR REGISTRO/i)).closest(
        ".modal-card",
      ) as HTMLElement
      await user.click(within(editModal).getByRole("button", { name: /GUARDAR CAMBIOS/i }))
      await waitFor(() => expect(mockedUpdatePerson).toHaveBeenCalled())
      const [id, body] = mockedUpdatePerson.mock.calls[0]
      expect(id).toBe("10")
      expect(body.profession_id).toBe(1)
      expect(typeof body.profession_id).toBe("number")
    })

    it("status change submits the selected enum value", async () => {
      const user = userEvent.setup()
      mockedUpdateStatus.mockResolvedValue(persons[0])
      renderPeople()
      await user.click(await screen.findByText(/joel miller/i))
      await user.click(await screen.findByRole("button", { name: /CAMBIAR ESTADO/i }))

      const statusModal = await screen.findByText(/CAMBIAR ESTADO/i)
      const select = within(statusModal.closest(".modal-card") as HTMLElement).getByLabelText(
        /NUEVO ESTADO/i,
      ) as HTMLSelectElement
      await user.selectOptions(select, "sick")
      await user.click(screen.getByRole("button", { name: /CONFIRMAR ESTADO/i }))

      await waitFor(() => expect(mockedUpdateStatus).toHaveBeenCalled())
      const [id, body] = mockedUpdateStatus.mock.calls[0]
      expect(id).toBe("10")
      expect(body.status).toBe("sick")
    })

    it("delete submit calls the delete service with the person id", async () => {
      const user = userEvent.setup()
      mockedDeletePerson.mockResolvedValue(undefined)
      renderPeople()
      await user.click(await screen.findByText(/joel miller/i))
      await user.click(await screen.findByRole("button", { name: /^ELIMINAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR BAJA/i }))

      await waitFor(() => expect(mockedDeletePerson).toHaveBeenCalledWith("10"))
    })
  })

  describe("pagination", () => {
    it("disables ANTERIOR on first page and SIGUIENTE on short pages", async () => {
      renderPeople()
      await screen.findByText(/joel/i)
      expect(screen.getByRole("button", { name: /ANTERIOR/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /SIGUIENTE/i })).toBeDisabled()
    })

    it("fetches next page when SIGUIENTE has rows to advance", async () => {
      mockedGetPersons.mockResolvedValueOnce({
        data: Array.from({ length: 10 }, (_, i) => ({ ...persons[0], id: String(i + 100) })),
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      })
      mockedGetPersons.mockResolvedValueOnce({
        data: [persons[1]],
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      })

      const user = userEvent.setup()
      renderPeople()
      await waitFor(() => expect(mockedGetPersons).toHaveBeenCalledTimes(1))
      await user.click(screen.getByRole("button", { name: /SIGUIENTE/i }))
      await waitFor(() => expect(mockedGetPersons).toHaveBeenCalledTimes(2))
      expect(mockedGetPersons).toHaveBeenLastCalledWith({
        campId: "1",
        page: 2,
        limit: 10,
      })
    })
  })
})
