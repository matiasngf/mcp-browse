import { createHttpMockServer } from './http-server'
import { createWebSocketMockServer } from './websocket-server'
import { createGraphQLServer } from './graphql-server'
import { Server } from 'http'

export interface TestServerInstance {
  httpServer: Server
  port: number
  close: () => Promise<void>
  wsStatus: () => any
}

export async function startTestServer(port: number = 0): Promise<TestServerInstance> {
  // Create the Express app with HTTP endpoints
  const app = createHttpMockServer()

  // Create HTTP server
  const httpServer = app.listen(port)

  // Get the actual port (useful when port is 0)
  const actualPort = (httpServer.address() as any).port

  // Add WebSocket server
  const { wss, getStatus: wsStatus } = createWebSocketMockServer(httpServer)

  // Add GraphQL server
  await createGraphQLServer(app)

  // Add a health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      services: {
        http: 'running',
        websocket: 'running',
        graphql: 'running'
      },
      websocketClients: wsStatus().connectedClients,
      timestamp: new Date().toISOString()
    })
  })

  return {
    httpServer,
    port: actualPort,
    close: () => {
      return new Promise((resolve) => {
        // Close all active WebSocket connections
        wss.clients.forEach((ws) => {
          ws.close(1000, 'Server shutting down')
        })

        wss.close(() => {
          httpServer.close(() => {
            resolve()
          })
        })
      })
    },
    wsStatus
  }
}

// If running directly (not imported)
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3333')
  startTestServer(port).catch(console.error)
}
