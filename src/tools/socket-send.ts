import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import WebSocket from "ws"
import {
  getSocket,
  generateMessageId,
  addMessage,
  type Message
} from "../utils/socket-instances"

// Define the schema for tool parameters
export const schema = {
  socketId: z.string()
    .describe("The ID of the WebSocket connection to send to"),
  message: z.union([z.string(), z.record(z.any())])
    .describe("The message to send (string or object that will be JSON stringified)"),
  binary: z.boolean()
    .optional()
    .default(false)
    .describe("Whether to send the message as binary data"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "socket-send",
  description: "Send a message through an established WebSocket connection",
  annotations: {
    title: "WebSocket Send Message",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function socketSend(params: InferSchema<typeof schema>) {
  const { socketId, message, binary } = params

  try {
    // Get socket instance
    const socketInstance = getSocket(socketId)

    if (!socketInstance) {
      return JSON.stringify({
        success: false,
        error: `Socket with ID '${socketId}' not found`,
      }, null, 2)
    }

    // Check socket status
    if (socketInstance.status !== 'open') {
      return JSON.stringify({
        success: false,
        error: `Socket is not open. Current status: ${socketInstance.status}`,
        socketId,
        status: socketInstance.status,
      }, null, 2)
    }

    // Check WebSocket ready state
    if (socketInstance.socket.readyState !== WebSocket.OPEN) {
      return JSON.stringify({
        success: false,
        error: "WebSocket is not in OPEN state",
        readyState: socketInstance.socket.readyState,
        socketId,
      }, null, 2)
    }

    // Prepare message data
    let messageData: string | Buffer

    if (typeof message === 'object') {
      messageData = JSON.stringify(message)
    } else {
      messageData = message
    }

    // Convert to binary if requested
    if (binary) {
      messageData = Buffer.from(messageData)
    }

    // Generate message ID
    const messageId = generateMessageId()

    // Send the message
    return new Promise((resolve) => {
      socketInstance.socket.send(messageData, (error) => {
        if (error) {
          resolve(JSON.stringify({
            success: false,
            error: error.message,
            socketId,
            messageId,
          }, null, 2))
        } else {
          // Add to message queue
          const sentMessage: Message = {
            id: messageId,
            type: 'sent',
            data: messageData,
            timestamp: new Date(),
          }
          addMessage(socketId, sentMessage)

          resolve(JSON.stringify({
            success: true,
            messageId,
            socketId,
            timestamp: sentMessage.timestamp.toISOString(),
            message: `Message sent successfully`,
            details: {
              binary,
              size: messageData instanceof Buffer
                ? messageData.length
                : messageData.length,
              type: typeof message === 'object' ? 'json' : 'string',
            },
          }, null, 2))
        }
      })
    })

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      errorType: "SendError",
      socketId,
    }, null, 2)
  }
}
