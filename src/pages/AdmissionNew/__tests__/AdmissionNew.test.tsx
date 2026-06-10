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

describe("AdmissionNew — intro phase", () => {
  it("shows the 'SISTEMA EN ESPERA' prompt before the user clicks", () => {
    renderForm()
    expect(screen.getByText(/sistema en espera/i)).toBeInTheDocument()
  })

  it("transitions to the form phase when the intro overlay is clicked", async () => {
    const user = userEvent.setup()
    renderForm()
    const overlay = screen.getByRole("button", { name: /haga clic/i })
    await user.click(overlay)
    await waitFor(() => {
      expect(screen.queryByText(/sistema en espera/i)).not.toBeInTheDocument()
    })
  })
})

describe("AdmissionNew — age validation", () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
  })

  it("shows age error for a non-integer value of 0", async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/edad/i), "0")
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("La edad debe ser un entero mayor o igual a 1")).toBeInTheDocument()
    })
  })
})

describe("AdmissionNew — photo validation", () => {
  beforeEach(() => {
    mockedSubmit.mockReset()
    mockedUpload.mockReset()
  })

  it("shows 'Debes adjuntar una imagen valida' for a non-image file", async () => {
    renderForm()
    const nonImageFile = new File(["content"], "document.pdf", { type: "application/pdf" })
    const fileInput = document.getElementById("foto") as HTMLInputElement
    // user-event respects accept="image/*" and would filter the PDF — use fireEvent instead
    Object.defineProperty(fileInput, "files", { value: [nonImageFile], configurable: true })
    fireEvent.change(fileInput)
    submitForm()
    await waitFor(() => {
      expect(screen.getByText("Debes adjuntar una imagen valida")).toBeInTheDocument()
    })
  })
})

describe("AdmissionNew — API error handling", () => {
  beforeEach(() => {
    mockedUpload.mockResolvedValue({ url: "https://cdn.example.com/photo.jpg" })
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
    mockedSubmit.mockReset()
    mockedUpload.mockReset()
  })

  const fillAllFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/nombre completo/i), "Joel Miller")
    await user.type(screen.getByLabelText(/metodo de contacto/i), "joel@example.com")
    await user.type(screen.getByLabelText(/cedula/i), "123456789")
    await user.type(screen.getByLabelText(/edad/i), "35")
    await user.type(screen.getByLabelText(/salud \(detalles\)/i), "Buena salud")
    await user.type(screen.getByLabelText(/condicion fisica \(detalles\)/i), "Excelente")
    await user.type(screen.getByLabelText(/habilidades/i), "medicina")
    const fileInput = document.getElementById("foto") as HTMLInputElement
    await user.upload(fileInput, new File(["pixel"], "photo.jpg", { type: "image/jpeg" }))
  }

  it("shows an API error message when submitAdmission rejects", async () => {
    const user = userEvent.setup()
    mockedSubmit.mockRejectedValueOnce(new Error("network error"))
    renderForm()
    await fillAllFields(user)
    submitForm()
    await waitFor(
      () => expect(screen.getByText(/no se pudo registrar la admision/i)).toBeInTheDocument(),
      { timeout: 5000 },
    )
  }, 10000)
})

describe("AdmissionNew — criminal_record checkbox", () => {
  it("toggles the antecedentes label text when the checkbox is checked", async () => {
    const user = userEvent.setup()
    renderForm()
    expect(screen.getByText(/sin antecedentes/i)).toBeInTheDocument()
    await user.click(screen.getByLabelText(/sin antecedentes/i))
    expect(screen.getByText(/antecedentes penales/i)).toBeInTheDocument()
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

  it("compresses the selected photo before uploading when canvas succeeds", async () => {
    const user = userEvent.setup()
    const drawImage = vi.fn()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation(function (callback) {
        callback(new Blob(["compressed"], { type: "image/jpeg" }))
      })

    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        width = 1600
        height = 800
        set src(_url: string) {
          setTimeout(() => this.onload?.(), 0)
        }
      },
    )

    const uploadCallsBeforeSubmit = mockedUpload.mock.calls.length
    renderForm()
    await fillAllFields(user, "Tommy Miller", "tommy@example.com")
    submitForm()

    await waitFor(
      () => expect(mockedUpload.mock.calls.length).toBeGreaterThan(uploadCallsBeforeSubmit),
      {
        timeout: 5000,
      },
    )
    const uploadedFile = mockedUpload.mock.calls.at(-1)?.[0] as File
    expect(uploadedFile.name).toBe("photo.jpg")
    expect(uploadedFile.type).toBe("image/jpeg")
    expect(drawImage).toHaveBeenCalled()
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.75)

    getContext.mockRestore()
    toBlob.mockRestore()
  }, 10000)

  it("falls back to the original photo when canvas has no context", async () => {
    const user = userEvent.setup()
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)

    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        width = 800
        height = 600
        set src(_url: string) {
          setTimeout(() => this.onload?.(), 0)
        }
      },
    )

    renderForm()
    await fillAllFields(user, "Canvas Fallback", "canvas@example.com")
    submitForm()

    await waitFor(() => expect(mockedUpload).toHaveBeenCalled(), { timeout: 5000 })
    const uploadedFile = mockedUpload.mock.calls.at(-1)?.[0] as File
    expect(uploadedFile.name).toBe("photo.jpg")

    getContext.mockRestore()
  }, 10000)

  it("falls back to the original photo when canvas returns no blob", async () => {
    const user = userEvent.setup()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation(function (callback) {
        callback(null)
      })

    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        width = 800
        height = 600
        set src(_url: string) {
          setTimeout(() => this.onload?.(), 0)
        }
      },
    )

    renderForm()
    await fillAllFields(user, "Blob Fallback", "blob@example.com")
    submitForm()

    await waitFor(() => expect(mockedUpload).toHaveBeenCalled(), { timeout: 5000 })
    const uploadedFile = mockedUpload.mock.calls.at(-1)?.[0] as File
    expect(uploadedFile.name).toBe("photo.jpg")

    getContext.mockRestore()
    toBlob.mockRestore()
  }, 10000)

  it("sends optional profession, years, numeric scores and criminal record in the payload", async () => {
    const user = userEvent.setup()
    renderForm()

    await fillAllFields(user, "Solo", "solo@example.com")
    await user.type(document.getElementById("previous_profession") as HTMLInputElement, "Ingeniero")
    await user.clear(screen.getByLabelText(/a.os de experiencia/i))
    await user.type(screen.getByLabelText(/a.os de experiencia/i), "4")
    fireEvent.change(document.getElementById("salud_score") as HTMLInputElement, {
      target: { name: "salud_score", value: "80" },
    })
    fireEvent.change(document.getElementById("psychological_evaluation") as HTMLInputElement, {
      target: { name: "psychological_evaluation", value: "95" },
    })
    await user.click(screen.getByLabelText(/sin antecedentes/i))
    submitForm()

    await waitFor(() => expect(mockedSubmit).toHaveBeenCalled(), { timeout: 5000 })
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Solo",
        last_name: "Solo",
        previous_profession: "Ingeniero",
        years_experience: 4,
        health_status: 80,
        psychological_evaluation: 95,
        criminal_record: true,
        personal_history: expect.stringContaining("Profesion previa: Ingeniero"),
      }),
    )
  }, 10000)
})
