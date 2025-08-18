import WebSocket from "ws"
import { generate as generateWords } from "random-words"

// Socket instance interface
export interface SocketInstance {
  id: string
  socket: WebSocket
  url: string
  createdAt: Date
  status: 'connecting' | 'open' | 'closing' | 'closed'
  messageQueue: Message[]
  config: SocketConfig
  reconnectAttempts?: number
  lastActivity?: Date
}

// Message interface
export interface Message {
  id: string
  type: 'sent' | 'received'
  data: string | Buffer
  timestamp: Date
}

// Socket configuration
export interface SocketConfig {
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
  messageHistoryLimit?: number
  protocols?: string[]
  headers?: Record<string, string>
}

// Global socket store
const sockets: Record<string, SocketInstance> = {}

// Generate unique socket ID using random words
export function generateSocketId(): string {
  const words = generateWords({ exactly: 4, join: "-" }) as string
  return `socket-${words}`
}

// Generate unique message ID using random words
export function generateMessageId(): string {
  const words = generateWords({ exactly: 3, join: "-" }) as string
  return `msg-${words}`
}

// Get all sockets
export function getSockets(): Record<string, SocketInstance> {
  return sockets
}

// Get specific socket
export function getSocket(id: string): SocketInstance | undefined {
  return sockets[id]
}

// Add socket
export function addSocket(instance: SocketInstance): void {
  sockets[instance.id] = instance
}

// Remove socket
export function removeSocket(id: string): void {
  delete sockets[id]
}

// Add message to queue
export function addMessage(socketId: string, message: Message): void {
  const instance = sockets[socketId]
  if (instance) {
    instance.messageQueue.push(message)
    instance.lastActivity = new Date()

    // Enforce message history limit
    if (instance.config.messageHistoryLimit &&
      instance.messageQueue.length > instance.config.messageHistoryLimit) {
      const removeCount = instance.messageQueue.length - instance.config.messageHistoryLimit
      instance.messageQueue.splice(0, removeCount)
    }
  }
}

// Update socket status
export function updateSocketStatus(socketId: string, status: SocketInstance['status']): void {
  const instance = sockets[socketId]
  if (instance) {
    instance.status = status
    instance.lastActivity = new Date()
  }
}

// Get messages from queue
export function getMessages(
  socketId: string,
  action: 'get-latest' | 'get-all' | 'get-since',
  since?: string | Date,
  clearAfterRead?: boolean
): Message[] {
  const instance = sockets[socketId]
  if (!instance) return []

  let messages: Message[] = []

  switch (action) {
    case 'get-latest':
      messages = instance.messageQueue.slice(-10) // Last 10 messages
      break

    case 'get-all':
      messages = [...instance.messageQueue]
      break

    case 'get-since':
      if (since) {
        const sinceTime = typeof since === 'string'
          ? new Date(since).getTime()
          : since.getTime()
        messages = instance.messageQueue.filter(msg =>
          msg.timestamp.getTime() > sinceTime
        )
      } else {
        messages = [...instance.messageQueue]
      }
      break
  }

  if (clearAfterRead && action === 'get-all') {
    instance.messageQueue = []
  }

  return messages
}

// Clean up closed sockets
export function cleanupClosedSockets(): void {
  Object.keys(sockets).forEach(id => {
    const socket = sockets[id]
    if (socket.status === 'closed' && socket.socket.readyState === WebSocket.CLOSED) {
      delete sockets[id]
    }
  })
}
