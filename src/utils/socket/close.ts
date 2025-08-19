import * as WebSocket from "ws"
import {
  getSocket,
  removeSocket,
  updateSocketStatus,
} from "../socket-instances"

export interface CloseParams {
  socketId: string
  code?: number
  reason?: string
}

export async function closeSocket(params: CloseParams): Promise<string> {
  const { socketId, code = 1000, reason = "Normal closure" } = params

  // Get socket instance
  const socketInstance = getSocket(socketId)

  if (!socketInstance) {
    return JSON.stringify({
      success: false,
      error: `Socket with ID '${socketId}' not found`,
    }, null, 2)
  }

  // Get final stats before closing
  const finalStats = {
    totalMessages: socketInstance.messageQueue.length,
    sentMessages: socketInstance.messageQueue.filter(m => m.type === 'sent').length,
    receivedMessages: socketInstance.messageQueue.filter(m => m.type === 'received').length,
    connectionDuration: Date.now() - socketInstance.createdAt.getTime(),
  }

  // Update status
  updateSocketStatus(socketId, 'closing')

  // Close the WebSocket connection
  return new Promise((resolve) => {
    const { socket } = socketInstance

    // Handle already closed socket
    if (socket.readyState === 3) { // WebSocket.CLOSED = 3
      removeSocket(socketId)
      resolve(JSON.stringify({
        success: true,
        socketId,
        message: "Socket was already closed",
        finalStats,
      }, null, 2))
      return
    }

    // Set up close handler
    const closeHandler = () => {
      removeSocket(socketId)
      resolve(JSON.stringify({
        success: true,
        socketId,
        message: `WebSocket closed successfully`,
        code,
        reason,
        finalStats,
      }, null, 2))
    }

    // Handle close event
    socket.once('close', closeHandler)

    // Set timeout for close operation
    const timeout = setTimeout(() => {
      socket.removeListener('close', closeHandler)

      // Force close and cleanup
      try {
        socket.terminate()
      } catch {
        // Ignore errors during termination
      }

      removeSocket(socketId)

      resolve(JSON.stringify({
        success: true,
        socketId,
        message: "WebSocket forcefully terminated after timeout",
        warning: "Connection did not close gracefully",
        finalStats,
      }, null, 2))
    }, 5000) // 5 second timeout

    // Initiate close
    try {
      if (socket.readyState === 1) { // WebSocket.OPEN = 1
        socket.close(code, reason)
      } else if (socket.readyState === 0) { // WebSocket.CONNECTING = 0
        // If still connecting, terminate immediately
        socket.terminate()
        clearTimeout(timeout)
        removeSocket(socketId)
        resolve(JSON.stringify({
          success: true,
          socketId,
          message: "WebSocket terminated while connecting",
          finalStats,
        }, null, 2))
      }
    } catch (error) {
      clearTimeout(timeout)
      socket.removeListener('close', closeHandler)

      // Try to terminate
      try {
        socket.terminate()
      } catch {
        // Ignore errors during termination
      }

      removeSocket(socketId)

      resolve(JSON.stringify({
        success: true,
        socketId,
        message: "WebSocket closed with errors",
        error: error instanceof Error ? error.message : "Unknown error",
        finalStats,
      }, null, 2))
    }
  })
}
