import api from "@/config/api"
import type { Exploration } from "@/types/api.types"

export interface ExplorationPersonBody {
  person_id: string
  is_leader?: boolean
}

export interface ExplorationResourceBody {
  resource_id: string
  /** "in" (brought back at return) or "out" (taken on the trip). */
  flow: string
  quantity: number
}

export interface CreateExplorationBody {
  camp_id: string
  name: string
  destination_description: string
  departure_date: string
  estimated_days: number
  grace_days?: number
  persons: ExplorationPersonBody[]
  resources?: ExplorationResourceBody[]
}

export interface ReturnExplorationBody {
  real_return_date: string
  notes?: string
  found_resources?: ExplorationResourceBody[]
}

export interface ExplorationsParams {
  campId?: string
  status?: string
}

export const createExploration = async (body: CreateExplorationBody): Promise<Exploration> => {
  const { data } = await api.post<Exploration>("/explorations", body)
  return data
}

export const getExplorations = async (params?: ExplorationsParams): Promise<Exploration[]> => {
  const { data } = await api.get<Exploration[]>("/explorations", { params })
  return data
}

export const getExplorationById = async (id: string): Promise<Exploration> => {
  const { data } = await api.get<Exploration>(`/explorations/${id}`)
  return data
}

export const departExploration = async (id: string): Promise<Exploration> => {
  const { data } = await api.patch<Exploration>(`/explorations/${id}/depart`)
  return data
}

export const returnExploration = async (
  id: string,
  body: ReturnExplorationBody,
): Promise<Exploration> => {
  const { data } = await api.patch<Exploration>(`/explorations/${id}/return`, body)
  return data
}

export const cancelExploration = async (id: string): Promise<void> => {
  await api.delete<void>(`/explorations/${id}`)
}
