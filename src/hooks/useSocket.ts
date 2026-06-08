import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

import { useTokenStore } from "@/store/useAuthStore"

const SOCKET_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace("/api/v1", "") ??
  "http://localhost:3000"

let globalSocket: Socket | null = null
let refCount = 0

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

    if (!globalSocket || !globalSocket.connected) {
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
      if (refCount === 0 && globalSocket) {
        globalSocket.disconnect()
        globalSocket = null
      }
    }
  }, [token])

  return socketRef.current
}
