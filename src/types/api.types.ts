// Canonical API types. Mirrors exactly what the backend serializes
// (see docs/ALIGNMENT_SPEC.md §1.3). Field names are snake_case to match
// backend entity columns; do not add camelCase aliases.

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
  email?: string
  role: string
  camp_id: string | null
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface Camp {
  id: string
  name: string
  location_description: string | null
  latitude: number | null
  longitude: number | null
  max_capacity: number | null
  active: boolean
  foundation_date: string | null
  logo_url: string | null
  logo_public_id: string | null
  map_url: string | null
  map_public_id: string | null
  created_at: string
  updated_at: string
}

export interface Profession {
  id: string
  name: string
  can_explore: boolean
  minimum_active_required: number
  created_at?: string
  updated_at?: string
}

export interface UserAccountSummary {
  id: string
  username: string
  email: string
  camp_id: string | null
  avatar_url: string | null
}

export interface Person {
  id: string
  profession_id: string | null
  first_name: string
  last_name: string
  last_name2: string | null
  birth_date: string | null
  join_date: string | null
  identification_code: string | null
  status: string | null
  can_work: boolean
  experience_level: number
  experience_points: number
  photo_url: string | null
  id_card_url: string | null
  previous_skills: string | null
  notes: string | null
  profession?: Profession | null
  userAccount?: UserAccountSummary | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  name: string
  unit: string
  category: string
  image_url: string | null
  image_public_id: string | null
  description: string | null
}

export interface Inventory {
  camp_id: string
  resource_id: string
  current_quantity: number
  minimum_stock_required: number
  alert_active: boolean
  last_update: string | null
  resource?: Resource
  camp?: Camp
  created_at: string
  updated_at: string
}

/** Legacy alias retained for incremental migration; prefer `Inventory`. */
export type InventoryItem = Inventory

export interface InventoryMovement {
  id: string
  resource_id: string
  camp_id: string
  quantity: number
  type: string
  description: string | null
  date: string
  user_id: string | null
  resource?: Resource
  user?: UserAccountSummary
  created_at: string
  updated_at: string
}

export interface ExplorationPerson {
  exploration_id: string
  person_id: string
  is_leader: boolean
  return_confirmed: boolean
  person?: Person
}

export interface ExplorationResource {
  exploration_id: string
  resource_id: string
  /** "in" (brought back) or "out" (taken on the trip). Part of the composite key. */
  flow: string
  quantity: number
  resource?: Resource
}

export interface Exploration {
  id: string
  camp_id: string
  name: string
  destination_description: string | null
  departure_date: string
  estimated_days: number
  grace_days: number
  real_return_date: string | null
  status: string
  notes: string | null
  user_create_id: string | null
  camp?: Camp
  userCreate?: UserAccountSummary
  explorationPersons: ExplorationPerson[]
  explorationResources: ExplorationResource[]
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  approval_date: string
  status: string
  user?: UserAccountSummary
  created_at: string
  updated_at: string
}

export interface RequestResourceDetail {
  request_id: string
  resource_id: string
  requested_quantity: number
  approved_quantity: number | null
  received_quantity: number | null
  resource?: Resource
}

export interface RequestPersonDetail {
  request_id: string
  person_id: string
  is_leader: boolean
  transfer_status: string
  person?: Person
}

export interface IntercampRequest {
  id: string
  camp_origin_id: string
  camp_destination_id: string
  type: string
  status: string
  request_date: string
  notes: string | null
  travel_days: number | null
  departure_date: string | null
  arrival_date: string | null
  campOrigin?: Camp
  campDestination?: Camp
  resourceDetails?: RequestResourceDetail[]
  personDetails?: RequestPersonDetail[]
  approvals?: Approval[]
  created_at: string
  updated_at: string
}

export interface AdmissionCandidateData {
  first_name: string
  last_name: string
  last_name2?: string | null
  age: number
  health_status: number
  physical_condition: number
  medical_conditions?: string[]
  skills: string[]
  previous_profession?: string | null
  years_experience?: number | null
  criminal_record: boolean
  psychological_evaluation?: number | null
  photo_url?: string | null
  id_card_url?: string | null
  contact_email?: string | null
  personal_history?: string | null
}

export interface AiAdmission {
  id: string
  tracking_code: string
  camp_id: string
  person_id: string | null
  candidate_data: AdmissionCandidateData
  score: number | null
  status: string
  suggested_decision: string | null
  suggested_profession_id: string | null
  justification: string | null
  raw_ai_response: unknown
  reviewed_by_user_id: string | null
  final_human_decision: string | null
  admin_notes: string | null
  submission_date: string
  review_date: string | null
  registration_token?: string | null
}

export interface CriticalResource {
  resource_id: string
  resource_name: string
  current_quantity: number
  minimum_required: number
}

export interface DashboardCampMetrics {
  total_people: number
  active_workers: number
  unavailable_people: number
  camp_capacity: number | null
  occupancy_rate: number | null
  active_explorations: number
  empty_professions: string[]
}

export interface DashboardWarehouseMetrics {
  total_resource_types: number
  resources_with_alerts: number
  inventory_total_quantity: number
  critical_resources: CriticalResource[]
}

export interface DashboardTransfersMetrics {
  pending_transfers: number
  approved_transfers: number
  completed_transfers: number
}

export interface DashboardMetrics {
  camp_id: string
  role: string
  generated_at: string
  camp: DashboardCampMetrics
  warehouse: DashboardWarehouseMetrics | null
  transfers: DashboardTransfersMetrics
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages?: number
}
