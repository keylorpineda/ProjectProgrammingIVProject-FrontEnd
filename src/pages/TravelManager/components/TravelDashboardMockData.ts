export const mockExplorations = [
  {
    id: "EXP-1",
    name: "MOCK EXPLORATION 1",
    status: "in_progress",
    camp_id: "CAMP-A1",
    type: "people",
    destination_description: "Sector 7G",
  },
  {
    id: "EXP-2",
    name: "MOCK EXPLORATION 2",
    status: "scheduled",
    camp_id: "CAMP-A1",
    type: "mixed",
    destination_description: "Sector 8B",
  },
]

export const mockTransfers = [
  {
    id: "TR-1",
    status: "in_transit",
    camp_origin_id: "CAMP-A1",
    camp_destination_id: "CAMP-B2",
    type: "cargo",
    campOrigin: { id: "CAMP-A1", name: "Alpha" },
    campDestination: { id: "CAMP-B2", name: "Bravo" },
  },
  {
    id: "TR-2",
    status: "pending",
    camp_origin_id: "CAMP-B2",
    camp_destination_id: "CAMP-A1",
    type: "people",
    campOrigin: { id: "CAMP-B2", name: "Bravo" },
    campDestination: { id: "CAMP-A1", name: "Alpha" },
  },
]

export const mockInventory = [
  {
    camp_id: "CAMP-A1",
    resource_id: "RES-1",
    resource: { name: "Agua" },
    current_quantity: 10,
    minimum_stock_required: 50,
    alert_active: true,
  },
  {
    camp_id: "CAMP-A1",
    resource_id: "RES-2",
    resource: { name: "Comida" },
    current_quantity: 100,
    minimum_stock_required: 50,
    alert_active: false,
  },
]

export const mockPersons = [
  {
    id: "P-1",
    status: "active",
    first_name: "Jane",
    last_name: "Doe",
    camp_id: "CAMP-A1",
    profession: { name: "Operario", can_explore: true },
  },
  {
    id: "P-2",
    status: "in_field",
    first_name: "John",
    last_name: "Smith",
    camp_id: "CAMP-A1",
    profession: { name: "Ingeniero", can_explore: true },
  },
]
