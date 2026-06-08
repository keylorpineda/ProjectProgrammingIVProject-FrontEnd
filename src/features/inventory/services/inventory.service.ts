import type { InventoryItem, InventoryMovement, Resource } from "@/types/api.types"

import api from "@/config/api"

export interface UpdateInventoryBody {
  minimum_stock_required?: number
  current_quantity?: number
}

export interface CreateMovementBody {
  camp_id: number
  resource_id: number
  quantity: number
  type: string
  description?: string
}

export interface DailyProductionBody {
  resource_id: string
  quantity: number
  camp_id: string
  description?: string
}

export interface ResourcesParams {
  page?: number
  limit?: number
  category?: string
}

export const getInventory = async (campId: string): Promise<InventoryItem[]> => {
  const { data } = await api.get<any>(`/resources/inventory/${campId}`)
  return Array.isArray(data) ? data : (data?.data ?? [])
}

export const getInventoryAlerts = async (campId: string): Promise<InventoryItem[]> => {
  const { data } = await api.get<InventoryItem[]>(`/resources/inventory/${campId}/alerts`)
  return data
}

export const updateInventoryItem = async (
  campId: string,
  resourceId: string,
  body: UpdateInventoryBody,
): Promise<InventoryItem> => {
  const { data } = await api.patch<InventoryItem>(
    `/resources/inventory/${campId}/${resourceId}`,
    body,
  )
  return data
}

export const createMovement = async (body: CreateMovementBody): Promise<InventoryMovement> => {
  const { data } = await api.post<InventoryMovement>("/resources/movements", body)
  return data
}

export const getMovements = async (campId: string, limit = 50): Promise<InventoryMovement[]> => {
  const { data } = await api.get<InventoryMovement[]>(`/resources/movements/${campId}`, {
    params: { limit },
  })
  return data
}

export const runDailyProcess = async (campId: string): Promise<void> => {
  await api.post<void>(`/resources/daily-process/${campId}`)
}

export const runDailyProduction = async (
  personId: string,
  body: DailyProductionBody,
): Promise<void> => {
  await api.post<void>(`/resources/daily-production/${personId}`, body)
}

export const getResources = async (params?: ResourcesParams): Promise<Resource[]> => {
  const { data } = await api.get<any>("/resources", { params })
  return Array.isArray(data) ? data : (data?.data ?? [])
}

export const getResourceById = async (id: string): Promise<Resource> => {
  const { data } = await api.get<Resource>(`/resources/${id}`)
  return data
}
