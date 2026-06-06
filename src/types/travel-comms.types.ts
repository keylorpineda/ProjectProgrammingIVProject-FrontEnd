// Types extending the real API for the TravelComms role
// All types that already exist in api.types.ts are imported, not redefined here

import type { Exploration, IntercampRequest } from "@/types/api.types"

export type TransferPriority = "low" | "medium" | "high" | "critical"
export type TransferRole = "all" | "sent" | "received"
export type ExplorationFilterStatus =
  | ""
  | "scheduled"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"

// DTO for creating explorations (matches existing CreateExplorationBody in explorations.service)
export interface CreateExplorationFormData {
  name: string
  destination_description: string
  departure_date: string
  estimated_days: number
  grace_days: number
  selectedPersons: Array<{ person_id: string; is_leader: boolean }>
  selectedResources: Array<{ resource_id: string; quantity: number }>
}

// DTO for returning an exploration (matches real ReturnExplorationBody)
export interface ReturnExplorationFormData {
  real_return_date: string
  notes: string
  found_resources?: Array<{ resource_id: number; flow: string; quantity: number }>
}

// DTO for creating a transfer (maps to CreateTransferBody)
export interface CreateTransferFormData {
  camp_destination_id: string
  priority: TransferPriority
  reason: string
  selectedResources: Array<{ resource_id: string; requested_quantity: number }>
  selectedPersons: Array<{ person_id: string }>
}

// Enriched types for display (when we have joined data)
export interface ExplorationWithCamp extends Exploration {
  campName?: string
}

export interface TransferWithCamps extends IntercampRequest {
  originCampName?: string
  destinationCampName?: string
}

// Stats shapes for dashboard
export interface ExplorationStats {
  scheduled: number
  inProgress: number
  completed: number
  cancelled: number
}

export interface TransferStats {
  pending: number
  inTransit: number
  sent: number
  received: number
}
