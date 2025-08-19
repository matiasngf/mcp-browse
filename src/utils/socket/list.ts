import {
  getSockets,
  cleanupClosedSockets,
} from "../socket-instances"

export async function listSockets(): Promise<string> {
  // Clean up closed sockets first
  cleanupClosedSockets()

  // Get all sockets
  const sockets = getSockets()
  const socketIds = Object.keys(sockets)

  if (socketIds.length === 0) {
    return JSON.stringify({
      success: true,
      sockets: [],
      count: 0,
      message: "No active WebSocket connections",
    }, null, 2)
  }

  // Format socket information
  const socketList = socketIds.map(id => {
    const socket = sockets[id]
    return {
      id: socket.id,
      url: socket.url,
      status: socket.status,
      createdAt: socket.createdAt.toISOString(),
      lastActivity: socket.lastActivity?.toISOString(),
      messageQueueSize: socket.messageQueue.length,
      reconnectAttempts: socket.reconnectAttempts || 0,
      config: {
        autoReconnect: socket.config.autoReconnect,
        messageHistoryLimit: socket.config.messageHistoryLimit,
        protocols: socket.config.protocols,
      },
      stats: {
        sentMessages: socket.messageQueue.filter(m => m.type === 'sent').length,
        receivedMessages: socket.messageQueue.filter(m => m.type === 'received').length,
      },
    }
  })

  // Sort by creation time (newest first)
  socketList.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return JSON.stringify({
    success: true,
    count: socketList.length,
    sockets: socketList,
    summary: {
      total: socketList.length,
      open: socketList.filter(s => s.status === 'open').length,
      connecting: socketList.filter(s => s.status === 'connecting').length,
      closing: socketList.filter(s => s.status === 'closing').length,
      closed: socketList.filter(s => s.status === 'closed').length,
    },
  }, null, 2)
}
