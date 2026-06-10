import { beforeEach, describe, expect, it, vi } from "vitest"

import { uploadCampImage, uploadPersonImage } from "../upload.service"

import api from "@/config/api"

vi.mock("@/config/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

const mockedApi = api as unknown as {
  post: ReturnType<typeof vi.fn>
}

describe("upload service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uploads person images as multipart form data", async () => {
    const file = new File(["person"], "person.png", { type: "image/png" })
    mockedApi.post.mockResolvedValueOnce({
      data: { url: "person-url", publicId: "person-id", thumbnailUrl: "person-thumb" },
    })

    await expect(uploadPersonImage(file)).resolves.toEqual({
      url: "person-url",
      publicId: "person-id",
      thumbnailUrl: "person-thumb",
    })
    expect(mockedApi.post.mock.calls[0][0]).toBe("/upload/person")
    expect(mockedApi.post.mock.calls[0][1]).toBeInstanceOf(FormData)
    expect(mockedApi.post.mock.calls[0][2]).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    })
  })

  it("uploads camp images as multipart form data", async () => {
    const file = new File(["camp"], "camp.png", { type: "image/png" })
    mockedApi.post.mockResolvedValueOnce({
      data: { url: "camp-url", publicId: "camp-id", thumbnailUrl: "camp-thumb" },
    })

    await expect(uploadCampImage(file)).resolves.toEqual({
      url: "camp-url",
      publicId: "camp-id",
      thumbnailUrl: "camp-thumb",
    })
    expect(mockedApi.post.mock.calls[0][0]).toBe("/upload/camp")
    expect(mockedApi.post.mock.calls[0][1]).toBeInstanceOf(FormData)
  })
})
