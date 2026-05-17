import axios, { AxiosError } from 'axios'
import type {
  WorkerAssignedResource,
  Profession,
  Resource,
  InventoryItem,
  InventoryMovement,
  ApiError,
} from '@/types/worker.api.types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gestion-del-fin-api-614190957140.us-central1.run.app'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Error handler
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>
    return {
      statusCode: axiosError.response?.status || 500,
      message: axiosError.response?.data?.message || error.message,
      error: axiosError.response?.data?.error || 'Unknown Error',
    }
  }

  return {
    statusCode: 500,
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    error: 'Internal Server Error',
  }
}

// Worker Service
export const workerService = {
  /**
   * Get resources assigned to the current user
   * GET /api/users/me/assigned-resources
   */
  async getAssignedResources(): Promise<WorkerAssignedResource[]> {
    try {
      const response = await apiClient.get<{ resources: WorkerAssignedResource[] }>(
        '/api/users/me/assigned-resources'
      )
      return response.data.resources || []
    } catch (error) {
      console.error('Error fetching assigned resources:', error)
      throw handleApiError(error)
    }
  },

  /**
   * Get all available professions
   * GET /api/users/professions
   */
  async getProfessions(): Promise<Profession[]> {
    try {
      const response = await apiClient.get<{ professions: Profession[] }>(
        '/api/users/professions'
      )
      return response.data.professions || []
    } catch (error) {
      console.error('Error fetching professions:', error)
      throw handleApiError(error)
    }
  },

  /**
   * Get all resources in the system
   * GET /api/resources?page=1&limit=20&category=...
   */
  async getResources(
    page: number = 1,
    limit: number = 20,
    category?: string
  ): Promise<Resource[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (category) {
        params.append('category', category)
      }

      const response = await apiClient.get<Resource[]>(
        `/api/resources?${params.toString()}`
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching resources:', error)
      throw handleApiError(error)
    }
  },

  /**
   * Get inventory for a specific camp
   * GET /api/resources/inventory/:campId
   */
  async getInventory(campId: string | number): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<{
        camp_id: number
        inventory_items: InventoryItem[]
      }>(`/api/resources/inventory/${campId}`)
      return response.data.inventory_items || []
    } catch (error) {
      console.error(`Error fetching inventory for camp ${campId}:`, error)
      throw handleApiError(error)
    }
  },

  /**
   * Get inventory movements history
   * GET /api/resources/movements/:campId?limit=50
   */
  async getInventoryMovements(
    campId: string | number,
    limit: number = 50
  ): Promise<InventoryMovement[]> {
    try {
      const response = await apiClient.get<{
        movements: InventoryMovement[]
      }>(`/api/resources/movements/${campId}?limit=${limit}`)
      return response.data.movements || []
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
  getResourceStatus(item: InventoryItem): 'OK' | 'LOW' | 'CRITICAL' {
    if (item.current_quantity === 0) return 'CRITICAL'
    if (item.alert_active) return 'CRITICAL'
    if (item.current_quantity < item.minimum_stock_required * 1.5) return 'LOW'
    return 'OK'
  },

  /**
   * Calculate percentage of stock
   */
  getStockPercentage(item: InventoryItem): number {
    if (item.minimum_stock_required === 0) return 100
    return Math.round((item.current_quantity / (item.minimum_stock_required * 2)) * 100)
  },
}

export default workerService
