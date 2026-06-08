import type { AuthTokens, AuthUser } from "@/types/api.types"

import api from "@/config/api"

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
  lastActivity: string
  minutesUntilExpiration: number
  willExpireSoon: boolean
}

export const login = async (body: LoginBody): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", body)
  return data
}

export const logout = async (): Promise<void> => {
  await api.post<void>("/auth/logout")
}

export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const { data } = await api.post<RefreshResponse>("/auth/refresh")
  return data
}

export const getSessionStatus = async (): Promise<SessionStatus> => {
  const { data } = await api.get<SessionStatus>("/auth/session-status")
  return data
}

export interface SwitchCampBody {
  camp_id: number
}

/**
 * PATCH /auth/switch-camp — rotates the JWT so the server-side camp_id matches
 * the one the user picked. The response mirrors the login payload. Per
 * docs/MASTER_DOC.md §3.5 the frontend must fully reload context after switching.
 */
export const switchCamp = async (body: SwitchCampBody): Promise<LoginResponse> => {
  const { data } = await api.patch<LoginResponse>("/auth/switch-camp", body)
  return data
}

export interface UploadAvatarResponse {
  url: string
  publicId: string
  thumbnailUrl: string
}

export const uploadAvatarImage = async (file: File): Promise<UploadAvatarResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<UploadAvatarResponse>("/upload/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const updateMyAvatar = async (
  avatarUrl: string,
  avatarPublicId?: string,
): Promise<{ avatar_url: string; avatar_public_id: string | null }> => {
  const { data } = await api.patch<{ avatar_url: string; avatar_public_id: string | null }>(
    "/users/me/avatar",
    { avatar_url: avatarUrl, avatar_public_id: avatarPublicId },
  )
  return data
}

export const getMe = async (): Promise<{ avatar_url: string | null }> => {
  const { data } = await api.get<{ avatar_url: string | null }>("/users/me")
  return data
}
