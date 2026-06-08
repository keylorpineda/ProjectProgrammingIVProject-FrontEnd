/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import userEventLib from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"

import { adminUser } from "./fixtures"

import type { AuthUser } from "@/types/api.types"
import type { RenderOptions, RenderResult } from "@testing-library/react"
import type * as React from "react"

import { AuthProvider as AdminAuthProvider } from "@/pages/Admin/context/AuthContext"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  })

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string
  user?: AuthUser | null
  token?: string | null
  queryClient?: QueryClient
  withAdminAuthProvider?: boolean
}

/**
 * Renders a component with QueryClient + MemoryRouter + (optionally) the Admin
 * AuthProvider mounted. Seeds the zustand stores so route guards see the user.
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult & { queryClient: QueryClient } => {
  const {
    route = "/",
    user = null,
    token = null,
    queryClient: existing,
    withAdminAuthProvider = true,
    ...rest
  } = options
  const queryClient = existing ?? makeQueryClient()

  useTokenStore.getState().setToken(token)
  if (user) {
    useAuthStore.getState().setAuth(token ?? "fake-token", user)
  } else {
    useAuthStore.getState().logout()
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {withAdminAuthProvider ? <AdminAuthProvider>{children}</AdminAuthProvider> : children}
      </MemoryRouter>
    </QueryClientProvider>
  )

  const utils = render(ui, { wrapper: Wrapper, ...rest })
  return { ...utils, queryClient }
}

export const loginAsAdmin = () => {
  useTokenStore.getState().setToken("fake-admin-token")
  useAuthStore.getState().setAuth("fake-admin-token", adminUser)
}

export const logoutCompletely = () => {
  useTokenStore.getState().setToken(null)
  useAuthStore.getState().logout()
}

export * from "@testing-library/react"
export const userEvent = userEventLib
