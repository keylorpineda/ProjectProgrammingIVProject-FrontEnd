import api from "@/config/api"

export interface UploadResult {
  url: string
  publicId: string
  thumbnailUrl: string
}

export const uploadPersonImage = async (file: File): Promise<UploadResult> => {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post<UploadResult>("/upload/person", form)
  return data
}

export const uploadCampImage = async (file: File): Promise<UploadResult> => {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post<UploadResult>("/upload/camp", form)
  return data
}
