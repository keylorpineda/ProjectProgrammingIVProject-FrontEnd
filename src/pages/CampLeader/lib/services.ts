import axios from "axios"

import { useTokenStore } from "@/store/useAuthStore"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"

const api = axios.create({ baseURL: BASE_URL, timeout: 30000, withCredentials: true })

api.interceptors.request.use((config) => {
  const token = useTokenStore.getState().getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ==========================================
// 1. EXPLORATIONS SERVICE
// ==========================================
export const explorationsService = {
  async getExplorations(campId: number, status?: string) {
    const params: Record<string, unknown> = { campId }
    if (status) params.status = status
    const { data } = await api.get("/explorations", { params })
    return data
  },

  async getExplorationById(id: number) {
    const { data } = await api.get(`/explorations/${id}`)
    return data
  },

  /**
   * POST /explorations
   * data.personIds → persons: [{ person_id, is_leader }]
   * data.resourceConsumptions → resources: [{ resource_id, quantity, flow: 'out' }]
   */
  async createExploration(data: {
    camp_id: number
    name: string
    destination_description?: string
    departure_date: string
    estimated_days: number
    grace_days?: number
    notes?: string
    personIds: number[]
    resourceConsumptions: { resource_id: number; quantity: number }[]
  }) {
    const payload = {
      camp_id: data.camp_id,
      name: data.name,
      destination_description: data.destination_description,
      departure_date: data.departure_date,
      estimated_days: data.estimated_days,
      grace_days: data.grace_days ?? 0,
      persons: data.personIds.map((id, idx) => ({
        person_id: id,
        is_leader: idx === 0,
      })),
      resources: data.resourceConsumptions.map((rc) => ({
        resource_id: rc.resource_id,
        quantity: rc.quantity,
        flow: "out",
      })),
    }
    const { data: result } = await api.post("/explorations", payload)
    return result
  },

  async departExploration(id: number) {
    const { data } = await api.patch(`/explorations/${id}/depart`)
    return data
  },

  async returnExploration(
    id: number,
    returnData: {
      notes?: string
      foundResources: { resource_id: number; quantity: number }[]
    },
  ) {
    const payload = {
      real_return_date: new Date().toISOString(),
      notes: returnData.notes,
      found_resources: returnData.foundResources.map((r) => ({
        resource_id: r.resource_id,
        quantity: r.quantity,
        flow: "in",
      })),
    }
    const { data } = await api.patch(`/explorations/${id}/return`, payload)
    return data
  },

  async cancelExploration(id: number) {
    await api.delete(`/explorations/${id}`)
  },
}

// ==========================================
// 2. TRANSFERS SERVICE
// ==========================================
export const transfersService = {
  async getTransferById(id: number) {
    const { data } = await api.get(`/transfers/requests/${id}`)
    return data
  },

  async getCampTransferRequests(
    campId: number,
    filters?: { role?: "origin" | "destination"; status?: string },
  ) {
    const { data } = await api.get(`/transfers/requests/camp/${campId}`, {
      params: filters,
    })
    return data
  },

  async getCampPendingTransfers(campId: number) {
    const { data } = await api.get(`/transfers/requests/camp/${campId}/pending`)
    return data
  },

  /**
   * POST /transfers/requests
   * Maps flat legacy signature to the real DTO shape.
   */
  async createTransferRequest(data: {
    origin_camp_id: number
    destination_camp_id: number
    resource_id: number
    quantity: number
    notes?: string
  }) {
    const payload = {
      camp_origin_id: data.origin_camp_id,
      camp_destination_id: data.destination_camp_id,
      type: "resources",
      notes: data.notes,
      resource_details: [{ resource_id: data.resource_id, requested_quantity: data.quantity }],
    }
    const { data: result } = await api.post("/transfers/requests", payload)
    return result
  },

  async handleTransferApproval(id: number, approved: boolean, _userId: number) {
    const { data } = await api.patch(`/transfers/requests/${id}/approval`, {
      status: approved ? "approved" : "rejected",
    })
    return data
  },

  async cancelTransferRequest(id: number) {
    const { data } = await api.patch(`/transfers/requests/${id}/cancel`)
    return data
  },

  async arriveTransferRequest(id: number) {
    const { data } = await api.patch(`/transfers/requests/${id}/arrive`)
    return data
  },

  async getTransferStatistics(campId: number) {
    const { data } = await api.get(`/transfers/statistics/${campId}`)
    return data
  },
}

// ==========================================
// 3. RESOURCES SERVICE
// ==========================================
export const resourcesService = {
  async getCampInventory(campId: number) {
    try {
      const { data } = await api.get(`/resources/inventory/${campId}`)
      // Normalize to the shape the UI expects
      return Array.isArray(data)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((item: any) => ({
            camp_id: item.camp_id ?? campId,
            resource_id: item.resource?.id ?? item.resource_id,
            current_quantity: Number(item.current_quantity ?? 0),
            minimum_stock_required: Number(item.minimum_stock_required ?? 0),
            alert_active: item.alert_active ?? false,
            resource: item.resource,
          }))
        : []
    } catch {
      return []
    }
  },

  async getInventoryMovements(campId: number) {
    try {
      const { data } = await api.get(`/resources/movements/${campId}`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },

  async getAllResources() {
    try {
      const { data } = await api.get("/resources", { params: { limit: 100 } })
      // Backend may return paginated or array
      const list = Array.isArray(data) ? data : (data.data ?? [])
      return list
    } catch {
      return []
    }
  },
}

// ==========================================
// 4. USERS/CAMP SERVICE
// ==========================================
export const usersService = {
  async getCampPersons(campId?: number) {
    const params: Record<string, unknown> = { limit: 200 }
    if (campId) params.campId = campId
    const { data } = await api.get("/users/persons", { params })
    const list = Array.isArray(data) ? data : (data.data ?? [])
    // Map to the shape the CampLeader UI expects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((p: any) => ({
      id: p.id,
      username: `${p.first_name} ${p.last_name}`,
      first_name: p.first_name,
      last_name: p.last_name,
      status: p.status ?? "active",
      can_work: p.status === "active",
      role: p.profession?.name ?? "Unknown",
      campId: p.userAccount?.camp_id ?? campId,
      experience_points: p.experience_points ?? 0,
      expeditionsSurvived: p.expeditions_survived ?? 0,
      experience_level: Math.min(5, Math.floor((p.experience_points ?? 0) / 100) + 1),
      profession: p.profession
        ? { id: p.profession.id ?? 0, name: p.profession.name ?? "Desconocida" }
        : { id: 0, name: "Desconocida" },
      achievements: p.achievements ?? [],
      previous_skills: p.previous_skills ?? "",
      photo_url: p.photo_url ?? undefined,
    }))
  },

  async getPersonById(id: number) {
    const { data } = await api.get(`/users/persons/${id}`)
    return data
  },

  /** Balance diario: uses dashboard metrics as source of truth */
  async getCampBalances(campId: number) {
    try {
      const { data } = await api.get(`/dashboard/${campId}`)
      const resources = data?.warehouse?.inventory ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return resources.map((item: any) => ({
        resource_id: item.resource_id,
        resource_name: item.resource_name ?? "Recurso",
        production: item.daily_production ?? 0,
        consumption: item.daily_consumption ?? 0,
        net: (item.daily_production ?? 0) - (item.daily_consumption ?? 0),
      }))
    } catch {
      return []
    }
  },

  /** Camp statistics: derived from dashboard metrics */
  async getCampStatistics(campId: number) {
    try {
      const { data } = await api.get(`/dashboard/${campId}`)
      const camp = data?.camp ?? {}
      return {
        total_persons: camp.total_people ?? 0,
        active_workers: camp.active_workers ?? 0,
        injured_or_sick: camp.sick_or_injured ?? 0,
        exploring: camp.exploring ?? 0,
        deceased: camp.deceased ?? 0,
        occupancy_rate: camp.camp_capacity
          ? Math.round(((camp.total_people ?? 0) / camp.camp_capacity) * 100)
          : 0,
        explorations_completed: camp.explorations_completed ?? 0,
        survival_score: data?.survival_score ?? 0,
      }
    } catch {
      return {
        total_persons: 0,
        active_workers: 0,
        injured_or_sick: 0,
        exploring: 0,
        deceased: 0,
        occupancy_rate: 0,
        explorations_completed: 0,
        survival_score: 0,
      }
    }
  },
}
