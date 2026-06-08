import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders, userEvent } from "../../../test/test-utils"
import AdmissionNew from "../AdmissionNew"

// ─── Service mocks ────────────────────────────────────────────────────────────

vi.mock("@/features/admissions/services/admissions.service", () => ({
  submitAdmission: vi.fn(),
}))

vi.mock("@/features/upload/services/upload.service", () => ({
  uploadPersonImage: vi.fn(),
}))

import { submitAdmission } from "@/features/admissions/services/admissions.service"
import { uploadPersonImage } from "@/features/upload/services/upload.service"

const mockedSubmit = submitAdmission as ReturnType<typeof vi.fn>
const mockedUpload = uploadPersonImage as ReturnType<typeof vi.fn>

// ─── JSDOM shims for File/Blob APIs used by compressImage ─────────────────────

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:mock")
  global.URL.revokeObjectURL = vi.fn()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderForm = () =>
  renderWithProviders(<AdmissionNew />, {
    route: "/admissions/new",
    withAdminAuthProvider: false,
  })

const makePhoto = () => new File(["pixel"], "photo.jpg", { type: "image/jpeg" })

/** Fires the form submit event directly, bypassing HTML5 pointer-event delivery. */
const submitForm = () => {
  const form = document.querySelector("form.form-content") as HTMLFormElement
  fireEvent.submit(form)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AdmissionNew — rendering", () => {
  it("renders all required fields and the submit button", () => {
    renderForm()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/metodo de contacto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cedula/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/edad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/salud \(detalles\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/condicion fisica \(detalles\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/habilidades/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /guardar solicitud/i })).toBeInTheDocument()
  })
})

describe("AdmissionNew — validation on submit", () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
    mockedUpload.mockReset()
  })

  it("shows all required-field errors and a global banner when the form is empty", async () => {
    renderForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument()
    })
    expect(screen.getByText("La edad es obligatoria")).toBeInTheDocument()
    expect(screen.getByText("La cedula es obligatoria")).toBeInTheDocument()
    expect(screen.getByText("El correo de contacto es obligatorio")).toBeInTheDocument()
    expect(screen.getByText("La salud es obligatoria")).toBeInTheDocument()
    expect(screen.getByText("La condicion fisica es obligatoria")).toBeInTheDocument()
    expect(screen.getByText("Las habilidades son obligatorias")).toBeInTheDocument()
    expect(screen.getByText("La foto es obligatoria")).toBeInTheDocument()
    expect(screen.getByText(/revisa los campos marcados antes de continuar/i)).toBeInTheDocument()

    expect(mockedSubmit).not.toHaveBeenCalled()
  })

  it("does not call the submission service when validation fails", async () => {
    renderForm()
    submitForm()
    await waitFor(() => {
      expect(screen.getByText(/revisa los campos marcados/i)).toBeInTheDocument()
    })
    expect(mockedSubmit).not.toHaveBeenCalled()
  })
})

describe("AdmissionNew — cedula validation", () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
    mockedUpload.mockReset()
  })

  it("shows 'La cedula es obligatoria' when the field is left blank", async () => {
    renderForm()
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("La cedula es obligatoria")).toBeInTheDocument()
    })
  })

  it("shows length error for fewer than 9 digits", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/cedula/i), "12345678") // 8 digits
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("La cedula debe tener entre 9 y 20 digitos")).toBeInTheDocument()
    })
  })

  it("accepts a valid 9-digit cedula (no cedula error)", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/cedula/i), "123456789")
    submitForm()
    await waitFor(() => {
      expect(screen.queryByText("La cedula es obligatoria")).not.toBeInTheDocument()
      expect(
        screen.queryByText("La cedula debe tener entre 9 y 20 digitos"),
      ).not.toBeInTheDocument()
    })
  })

  it("strips non-numeric characters from cedula input", async () => {
    const user = userEvent.setup()
    renderForm()
    const input = screen.getByLabelText(/cedula/i)
    await user.type(input, "1-2-3-4-5-6-7-8-9")
    expect(input).toHaveValue("123456789")
  })
})

describe("AdmissionNew — email validation", () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
  })

  it("shows 'El correo de contacto es obligatorio' for an empty email field", async () => {
    renderForm()
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("El correo de contacto es obligatorio")).toBeInTheDocument()
    })
  })

  it("shows invalid-format error for a malformed email", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/metodo de contacto/i), "notanemail")
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("El formato de correo es invalido")).toBeInTheDocument()
    })
  })

  it("accepts a well-formed email address (no email error)", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/metodo de contacto/i), "joel@example.com")
    submitForm()
    await waitFor(() => {
      expect(screen.queryByText("El correo de contacto es obligatorio")).not.toBeInTheDocument()
      expect(screen.queryByText("El formato de correo es invalido")).not.toBeInTheDocument()
    })
  })
})

describe("AdmissionNew — error clearing on user interaction", () => {
  it("clears the nombre error as soon as the user types in the field", async () => {
    const user = userEvent.setup()
    renderForm()

    submitForm()
    await waitFor(() => {
      expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nombre completo/i), "J")
    await waitFor(() => {
      expect(screen.queryByText("El nombre es obligatorio")).not.toBeInTheDocument()
    })
  })

  it("clears the cedula error as soon as the user types in the field", async () => {
    const user = userEvent.setup()
    renderForm()

    submitForm()
    await waitFor(() => {
      expect(screen.getByText("La cedula es obligatoria")).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/cedula/i), "1")
    await waitFor(() => {
      expect(screen.queryByText("La cedula es obligatoria")).not.toBeInTheDocument()
    })
  })
})

describe("AdmissionNew — successful submission", () => {
  beforeEach(() => {
    mockedUpload.mockResolvedValue({ url: "https://cdn.example.com/photo.jpg" })
    mockedSubmit.mockResolvedValue({
      tracking_code: "TRK-2026-001",
      suggested_decision: "approved",
      score: 85,
      status: "pending",
    })

    // compressImage creates a native Image element and waits for onload/onerror.
    // jsdom cannot load blob URLs, so we stub Image to immediately fire onerror,
    // causing compressImage to resolve with the original file.
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        width = 0
        height = 0
        set src(_url: string) {
          setTimeout(() => this.onerror?.(), 0)
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const fillAllFields = async (
    user: ReturnType<typeof userEvent.setup>,
    name: string,
    email: string,
  ) => {
    await user.type(screen.getByLabelText(/nombre completo/i), name)
    await user.type(screen.getByLabelText(/metodo de contacto/i), email)
    await user.type(screen.getByLabelText(/cedula/i), "123456789")
    await user.type(screen.getByLabelText(/edad/i), "35")
    await user.type(screen.getByLabelText(/salud \(detalles\)/i), "Buena salud")
    await user.type(screen.getByLabelText(/condicion fisica \(detalles\)/i), "Excelente")
    await user.type(screen.getByLabelText(/habilidades/i), "medicina, seguridad")
    const fileInput = document.getElementById("foto") as HTMLInputElement
    await user.upload(fileInput, makePhoto())
  }

  it("shows the success state and tracking code after a valid submission", async () => {
    const user = userEvent.setup()
    renderForm()

    await fillAllFields(user, "Joel Miller", "joel@example.com")
    submitForm()

    await waitFor(() => expect(screen.getByText("EVALUACION REGISTRADA.")).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(screen.getByText("TRK-2026-001")).toBeInTheDocument()
  }, 10000)

  it("calls submitAdmission exactly once with the correct contact email", async () => {
    const user = userEvent.setup()
    renderForm()

    await fillAllFields(user, "Ellie Williams", "ellie@qz.com")
    submitForm()

    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledTimes(1), { timeout: 5000 })
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ contact_email: "ellie@qz.com" }),
    )
  }, 10000)
})
