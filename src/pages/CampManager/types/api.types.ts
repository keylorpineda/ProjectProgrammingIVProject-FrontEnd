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

export interface IntercampRequest {
  id: string
  resource_type: string
  amount: number
  camp_source_id: string
  camp_destination_id: string
  status: "pending" | "approved" | "denied" | "in_transit"
  requested_at: string
  notes?: string
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
