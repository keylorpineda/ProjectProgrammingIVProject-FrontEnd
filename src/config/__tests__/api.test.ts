import { beforeEach, describe, expect, it, vi } from "vitest"

type RequestHandler = (config: { headers: Record<string, string> }) => {
  headers: Record<string, string>
}
type ResponseErrorHandler = (error: {
  config: { headers: Record<string, string>; _retry?: boolean }
  response?: { status: number }
}) => Promise<unknown>

describe("api client interceptors", () => {
  let apiInstance: ReturnType<typeof vi.fn> & {
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> }
      response: { use: ReturnType<typeof vi.fn> }
    }
  }
  let axiosPost: ReturnType<typeof vi.fn>
  let requestHandler: RequestHandler
  let responseSuccessHandler: (response: unknown) => unknown
  let responseErrorHandler: ResponseErrorHandler
  let tokenState: {
    getToken: ReturnType<typeof vi.fn>
    setToken: ReturnType<typeof vi.fn>
  }
  let authState: {
    logout: ReturnType<typeof vi.fn>
    setSessionExpired: ReturnType<typeof vi.fn>
  }

  const importClient = async () => {
    vi.resetModules()

    tokenState = {
      getToken: vi.fn(),
      setToken: vi.fn(),
    }
    authState = {
      logout: vi.fn(),
      setSessionExpired: vi.fn(),
    }
    axiosPost = vi.fn()
    apiInstance = Object.assign(vi.fn().mockResolvedValue({ data: "retried" }), {
      interceptors: {
        request: {
          use: vi.fn((handler: RequestHandler) => {
            requestHandler = handler
          }),
        },
        response: {
          use: vi.fn(
            (
              successHandler: (response: unknown) => unknown,
              errorHandler: ResponseErrorHandler,
            ) => {
              responseSuccessHandler = successHandler
              responseErrorHandler = errorHandler
            },
          ),
        },
      },
    })

    vi.doMock("axios", () => ({
      default: {
        create: vi.fn(() => apiInstance),
        post: axiosPost,
      },
    }))
    vi.doMock("@/store/useAuthStore", () => ({
      useTokenStore: { getState: () => tokenState },
      useAuthStore: { getState: () => authState },
    }))

    await import("../api")
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, "", "/dashboard")
  })

  it("adds authorization header when a token exists", async () => {
    await importClient()
    tokenState.getToken.mockReturnValue("token-1")

    const config = requestHandler({ headers: {} })

    expect(config.headers.Authorization).toBe("Bearer token-1")
  })

  it("leaves request headers unchanged when token is missing", async () => {
    await importClient()
    tokenState.getToken.mockReturnValue(null)

    const config = requestHandler({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })

  it("returns successful responses unchanged", async () => {
    await importClient()
    const response = { data: "ok" }

    expect(responseSuccessHandler(response)).toBe(response)
  })

  it("refreshes an expired token and retries the original request", async () => {
    await importClient()
    axiosPost.mockResolvedValueOnce({ data: { access_token: "fresh-token" } })
    const originalRequest: { headers: Record<string, string> } = { headers: {} }

    await expect(
      responseErrorHandler({ config: originalRequest, response: { status: 401 } }),
    ).resolves.toEqual({ data: "retried" })

    expect(axiosPost.mock.calls[0][0]).toMatch(/\/auth\/refresh$/)
    expect(axiosPost.mock.calls[0][1]).toEqual({})
    expect(axiosPost.mock.calls[0][2]).toEqual({ withCredentials: true })
    expect(tokenState.setToken).toHaveBeenCalledWith("fresh-token")
    expect(originalRequest.headers.Authorization).toBe("Bearer fresh-token")
    expect(apiInstance).toHaveBeenCalledWith(originalRequest)
  })

  it("queues failed requests while a token refresh is already running", async () => {
    await importClient()
    let resolveRefresh: (value: unknown) => void = () => {}
    axiosPost.mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)))
    const firstRequest: { headers: Record<string, string> } = { headers: {} }
    const secondRequest: { headers: Record<string, string> } = { headers: {} }

    const firstPromise = responseErrorHandler({
      config: firstRequest,
      response: { status: 401 },
    })
    const secondPromise = responseErrorHandler({
      config: secondRequest,
      response: { status: 401 },
    })

    resolveRefresh({ data: { access_token: "queued-token" } })

    await Promise.all([firstPromise, secondPromise])

    expect(secondRequest.headers.Authorization).toBe("Bearer queued-token")
    expect(apiInstance).toHaveBeenCalledWith(secondRequest)
  })

  it("logs out and marks session expired when refresh fails on private pages", async () => {
    await importClient()
    const refreshError = new Error("refresh failed")
    axiosPost.mockRejectedValueOnce(refreshError)

    await expect(
      responseErrorHandler({ config: { headers: {} }, response: { status: 401 } }),
    ).rejects.toThrow("refresh failed")

    expect(tokenState.setToken).toHaveBeenCalledWith(null)
    expect(authState.logout).toHaveBeenCalled()
    expect(authState.setSessionExpired).toHaveBeenCalledWith(true)
  })

  it("does not mark session expired when refresh fails on public pages", async () => {
    window.history.pushState({}, "", "/login")
    await importClient()
    axiosPost.mockRejectedValueOnce(new Error("refresh failed"))

    await expect(
      responseErrorHandler({ config: { headers: {} }, response: { status: 401 } }),
    ).rejects.toThrow("refresh failed")

    expect(authState.setSessionExpired).not.toHaveBeenCalled()
  })

  it("rejects non-refreshable errors", async () => {
    await importClient()
    const error = { config: { headers: {}, _retry: true }, response: { status: 401 } }

    await expect(responseErrorHandler(error)).rejects.toBe(error)
  })
})
