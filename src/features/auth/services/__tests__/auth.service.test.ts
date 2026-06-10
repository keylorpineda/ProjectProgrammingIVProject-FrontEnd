import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getMe,
  getSessionStatus,
  login,
  logout,
  refreshAccessToken,
  switchCamp,
  updateMyAvatar,
  uploadAvatarImage,
} from "../auth.service"

import api from "@/config/api"
import { adminUser } from "@/test/fixtures"

vi.mock("@/config/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("logs in and returns the response data", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { access_token: "tk", user: adminUser } })

    await expect(login({ username: "admin", password: "pw" })).resolves.toEqual({
      access_token: "tk",
      user: adminUser,
    })
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", {
      username: "admin",
      password: "pw",
    })
  })

  it("calls logout and refresh endpoints", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: undefined })
    await logout()
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout")

    mockedApi.post.mockResolvedValueOnce({ data: { access_token: "fresh" } })
    await expect(refreshAccessToken()).resolves.toEqual({ access_token: "fresh" })
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/refresh")
  })

  it("gets session status and switches camp", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        isActive: true,
        lastActivity: "now",
        minutesUntilExpiration: 10,
        willExpireSoon: false,
      },
    })
    await expect(getSessionStatus()).resolves.toMatchObject({ isActive: true })
    expect(mockedApi.get).toHaveBeenCalledWith("/auth/session-status")

    mockedApi.patch.mockResolvedValueOnce({ data: { access_token: "camp", user: adminUser } })
    await expect(switchCamp({ camp_id: 2 })).resolves.toMatchObject({ access_token: "camp" })
    expect(mockedApi.patch).toHaveBeenCalledWith("/auth/switch-camp", { camp_id: 2 })
  })

  it("uploads and updates avatar data", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })
    mockedApi.post.mockResolvedValueOnce({
      data: { url: "url", publicId: "public", thumbnailUrl: "thumb" },
    })

    await expect(uploadAvatarImage(file)).resolves.toEqual({
      url: "url",
      publicId: "public",
      thumbnailUrl: "thumb",
    })
    expect(mockedApi.post.mock.calls.at(-1)?.[0]).toBe("/upload/avatar")
    expect(mockedApi.post.mock.calls.at(-1)?.[2]).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    })

    mockedApi.patch.mockResolvedValueOnce({
      data: { avatar_url: "url", avatar_public_id: "public" },
    })
    await expect(updateMyAvatar("url", "public")).resolves.toEqual({
      avatar_url: "url",
      avatar_public_id: "public",
    })
    expect(mockedApi.patch).toHaveBeenCalledWith("/users/me/avatar", {
      avatar_url: "url",
      avatar_public_id: "public",
    })
  })

  it("gets current user avatar data", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { avatar_url: null } })

    await expect(getMe()).resolves.toEqual({ avatar_url: null })
    expect(mockedApi.get).toHaveBeenCalledWith("/users/me")
  })
})
