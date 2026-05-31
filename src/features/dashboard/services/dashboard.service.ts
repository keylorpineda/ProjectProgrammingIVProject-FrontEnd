import type { DashboardMetrics } from "@/types/api.types"

import api from "@/config/api"

export const getDashboardMetrics = async (campId: string): Promise<DashboardMetrics> => {
  const { data } = await api.get<DashboardMetrics>(`/dashboard/${campId}`)
  return data
}
