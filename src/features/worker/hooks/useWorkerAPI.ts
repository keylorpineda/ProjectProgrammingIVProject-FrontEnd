import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import workerService, { setAuthToken } from '@/features/worker/services/workerService'
import type {
  WorkerAssignedResource,
  Profession,
  Resource,
  InventoryItem,
  InventoryMovement,
  ApiError,
  ResourcesQueryParams,
} from '@/types/worker.api.types'

// Query keys factory
export const workerQueryKeys = {
  all: ['worker'] as const,
  assigned: ['worker', 'assigned-resources'] as const,
  professions: ['worker', 'professions'] as const,
  resources: ['worker', 'resources'] as const,
  resourcesWithParams: (params: ResourcesQueryParams) =>
    ['worker', 'resources', params] as const,
  inventory: (campId: string | number) => ['worker', 'inventory', campId] as const,
  movements: (campId: string | number) =>
    ['worker', 'movements', campId] as const,
}

/**
 * Hook to fetch resources assigned to the current user
 * GET /api/users/me/assigned-resources
 */
export const useAssignedResources = (): UseQueryResult<
  WorkerAssignedResource[],
  ApiError
> => {
  const { token } = useAuthStore()

  // Set token for API calls
  React.useEffect(() => {
    setAuthToken(token)
  }, [token])

  return useQuery({
    queryKey: workerQueryKeys.assigned,
    queryFn: () => workerService.getAssignedResources(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * Hook to fetch all available professions
 * GET /api/users/professions
 */
export const useProfessions = (): UseQueryResult<Profession[], ApiError> => {
  const { token } = useAuthStore()

  React.useEffect(() => {
    setAuthToken(token)
  }, [token])

  return useQuery({
    queryKey: workerQueryKeys.professions,
    queryFn: () => workerService.getProfessions(),
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  })
}

/**
 * Hook to fetch resources from catalog
 * GET /api/resources?page=1&limit=20&category=...
 */
export const useResources = (
  params: ResourcesQueryParams = { page: 1, limit: 20 }
): UseQueryResult<Resource[], ApiError> => {
  const { token } = useAuthStore()

  React.useEffect(() => {
    setAuthToken(token)
  }, [token])

  return useQuery({
    queryKey: workerQueryKeys.resourcesWithParams(params),
    queryFn: () =>
      workerService.getResources(params.page, params.limit, params.category),
    enabled: !!token,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch inventory for a specific camp
 * GET /api/resources/inventory/:campId
 */
export const useInventory = (
  campId: string | number | null | undefined
): UseQueryResult<InventoryItem[], ApiError> => {
  const { token } = useAuthStore()

  React.useEffect(() => {
    setAuthToken(token)
  }, [token])

  return useQuery({
    queryKey: workerQueryKeys.inventory(campId || ''),
    queryFn: () => {
      if (!campId) throw new Error('Camp ID is required')
      return workerService.getInventory(campId)
    },
    enabled: !!token && !!campId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch inventory movements history
 * GET /api/resources/movements/:campId?limit=50
 */
export const useInventoryMovements = (
  campId: string | number | null | undefined,
  limit: number = 50
): UseQueryResult<InventoryMovement[], ApiError> => {
  const { token } = useAuthStore()

  React.useEffect(() => {
    setAuthToken(token)
  }, [token])

  return useQuery({
    queryKey: workerQueryKeys.movements(campId || ''),
    queryFn: () => {
      if (!campId) throw new Error('Camp ID is required')
      return workerService.getInventoryMovements(campId, limit)
    },
    enabled: !!token && !!campId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  })
}

/**
 * Hook to get profession metrics for dashboard
 */
export const useProfessionMetrics = () => {
  const { data: professions, isLoading, error } = useProfessions()

  const metrics = React.useMemo(() => {
    if (!professions) return []

    return professions.map((prof) => {
      const totalPersons = prof.persons.length
      const activePersons = prof.persons.filter((p) => p.status === 'activo').length
      const status =
        activePersons >= prof.minimum_active_required
          ? 'OK'
          : activePersons === 0
            ? 'CRÍTICO'
            : 'DÉFICIT'

      return {
        id: prof.id,
        name: prof.name,
        totalPersons,
        activePersons,
        minimum: prof.minimum_active_required,
        canExplore: prof.can_explore,
        status,
        percentage: prof.minimum_active_required
          ? Math.round((activePersons / prof.minimum_active_required) * 100)
          : 100,
      }
    })
  }, [professions])

  return { metrics, isLoading, error }
}

/**
 * Hook to get inventory status for dashboard
 */
export const useInventoryStatus = (campId: string | number | null | undefined) => {
  const { data: inventory, isLoading, error } = useInventory(campId)

  const stats = React.useMemo(() => {
    if (!inventory) {
      return {
        total: 0,
        okItems: 0,
        lowItems: 0,
        criticalItems: 0,
      }
    }

    const okItems = inventory.filter(
      (item) => !item.alert_active && item.current_quantity >= item.minimum_stock_required
    ).length
    const lowItems = inventory.filter(
      (item) =>
        !item.alert_active &&
        item.current_quantity < item.minimum_stock_required &&
        item.current_quantity > 0
    ).length
    const criticalItems = inventory.filter((item) => item.alert_active).length

    return {
      total: inventory.length,
      okItems,
      lowItems,
      criticalItems,
    }
  }, [inventory])

  return { stats, isLoading, error }
}

// Re-export service helpers for direct use
export { workerService, setAuthToken }

// Utility type for component props
export type WorkerDataHooks = {
  assignedResources: ReturnType<typeof useAssignedResources>
  professions: ReturnType<typeof useProfessions>
  professionMetrics: ReturnType<typeof useProfessionMetrics>
  inventory: ReturnType<typeof useInventory>
  movements: ReturnType<typeof useInventoryMovements>
  inventoryStatus: ReturnType<typeof useInventoryStatus>
}

import React
