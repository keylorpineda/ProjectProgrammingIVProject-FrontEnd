import { fireEvent } from "@testing-library/dom"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ImageUploader } from "../ImageUploader"

describe("ImageUploader", () => {
  it("renders an empty placeholder and triggers the hidden input", () => {
    render(<ImageUploader label="Imagen" onChange={vi.fn()} uploadFn={vi.fn()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click")

    expect(screen.getByText("SIN IMG")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "SUBIR ARCHIVO" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "SUBIR ARCHIVO" }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it("uploads a selected file and clears the input", async () => {
    const uploadFn = vi.fn().mockResolvedValue({ url: "https://cdn.test/image.png" })
    const onChange = vi.fn()

    render(
      <ImageUploader
        label="Foto"
        currentUrl="https://cdn.test/current.png"
        onChange={onChange}
        uploadFn={uploadFn}
        accept="image/png"
      />,
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole("button", { name: "SUBIENDO..." })).toBeDisabled()
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("https://cdn.test/image.png"))
    expect(uploadFn).toHaveBeenCalledWith(file)
    expect(input.value).toBe("")
    expect(screen.getByText(/CARGADO/)).toBeInTheDocument()
  })

  it("shows an error when the upload fails and ignores empty selections", async () => {
    const uploadFn = vi.fn().mockRejectedValue(new Error("fail"))

    render(<ImageUploader label="Foto" onChange={vi.fn()} uploadFn={uploadFn} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [] } })
    expect(uploadFn).not.toHaveBeenCalled()

    fireEvent.change(input, {
      target: { files: [new File(["bad"], "bad.png", { type: "image/png" })] },
    })

    expect(
      await screen.findByText("Error al subir la imagen. Intenta de nuevo."),
    ).toBeInTheDocument()
  })
})
