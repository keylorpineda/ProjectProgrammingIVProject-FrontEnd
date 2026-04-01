import api from "@/config/api"
import type { AiAdmission } from "@/types/api.types"

export interface SubmitAdmissionBody {
  name: string
  about_yourself: string
  skills: string
  medical_info: string
  has_photo?: boolean
  has_id_card?: boolean
}

export interface SubmitAdmissionResponse {
  tracking_code: string
  ai_recommendation: string
  evaluation_score: number
  glass_box_report: unknown
}

export interface PendingAdmissionsParams {
  campId?: string
  page?: number
  limit?: number
}

export interface ReviewAdmissionBody {
  decision: "accepted" | "rejected"
  admin_notes?: string
  override_reason?: string
}

export interface CreateAccountBody {
  username: string
  password: string
  camp_id: string
  role: string
}

export const submitAdmission = async (
  body: SubmitAdmissionBody,
): Promise<SubmitAdmissionResponse> => {
  const { data } = await api.post<SubmitAdmissionResponse>("/ai/admissions/submit", body)
  return data
}

export const trackAdmission = async (code: string): Promise<AiAdmission> => {
  const { data } = await api.get<AiAdmission>(`/ai/admissions/track/${code}`)
  return data
}

export const getPendingAdmissions = async (
  params?: PendingAdmissionsParams,
): Promise<AiAdmission[]> => {
  const { data } = await api.get<AiAdmission[]>("/ai/admissions/pending", { params })
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
