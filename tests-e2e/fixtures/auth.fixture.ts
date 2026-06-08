import { test as base } from "@playwright/test"

import { mockManagerApis } from "../mocks/handlers"

export const test = base.extend({
  page: async ({ page }, use) => {
    // Log browser console to stdout for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.type()}: ${msg.text()}`))
    page.on("pageerror", (err) => console.log(`[Browser Error] ${err.message}`))

    // Inject auth state before any page loads
    await page.addInitScript(() => {
      try {
        // 1. Session Storage: Token
        const fakeJwt =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
          btoa(JSON.stringify({ exp: 32503680000 })) +
          ".signature"

        window.sessionStorage.setItem(
          "auth-token-session",
          JSON.stringify({
            state: { token: fakeJwt },
            version: 0,
          }),
        )

        // 2. Local Storage: User
        window.localStorage.setItem(
          "auth-user-storage",
          JSON.stringify({
            state: {
              user: {
                id: "1",
                name: "CommanderE2E",
                email: "e2e@doomsday.com",
                role: "admin",
                camp_id: "1",
              },
              isAuthenticated: true,
            },
            version: 0,
          }),
        )
      } catch (e) {
        // Ignore errors on about:blank or cross-origin iframes
      }
    })

    // Mock all manager APIs so the app doesn't hit a real backend
    await mockManagerApis(page)

    await use(page)
  },
})

export { expect } from "@playwright/test"
