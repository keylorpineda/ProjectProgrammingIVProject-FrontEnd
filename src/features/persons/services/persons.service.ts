import type { Person, Profession, PaginatedResponse, PersonStatus } from "@/types/api.types"

import api from "@/config/api"

export interface PersonsParams {
  campId?: string
  page?: number
  limit?: number
  search?: string
}

export interface CreatePersonBody {
  first_name: string
  last_name: string
  last_name2?: string
  birth_date?: string
  profession_id?: string
  previous_skills?: string
  notes?: string
  photo_url?: string
  id_card_url?: string
}

export type UpdatePersonBody = Partial<CreatePersonBody>

export interface UpdatePersonStatusBody {
  status: PersonStatus
  notes?: string
}

export interface TemporaryAssignmentBody {
  person_id: string
  profession_temporary_id: string
  reason?: string
  duration_days?: number
  start_date?: string
}

export interface BadgeDisplayBody {
  is_displayed: boolean
}

export const getPersons = async (params?: PersonsParams): Promise<PaginatedResponse<Person>> => {
  const { data } = await api.get<PaginatedResponse<Person>>("/users/persons", { params })
  return data
}

export const getPersonById = async (id: string): Promise<Person> => {
  const { data } = await api.get<Person>(`/users/persons/${id}`)
  return data
}

export const createPerson = async (body: CreatePersonBody): Promise<Person> => {
  const { data } = await api.post<Person>("/users/persons", body)
  return data
}

export const updatePerson = async (id: string, body: UpdatePersonBody): Promise<Person> => {
  const { data } = await api.put<Person>(`/users/persons/${id}`, body)
  return data
}

export const updatePersonStatus = async (
  id: string,
  body: UpdatePersonStatusBody,
): Promise<Person> => {
  const { data } = await api.put<Person>(`/users/persons/${id}/status`, body)
  return data
}

export const deletePerson = async (id: string): Promise<void> => {
  await api.delete<void>(`/users/persons/${id}`)
}

export const getPersonStatsByStatus = async (campId: string): Promise<Record<string, number>> => {
  const { data } = await api.get<Record<string, number>>("/users/persons/stats/by-status", {
    params: { campId },
  })
  return data
}

export const getPersonStatsByProfession = async (
  campId: string,
): Promise<Record<string, number>> => {
  const { data } = await api.get<Record<string, number>>("/users/persons/stats/by-profession", {
    params: { campId },
  })
  return data
}

export const getProfessions = async (): Promise<Profession[]> => {
  const { data } = await api.get<Profession[]>("/users/professions")
  return data
}

export const getProfessionsNeedingWorkers = async (): Promise<Profession[]> => {
  const { data } = await api.get<Profession[]>("/users/professions/alerts/needing-workers")
  return data
}

export const getProfessionsWithExcess = async (): Promise<Profession[]> => {
  const { data } = await api.get<Profession[]>("/users/professions/alerts/with-excess")
  return data
}

export const createTemporaryAssignment = async (
  body: TemporaryAssignmentBody,
): Promise<unknown> => {
  const { data } = await api.post<unknown>("/users/temporary-assignments", body)
  return data
}

export const getTemporaryAssignments = async (campId: string): Promise<unknown[]> => {
  const { data } = await api.get<unknown[]>("/users/temporary-assignments", {
    params: { campId },
  })
  return data
}

export const endTemporaryAssignment = async (id: string): Promise<void> => {
  await api.put<void>(`/users/temporary-assignments/${id}/end`)
}

export const getCampProduction = async (campId: string): Promise<Record<string, number>> => {
  const { data } = await api.get<Record<string, number>>(`/users/camp/${campId}/production`)
  return data
}

export const getCampConsumption = async (campId: string): Promise<Record<string, number>> => {
  const { data } = await api.get<Record<string, number>>(`/users/camp/${campId}/consumption`)
  return data
}

export const getCampBalance = async (campId: string): Promise<Record<string, number>> => {
  const { data } = await api.get<Record<string, number>>(`/users/camp/${campId}/balance`)
  return data
}

export const getMyAssignedResources = async (): Promise<unknown[]> => {
  const { data } = await api.get<unknown[]>("/users/me/assigned-resources")
  return data
}

export const getMyBadges = async (): Promise<unknown[]> => {
  const { data } = await api.get<unknown[]>("/users/me/badges")
  return data
}

export const toggleBadgeDisplay = async (id: string, body: BadgeDisplayBody): Promise<void> => {
  await api.post<void>(`/users/me/badges/${id}/display`, body)
}
