import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

import { useTokenStore } from "@/store/useAuthStore"

const SOCKET_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace("/api/v1", "") ??
  "http://localhost:3000"

let globalSocket: Socket | null = null
let refCount = 0
// Desconexión diferida: nos da margen para cancelarla en el remount de
// StrictMode (React 18 monta → desmonta → vuelve a montar en dev).
let disconnectTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Returns a stable shared Socket.io connection authenticated with the current
 * JWT token.  The socket is created once and reused across all callers.
 * It disconnects automatically when the last consumer unmounts.
 */
export const useSocket = (): Socket | null => {
  const token = useTokenStore((s) => s.token)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    // Un nuevo consumidor cancela cualquier desconexión pendiente. Esto evita
    // el ciclo connect/disconnect del doble-montaje de StrictMode (que disparaba
    // "WebSocket is closed before the connection is established").
    if (disconnectTimer) {
      clearTimeout(disconnectTimer)
      disconnectTimer = null
    }

    // Solo creamos un socket si no existe. NO comprobamos `.connected`: durante
    // el handshake aún es false, y crear otro aquí filtraría el primero.
    // socket.io ya reconecta solo si la conexión se cae.
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })
    }

    socketRef.current = globalSocket
    refCount += 1

    return () => {
      refCount -= 1
      if (refCount === 0) {
        // Difiere la desconexión: si fue un remount, el nuevo efecto sube
        // refCount y limpia este timer antes de que dispare.
        disconnectTimer = setTimeout(() => {
          disconnectTimer = null
          if (refCount === 0 && globalSocket) {
            globalSocket.disconnect()
            globalSocket = null
          }
        }, 150)
      }
    }
  }, [token])

  return socketRef.current
}
