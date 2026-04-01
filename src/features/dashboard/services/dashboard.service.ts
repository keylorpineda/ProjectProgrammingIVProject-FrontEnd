import api from "@/config/api"
import type { DashboardMetrics } from "@/types/api.types"

export const getDashboardMetrics = async (campId: string): Promise<DashboardMetrics> => {
  const { data } = await api.get<DashboardMetrics>(`/dashboard/${campId}`)
  return data
}
