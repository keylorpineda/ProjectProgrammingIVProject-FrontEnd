/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PersonStatus = "active" | "sick" | "injured"

export interface Person {
  id: string
  name: string
  status: PersonStatus
  profession: string
  campId: string
  skills: string[]
  injuryDetails?: string
  dailyConsumptionFood: number
  dailyConsumptionWater: number
}

export interface InventoryItem {
  id: string
  name: string
  category: "Food" | "Water" | "Medicine" | "Ammo" | "Materials" | "Fuel"
  current_stock: number
  minimum_stock_required: number
  is_below_minimum: boolean
  unit: string
}

export interface CampBalance {
  foodProduction: number
  foodConsumption: number
  waterProduction: number
  waterConsumption: number
  medicalSuppliesNeeded: number
  activeAlarmsCount: number
  detailedAlarms: string[]
}

export interface TransferStatistics {
  sentCount: number
  receivedCount: number
  totalTransferredResources: number
  pendingIncomingRequests: number
  totalFuelCostUsed: number
}

export interface RequestResourceDetail {
  request_id?: string
  resource_id: string
  requested_quantity: number
  approved_quantity?: number | null
  received_quantity?: number | null
  resource?: { id: string; name: string; category: string; unit: string }
}

export interface IntercampRequest {
  id: string
  camp_origin_id: string
  camp_source_id?: string // legacy alias for camp_origin_id
  camp_destination_id: string
  type: string
  status: string
  request_date?: string
  notes?: string | null
  travel_days?: number | null
  departure_date?: string | null
  arrival_date?: string | null
  requested_at: string // primary date field from API
  resourceDetails?: RequestResourceDetail[]
  personDetails?: unknown[]
  created_at?: string
  updated_at?: string
}

export interface ProfessionAlert {
  profession: string
  neededCount: number
  severity: "low" | "medium" | "high"
  impactDescription: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
