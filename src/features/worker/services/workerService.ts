import axios from "axios"
import api from "@/config/api"
import type {
  WorkerAssignedResource,
  ProfessionWithPersons,
  Resource,
  InventoryItem,
  InventoryMovement,
  ApiError,
  UserBadge,
  DailyBalance,
  CampWithMetrics,
  MyProfile,
} from "@/types/worker.api.types"

// The worker module previously had its own axios instance and `setAuthToken`.
// Per docs/ALIGNMENT_SPEC.md §1.5 / P0-5 there is exactly one HTTP client and
// auth is attached by the shared `@/config/api` interceptor. This stub is kept
// only so existing hooks that still call `setAuthToken(token)` compile until
// they are cleaned up.
export const setAuthToken = (_token: string | null) => {
  /* no-op: the shared api client handles auth via its request interceptor */
}

// Error handler
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error || "Unknown Error",
    }
  }

  return {
    statusCode: 500,
    message: error instanceof Error ? error.message : "Unknown error occurred",
    error: "Internal Server Error",
  }
}

// Worker Service
export const workerService = {
  /**
   * GET /users/me/assigned-resources
   */
  async getAssignedResources(): Promise<WorkerAssignedResource[]> {
    try {
      const response = await api.get<
        WorkerAssignedResource[] | { resources: WorkerAssignedResource[] }
      >("/users/me/assigned-resources")
      const data = response.data
      if (Array.isArray(data)) return data
      return data?.resources ?? []
    } catch (error) {
      console.error("Error fetching assigned resources:", error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /users/professions
   *
   * The shared `Profession` contract type does not include a `persons[]` roster;
   * the worker dashboard renders persons per profession, so we widen to
   * `ProfessionWithPersons`. When the backend lacks the field at runtime the
   * roster simply renders empty.
   */
  async getProfessions(): Promise<ProfessionWithPersons[]> {
    try {
      const response = await api.get<
        ProfessionWithPersons[] | { professions: ProfessionWithPersons[] }
      >("/users/professions")
      const data = response.data
      if (Array.isArray(data)) return data
      return data?.professions ?? []
    } catch (error) {
      console.error("Error fetching professions:", error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /resources?page=1&limit=20&category=...
   */
  async getResources(page: number = 1, limit: number = 20, category?: string): Promise<Resource[]> {
    try {
      const params: Record<string, string | number> = { page, limit }
      if (category) params.category = category

      const response = await api.get<Resource[] | { data: Resource[] }>("/resources", { params })
      const data = response.data
      if (Array.isArray(data)) return data
      return data?.data ?? []
    } catch (error) {
      console.error("Error fetching resources:", error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /resources/inventory/:campId
   */
  async getInventory(campId: string | number): Promise<InventoryItem[]> {
    try {
      const response = await api.get<
        InventoryItem[] | { camp_id: number; inventory_items: InventoryItem[] }
      >(`/resources/inventory/${campId}`)
      const data = response.data
      if (Array.isArray(data)) return data
      return data?.inventory_items ?? []
    } catch (error) {
      console.error(`Error fetching inventory for camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /resources/movements/:campId?limit=50
   */
  async getInventoryMovements(
    campId: string | number,
    limit: number = 50,
  ): Promise<InventoryMovement[]> {
    try {
      const response = await api.get<InventoryMovement[] | { movements: InventoryMovement[] }>(
        `/resources/movements/${campId}`,
        { params: { limit } },
      )
      const data = response.data
      if (Array.isArray(data)) return data
      return data?.movements ?? []
    } catch (error) {
      console.error(`Error fetching inventory movements for camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },

  /**
   * Check if a resource is in critical stock
   */
  isResourceCritical(item: InventoryItem): boolean {
    return item.alert_active || item.current_quantity < item.minimum_stock_required
  },

  /**
   * Get resource status badge
   */
  getResourceStatus(item: InventoryItem): "OK" | "LOW" | "CRITICAL" {
    if (item.current_quantity === 0) return "CRITICAL"
    if (item.alert_active) return "CRITICAL"
    if (item.current_quantity < item.minimum_stock_required * 1.5) return "LOW"
    return "OK"
  },

  /**
   * Calculate percentage of stock
   */
  getStockPercentage(item: InventoryItem): number {
    if (item.minimum_stock_required === 0) return 100
    return Math.round((item.current_quantity / (item.minimum_stock_required * 2)) * 100)
  },

  /**
   * GET /users/me/badges
   * Returns badges (UserAssets with relation_type="badge") for the current user.
   */
  async getMyBadges(): Promise<UserBadge[]> {
    try {
      const response = await api.get<UserBadge[] | { badges: UserBadge[] }>("/users/me/badges")
      const data = response.data
      if (Array.isArray(data)) return data
      return (data as { badges?: UserBadge[] }).badges ?? []
    } catch (error) {
      console.error("Error fetching badges:", error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /users/camp/:campId/balance
   * Returns daily production/consumption balance for the camp.
   */
  async getDailyBalance(campId: string | number): Promise<DailyBalance> {
    try {
      const response = await api.get<DailyBalance>(`/users/camp/${campId}/balance`)
      return response.data
    } catch (error) {
      console.error(`Error fetching daily balance for camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /users/me/profile
   * Returns the current user's full profile including person + profession.
   */
  async getMyProfile(): Promise<MyProfile> {
    try {
      const response = await api.get<MyProfile>("/users/me/profile")
      return response.data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /camps/:id
   * Returns camp details + metrics. No @Roles restriction — accessible to workers.
   */
  async getCampById(campId: string | number): Promise<CampWithMetrics> {
    try {
      const response = await api.get<CampWithMetrics>(`/camps/${campId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },

  /**
   * GET /explorations?campId=:campId
   * Returns explorations for the worker's camp (read-only view).
   */
  async getCampExplorations(campId: string | number): Promise<unknown[]> {
    try {
      const response = await api.get<unknown[]>("/explorations", {
        params: { campId: Number(campId) },
      })
      const data = response.data
      if (Array.isArray(data)) return data
      return (data as { data?: unknown[] }).data ?? []
    } catch (error) {
      console.error(`Error fetching explorations for camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },
}

export default workerService
