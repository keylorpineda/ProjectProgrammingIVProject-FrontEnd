import axios, { type AxiosError } from "axios"

import type { Camp, HazardArea, ProfessionStat, Resource, TransferLine } from "../types/camp"

import api from "@/config/api"

type Primitive = string | number | boolean | null | undefined

type UnknownRecord = Record<string, unknown>

interface RawTransfer {
  id?: Primitive
  camp_origin_id?: Primitive
  camp_destination_id?: Primitive
  type?: Primitive
}

const FALLBACK_CENTER: [number, number] = [9.934739, -84.087502]

const DEFAULT_THUMBNAILS = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1533630675586-caeb222956bc?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1552516766-3be0b8d50f83?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400",
]

export class TacticalMapApiError extends Error {
  readonly status?: number
  readonly details?: unknown

  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.name = "TacticalMapApiError"
    this.status = status
    this.details = details
  }
}

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === "object") {
    const record = value as UnknownRecord
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.items)) return record.items as T[]
  }
  return []
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const hashString = (value: string): number => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const deterministicJitter = (seed: string, amplitude: number): number => {
  const hash = hashString(seed)
  const normalized = (hash % 10000) / 10000
  return (normalized - 0.5) * amplitude
}

const parseCoords = (raw: UnknownRecord, seed: string): [number, number] => {
  const coordsValue = raw.coords
  if (Array.isArray(coordsValue) && coordsValue.length >= 2) {
    const lat = toNumber(coordsValue[0])
    const lng = toNumber(coordsValue[1])
    if (lat !== null && lng !== null) return [lat, lng]
  }

  const lat = toNumber(raw.lat ?? raw.latitude)
  const lng = toNumber(raw.lng ?? raw.lon ?? raw.longitude)
  if (lat !== null && lng !== null) return [lat, lng]

  const location = raw.location
  if (typeof location === "string") {
    const match = location.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
    if (match) {
      const parsedLat = Number(match[1])
      const parsedLng = Number(match[2])
      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) return [parsedLat, parsedLng]
    }
  }

  return [
    FALLBACK_CENTER[0] + deterministicJitter(`${seed}-lat`, 0.08),
    FALLBACK_CENTER[1] + deterministicJitter(`${seed}-lng`, 0.08),
  ]
}

const dangerFromRaw = (raw: UnknownRecord): Camp["dangerLevel"] => {
  const value = raw.dangerLevel
  if (value === "low" || value === "moderate" || value === "high" || value === "critical") {
    return value
  }

  const numeric = toNumber(raw.danger_level ?? raw.alert_level)
  if (numeric !== null) {
    if (numeric >= 80) return "critical"
    if (numeric >= 60) return "high"
    if (numeric >= 35) return "moderate"
  }

  return "low"
}

const normalizeResources = (raw: UnknownRecord, seed: string): Resource[] => {
  const value = raw.resources
  if (Array.isArray(value)) {
    const mapped = value
      .map((item): Resource | null => {
        if (!item || typeof item !== "object") return null
        const record = item as UnknownRecord
        const type = record.type
        if (type !== "food" && type !== "water" && type !== "ammo" && type !== "fuel") return null
        const amount = toNumber(record.amount ?? record.current ?? record.current_quantity) ?? 0
        const max = toNumber(record.max ?? record.maximum ?? record.max_quantity) ?? 100
        return { type, amount: Math.max(0, Math.min(100, amount)), max: Math.max(1, max) }
      })
      .filter((item): item is Resource => item !== null)

    if (mapped.length > 0) return mapped
  }

  const base = hashString(seed)
  return [
    { type: "food", amount: 25 + (base % 65), max: 100 },
    { type: "water", amount: 20 + ((base >> 2) % 70), max: 100 },
    { type: "ammo", amount: 15 + ((base >> 3) % 70), max: 100 },
    { type: "fuel", amount: 10 + ((base >> 4) % 75), max: 100 },
  ]
}

const normalizeProfessions = (raw: UnknownRecord, seed: string): ProfessionStat[] => {
  const value = raw.professions
  if (Array.isArray(value)) {
    const mapped = value
      .map((item): ProfessionStat | null => {
        if (!item || typeof item !== "object") return null
        const record = item as UnknownRecord
        const label = record.label
        const count = toNumber(record.count)
        if (typeof label !== "string" || count === null) return null
        return { label, count: Math.max(0, Math.round(count)) }
      })
      .filter((item): item is ProfessionStat => item !== null)

    if (mapped.length > 0) return mapped
  }

  const base = hashString(seed)
  return [
    { label: "Exploradores", count: 4 + (base % 8) },
    { label: "Ingenieros", count: 2 + ((base >> 1) % 6) },
    { label: "Logistica", count: 3 + ((base >> 2) % 7) },
    { label: "Medicos", count: 1 + ((base >> 3) % 4) },
  ]
}

const normalizeCamp = (raw: UnknownRecord): Camp => {
  const id = String(raw.id ?? raw.camp_id ?? crypto.randomUUID())
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name : `Campamento ${id}`
  const dangerLevel = dangerFromRaw(raw)
  const resources = normalizeResources(raw, id)
  const population = toNumber(raw.population ?? raw.current_population ?? raw.max_capacity) ?? 0
  const hasAlert =
    typeof raw.hasAlert === "boolean"
      ? raw.hasAlert
      : typeof raw.has_alert === "boolean"
        ? raw.has_alert
        : dangerLevel === "critical"

  const rotation =
    toNumber(raw.rotation) ?? Math.round(deterministicJitter(`${id}-rotation`, 20) * 10) / 10

  const hazardRadius =
    toNumber(raw.hazardRadius ?? raw.hazard_radius ?? raw.radius) ??
    (dangerLevel === "critical" ? 750 : dangerLevel === "high" ? 600 : 420)

  const thumbnailUrl =
    typeof raw.thumbnailUrl === "string" && raw.thumbnailUrl.trim()
      ? raw.thumbnailUrl
      : typeof raw.thumbnail_url === "string" && raw.thumbnail_url.trim()
        ? raw.thumbnail_url
        : DEFAULT_THUMBNAILS[hashString(id) % DEFAULT_THUMBNAILS.length]

  const alertType =
    raw.alertType === "starvation" || raw.alertType === "attack" || raw.alertType === "shortage"
      ? raw.alertType
      : undefined

  return {
    id,
    name,
    coords: parseCoords(raw, id),
    population,
    professions: normalizeProfessions(raw, id),
    resources,
    hasAlert,
    alertType,
    thumbnailUrl,
    rotation: Math.max(-10, Math.min(10, rotation)),
    dangerLevel,
    hazardRadius,
  }
}

const normalizeError = (error: unknown, fallbackMessage: string): TacticalMapApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError
    const status = axiosError.response?.status
    const apiMessage =
      typeof axiosError.response?.data === "object" && axiosError.response?.data !== null
        ? (axiosError.response.data as Record<string, unknown>).message
        : null

    const message =
      typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : fallbackMessage
    return new TacticalMapApiError(message, status, axiosError.response?.data)
  }

  if (error instanceof Error) return new TacticalMapApiError(error.message)
  return new TacticalMapApiError(fallbackMessage)
}

export class CampsService {
  async getCamps(): Promise<Camp[]> {
    try {
      const { data } = await api.get<unknown>("/camps/map")
      return asArray<UnknownRecord>(data).map(normalizeCamp)
    } catch (error) {
      throw normalizeError(error, "No se pudieron cargar los campamentos.")
    }
  }

  async getHazardAreas(camps: Camp[]): Promise<HazardArea[]> {
    // Backend actual no expone hazard-areas. Derivamos zonas desde el estado de campamentos.
    return this.deriveHazardAreas(camps)
  }

  async getTransfers(camps: Camp[]): Promise<TransferLine[]> {
    try {
      if (camps.length === 0) return []

      const { data } = await api.get<unknown>("/transfers/requests/map")
      const transfers = asArray<RawTransfer>(data)

      const campById = new Map(camps.map((camp) => [camp.id, camp]))

      return transfers
        .map((transfer): TransferLine | null => {
          const id = transfer.id ? String(transfer.id) : null
          const originId = transfer.camp_origin_id ? String(transfer.camp_origin_id) : null
          const destinationId = transfer.camp_destination_id
            ? String(transfer.camp_destination_id)
            : null
          if (!id || !originId || !destinationId) return null

          const origin = campById.get(originId)
          const destination = campById.get(destinationId)
          if (!origin || !destination) return null

          const type =
            transfer.type === "food" ||
            transfer.type === "fuel" ||
            transfer.type === "ammo" ||
            transfer.type === "water"
              ? transfer.type
              : "food"

          return {
            id,
            from: origin.coords,
            to: destination.coords,
            resourceType: type,
          }
        })
        .filter((item): item is TransferLine => item !== null)
    } catch (error) {
      throw normalizeError(error, "No se pudieron cargar las transferencias.")
    }
  }

  private deriveHazardAreas(camps: Camp[]): HazardArea[] {
    return camps
      .filter((camp) => camp.dangerLevel !== "low" || camp.hasAlert)
      .map((camp) => ({
        id: `hazard-${camp.id}`,
        name: `${camp.name} - Zona de Riesgo`,
        coords: camp.coords,
        dangerLevel: camp.dangerLevel,
        radius: camp.hazardRadius,
      }))
  }
}

export const campsService = new CampsService()
