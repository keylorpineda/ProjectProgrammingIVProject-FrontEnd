// Worker-specific fixtures. Snake_case keys mirror the real API shape.
// Values are chosen so the derived metrics are deterministic:
//   professions → 1 OK / 1 DÉFICIT / 1 CRÍTICO
//   inventory   → 1 ok / 1 warning / 1 critical

import type {
  ProfessionWithPersons,
  InventoryItem,
  InventoryMovement,
  UserBadge,
  MyProfile,
  CampWithMetrics,
  DailyBalance,
  WorkerAssignedResource,
} from "@/types/worker.api.types"

const ISO = "2026-02-01T00:00:00.000Z"

export const workerCamp: CampWithMetrics = {
  camp: {
    id: 1,
    name: "Campamento Alpha",
    location_description: "Bunker subterráneo",
    latitude: 9.93,
    longitude: -84.08,
    max_capacity: 500,
    active: true,
    foundation_date: "2026-01-01",
    logo_url: null,
  },
  metrics: { totalResources: 3, resourcesWithAlerts: 1, inventorySummary: [] },
}

export const workerProfessions: ProfessionWithPersons[] = [
  {
    id: "1",
    name: "Medico",
    can_explore: false,
    minimum_active_required: 2,
    // 1 active < 2 required → DÉFICIT
    persons: [
      {
        id: 101,
        first_name: "Ana",
        last_name: "Ruiz",
        status: "activo",
        experience_level: 2,
        can_work: true,
      },
    ],
  },
  {
    id: "2",
    name: "Vigia",
    can_explore: true,
    minimum_active_required: 1,
    // 1 active >= 1 required → OK
    persons: [
      {
        id: 201,
        first_name: "Beto",
        last_name: "Cruz",
        status: "activo",
        experience_level: 3,
        can_work: true,
      },
    ],
  },
  {
    id: "3",
    name: "Panadero",
    can_explore: false,
    minimum_active_required: 2,
    // 0 active → CRÍTICO
    persons: [],
  },
]

const resource = (id: string, name: string, unit: string, category: string) => ({
  id,
  name,
  unit,
  category,
  image_url: null,
  image_public_id: null,
  description: null,
})

export const workerInventory: InventoryItem[] = [
  {
    camp_id: "1",
    resource_id: "1",
    current_quantity: 1000,
    minimum_stock_required: 500,
    alert_active: false,
    last_update: ISO,
    resource: resource("1", "Agua Potable", "L", "water"),
    created_at: ISO,
    updated_at: ISO,
  },
  {
    camp_id: "1",
    resource_id: "2",
    current_quantity: 80,
    minimum_stock_required: 100,
    alert_active: false,
    last_update: ISO,
    resource: resource("2", "Raciones", "uds", "food"),
    created_at: ISO,
    updated_at: ISO,
  },
  {
    camp_id: "1",
    resource_id: "3",
    current_quantity: 10,
    minimum_stock_required: 50,
    alert_active: true,
    last_update: ISO,
    resource: resource("3", "Vendas", "uds", "medicine"),
    created_at: ISO,
    updated_at: ISO,
  },
] as unknown as InventoryItem[]

// Movement resources are intentionally distinct from the inventory names so a
// resource name appears in exactly one place (avoids ambiguous text queries).
export const workerMovements: InventoryMovement[] = [
  {
    id: "1",
    resource_id: "4",
    camp_id: "1",
    quantity: 200,
    type: "entrada",
    description: "Reposición semanal",
    date: ISO,
    user_id: null,
    resource: resource("4", "Combustible", "L", "fuel"),
    created_at: ISO,
    updated_at: ISO,
  },
  {
    id: "2",
    resource_id: "5",
    camp_id: "1",
    quantity: -40,
    type: "salida",
    description: "Consumo diario",
    date: ISO,
    user_id: null,
    resource: resource("5", "Herramientas", "uds", "tools"),
    created_at: ISO,
    updated_at: ISO,
  },
] as unknown as InventoryMovement[]

export const workerBadges: UserBadge[] = [
  {
    id: 1,
    user_account_id: 6,
    asset_id: 10,
    relation_type: "badge",
    acquired_at: ISO,
    is_displayed: true,
    context_data: null,
    asset: {
      id: 10,
      name: "Primer Trabajo",
      description: "Primer inicio de sesión en el sistema",
      asset_type: "badge",
      category: "hito",
      url: "https://example.test/badge.png",
      thumbnail_url: null,
      rarity: 1,
      metadata: null,
      active: true,
    },
  },
]

export const workerProfile: MyProfile = {
  id: 6,
  username: "worker",
  email: "worker@system.local",
  camp_id: "1",
  person: {
    id: 6,
    first_name: "Survivor",
    last_name: "Uno",
    status: "activo",
    experience_level: 2,
    can_work: true,
    profession_id: 1,
    profession: { id: 1, name: "Medico", can_explore: false, minimum_active_required: 2 },
  },
}

export const workerBalance: DailyBalance = {
  production: { food: 120, water: 90 },
  consumption: { food: 80, water: 100 },
  balance: { food: 40, water: -10 },
  persons: 12,
}

export const workerAssignedResources: WorkerAssignedResource[] = [
  {
    id: 1,
    name: "Ración semanal",
    unit: "uds",
    category: "alimentos",
    current_quantity: 1,
    image_url: "",
    description: "Asignación básica de supervivencia.",
  },
]

// Explorations cover every branch of WorkerExpeditions: an in-progress mission
// with coords / leader / team (including the current person) / supplies / notes,
// a scheduled mission with no coords, plus completed and cancelled history rows.
// person_id 6 matches workerProfile.person.id so the "TU MISIÓN" path is hit.
export const workerExplorations = [
  {
    id: 1,
    name: "Avanzada Norte",
    destination_description: "Sector norte [9.93, -84.08]",
    departure_date: "2026-03-01T00:00:00.000Z",
    estimated_days: 3,
    grace_days: 1,
    status: "in_progress",
    notes: "Llevar agua extra",
    explorationPersons: [
      { person_id: 6, is_leader: true, person: { first_name: "Survivor", last_name: "Uno" } },
      { person_id: 7, is_leader: false, person: { first_name: "Otra", last_name: "Dos" } },
    ],
    explorationResources: [{ resource_id: 1, quantity: 5, resource: { name: "Agua", unit: "L" } }],
  },
  {
    id: 2,
    name: "Reconocimiento Sur",
    destination_description: "Zona sur",
    departure_date: "2026-03-05T00:00:00.000Z",
    estimated_days: 2,
    grace_days: 0,
    status: "scheduled",
    explorationPersons: [],
    explorationResources: [],
  },
  {
    id: 3,
    name: "Mision Completada",
    destination_description: "Base lejana",
    departure_date: "2026-02-01T00:00:00.000Z",
    estimated_days: 1,
    grace_days: 0,
    real_return_date: "2026-02-03T00:00:00.000Z",
    status: "completed",
    explorationPersons: [],
    explorationResources: [],
  },
  {
    id: 4,
    name: "Mision Cancelada",
    destination_description: "Ruta bloqueada",
    departure_date: "2026-02-10T00:00:00.000Z",
    estimated_days: 4,
    grace_days: 1,
    status: "cancelled",
    explorationPersons: [],
    explorationResources: [],
  },
]
