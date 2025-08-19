import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'

interface ClientInfo {
  id: string
  connected: Date
  messageCount: number
}

export function createWebSocketMockServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })
  const clients = new Map<WebSocket, ClientInfo>()

  wss.on('connection', (ws: WebSocket, request) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store client info
    clients.set(ws, {
      id: clientId,
      connected: new Date(),
      messageCount: 0
    })

    // Declare ping interval variable
    let pingInterval: NodeJS.Timeout

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to mock WebSocket server',
      clientId,
      timestamp: new Date().toISOString()
    }))

    // Echo messages back to client (mimicking echo.websocket.org)
    ws.on('message', (data: Buffer) => {
      const clientInfo = clients.get(ws)!
      clientInfo.messageCount++

      const message = data.toString()

      // Echo the message back
      ws.send(message)

      // Also send a metadata message if the message is JSON
      try {
        const parsed = JSON.parse(message)
        ws.send(JSON.stringify({
          type: 'echo-metadata',
          originalMessage: parsed,
          echoedAt: new Date().toISOString(),
          messageNumber: clientInfo.messageCount
        }))
      } catch {
        // Not JSON, just echo as-is
      }
    })

    ws.on('close', (code, reason) => {
      const clientInfo = clients.get(ws)
      clients.delete(ws)
      // Clear ping interval when connection closes
      if (pingInterval) {
        clearInterval(pingInterval)
      }
    })

    ws.on('error', (error) => {
      const clientInfo = clients.get(ws)
      // Handle error silently
    })

    // Ping client every 5 seconds to keep connection alive (shorter for tests)
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      } else {
        clearInterval(pingInterval)
      }
    }, 5000)

    // Allow the process to exit even if this timer is active
    pingInterval.unref()

    ws.on('pong', () => {
      const clientInfo = clients.get(ws)
      // Pong received
    })
  })

  // Add a status endpoint for debugging
  const getStatus = () => ({
    connectedClients: clients.size,
    clients: Array.from(clients.entries()).map(([ws, info]) => ({
      id: info.id,
      connected: info.connected,
      messageCount: info.messageCount,
      readyState: ws.readyState,
      readyStateString: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState]
    }))
  })

  return { wss, getStatus }
}
