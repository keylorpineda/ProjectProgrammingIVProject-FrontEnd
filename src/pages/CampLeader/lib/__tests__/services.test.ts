import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("axios", () => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn().mockImplementation((cb) => {
          ;(globalThis as any).__requestInterceptorCallback = cb
        }),
      },
      response: { use: vi.fn() },
    },
  }
  ;(globalThis as any).__mockAxiosInstance = instance
  return {
    default: {
      create: () => instance,
    },
  }
})

const mockAxiosInstance = (globalThis as any).__mockAxiosInstance
const getRequestInterceptorCallback = () => (globalThis as any).__requestInterceptorCallback

import { explorationsService, transfersService, resourcesService, usersService } from "../services"

import { useTokenStore } from "@/store/useAuthStore"

describe("CampLeader Services", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Request interceptor", () => {
    it("adds Authorization header if token exists", () => {
      useTokenStore.getState().setToken("mock-token")
      const config = { headers: {} } as any
      const result = getRequestInterceptorCallback()(config)
      expect(result.headers.Authorization).toBe("Bearer mock-token")
    })

    it("does not add Authorization header if token is null", () => {
      useTokenStore.getState().setToken(null)
      const config = { headers: {} } as any
      const result = getRequestInterceptorCallback()(config)
      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe("explorationsService", () => {
    it("getExplorations calls get with correct params", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] })
      const res = await explorationsService.getExplorations(1, "active")
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/explorations", {
        params: { campId: 1, status: "active" },
      })
      expect(res).toEqual([])
    })

    it("getExplorations calls get with only campId when status is not provided", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] })
      await explorationsService.getExplorations(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/explorations", {
        params: { campId: 1 },
      })
    })

    it("getExplorations returns data.data array when response is paginated", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: [{ id: 5 }] } })
      const res = await explorationsService.getExplorations(1)
      expect(res).toEqual([{ id: 5 }])
    })

    it("getExplorationById calls get with correct URL", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 2 } })
      const res = await explorationsService.getExplorationById(2)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/explorations/2")
      expect(res).toEqual({ id: 2 })
    })

    it("createExploration calls post with correctly formatted payload", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 10 } })
      const data = {
        camp_id: 1,
        name: "Test Exp",
        destination_description: "Desc",
        departure_date: "2026-06-08",
        estimated_days: 5,
        grace_days: 2,
        notes: "Some notes",
        personIds: [101, 102],
        resourceConsumptions: [{ resource_id: 201, quantity: 15 }],
      }
      const res = await explorationsService.createExploration(data)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/explorations", {
        camp_id: 1,
        name: "Test Exp",
        destination_description: "Desc",
        departure_date: "2026-06-08",
        estimated_days: 5,
        grace_days: 2,
        persons: [
          { person_id: 101, is_leader: true },
          { person_id: 102, is_leader: false },
        ],
        resources: [{ resource_id: 201, quantity: 15, flow: "out" }],
      })
      expect(res).toEqual({ id: 10 })
    })

    it("createExploration uses default grace_days of 0 if not provided", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 10 } })
      const data = {
        camp_id: 1,
        name: "Test Exp",
        departure_date: "2026-06-08",
        estimated_days: 5,
        personIds: [101],
        resourceConsumptions: [],
      }
      await explorationsService.createExploration(data)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/explorations",
        expect.objectContaining({ grace_days: 0 }),
      )
    })

    it("departExploration calls patch with correct URL", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "departed" } })
      const res = await explorationsService.departExploration(5)
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith("/explorations/5/depart")
      expect(res).toEqual({ status: "departed" })
    })

    it("returnExploration calls patch with correct URL and payload", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "returned" } })
      const res = await explorationsService.returnExploration(5, {
        notes: "success",
        foundResources: [{ resource_id: 301, quantity: 5 }],
      })
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/explorations/5/return",
        expect.objectContaining({
          notes: "success",
          found_resources: [{ resource_id: 301, quantity: 5, flow: "in" }],
        }),
      )
      expect(res).toEqual({ status: "returned" })
    })

    it("cancelExploration calls delete with correct URL", async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({})
      await explorationsService.cancelExploration(5)
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/explorations/5")
    })
  })

  describe("transfersService", () => {
    it("getTransferById calls get with correct URL", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 100 } })
      const res = await transfersService.getTransferById(100)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/transfers/requests/100")
      expect(res).toEqual({ id: 100 })
    })

    it("getCampTransferRequests maps array data correctly", async () => {
      const mockRaw = [
        {
          id: 100,
          camp_origin_id: 1,
          camp_destination_id: 2,
          resourceDetails: [
            { resource_id: 10, requested_quantity: 50, resource: { name: "Agua" } },
          ],
          status: "pending",
          notes: "Need water",
          campOrigin: { name: "Alpha" },
          campDestination: { name: "Beta" },
        },
      ]
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockRaw })
      const res = await transfersService.getCampTransferRequests(1, { status: "pending" })
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/transfers/requests/camp/1", {
        params: { status: "pending" },
      })
      expect(res).toEqual([
        {
          id: 100,
          origin_camp_id: 1,
          destination_camp_id: 2,
          resource_id: 10,
          quantity: 50,
          status: "pending",
          requested_by_user_id: 0,
          notes: "Need water",
          resource: { name: "Agua" },
          origin_camp: { name: "Alpha" },
          destination_camp: { name: "Beta" },
        },
      ])
    })

    it("getCampTransferRequests maps empty array if data is not an array", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: null })
      const res = await transfersService.getCampTransferRequests(1)
      expect(res).toEqual([])
    })

    it("getCampPendingTransfers calls get with correct URL", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] })
      const res = await transfersService.getCampPendingTransfers(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/transfers/requests/camp/1/pending")
      expect(res).toEqual([])
    })

    it("createTransferRequest calls post with legacy mapped shape", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 50 } })
      const res = await transfersService.createTransferRequest({
        origin_camp_id: 1,
        destination_camp_id: 2,
        resource_id: 10,
        quantity: 50,
        notes: "urgent",
      })
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/transfers/requests", {
        camp_origin_id: 1,
        camp_destination_id: 2,
        type: "resources",
        notes: "urgent",
        resource_details: [{ resource_id: 10, requested_quantity: 50 }],
      })
      expect(res).toEqual({ id: 50 })
    })

    it("handleTransferApproval calls patch with status approved", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "approved" } })
      const res = await transfersService.handleTransferApproval(100, true, 10)
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith("/transfers/requests/100/approval", {
        status: "approved",
      })
      expect(res).toEqual({ status: "approved" })
    })

    it("handleTransferApproval calls patch with status rejected", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "rejected" } })
      await transfersService.handleTransferApproval(100, false, 10)
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith("/transfers/requests/100/approval", {
        status: "rejected",
      })
    })

    it("cancelTransferRequest calls patch with correct URL", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "cancelled" } })
      const res = await transfersService.cancelTransferRequest(100)
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith("/transfers/requests/100/cancel")
      expect(res).toEqual({ status: "cancelled" })
    })

    it("getTransferStatistics calls get with correct URL", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { count: 5 } })
      const res = await transfersService.getTransferStatistics(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/transfers/statistics/1")
      expect(res).toEqual({ count: 5 })
    })
  })

  describe("resourcesService", () => {
    it("getCampInventory maps array inventory items correctly", async () => {
      const rawInventory = [
        {
          camp_id: 1,
          resource: { id: 10 },
          current_quantity: "100",
          minimum_stock_required: "50",
          alert_active: true,
        },
      ]
      mockAxiosInstance.get.mockResolvedValueOnce({ data: rawInventory })
      const res = await resourcesService.getCampInventory(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/resources/inventory/1")
      expect(res).toEqual([
        {
          camp_id: 1,
          resource_id: 10,
          current_quantity: 100,
          minimum_stock_required: 50,
          alert_active: true,
          resource: { id: 10 },
        },
      ])
    })

    it("getCampInventory maps object inventory items correctly", async () => {
      const rawInventoryObj = {
        inventory_items: [
          {
            resource_id: 10,
            current_quantity: 100,
            minimum_stock_required: 50,
            alert_active: false,
          },
        ],
      }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: rawInventoryObj })
      const res = await resourcesService.getCampInventory(1)
      expect(res).toEqual([
        {
          camp_id: 1,
          resource_id: 10,
          current_quantity: 100,
          minimum_stock_required: 50,
          alert_active: false,
          resource: undefined,
        },
      ])
    })

    it("getCampInventory returns empty array on error", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error("API Error"))
      const res = await resourcesService.getCampInventory(1)
      expect(res).toEqual([])
    })

    it("getInventoryMovements calls get and returns array", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [1, 2] })
      const res = await resourcesService.getInventoryMovements(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/resources/movements/1")
      expect(res).toEqual([1, 2])
    })

    it("getInventoryMovements returns empty array if response is not array", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: null })
      const res = await resourcesService.getInventoryMovements(1)
      expect(res).toEqual([])
    })

    it("getInventoryMovements returns empty array on error", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error())
      const res = await resourcesService.getInventoryMovements(1)
      expect(res).toEqual([])
    })

    it("getAllResources calls get and returns list", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: [10, 20] } })
      const res = await resourcesService.getAllResources()
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/resources", { params: { limit: 100 } })
      expect(res).toEqual([10, 20])
    })

    it("getAllResources returns empty array on error", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error())
      const res = await resourcesService.getAllResources()
      expect(res).toEqual([])
    })

    it("getAllResources returns empty array when data has no .data property", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} })
      const res = await resourcesService.getAllResources()
      expect(res).toEqual([])
    })
  })

  describe("usersService", () => {
    it("getCampPersons maps data correctly", async () => {
      const rawPersons = [
        {
          id: 10,
          first_name: "John",
          last_name: "Doe",
          status: "active",
          experience_points: 120,
          expeditions_survived: 3,
          profession: { id: 1, name: "Medico", can_explore: true },
          userAccount: { camp_id: 1 },
          achievements: ["A", { achievement_name: "B" }],
          previous_skills: "Survival",
          photo_url: "url",
        },
      ]
      mockAxiosInstance.get.mockResolvedValueOnce({ data: rawPersons })
      const res = await usersService.getCampPersons(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/users/persons", {
        params: { limit: 200, campId: 1 },
      })
      expect(res).toEqual([
        {
          id: 10,
          username: "John Doe",
          first_name: "John",
          last_name: "Doe",
          status: "active",
          can_work: true,
          role: "Medico",
          campId: 1,
          experience_points: 120,
          expeditionsSurvived: 3,
          experience_level: 2,
          profession: { id: 1, name: "Medico", can_explore: true },
          achievements: ["A", "B"],
          previous_skills: "Survival",
          photo_url: "url",
        },
      ])
    })

    it("getPersonById calls get with correct URL", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 10 } })
      const res = await usersService.getPersonById(10)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/users/persons/10")
      expect(res).toEqual({ id: 10 })
    })

    it("getCampDashboard maps data correctly", async () => {
      const mockDash = {
        camp: {
          total_people: 10,
          active_workers: 8,
          sick_or_injured: 1,
          exploring: 1,
          deceased: 0,
          camp_capacity: 100,
          explorations_completed: 4,
          survival_score: 85,
        },
        warehouse: {
          inventory: [
            {
              resource_id: 1,
              resource_name: "Water",
              daily_production: 10,
              daily_consumption: 4,
            },
          ],
        },
      }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockDash })
      const res = await usersService.getCampDashboard(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/dashboard/1")
      expect(res.balances).toEqual([
        {
          resource_id: 1,
          resource_name: "Water",
          production: 10,
          consumption: 4,
          net: 6,
        },
      ])
      expect(res.statistics).toEqual({
        total_persons: 10,
        active_workers: 8,
        injured_or_sick: 1,
        exploring: 1,
        deceased: 0,
        occupancy_rate: 10,
        explorations_completed: 4,
        survival_score: 85,
      })
    })

    it("getCampDashboard returns defaults on error", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error())
      const res = await usersService.getCampDashboard(1)
      expect(res.balances).toEqual([])
      expect(res.statistics.total_persons).toBe(0)
    })

    it("getCampPersons omits campId param when called without argument", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] })
      await usersService.getCampPersons()
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/users/persons", {
        params: { limit: 200 },
      })
    })

    it("getCampPersons handles paginated response with data.data array", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 5,
              first_name: "Ana",
              last_name: "Lopez",
              status: "active",
              experience_points: 50,
              expeditions_survived: 0,
              profession: { id: 1, name: "Guardia", can_explore: false },
              achievements: [],
              previous_skills: "",
            },
          ],
        },
      })
      const res = await usersService.getCampPersons(1)
      expect(res).toHaveLength(1)
      expect(res[0].first_name).toBe("Ana")
    })

    it("getCampPersons uses fallback profession when profession is null", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            first_name: "X",
            last_name: "Y",
            status: "active",
            experience_points: 0,
            expeditions_survived: 0,
            profession: null,
            achievements: [],
            previous_skills: "",
          },
        ],
      })
      const res = await usersService.getCampPersons(1)
      expect(res[0].profession).toEqual({ id: 0, name: "Desconocida", can_explore: false })
    })

    it("getCampPersons defaults status to active when status field is absent", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            first_name: "A",
            last_name: "B",
            experience_points: 0,
            expeditions_survived: 0,
            profession: { id: 1, name: "X", can_explore: false },
            achievements: [],
            previous_skills: "",
          },
        ],
      })
      const res = await usersService.getCampPersons(1)
      expect(res[0].status).toBe("active")
    })

    it("getCampPersons caps experience_level at 5 for XP >= 400", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            first_name: "A",
            last_name: "B",
            status: "active",
            experience_points: 600,
            expeditions_survived: 0,
            profession: { id: 1, name: "X", can_explore: false },
            achievements: [],
            previous_skills: "",
          },
        ],
      })
      const res = await usersService.getCampPersons(1)
      expect(res[0].experience_level).toBe(5)
    })

    it("getCampPersons returns empty achievements array when field is not an array", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            first_name: "A",
            last_name: "B",
            status: "active",
            experience_points: 0,
            expeditions_survived: 0,
            profession: { id: 1, name: "X", can_explore: false },
            achievements: null,
            previous_skills: "",
          },
        ],
      })
      const res = await usersService.getCampPersons(1)
      expect(res[0].achievements).toEqual([])
    })

    it("getCampDashboard falls back to data.survival_score when camp.survival_score is absent", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          camp: {
            total_people: 5,
            active_workers: 3,
            sick_or_injured: 0,
            exploring: 0,
            deceased: 0,
          },
          warehouse: { inventory: [] },
          survival_score: 350,
        },
      })
      const res = await usersService.getCampDashboard(1)
      expect(res.statistics.survival_score).toBe(350)
    })

    it("getCampDashboard handles null camp and null warehouse with zero fallbacks", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { camp: null, warehouse: null } })
      const res = await usersService.getCampDashboard(1)
      expect(res.statistics.total_persons).toBe(0)
      expect(res.statistics.survival_score).toBe(0)
      expect(res.balances).toEqual([])
    })

    it("getCampDashboard uses zero for all stats when camp is empty object", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          camp: {},
          warehouse: { inventory: [] },
        },
      })
      const res = await usersService.getCampDashboard(1)
      expect(res.statistics.total_persons).toBe(0)
      expect(res.statistics.active_workers).toBe(0)
      expect(res.statistics.injured_or_sick).toBe(0)
      expect(res.statistics.occupancy_rate).toBe(0)
      expect(res.statistics.survival_score).toBe(0)
    })

    it("getCampDashboard calculates occupancy_rate when camp_capacity is provided", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          camp: { total_people: 10, camp_capacity: 20 },
          warehouse: { inventory: [] },
        },
      })
      const res = await usersService.getCampDashboard(1)
      expect(res.statistics.occupancy_rate).toBe(50)
    })

    it("getCampDashboard uses fallback resource_name and zero production when fields are null", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          camp: { total_people: 1 },
          warehouse: {
            inventory: [
              {
                resource_id: 1,
                resource_name: null,
                daily_production: null,
                daily_consumption: null,
              },
            ],
          },
        },
      })
      const res = await usersService.getCampDashboard(1)
      expect(res.balances[0].resource_name).toBe("Recurso")
      expect(res.balances[0].production).toBe(0)
      expect(res.balances[0].consumption).toBe(0)
    })

    it("deprecated getCampBalances and getCampStatistics call getCampDashboard", async () => {
      const mockDash = {
        camp: { total_people: 10 },
        warehouse: { inventory: [] },
      }
      mockAxiosInstance.get.mockResolvedValue({ data: mockDash })
      const balances = await usersService.getCampBalances(1)
      const stats = await usersService.getCampStatistics(1)
      expect(balances).toEqual([])
      expect(stats.total_persons).toBe(10)
    })
  })
})
