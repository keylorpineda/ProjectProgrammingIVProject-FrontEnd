import api from "@/config/api"
import type { AiAdmission, PaginatedResponse } from "@/types/api.types"

export interface SubmitAdmissionBody {
  first_name: string
  last_name: string
  last_name2?: string
  age: number
  health_status: number
  physical_condition: number
  skills: string[]
  medical_conditions?: string[]
  previous_profession?: string
  years_experience?: number
  criminal_record: boolean
  psychological_evaluation?: number
  camp_id: number | string
  photo_url?: string
  id_card_url?: string
  contact_email: string
  personal_history?: string
}

export interface PendingAdmissionsParams {
  campId?: string
  page?: number
  limit?: number
}

export interface ReviewAdmissionBody {
  decision: "accepted" | "rejected"
  override_profession_id?: number
  notes?: string
  assign_to_camp_id?: number
}

export interface CreateAccountBody {
  username: string
  email: string
  password: string
  role_id: number
}

export const submitAdmission = async (body: SubmitAdmissionBody): Promise<AiAdmission> => {
  const { data } = await api.post<AiAdmission>("/ai/admissions/submit", body)
  return data
}

export interface TrackedAdmission {
  tracking_code: string
  status: string
  camp_name: string
  candidate_name: string
  submission_date: string
  review_date: string | null
  final_decision: string | null
  suggested_profession: string | null
  person_code: string | null
}

export const trackAdmission = async (code: string): Promise<TrackedAdmission> => {
  const { data } = await api.get<TrackedAdmission>(`/ai/admissions/track/${code}`)
  return data
}

export const getPendingAdmissions = async (
  params?: PendingAdmissionsParams,
): Promise<PaginatedResponse<AiAdmission>> => {
  const { data } = await api.get<PaginatedResponse<AiAdmission>>("/ai/admissions/pending", {
    params,
  })
  return data
}

export const getAdmissionById = async (id: string): Promise<AiAdmission> => {
  const { data } = await api.get<AiAdmission>(`/ai/admissions/${id}`)
  return data
}

export const reviewAdmission = async (
  id: string,
  body: ReviewAdmissionBody,
): Promise<AiAdmission> => {
  const { data } = await api.post<AiAdmission>(`/ai/admissions/${id}/review`, body)
  return data
}

export const createAdmissionAccount = async (
  id: string,
  body: CreateAccountBody,
): Promise<unknown> => {
  const { data } = await api.post<unknown>(`/ai/admissions/${id}/create-account`, body)
  return data
}

export const completeRegistration = async (body: {
  token: string
  username: string
  password: string
  email: string
}): Promise<unknown> => {
  const { data } = await api.post<unknown>("/ai/admissions/complete-registration", body)
  return data
}
