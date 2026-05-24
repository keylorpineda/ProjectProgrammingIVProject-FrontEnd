// Worker-specific UI / derived types.
//
// Per docs/ALIGNMENT_SPEC.md §1.5 there is exactly one canonical API type
// module per repo (`./api.types.ts`). This file re-exports the shared
// contract types so existing worker imports keep working, and only adds the
// worker-page-specific derived/UI types.

import type {
  Inventory,
  InventoryMovement,
  Profession,
  Resource,
} from "./api.types"

export type { Inventory, InventoryMovement, Profession, Resource }

// Inventory is the canonical name; worker UI historically called it InventoryItem.
export type InventoryItem = Inventory

// ============================================================================
// ERROR / AUTH (worker-only UI shapes; kept for backwards compatibility)
// ============================================================================

export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
}

export interface LoginRequest {
  username: string
  password: string
}

// ============================================================================
// ASSIGNED RESOURCES (worker dashboard projection)
// ============================================================================

export interface WorkerAssignedResource {
  id: number
  name: string
  unit: string
  category: string
  current_quantity: number
  image_url: string
  description: string
}

export interface AssignedResourcesResponse {
  resources: WorkerAssignedResource[]
}

// ============================================================================
// PROFESSIONS — worker pages need the persons[] roster shape, not just metadata
// ============================================================================

export interface ProfessionPerson {
  id: number
  first_name: string
  last_name: string
  status: "activo" | "inactivo" | "enfermo" | "herido"
  experience_level: number
  can_work: boolean
}

export interface ProfessionWithPersons extends Profession {
  persons: ProfessionPerson[]
}

export interface ProfessionsResponse {
  professions: ProfessionWithPersons[]
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface ResourcesQueryParams {
  page?: number
  limit?: number
  category?: string
}

export interface MovementsQueryParams {
  limit?: number
}

// ============================================================================
// DERIVED TYPES FOR UI
// ============================================================================

export type ResourceStatus = "OK" | "LOW" | "CRITICAL"

export interface InventoryItemWithStatus extends Inventory {
  status: ResourceStatus
  stockPercentage: number
  isCritical: boolean
}

export type MovementType = "entrada" | "salida" | "consumo" | "producción"

export interface ProfessionMetrics {
  id: number
  name: string
  totalPersons: number
  activePersons: number
  minimum: number
  canExplore: boolean
  status: "OK" | "DÉFICIT" | "CRÍTICO"
}

export interface ResourceCategory {
  name: string
  count: number
  resources: Resource[]
}
