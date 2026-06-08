// Fixtures shared by all tests. Snake_case keys mirror the real API shape.

import type {
  AuthUser,
  Camp,
  Person,
  Profession,
  Resource,
  Inventory,
  IntercampRequest,
  Exploration,
  AiAdmission,
  DashboardMetrics,
  PaginatedResponse,
} from "@/types/api.types"

export const adminUser: AuthUser = {
  id: "5",
  username: "admin",
  email: "admin@system.local",
  role: "admin",
  camp_id: "1",
}

export const workerUser: AuthUser = {
  id: "6",
  username: "worker",
  email: "worker@system.local",
  role: "worker",
  camp_id: "1",
}

export const campLeaderUser: AuthUser = {
  id: "7",
  username: "leader",
  email: "leader@system.local",
  role: "camp_leader",
  camp_id: "1",
}

export const camps: Camp[] = [
  {
    id: "1",
    name: "Campamento Alpha",
    location_description: "Bunker subterráneo",
    latitude: 9.93,
    longitude: -84.08,
    max_capacity: 500,
    active: true,
    foundation_date: "2026-01-01",
    logo_url: null,
    logo_public_id: null,
    map_url: null,
    map_public_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Refugio Beta",
    location_description: "Base en las montañas",
    latitude: 10.0,
    longitude: -83.0,
    max_capacity: 1500,
    active: true,
    foundation_date: "2026-01-01",
    logo_url: null,
    logo_public_id: null,
    map_url: null,
    map_public_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
]

export const professions: Profession[] = [
  { id: "1", name: "Medico", can_explore: false, minimum_active_required: 1 },
  { id: "2", name: "Explorador", can_explore: true, minimum_active_required: 1 },
  { id: "3", name: "Cocinero", can_explore: false, minimum_active_required: 1 },
]

export const persons: Person[] = [
  {
    id: "10",
    profession_id: "1",
    first_name: "Joel",
    last_name: "Miller",
    last_name2: null,
    birth_date: "1990-05-12",
    join_date: "2026-01-01T00:00:00.000Z",
    identification_code: "SURVIVOR-001",
    status: "active",
    can_work: true,
    experience_level: 1,
    experience_points: 0,
    photo_url: null,
    id_card_url: null,
    previous_skills: null,
    notes: null,
    profession: professions[0],
    userAccount: {
      id: "10",
      username: "joel",
      email: "joel@a.com",
      camp_id: "1",
      avatar_url: null,
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "11",
    profession_id: "2",
    first_name: "Ellie",
    last_name: "Williams",
    last_name2: null,
    birth_date: "2005-04-04",
    join_date: "2026-01-02T00:00:00.000Z",
    identification_code: "SURVIVOR-002",
    status: "active",
    can_work: true,
    experience_level: 1,
    experience_points: 0,
    photo_url: null,
    id_card_url: null,
    previous_skills: null,
    notes: null,
    profession: professions[1],
    userAccount: null,
    created_at: "2026-01-02T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  },
]

export const personsPage: PaginatedResponse<Person> = {
  data: persons,
  total: persons.length,
  page: 1,
  limit: 10,
  totalPages: 1,
}

export const resources: Resource[] = [
  {
    id: "1",
    name: "Agua",
    unit: "litros",
    category: "water",
    image_url: null,
    image_public_id: null,
    description: null,
  },
  {
    id: "2",
    name: "Comida",
    unit: "raciones",
    category: "food",
    image_url: null,
    image_public_id: null,
    description: null,
  },
]

export const inventory: Inventory[] = [
  {
    camp_id: "1",
    resource_id: "1",
    current_quantity: 1000,
    minimum_stock_required: 500,
    alert_active: false,
    last_update: "2026-01-01T00:00:00.000Z",
    resource: resources[0],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Inventory,
]

export const transfers: IntercampRequest[] = [
  {
    id: "100",
    camp_origin_id: "2",
    camp_destination_id: "1",
    type: "resources",
    status: "pending",
    request_date: "2026-01-05T00:00:00.000Z",
    notes: null,
    travel_days: 1,
    departure_date: null,
    arrival_date: null,
    created_at: "2026-01-05T00:00:00.000Z",
    updated_at: "2026-01-05T00:00:00.000Z",
    resourceDetails: [],
    personDetails: [],
  } as unknown as IntercampRequest,
]

export const explorations: Exploration[] = [
  {
    id: "200",
    camp_id: "1",
    name: "Búsqueda zona norte",
    destination_description: "Sector norte",
    departure_date: "2026-02-01",
    estimated_days: 3,
    grace_days: 1,
    real_return_date: null,
    status: "scheduled",
    notes: null,
    user_create_id: "5",
    created_at: "2026-01-30T00:00:00.000Z",
    updated_at: "2026-01-30T00:00:00.000Z",
    explorationPersons: [],
    explorationResources: [],
  } as unknown as Exploration,
]

export const dashboardMetrics: DashboardMetrics = {
  camp_id: "1",
  role: "admin",
  generated_at: "2026-01-05T00:00:00.000Z",
  camp: {
    total_people: 12,
    active_workers: 10,
    unavailable_people: 2,
    camp_capacity: 500,
    occupancy_rate: 2.4,
    active_explorations: 1,
    empty_professions: [],
  },
  warehouse: {
    total_resource_types: 8,
    resources_with_alerts: 1,
    inventory_total_quantity: 4500,
    critical_resources: [
      {
        resource_id: "2",
        resource_name: "Comida",
        current_quantity: 20,
        minimum_required: 100,
      },
    ],
  },
  transfers: {
    pending_transfers: 1,
    approved_transfers: 0,
    completed_transfers: 0,
  },
}

export const pendingAdmissionsPage: PaginatedResponse<AiAdmission> = {
  data: [],
  total: 0,
  page: 1,
  limit: 100,
  totalPages: 0,
}
