import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth-token") ??
    (() => {
      try {
        const raw = localStorage.getItem("auth-storage")
        if (!raw) return null
        return JSON.parse(raw)?.state?.token ?? null
      } catch {
        return null
      }
    })()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Páginas que NO deben redirigir al login aunque reciban un 401
const PUBLIC_PATHS = ["/login", "/admissions", "/register"]

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isPublicPage = PUBLIC_PATHS.some((p) =>
        window.location.pathname.startsWith(p),
      )
      if (!isPublicPage) {
        localStorage.clear()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default api
