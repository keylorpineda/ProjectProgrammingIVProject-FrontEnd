import api from "@/config/api"
import type { IntercampRequest } from "@/types/api.types"

export interface TransferResourceDetail {
  resource_id: string
  requested_quantity: number
}

export interface TransferPersonDetail {
  person_id: string
  is_leader?: boolean
}

export interface CreateTransferBody {
  camp_origin_id: string
  camp_destination_id: string
  type: "resources" | "people" | "both"
  notes?: string
  travel_days?: number
  resource_details?: TransferResourceDetail[]
  person_details?: TransferPersonDetail[]
}

export interface ApprovalBody {
  status: "approved" | "rejected"
  notes?: string
}

export interface TransferStatistics {
  pending: number
  approved: number
  completed: number
  rejected: number
  cancelled: number
}

export type TransferRole = "origin" | "destination"

export const createTransferRequest = async (
  body: CreateTransferBody,
): Promise<IntercampRequest> => {
  const { data } = await api.post<IntercampRequest>("/transfers/requests", body)
  return data
}

export const getCampTransfers = async (
  campId: string,
  role?: TransferRole,
): Promise<IntercampRequest[]> => {
  const { data } = await api.get<IntercampRequest[]>(
    `/transfers/requests/camp/${campId}`,
    { params: { role } },
  )
  return data
}

export const getPendingCampTransfers = async (campId: string): Promise<IntercampRequest[]> => {
  const { data } = await api.get<IntercampRequest[]>(
    `/transfers/requests/camp/${campId}/pending`,
  )
  return data
}

export const getTransferById = async (id: string): Promise<IntercampRequest> => {
  const { data } = await api.get<IntercampRequest>(`/transfers/requests/${id}`)
  return data
}

export const approveOrRejectTransfer = async (
  id: string,
  body: ApprovalBody,
): Promise<IntercampRequest> => {
  const { data } = await api.patch<IntercampRequest>(
    `/transfers/requests/${id}/approval`,
    body,
  )
  return data
}

export const cancelTransfer = async (id: string): Promise<IntercampRequest> => {
  const { data } = await api.patch<IntercampRequest>(`/transfers/requests/${id}/cancel`)
  return data
}

export const confirmTransferArrival = async (id: string): Promise<IntercampRequest> => {
  const { data } = await api.patch<IntercampRequest>(`/transfers/requests/${id}/arrive`)
  return data
}

export const getTransferStatistics = async (campId: string): Promise<TransferStatistics> => {
  const { data } = await api.get<TransferStatistics>(`/transfers/statistics/${campId}`)
  return data
}
