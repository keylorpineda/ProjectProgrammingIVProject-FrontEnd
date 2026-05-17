/**
 * Worker API Types
 * Types for API responses from DASHBOARD_ENDPOINTS_COMPLETO.md
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: number
    username: string
    email: string
    role: 'trabajador' | 'encargado_viajes' | 'admin' | 'gestor_recursos'
    camp_id: number
  }
}

// ============================================================================
// ASSIGNED RESOURCES (GET /api/users/me/assigned-resources)
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
// PROFESSIONS (GET /api/users/professions)
// ============================================================================

export interface ProfessionPerson {
  id: number
  first_name: string
  last_name: string
  status: 'activo' | 'inactivo' | 'enfermo' | 'herido'
  experience_level: number
  can_work: boolean
}

export interface Profession {
  id: number
  name: string
  can_explore: boolean
  minimum_active_required: number
  persons: ProfessionPerson[]
}

export interface ProfessionsResponse {
  professions: Profession[]
}

// ============================================================================
// RESOURCES CATALOG (GET /api/resources)
// ============================================================================

export interface Resource {
  id: number
  name: string
  unit: string
  category: string
  image_url: string
  image_public_id: string
  description: string
}

export interface ResourcesResponse {
  data: Resource[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// INVENTORY (GET /api/resources/inventory/:campId)
// ============================================================================

export interface InventoryItem {
  camp_id: number
  resource_id: number
  resource_name: string
  current_quantity: number
  minimum_stock_required: number
  alert_active: boolean
  last_update: string // ISO timestamp
  unit: string
}

export interface InventoryResponse {
  camp_id: number
  inventory_items: InventoryItem[]
}

// ============================================================================
// INVENTORY MOVEMENTS (GET /api/resources/movements/:campId)
// ============================================================================

export type MovementType = 'entrada' | 'salida' | 'consumo' | 'producción'

export interface InventoryMovement {
  id: number
  resource_id: number
  resource_name: string
  camp_id: number
  quantity: number
  type: MovementType
  description: string
  date: string // ISO timestamp
  user_id: number | null
  user_name: string
}

export interface InventoryMovementsResponse {
  movements: InventoryMovement[]
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

export type ResourceStatus = 'OK' | 'LOW' | 'CRITICAL'

export interface InventoryItemWithStatus extends InventoryItem {
  status: ResourceStatus
  stockPercentage: number
  isCritical: boolean
}

// ============================================================================
// FILTER AND SEARCH
// ============================================================================

export interface ProfessionMetrics {
  id: number
  name: string
  totalPersons: number
  activePersons: number
  minimum: number
  canExplore: boolean
  status: 'OK' | 'DÉFICIT' | 'CRÍTICO'
}

export interface ResourceCategory {
  name: string
  count: number
  resources: Resource[]
}
