/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"

import { useTokenStore } from "@/store/useAuthStore"

// Creamos la instancia real apuntando a la URL del backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// INTERCEPTOR DE PETICIÓN (Request) - Añadir token JWT
api.interceptors.request.use((config) => {
  const token = useTokenStore.getState().getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// INTERCEPTOR DE RESPUESTA (Response) - Mapeo de Nomenclatura (DTOs)
api.interceptors.response.use(
  (response) => {
    const url = response.config.url || ""

    // 1. Mapear Personas (/users/persons)
    if (url.includes("/users/persons") && response.data?.data) {
      response.data.data = response.data.data.map((person: any) => ({
        id: person.id?.toString() || "",
        name: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
        status: person.status,
        profession: person.profession?.name || "Unknown",
        campId: person.userAccount?.camp?.id?.toString() || "1",
        skills: person.previous_skills ? person.previous_skills.split(",") : [],
        injuryDetails: person.notes || undefined,
        // Valores de consumo estandarizados (en backend está a nivel global de balance)
        dailyConsumptionFood: person.status === "active" ? 2 : 3,
        dailyConsumptionWater: person.status === "active" ? 3 : 4,
      }))
    }

    // 2. Mapear Inventario (/resources/inventory)
    if (url.includes("/resources/inventory")) {
      const mapInventoryItem = (item: any) => ({
        id: item.resource?.id?.toString() || `${item.resource_id}`,
        name: item.resource?.name || "Recurso",
        category: item.resource?.category || "Materials",
        current_stock: Number(item.current_quantity || 0),
        minimum_stock_required: Number(item.minimum_stock_required || 0),
        is_below_minimum: item.alert_active || false,
        unit: item.resource?.unit || "Unidades",
      })

      if (Array.isArray(response.data)) {
        response.data = response.data.map(mapInventoryItem)
      } else if (response.data && typeof response.data === "object" && response.data.resource) {
        // En caso de GET by ID o PATCH
        response.data = mapInventoryItem(response.data)
      }
    }

    // 3. Mapear Transferencias (/transfers/requests)
    if (url.includes("/transfers/requests")) {
      const mapTransfer = (t: any) => ({
        id: t.id?.toString() || "",
        resource_type: t.type || "Recurso",
        amount: t.resourceDetails?.[0]?.quantity || 10,
        camp_source_id: t.campOrigin?.name || `Bunker-${t.camp_origin_id || "X"}`,
        camp_destination_id: t.campDestination?.name || `Bunker-${t.camp_destination_id || "Y"}`,
        status: t.status,
        requested_at: t.request_date || new Date().toISOString(),
        notes: t.notes || "",
      })

      if (Array.isArray(response.data)) {
        response.data = response.data.map(mapTransfer)
      } else if (response.data && typeof response.data === "object" && response.data.id) {
        response.data = mapTransfer(response.data)
      }
    }

    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔴 401 No autorizado, posible expiración de token")
      // No redirigimos aquí forzosamente para no romper componentes, el hook global se encargará
    }
    return Promise.reject(error)
  },
)
