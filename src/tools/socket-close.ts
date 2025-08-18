import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import WebSocket from "ws"
import {
  getSocket,
  removeSocket,
  updateSocketStatus,
} from "../utils/socket-instances"

// Define the schema for tool parameters
export const schema = {
  socketId: z.string()
    .describe("The ID of the WebSocket connection to close"),
  code: z.number()
    .optional()
    .default(1000)
    .describe("WebSocket close code (1000 = normal closure)"),
  reason: z.string()
    .optional()
    .default("Normal closure")
    .describe("Reason for closing the connection"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "socket-close",
  description: "Close a WebSocket connection with optional code and reason",
  annotations: {
    title: "Close WebSocket Connection",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function socketClose(params: InferSchema<typeof schema>) {
  const { socketId, code, reason } = params

  try {
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
      if (socket.readyState === WebSocket.CLOSED) {
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
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(code, reason)
        } else if (socket.readyState === WebSocket.CONNECTING) {
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

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      errorType: "CloseError",
      socketId,
    }, null, 2)
  }
}
