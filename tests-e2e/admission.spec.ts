import { expect, test } from "@playwright/test"

import type { Page } from "@playwright/test"

// ─── API stubs ────────────────────────────────────────────────────────────────

const SUCCESS_RESPONSE = {
  id: "adm-1",
  tracking_code: "TRK-E2E-001",
  status: "pending",
  suggested_decision: "approved",
  score: 88,
}

async function stubApis(page: Page) {
  // Image upload
  await page.route("**/upload/**", (route) =>
    route.fulfill({ status: 200, json: { url: "https://cdn.example.com/test.jpg" } }),
  )
  // Admission submission
  await page.route("**/admissions**", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({ status: 201, json: SUCCESS_RESPONSE })
    }
    return route.continue()
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gotoAdmissionForm(page: Page) {
  await page.goto("/admissions/new")
  // Click through the post-apocalyptic intro overlay to reveal the form
  await page.getByRole("button", { name: /sistema en espera/i }).click()
  // Wait for the form animation to settle
  await page.getByRole("button", { name: /guardar solicitud/i }).waitFor({ state: "visible" })
}

async function fillValidForm(page: Page) {
  await page.getByLabel(/nombre completo/i).fill("Joel Miller")
  await page.getByLabel(/metodo de contacto/i).fill("joel@example.com")
  await page.getByLabel(/cedula/i).fill("123456789")
  await page.getByLabel(/edad/i).fill("35")
  await page.getByLabel(/salud \(detalles\)/i).fill("Sin dolencias conocidas")
  await page.getByLabel(/condicion fisica \(detalles\)/i).fill("Excelente condicion fisica")
  await page.getByLabel(/habilidades/i).fill("medicina, seguridad, exploración")

  // Attach a minimal valid image
  const photoInput = page.locator("#foto")
  await photoInput.setInputFiles({
    name: "photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("JFIF"),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Admission registration — form validation", () => {
  test("shows validation errors for all required fields on empty submit", async ({ page }) => {
    await gotoAdmissionForm(page)

    await page.getByRole("button", { name: /guardar solicitud/i }).click()

    // Global banner
    await expect(page.getByText(/revisa los campos marcados antes de continuar/i)).toBeVisible()

    // Per-field errors
    await expect(page.getByText("El nombre es obligatorio")).toBeVisible()
    await expect(page.getByText("La edad es obligatoria")).toBeVisible()
    await expect(page.getByText("La cedula es obligatoria")).toBeVisible()
    await expect(page.getByText("El correo de contacto es obligatorio")).toBeVisible()
    await expect(page.getByText("La salud es obligatoria")).toBeVisible()
    await expect(page.getByText("La condicion fisica es obligatoria")).toBeVisible()
    await expect(page.getByText("Las habilidades son obligatorias")).toBeVisible()
    await expect(page.getByText("La foto es obligatoria")).toBeVisible()
  })

  test.describe("cedula field", () => {
    test("shows 'La cedula es obligatoria' when left empty", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("La cedula es obligatoria")).toBeVisible()
    })

    test("shows length error for fewer than 9 digits", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByLabel(/cedula/i).fill("12345678")
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("La cedula debe tener entre 9 y 20 digitos")).toBeVisible()
    })

    test("shows length error for more than 20 digits", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByLabel(/cedula/i).fill("123456789012345678901") // 21 digits
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("La cedula debe tener entre 9 y 20 digitos")).toBeVisible()
    })

    test("accepts exactly 9 digits and shows no cedula error", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByLabel(/cedula/i).fill("123456789")
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("La cedula es obligatoria")).not.toBeVisible()
      await expect(page.getByText("La cedula debe tener entre 9 y 20 digitos")).not.toBeVisible()
    })

    test("strips non-numeric characters from cedula input", async ({ page }) => {
      await gotoAdmissionForm(page)
      const input = page.getByLabel(/cedula/i)
      await input.fill("1-2-3-4-5-6-7-8-9")
      await expect(input).toHaveValue("123456789")
    })
  })

  test.describe("email field", () => {
    test("shows format error for a malformed email", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByLabel(/metodo de contacto/i).fill("notanemail")
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("El formato de correo es invalido")).toBeVisible()
    })

    test("accepts a valid email and shows no email error", async ({ page }) => {
      await gotoAdmissionForm(page)
      await page.getByLabel(/metodo de contacto/i).fill("survivor@qz.com")
      await page.getByRole("button", { name: /guardar solicitud/i }).click()
      await expect(page.getByText("El correo de contacto es obligatorio")).not.toBeVisible()
      await expect(page.getByText("El formato de correo es invalido")).not.toBeVisible()
    })
  })

  test("error clears immediately when the user edits the invalid field", async ({ page }) => {
    await gotoAdmissionForm(page)
    await page.getByRole("button", { name: /guardar solicitud/i }).click()
    await expect(page.getByText("El nombre es obligatorio")).toBeVisible()

    await page.getByLabel(/nombre completo/i).fill("J")
    await expect(page.getByText("El nombre es obligatorio")).not.toBeVisible()
  })
})

test.describe("Admission registration — successful submission", () => {
  test("shows tracking code and EVALUACION REGISTRADA after a valid submission", async ({
    page,
  }) => {
    await stubApis(page)
    await gotoAdmissionForm(page)
    await fillValidForm(page)

    await page.getByRole("button", { name: /guardar solicitud/i }).click()

    await expect(page.getByText("EVALUACION REGISTRADA.")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("TRK-E2E-001")).toBeVisible()
  })
})
