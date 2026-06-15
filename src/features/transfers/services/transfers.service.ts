import type { IntercampRequest } from "@/types/api.types"

import api from "@/config/api"

export interface TransferResourceDetail {
  resource_id: number
  requested_quantity: number
}

export interface TransferPersonDetail {
  person_id: number
  is_leader?: boolean
}

export interface CreateTransferBody {
  camp_origin_id: number
  camp_destination_id: number
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
  const { data } = await api.get<any>(`/transfers/requests/camp/${campId}`, {
    params: { role },
  })
  return Array.isArray(data) ? data : (data?.data ?? [])
}

export const getPendingCampTransfers = async (campId: string): Promise<IntercampRequest[]> => {
  const { data } = await api.get<IntercampRequest[]>(`/transfers/requests/camp/${campId}/pending`)
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
  const { data } = await api.patch<IntercampRequest>(`/transfers/requests/${id}/approval`, body)
  return data
}

export const cancelTransfer = async (id: string): Promise<IntercampRequest> => {
  const { data } = await api.patch<IntercampRequest>(`/transfers/requests/${id}/cancel`)
  return data
}

export const getTransferStatistics = async (campId: string): Promise<TransferStatistics> => {
  const { data } = await api.get<TransferStatistics>(`/transfers/statistics/${campId}`)
  return data
}
