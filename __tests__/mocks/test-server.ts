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
  console.log(`Test server starting on port ${actualPort}`)

  // Add WebSocket server
  const { wss, getStatus: wsStatus } = createWebSocketMockServer(httpServer)
  console.log('WebSocket server configured at /ws')

  // Add GraphQL server
  await createGraphQLServer(app)
  console.log('GraphQL server configured at /graphql')

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

  console.log(`Test server running at http://localhost:${actualPort}`)
  console.log(`  - HTTP endpoints: http://localhost:${actualPort}/[get|post|put|delete|patch|headers|status/:code|json|redirect/:n]`)
  console.log(`  - WebSocket: ws://localhost:${actualPort}/ws`)
  console.log(`  - GraphQL: http://localhost:${actualPort}/graphql`)
  console.log(`  - Health check: http://localhost:${actualPort}/health`)

  return {
    httpServer,
    port: actualPort,
    close: () => {
      return new Promise((resolve) => {
        wss.close(() => {
          httpServer.close(() => {
            console.log('Test server closed')
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
