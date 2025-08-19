import * as WebSocket from "ws"
import {
  getSocket,
  generateMessageId,
  addMessage,
  type Message
} from "../socket-instances"

export interface SendParams {
  socketId: string
  message: string | Record<string, any>
  binary?: boolean
}

export async function sendMessage(params: SendParams): Promise<string> {
  const { socketId, message, binary = false } = params

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
  if (socketInstance.socket.readyState !== 1) { // WebSocket.OPEN = 1
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
}
