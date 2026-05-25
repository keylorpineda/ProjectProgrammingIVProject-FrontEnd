import type {
  InventoryItem,
  InventoryMovement,
  ProfessionWithPersons,
  WorkerAssignedResource,
} from "@/types/worker.api.types"

const nowIso = () => new Date().toISOString()

export const fallbackAssignedResources: WorkerAssignedResource[] = [
  {
    id: 1,
    name: "Racion semanal",
    unit: "uds",
    category: "alimentos",
    current_quantity: 1,
    image_url: "",
    description: "Asignacion basica de supervivencia para turno activo.",
  },
  {
    id: 2,
    name: "Cantimplora",
    unit: "uds",
    category: "agua",
    current_quantity: 1,
    image_url: "",
    description: "Equipo personal para hidratacion en ruta.",
  },
  {
    id: 3,
    name: "Kit primeros auxilios",
    unit: "uds",
    category: "medico",
    current_quantity: 1,
    image_url: "",
    description: "Suministro compacto para incidentes menores.",
  },
]

export const fallbackProfessions: ProfessionWithPersons[] = [
  {
    id: "1",
    name: "Aguatero",
    can_explore: false,
    minimum_active_required: 2,
    persons: [
      {
        id: 101,
        first_name: "Jorge",
        last_name: "Reyes",
        status: "activo",
        experience_level: 2,
        can_work: true,
      },
      {
        id: 102,
        first_name: "Mara",
        last_name: "Solano",
        status: "activo",
        experience_level: 1,
        can_work: true,
      },
    ],
  },
  {
    id: "2",
    name: "Guardia",
    can_explore: false,
    minimum_active_required: 3,
    persons: [
      {
        id: 201,
        first_name: "Elena",
        last_name: "Mora",
        status: "activo",
        experience_level: 3,
        can_work: true,
      },
    ],
  },
  {
    id: "3",
    name: "Explorador",
    can_explore: true,
    minimum_active_required: 1,
    persons: [
      {
        id: 301,
        first_name: "Noah",
        last_name: "Vargas",
        status: "activo",
        experience_level: 4,
        can_work: true,
      },
    ],
  },
  {
    id: "4",
    name: "Cocinero",
    can_explore: false,
    minimum_active_required: 2,
    persons: [],
  },
]

const fallbackResource = (id: string, name: string, unit: string, category: string) => ({
  id,
  name,
  unit,
  category,
  image_url: null,
  image_public_id: null,
  description: null,
})

export const fallbackInventory: InventoryItem[] = [
  {
    camp_id: "4",
    resource_id: "1",
    current_quantity: 1240,
    minimum_stock_required: 600,
    alert_active: false,
    last_update: nowIso(),
    resource: fallbackResource("1", "Raciones comida", "uds", "alimentos"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    camp_id: "4",
    resource_id: "2",
    current_quantity: 450,
    minimum_stock_required: 500,
    alert_active: false,
    last_update: nowIso(),
    resource: fallbackResource("2", "Agua potable", "L", "agua"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    camp_id: "4",
    resource_id: "3",
    current_quantity: 82,
    minimum_stock_required: 120,
    alert_active: true,
    last_update: nowIso(),
    resource: fallbackResource("3", "Municion 9mm", "packs", "armamento"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    camp_id: "4",
    resource_id: "4",
    current_quantity: 12,
    minimum_stock_required: 8,
    alert_active: false,
    last_update: nowIso(),
    resource: fallbackResource("4", "Kits medicos", "uds", "medico"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
]

export const fallbackMovements: InventoryMovement[] = [
  {
    id: "1",
    resource_id: "2",
    camp_id: "4",
    quantity: -40,
    type: "salida",
    description: "Consumo diario",
    date: nowIso(),
    user_id: null,
    resource: fallbackResource("2", "Agua potable", "L", "agua"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: "2",
    resource_id: "1",
    camp_id: "4",
    quantity: 200,
    type: "entrada",
    description: "Reposicion semanal",
    date: nowIso(),
    user_id: null,
    resource: fallbackResource("1", "Raciones comida", "uds", "alimentos"),
    created_at: nowIso(),
    updated_at: nowIso(),
  },
]
