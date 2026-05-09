export enum PersonStatus {
  Active = "active",
  Sick = "sick",
  Injured = "injured",
  Exploring = "exploring",
  Traveling = "traveling",
  Resting = "resting",
  Idle = "idle",
  OutOfCamp = "out_of_camp",
  Deceased = "deceased",
}

export interface AuthUser {
  id: string
  username?: string
  role: string
  campId: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface Camp {
  id: string
  name: string
  location: string
  max_capacity: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profession {
  id: string
  name: string
  description: string | null
  min_required: number
  resource_produced_id: string | null
  production_per_person: number
}

export interface Person {
  id: string
  name: string
  status: PersonStatus
  can_work: boolean
  camp_id: string
  profession_id: string | null
  profession: Profession | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  name: string
  category: string
  unit: string
  description: string | null
}

export interface InventoryItem {
  resource_id: string
  resource: Resource
  camp_id: string
  current_quantity: number
  minimum_stock_required: number
  is_below_minimum: boolean
  updated_at: string
}

export interface InventoryMovement {
  id: string
  camp_id: string
  resource_id: string
  resource: Resource
  quantity: number
  type: string
  description: string | null
  created_at: string
}

export interface ExplorationPerson {
  person_id: string
  person: Person
  is_leader: boolean
}

export interface Exploration {
  id: string
  camp_id: string
  name: string
  destination_description: string
  departure_date: string
  estimated_days: number
  grace_days: number
  status: string
  real_return_date: string | null
  notes: string | null
  persons: ExplorationPerson[]
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  transfer_id: string
  decision: "approved" | "rejected"
  notes: string | null
  decided_at: string
}

export interface IntercampRequest {
  id: string
  camp_origin_id: string
  camp_destination_id: string
  type: "resources" | "people" | "both"
  status: string
  notes: string | null
  travel_days: number | null
  approval: Approval | null
  created_at: string
  updated_at: string
}

export interface GlassBoxFactor {
  category: string
  score: number
  maxScore: number
  detail: string
}

export interface GlassBoxReport {
  factors: GlassBoxFactor[]
  criticalRuleTriggered: boolean
  finalRecommendation: string
}

export interface AiAdmission {
  id: string
  name: string
  about_yourself: string
  skills: string
  medical_info: string
  has_photo: boolean
  has_id_card: boolean
  tracking_code: string
  ai_recommendation: "accept" | "reject" | "review"
  evaluation_score: number
  glass_box_report: GlassBoxReport
  status: "pending" | "accepted" | "rejected"
  admin_notes: string | null
  override_reason: string | null
  created_at: string
}

export interface CriticalResource {
  resourceId: string
  resourceName: string
  currentQuantity: number
  minimumRequired: number
}

export interface DashboardMetrics {
  campId: string
  role: string
  generatedAt: string
  camp: {
    totalPeople: number
    activeWorkers: number
    unavailablePeople: number
    campCapacity: number
    occupancyRate: number
    activeExplorations: number
    emptyProfessions: string[]
  }
  warehouse: {
    totalResourceTypes: number
    resourcesWithAlerts: number
    inventoryTotalQuantity: number
    criticalResources: CriticalResource[]
  }
  transfers: {
    pendingTransfers: number
    approvedTransfers: number
    completedTransfers: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
