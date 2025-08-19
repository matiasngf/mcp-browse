import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import {
  connectSocket,
  sendMessage,
  receiveMessages,
  listSockets,
  closeSocket
} from "../utils/socket"

// Define the schema for tool parameters using discriminated union
export const schema = {
  action: z.discriminatedUnion("type", [
    // List sockets action
    z.object({
      type: z.literal("list"),
    }),

    // Connect action
    z.object({
      type: z.literal("connect"),
      url: z.string()
        .describe("The WebSocket URL to connect to (ws:// or wss://)"),
      protocols: z.array(z.string())
        .optional()
        .describe("WebSocket subprotocols to use"),
      headers: z.record(z.string())
        .optional()
        .describe("HTTP headers to include in the connection request"),
      autoReconnect: z.boolean()
        .optional()
        .default(false)
        .describe("Whether to automatically reconnect on disconnection"),
      maxReconnectAttempts: z.number()
        .optional()
        .default(5)
        .describe("Maximum number of reconnection attempts"),
      reconnectInterval: z.number()
        .optional()
        .default(1000)
        .describe("Base interval between reconnection attempts in milliseconds"),
      messageHistoryLimit: z.number()
        .optional()
        .default(100)
        .describe("Maximum number of messages to keep in history"),
    }),

    // Send action
    z.object({
      type: z.literal("send"),
      socketId: z.string()
        .describe("The ID of the WebSocket connection to send to"),
      message: z.union([z.string(), z.record(z.any())])
        .describe("The message to send (string or object that will be JSON stringified)"),
      binary: z.boolean()
        .optional()
        .default(false)
        .describe("Whether to send the message as binary data"),
    }),

    // Receive action
    z.object({
      type: z.literal("receive"),
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
    }),

    // Close action
    z.object({
      type: z.literal("close"),
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
    }),
  ]).describe("The action to perform on WebSocket connections"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "socket",
  description: "Manage WebSocket connections - connect, send, receive messages, list connections, and close",
  annotations: {
    title: "WebSocket Management",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function socket({ action }: InferSchema<typeof schema>) {
  try {
    switch (action.type) {
      case "list":
        return await listSockets()

      case "connect":
        return await connectSocket({
          url: action.url,
          protocols: action.protocols,
          headers: action.headers,
          autoReconnect: action.autoReconnect,
          maxReconnectAttempts: action.maxReconnectAttempts,
          reconnectInterval: action.reconnectInterval,
          messageHistoryLimit: action.messageHistoryLimit,
        })

      case "send":
        return await sendMessage({
          socketId: action.socketId,
          message: action.message,
          binary: action.binary,
        })

      case "receive":
        return await receiveMessages({
          socketId: action.socketId,
          action: action.action,
          since: action.since,
          clearAfterRead: action.clearAfterRead,
        })

      case "close":
        return await closeSocket({
          socketId: action.socketId,
          code: action.code,
          reason: action.reason,
        })

      default:
        return JSON.stringify({
          success: false,
          error: "Invalid action type",
        }, null, 2)
    }
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
