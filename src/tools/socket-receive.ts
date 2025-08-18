import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import {
  getSocket,
  getMessages,
} from "../utils/socket-instances"

// Define the schema for tool parameters
export const schema = {
  socketId: z.string()
    .describe("The ID of the WebSocket connection to receive messages from"),
  action: z.enum(["get-latest", "get-all", "get-since"])
    .describe("What messages to retrieve: get-latest (last 10), get-all (entire queue), or get-since (after timestamp)"),
  since: z.string()
    .optional()
    .describe("ISO timestamp or message ID to get messages after (required for get-since action)"),
  clearAfterRead: z.boolean()
    .optional()
    .default(false)
    .describe("Whether to clear the message queue after reading (only applies to get-all action)"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "socket-receive",
  description: "Retrieve messages from a WebSocket connection's message queue",
  annotations: {
    title: "WebSocket Receive Messages",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

// Tool implementation
export default async function socketReceive(params: InferSchema<typeof schema>) {
  const { socketId, action, since, clearAfterRead } = params

  try {
    // Get socket instance
    const socketInstance = getSocket(socketId)

    if (!socketInstance) {
      return JSON.stringify({
        success: false,
        error: `Socket with ID '${socketId}' not found`,
      }, null, 2)
    }

    // Validate parameters
    if (action === 'get-since' && !since) {
      return JSON.stringify({
        success: false,
        error: "The 'since' parameter is required for 'get-since' action",
      }, null, 2)
    }

    // Get messages based on action
    const messages = getMessages(socketId, action, since, clearAfterRead)

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      type: msg.type,
      timestamp: msg.timestamp.toISOString(),
      data: msg.data instanceof Buffer
        ? {
          type: 'binary',
          base64: msg.data.toString('base64'),
          size: msg.data.length
        }
        : msg.data,
    }))

    // Get queue size
    const queueSize = socketInstance.messageQueue.length

    return JSON.stringify({
      success: true,
      socketId,
      messages: formattedMessages,
      count: formattedMessages.length,
      queueSize: clearAfterRead && action === 'get-all' ? 0 : queueSize,
      status: socketInstance.status,
      lastActivity: socketInstance.lastActivity?.toISOString(),
      action,
      ...(action === 'get-since' && { since }),
      ...(clearAfterRead && { cleared: action === 'get-all' }),
    }, null, 2)

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      errorType: "ReceiveError",
      socketId,
    }, null, 2)
  }
}
