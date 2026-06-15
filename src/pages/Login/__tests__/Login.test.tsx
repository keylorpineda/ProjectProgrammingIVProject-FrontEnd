import { screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, campLeaderUser, workerUser } from "../../../test/fixtures"
import { renderWithProviders, userEvent } from "../../../test/test-utils"
import Login from "../Login"

import type * as ReactRouterDom from "react-router-dom"

import { login as loginService } from "@/features/auth/services/auth.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

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

const mockedLogin = loginService as unknown as ReturnType<typeof vi.fn>

const renderLogin = () =>
  renderWithProviders(<Login />, { route: "/login", withAdminAuthProvider: false })

/** Waits for the badge "hanging" effect (300ms) that enables the inputs. */
const enableForm = async () => {
  await waitFor(() => expect(screen.getByLabelText(/usuario/i)).not.toBeDisabled(), {
    timeout: 1000,
  })
}

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>, u: string, p: string) => {
  await user.type(screen.getByLabelText(/usuario/i), u)
  await user.type(screen.getByLabelText(/contraseña/i), p)
}

describe("Login page", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken(null)
    useAuthStore.getState().logout()
    navigateMock.mockClear()
    mockedLogin.mockReset()
  })

  describe("rendering", () => {
    it("renders the login form with USUARIO and CONTRASEÑA inputs", () => {
      renderLogin()
      expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument()
    })

    it("disables the form until the badge finishes hanging (300ms)", async () => {
      renderLogin()
      const usernameInput = screen.getByLabelText(/usuario/i)
      expect(usernameInput).toBeDisabled()
      await enableForm()
      expect(usernameInput).not.toBeDisabled()
    })

    it("shows the 'UNIRSE A UN CAMPAMENTO' secondary action", () => {
      renderLogin()
      expect(screen.getByRole("button", { name: /unirse a un campamento/i })).toBeInTheDocument()
    })
  })

  describe("client-side validation", () => {
    it("does not call the login service when both fields are empty", async () => {
      const user = userEvent.setup()
      renderLogin()
      await enableForm()
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      expect(mockedLogin).not.toHaveBeenCalled()
    })

    it("does not call the login service when password is shorter than 6 chars", async () => {
      const user = userEvent.setup()
      renderLogin()
      await enableForm()
      await fillCredentials(user, "admin", "12345")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      expect(mockedLogin).not.toHaveBeenCalled()
    })

    it("accepts username + 6+ char password", async () => {
      const user = userEvent.setup()
      mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: adminUser })
      renderLogin()
      await enableForm()
      await fillCredentials(user, "admin", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      await waitFor(() => expect(mockedLogin).toHaveBeenCalledTimes(1))
      expect(mockedLogin).toHaveBeenCalledWith({ username: "admin", password: "123456" })
    })
  })

  describe("submission", () => {
    it("stores the token + user in zustand on successful admin login", async () => {
      const user = userEvent.setup()
      mockedLogin.mockResolvedValueOnce({ access_token: "admin-token", user: adminUser })
      renderLogin()
      await enableForm()
      await fillCredentials(user, "admin", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(useTokenStore.getState().getToken()).toBe("admin-token")
      })
      expect(useAuthStore.getState().user?.role).toBe("admin")
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it("navigates to /admin/camp after admin login completes", async () => {
      const user = userEvent.setup()
      mockedLogin.mockResolvedValueOnce({ access_token: "admin-token", user: adminUser })
      renderLogin()
      await enableForm()
      await fillCredentials(user, "admin", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      // finalizeLogin holds on the card, the door opens and a hand drags it off;
      // navigate fires at ~5.6s, so allow generous margin.
      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/admin/camp"), {
        timeout: 12000,
      })
    }, 15000)

    // NOTE: Login.tsx routes `resource_manager` to /camp-manager but NOT
    // `camp_manager`. CampManagerGuard accepts both, so logging in as
    // `camp_manager` ends up on the "denied" branch (regression below).
    it.each([
      ["worker", workerUser, "/worker"],
      ["camp_leader", campLeaderUser, "/campleader"],
      ["resource_manager", { ...adminUser, role: "resource_manager" }, "/camp-manager"],
      ["travel_manager", { ...adminUser, role: "travel_manager" }, "/travel-manager"],
    ])(
      "routes %s to %s after login",
      async (_label, loggedUser, expectedRoute) => {
        const user = userEvent.setup()
        mockedLogin.mockResolvedValueOnce({ access_token: "tk", user: loggedUser })
        renderLogin()
        await enableForm()
        await fillCredentials(user, "u", "123456")
        await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expectedRoute), {
          timeout: 12000,
        })
      },
      15000,
    )

    it("[REGRESSION] camp_manager role currently falls through to 'denied'", async () => {
      const user = userEvent.setup()
      mockedLogin.mockResolvedValueOnce({
        access_token: "tk",
        user: { ...adminUser, role: "camp_manager" },
      })
      renderLogin()
      await enableForm()
      await fillCredentials(user, "u", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
      })
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("logs out and shows denied state when role has no routed destination", async () => {
      const user = userEvent.setup()
      mockedLogin.mockResolvedValueOnce({
        access_token: "tk",
        user: { ...adminUser, role: "ghost" },
      })
      renderLogin()
      await enableForm()
      await fillCredentials(user, "u", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
      })
      expect(await screen.findByText(/denegado/i)).toBeInTheDocument()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("shows DENEGADO when the login service rejects (401)", async () => {
      const user = userEvent.setup()
      mockedLogin.mockRejectedValueOnce(new Error("401"))
      renderLogin()
      await enableForm()
      await fillCredentials(user, "wrong", "wrongpass")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
      expect(await screen.findByText(/denegado/i)).toBeInTheDocument()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it("disables inputs while processing", async () => {
      const user = userEvent.setup()
      let resolveLogin: (v: unknown) => void = () => {}
      mockedLogin.mockImplementationOnce(() => new Promise((res) => (resolveLogin = res)))
      renderLogin()
      await enableForm()
      await fillCredentials(user, "admin", "123456")
      await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/usuario/i)).toBeDisabled()
      })
      expect(screen.getByRole("button", { name: /procesando/i })).toBeInTheDocument()

      resolveLogin({ access_token: "tk", user: adminUser })
    })
  })

  describe("navigation to admissions", () => {
    it("navigates to /admissions/new when clicking 'UNIRSE A UN CAMPAMENTO'", async () => {
      const user = userEvent.setup()
      renderLogin()
      await enableForm()
      await user.click(screen.getByRole("button", { name: /unirse a un campamento/i }))
      expect(navigateMock).toHaveBeenCalledWith("/admissions/new")
    })
  })

  describe("background motion", () => {
    it("updates motion values on mousemove through requestAnimationFrame", () => {
      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 })
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 500 })
      const requestSpy = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback) => {
          callback(1)
          return 1
        })

      renderLogin()
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 750, clientY: 125 }))

      expect(requestSpy).toHaveBeenCalledTimes(1)

      requestSpy.mockRestore()
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth })
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      })
    })

    it("ignores mousemove while a frame is pending and cancels it on unmount", () => {
      const requestSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(99)
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})

      const { unmount } = renderLogin()
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 10, clientY: 10 }))
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 20, clientY: 20 }))
      unmount()

      expect(requestSpy).toHaveBeenCalledTimes(1)
      expect(cancelSpy).toHaveBeenCalledWith(99)

      requestSpy.mockRestore()
      cancelSpy.mockRestore()
    })
  })

  describe("password visibility toggle", () => {
    it("password field is type=password by default", async () => {
      renderLogin()
      await enableForm()
      expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute("type", "password")
    })

    it("reveals password text when the toggle button is clicked", async () => {
      const user = userEvent.setup()
      renderLogin()
      await enableForm()
      const toggleBtn = screen
        .getAllByRole("button")
        .find((btn) => !btn.textContent?.match(/iniciar|unirse/i))
      expect(toggleBtn).toBeDefined()
      await user.click(toggleBtn!)
      expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute("type", "text")
    })

    it("hides password again when the toggle is clicked a second time", async () => {
      const user = userEvent.setup()
      renderLogin()
      await enableForm()
      const toggleBtn = screen
        .getAllByRole("button")
        .find((btn) => !btn.textContent?.match(/iniciar|unirse/i))!
      await user.click(toggleBtn)
      await user.click(toggleBtn)
      expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute("type", "password")
    })
  })
})
