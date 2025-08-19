import {
  getSocket,
  getMessages,
} from "../socket-instances"

export interface ReceiveParams {
  socketId: string
  action: 'get-latest' | 'get-all' | 'get-since'
  since?: string
  clearAfterRead?: boolean
}

export async function receiveMessages(params: ReceiveParams): Promise<string> {
  const { socketId, action, since, clearAfterRead = false } = params

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
}
