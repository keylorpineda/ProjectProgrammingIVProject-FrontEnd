import api from "@/config/api"
import type { AuthTokens, AuthUser } from "@/types/api.types"

export interface LoginBody {
  username: string
  password: string
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser
}

export interface RefreshResponse {
  access_token: string
}

export interface SessionStatus {
  isActive: boolean
  minutesRemaining: number
}

export const login = async (body: LoginBody): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", body)
  return data
}

export const logout = async (refresh_token?: string): Promise<void> => {
  await api.post<void>("/auth/logout", { refresh_token })
}

export const refreshAccessToken = async (refresh_token: string): Promise<RefreshResponse> => {
  const { data } = await api.post<RefreshResponse>("/auth/refresh", { refresh_token })
  return data
}

export const getSessionStatus = async (): Promise<SessionStatus> => {
  const { data } = await api.get<SessionStatus>("/auth/session-status")
  return data
}
