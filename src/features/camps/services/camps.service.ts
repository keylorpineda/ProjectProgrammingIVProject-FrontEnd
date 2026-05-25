import api from "@/config/api"
import type { Camp } from "@/types/api.types"

export interface CreateCampBody {
  name: string
  location_description?: string
  latitude?: number
  longitude?: number
  max_capacity?: number
  foundation_date?: string
}

export interface UpdateCampBody extends Partial<CreateCampBody> {
  active?: boolean
}

export interface CampInventorySummaryItem {
  resource: string
  quantity: number
  unit: string
  alert: boolean
}

export interface CampDetail {
  camp: Camp
  metrics: {
    totalResources: number
    resourcesWithAlerts: number
    inventorySummary: CampInventorySummaryItem[]
  }
}

type CampsResponse = Camp[] | { data?: Camp[]; items?: Camp[] }

export const getCamps = async (): Promise<Camp[]> => {
  const { data } = await api.get<CampsResponse>("/camps")

  if (Array.isArray(data)) return data
  if (data?.data && Array.isArray(data.data)) return data.data
  if (data?.items && Array.isArray(data.items)) return data.items
  return []
}

export const getCampById = async (id: string): Promise<CampDetail> => {
  const { data } = await api.get<CampDetail>(`/camps/${id}`)
  return data
}

export const createCamp = async (body: CreateCampBody): Promise<Camp> => {
  const { data } = await api.post<Camp>("/camps", body)
  return data
}

export const updateCamp = async (id: string, body: UpdateCampBody): Promise<Camp> => {
  const { data } = await api.patch<Camp>(`/camps/${id}`, body)
  return data
}

export const deleteCamp = async (id: string): Promise<void> => {
  await api.delete<void>(`/camps/${id}`)
}
