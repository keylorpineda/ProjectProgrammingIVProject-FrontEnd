export interface Resource {
  type: "food" | "water" | "ammo" | "fuel"
  amount: number
  max: number
}

export interface ProfessionStat {
  label: string
  count: number
}

export interface Camp {
  id: string
  name: string
  coords: [number, number]
  population: number
  professions: ProfessionStat[]
  resources: Resource[]
  hasAlert: boolean
  alertType?: "starvation" | "attack" | "shortage"
  thumbnailUrl: string
  rotation: number
  dangerLevel: "low" | "moderate" | "high" | "critical"
  hazardRadius: number
}

export interface TransferLine {
  id: string
  from: [number, number]
  to: [number, number]
  resourceType: "food" | "fuel" | "ammo" | "water"
}

export interface ExpeditionEvent {
  id: string
  originId: string
  type: "Expedicion"
  coords: [number, number]
  label: string
  status: "active" | "returning"
}

export interface HazardArea {
  id: string
  name: string
  coords: [number, number]
  dangerLevel: "low" | "moderate" | "high" | "critical"
  radius: number
}
