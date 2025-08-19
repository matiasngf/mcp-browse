import * as WebSocket from "ws"
import {
  generateSocketId,
  generateMessageId,
  addSocket,
  updateSocketStatus,
  addMessage,
  getSocket,
  type SocketInstance,
  type Message
} from "../socket-instances"

export interface ConnectParams {
  url: string
  protocols?: string[]
  headers?: Record<string, string>
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
  messageHistoryLimit?: number
}

export async function connectSocket(params: ConnectParams): Promise<string> {
  const {
    url,
    protocols,
    headers,
    autoReconnect = false,
    maxReconnectAttempts = 5,
    reconnectInterval = 1000,
    messageHistoryLimit = 100
  } = params

  // Validate URL
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    return JSON.stringify({
      success: false,
      error: "Invalid WebSocket URL. Must start with ws:// or wss://",
    }, null, 2)
  }

  // Generate unique socket ID
  const socketId = generateSocketId()

  // Create WebSocket options
  const options: WebSocket.ClientOptions = {
    ...(headers && { headers }),
  }

  // Create WebSocket instance
  const socket = new WebSocket.WebSocket(url, protocols, options)

  // Create socket instance
  const socketInstance: SocketInstance = {
    id: socketId,
    socket,
    url,
    createdAt: new Date(),
    status: 'connecting',
    messageQueue: [],
    config: {
      autoReconnect,
      maxReconnectAttempts,
      reconnectInterval,
      messageHistoryLimit,
      protocols,
      headers,
    },
    reconnectAttempts: 0,
    lastActivity: new Date(),
  }

  // Add to global store
  addSocket(socketInstance)

  // Set up event handlers
  socket.on('open', () => {
    updateSocketStatus(socketId, 'open')
    socketInstance.reconnectAttempts = 0

    // Add connection message
    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({ event: 'connected', timestamp: new Date() }),
      timestamp: new Date(),
    }
    addMessage(socketId, message)
  })

  socket.on('message', (data: WebSocket.Data) => {
    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: data instanceof Buffer ? data : data.toString(),
      timestamp: new Date(),
    }
    addMessage(socketId, message)
  })

  socket.on('error', (error: Error) => {
    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({
        event: 'error',
        error: error.message,
        timestamp: new Date()
      }),
      timestamp: new Date(),
    }
    addMessage(socketId, message)
  })

  socket.on('close', (code: number, reason: Buffer) => {
    updateSocketStatus(socketId, 'closed')

    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({
        event: 'disconnected',
        code,
        reason: reason.toString(),
        timestamp: new Date()
      }),
      timestamp: new Date(),
    }
    addMessage(socketId, message)

    // Handle auto-reconnection
    if (autoReconnect && socketInstance.reconnectAttempts! < maxReconnectAttempts) {
      socketInstance.reconnectAttempts!++
      const delay = reconnectInterval * Math.pow(2, socketInstance.reconnectAttempts! - 1)

      setTimeout(() => {
        const existingSocket = getSocket(socketId)
        if (existingSocket && existingSocket.status === 'closed') {
          reconnectSocketInstance(existingSocket)
        }
      }, delay)
    }
  })

  // Wait for connection or error
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(JSON.stringify({
        success: false,
        error: "Connection timeout",
        socketId,
        status: socketInstance.status,
      }, null, 2))
    }, 10000) // 10 second timeout

    socket.once('open', () => {
      clearTimeout(timeout)
      resolve(JSON.stringify({
        success: true,
        socketId,
        url,
        status: 'open',
        message: `WebSocket connected to ${url}`,
        config: {
          autoReconnect,
          messageHistoryLimit,
          protocols,
        },
      }, null, 2))
    })

    socket.once('error', (error) => {
      clearTimeout(timeout)
      resolve(JSON.stringify({
        success: false,
        error: error.message,
        socketId,
        status: 'error',
      }, null, 2))
    })
  })
}

// Reconnect socket function
export function reconnectSocketInstance(instance: SocketInstance) {
  const { url, config } = instance
  const options: WebSocket.ClientOptions = {
    ...(config.headers && { headers: config.headers }),
  }

  const newSocket = new WebSocket.WebSocket(url, config.protocols, options)
  instance.socket = newSocket
  updateSocketStatus(instance.id, 'connecting')

  // Re-attach event handlers
  newSocket.on('open', () => {
    updateSocketStatus(instance.id, 'open')
    instance.reconnectAttempts = 0

    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({
        event: 'reconnected',
        attempt: instance.reconnectAttempts,
        timestamp: new Date()
      }),
      timestamp: new Date(),
    }
    addMessage(instance.id, message)
  })

  newSocket.on('message', (data: WebSocket.Data) => {
    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: data instanceof Buffer ? data : data.toString(),
      timestamp: new Date(),
    }
    addMessage(instance.id, message)
  })

  newSocket.on('error', (error: Error) => {
    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({
        event: 'error',
        error: error.message,
        timestamp: new Date()
      }),
      timestamp: new Date(),
    }
    addMessage(instance.id, message)
  })

  newSocket.on('close', (code: number, reason: Buffer) => {
    updateSocketStatus(instance.id, 'closed')

    const message: Message = {
      id: generateMessageId(),
      type: 'received',
      data: JSON.stringify({
        event: 'disconnected',
        code,
        reason: reason.toString(),
        timestamp: new Date()
      }),
      timestamp: new Date(),
    }
    addMessage(instance.id, message)

    // Continue reconnection attempts
    if (instance.config.autoReconnect &&
      instance.reconnectAttempts! < instance.config.maxReconnectAttempts!) {
      instance.reconnectAttempts!++
      const delay = instance.config.reconnectInterval! *
        Math.pow(2, instance.reconnectAttempts! - 1)

      setTimeout(() => {
        const existingSocket = getSocket(instance.id)
        if (existingSocket && existingSocket.status === 'closed') {
          reconnectSocketInstance(instance)
        }
      }, delay)
    }
  })
}
