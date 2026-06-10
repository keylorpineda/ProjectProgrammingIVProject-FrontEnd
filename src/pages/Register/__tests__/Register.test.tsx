import { screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, campLeaderUser, workerUser } from "../../../test/fixtures"
import { renderWithProviders, userEvent } from "../../../test/test-utils"
import Register from "../Register"

import type * as ReactRouterDom from "react-router-dom"

import { completeRegistration } from "@/features/admissions/services/admissions.service"
import { login as loginService } from "@/features/auth/services/auth.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/admissions/services/admissions.service", () => ({
  completeRegistration: vi.fn(),
  submitAdmission: vi.fn(),
}))

vi.mock("@/features/auth/services/auth.service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getSessionStatus: vi.fn(),
  switchCamp: vi.fn(),
}))

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom")
  return { ...actual, useNavigate: () => navigateMock }
})

const mockedComplete = completeRegistration as ReturnType<typeof vi.fn>
const mockedLogin = loginService as ReturnType<typeof vi.fn>

const renderRegister = (token = "valid-token") =>
  renderWithProviders(<Register />, {
    route: `/register?token=${token}`,
    withAdminAuthProvider: false,
  })

const enableForm = async () => {
  await waitFor(() => expect(screen.getByLabelText(/nombre en código/i)).not.toBeDisabled(), {
    timeout: 1000,
  })
}

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>, u: string, p: string) => {
  await user.type(screen.getByLabelText(/nombre en código/i), u)
  await user.type(screen.getByLabelText(/nueva clave/i), p)
}

describe("Register page", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    navigateMock.mockClear()
    mockedComplete.mockReset()
    mockedLogin.mockReset()
  })

  describe("token guard", () => {
    it("redirects to /admissions/new when no token is present in the URL", () => {
      renderRegister("")
      expect(navigateMock).toHaveBeenCalledWith("/admissions/new", { replace: true })
    })

    it("renders the registration form when a token is present", async () => {
      renderRegister("valid-token")
      await enableForm()
      expect(screen.getByLabelText(/nombre en código/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nueva clave/i)).toBeInTheDocument()
    })
  })

  describe("rendering", () => {
    it("renders NOMBRE EN CÓDIGO, NUEVA CLAVE inputs and the submit button", async () => {
      renderRegister()
      await enableForm()
      expect(screen.getByLabelText(/nombre en código/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nueva clave/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /establecer identidad/i })).toBeInTheDocument()
    })

    it("disables the form until the badge finishes hanging (300ms)", async () => {
      renderRegister()
      expect(screen.getByLabelText(/nombre en código/i)).toBeDisabled()
      await enableForm()
      expect(screen.getByLabelText(/nombre en código/i)).not.toBeDisabled()
    })
  })

  describe("client-side validation", () => {
    it("does not call any service when both fields are empty", async () => {
      const user = userEvent.setup()
      renderRegister()
      await enableForm()
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      expect(mockedComplete).not.toHaveBeenCalled()
      expect(mockedLogin).not.toHaveBeenCalled()
    })

    it("does not call any service when username is empty", async () => {
      const user = userEvent.setup()
      renderRegister()
      await enableForm()
      await user.type(screen.getByLabelText(/nueva clave/i), "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      expect(mockedComplete).not.toHaveBeenCalled()
    })

    it("does not call any service when password is empty", async () => {
      const user = userEvent.setup()
      renderRegister()
      await enableForm()
      await user.type(screen.getByLabelText(/nombre en código/i), "survivor")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      expect(mockedComplete).not.toHaveBeenCalled()
    })

    it("calls completeRegistration with valid credentials", async () => {
      const user = userEvent.setup()
      mockedComplete.mockResolvedValueOnce({})
      mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: workerUser })
      renderRegister("abc123")
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      await waitFor(() => expect(mockedComplete).toHaveBeenCalledTimes(1))
      expect(mockedComplete).toHaveBeenCalledWith({
        token: "abc123",
        username: "survivor",
        password: "mypassword",
        email: "",
      })
    })
  })

  describe("submission", () => {
    it("stores the token + user in zustand on successful registration", async () => {
      const user = userEvent.setup()
      mockedComplete.mockResolvedValueOnce({})
      mockedLogin.mockResolvedValueOnce({ access_token: "reg-token", user: workerUser })
      renderRegister()
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))

      await waitFor(() => {
        expect(useTokenStore.getState().getToken()).toBe("reg-token")
      })
      expect(useAuthStore.getState().user?.role).toBe("worker")
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it("navigates to /worker after successful worker registration", async () => {
      const user = userEvent.setup()
      mockedComplete.mockResolvedValueOnce({})
      mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: workerUser })
      renderRegister()
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/worker"), { timeout: 6000 })
    }, 10000)

    it.each([
      ["admin", adminUser, "/admin/dashboard"],
      ["worker", workerUser, "/worker"],
      ["camp_leader", campLeaderUser, "/campleader"],
    ])(
      "routes %s to %s after registration",
      async (_label, loggedUser, expectedRoute) => {
        const user = userEvent.setup()
        mockedComplete.mockResolvedValueOnce({})
        mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: loggedUser })
        renderRegister()
        await enableForm()
        await fillCredentials(user, "u", "mypassword")
        await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expectedRoute), {
          timeout: 9000,
        })
      },
      12000,
    )

    it("logs out and shows denied state when registered role has no routed destination", async () => {
      const user = userEvent.setup()
      mockedComplete.mockResolvedValueOnce({})
      mockedLogin.mockResolvedValueOnce({
        access_token: "tk",
        user: { ...adminUser, role: "resource_manager" },
      })
      renderRegister()
      await enableForm()
      await fillCredentials(user, "u", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
      })
      expect(await screen.findByText(/denegado/i)).toBeInTheDocument()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("shows DENEGADO when completeRegistration rejects", async () => {
      const user = userEvent.setup()
      mockedComplete.mockRejectedValueOnce(new Error("token inválido"))
      renderRegister()
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      expect(await screen.findByText(/denegado/i)).toBeInTheDocument()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("shows DENEGADO when the auto-login after registration rejects", async () => {
      const user = userEvent.setup()
      mockedComplete.mockResolvedValueOnce({})
      mockedLogin.mockRejectedValueOnce(new Error("401"))
      renderRegister()
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))
      expect(await screen.findByText(/denegado/i)).toBeInTheDocument()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("shows VERIFICANDO... and disables inputs while processing", async () => {
      const user = userEvent.setup()
      let resolve: (v: unknown) => void = () => {}
      mockedComplete.mockImplementationOnce(() => new Promise((res) => (resolve = res)))
      renderRegister()
      await enableForm()
      await fillCredentials(user, "survivor", "mypassword")
      await user.click(screen.getByRole("button", { name: /establecer identidad/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre en código/i)).toBeDisabled()
      })
      expect(screen.getByRole("button", { name: /verificando/i })).toBeInTheDocument()

      resolve({})
      mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: workerUser })
    })
  })

  describe("background motion", () => {
    it("updates motion values on mousemove through requestAnimationFrame", () => {
      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 })
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 })
      const requestSpy = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback) => {
          callback(1)
          return 1
        })

      renderRegister()
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 900, clientY: 150 }))

      expect(requestSpy).toHaveBeenCalledTimes(1)

      requestSpy.mockRestore()
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth })
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      })
    })

    it("ignores mousemove while a frame is pending and cancels it on unmount", () => {
      const requestSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(77)
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})

      const { unmount } = renderRegister()
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 10, clientY: 10 }))
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 20, clientY: 20 }))
      unmount()

      expect(requestSpy).toHaveBeenCalledTimes(1)
      expect(cancelSpy).toHaveBeenCalledWith(77)

      requestSpy.mockRestore()
      cancelSpy.mockRestore()
    })
  })
})
