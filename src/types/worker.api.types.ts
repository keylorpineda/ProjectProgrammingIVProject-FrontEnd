// Worker-specific UI / derived types.
//
// Per docs/ALIGNMENT_SPEC.md §1.5 there is exactly one canonical API type
// module per repo (`./api.types.ts`). This file re-exports the shared
// contract types so existing worker imports keep working, and only adds the
// worker-page-specific derived/UI types.

import type { Inventory, InventoryMovement, Profession, Resource } from "./api.types"

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

// ============================================================================
// GAMIFICATION — Badges (UserAsset con relation_type="badge")
// ============================================================================

export interface UserBadgeAsset {
  id: number
  name: string
  description: string | null
  asset_type: string
  category: string | null
  url: string
  thumbnail_url: string | null
  rarity: number | null
  metadata: Record<string, unknown> | null
  active: boolean
}

export interface UserBadge {
  id: number
  user_account_id: number
  asset_id: number
  relation_type: string
  acquired_at: string | null
  is_displayed: boolean
  context_data: Record<string, unknown> | null
  asset: UserBadgeAsset
}

// ============================================================================
// DAILY BALANCE — GET /users/camp/:campId/balance
// ============================================================================

export interface DailyBalance {
  production: { food: number; water: number }
  consumption: { food: number; water: number }
  balance: { food: number; water: number }
  persons: number
}

// ============================================================================
// USER PROFILE — GET /users/me/profile
// Returns UserAccount with person + person.profession relations
// ============================================================================

export interface MyProfession {
  id: number
  name: string
  can_explore: boolean
  minimum_active_required: number
}

export interface MyPerson {
  id: number
  first_name: string
  last_name: string
  status: "activo" | "inactivo" | "enfermo" | "herido"
  experience_level: number
  can_work: boolean
  profession_id: number | null
  profession: MyProfession | null
}

export interface MyProfile {
  id: number | string
  username: string
  email: string
  camp_id: number | string | null
  person: MyPerson | null
}

// ============================================================================
// CAMP — GET /camps/:id  (no @Roles restriction — worker-accessible)
// ============================================================================

export interface Camp {
  id: number
  name: string
  location_description: string | null
  latitude: number | null
  longitude: number | null
  max_capacity: number | null
  active: boolean
  foundation_date: string | null
  logo_url: string | null
}

export interface CampMetrics {
  totalResources: number
  resourcesWithAlerts: number
  inventorySummary: Record<string, unknown>[]
}

export interface CampWithMetrics {
  camp: Camp
  metrics: CampMetrics
}
