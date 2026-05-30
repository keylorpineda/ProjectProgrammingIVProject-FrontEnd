import axios from "axios"
import { useTokenStore, useAuthStore } from "@/store/useAuthStore"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = useTokenStore.getState().getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Pages that must NOT redirect to login on 401
const PUBLIC_PATHS = ["/login", "/admissions", "/register"]

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Cookie refresh_token is sent automatically via withCredentials
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        useTokenStore.getState().setToken(data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch {
        useTokenStore.getState().setToken(null)
        useAuthStore.getState().logout()
        const isPublicPage = PUBLIC_PATHS.some((p) =>
          window.location.pathname.startsWith(p),
        )
        if (!isPublicPage) {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
