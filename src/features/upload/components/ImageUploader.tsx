import { useRef, useState } from "react"

import type { UploadResult } from "../services/upload.service"

interface ImageUploaderProps {
  label: string
  currentUrl?: string | null
  onChange: (url: string) => void
  uploadFn: (file: File) => Promise<UploadResult>
  accept?: string
}

export function ImageUploader({
  label,
  currentUrl,
  onChange,
  uploadFn,
  accept = "image/*",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError("")
    try {
      const result = await uploadFn(file)
      onChange(result.url)
    } catch {
      setUploadError("Error al subir la imagen. Intenta de nuevo.")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="form-group form-full">
      <label className="form-label">{label}</label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="preview"
            style={{
              width: "72px",
              height: "72px",
              objectFit: "cover",
              border: "2px solid var(--ink)",
              filter: "sepia(0.2)",
            }}
          />
        ) : (
          <div
            style={{
              width: "72px",
              height: "72px",
              border: "2px dashed var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            SIN IMG
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            className="action-btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            style={{ fontSize: "11px", padding: "6px 12px" }}
          >
            {isUploading ? "SUBIENDO..." : currentUrl ? "CAMBIAR" : "SUBIR ARCHIVO"}
          </button>
          {uploadError ? (
            <div className="form-error" style={{ marginTop: "4px" }}>
              {uploadError}
            </div>
          ) : null}
          {currentUrl && !isUploading ? (
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-secondary)",
                marginTop: "4px",
                fontFamily: "var(--font-mono)",
                wordBreak: "break-all",
              }}
            >
              ✓ CARGADO
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
