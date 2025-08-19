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

    console.log(`WebSocket client connected: ${clientId}`)

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
      console.log(`Received message from ${clientInfo.id}: ${message}`)

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
      console.log(`WebSocket client disconnected: ${clientInfo?.id} (code: ${code}, reason: ${reason})`)
      clients.delete(ws)
    })

    ws.on('error', (error) => {
      const clientInfo = clients.get(ws)
      console.error(`WebSocket error for client ${clientInfo?.id}:`, error)
    })

    // Ping client every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      } else {
        clearInterval(pingInterval)
      }
    }, 30000)

    ws.on('pong', () => {
      const clientInfo = clients.get(ws)
      if (clientInfo) {
        console.log(`Pong received from ${clientInfo.id}`)
      }
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
