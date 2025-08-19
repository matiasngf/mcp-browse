# Mock Test Servers

This directory contains mock servers used for testing the MCP Fetch server tools without hitting external APIs and avoiding rate limiting issues.

## Overview

The mock servers provide local replacements for:
- **HTTP endpoints** (replacing httpbin.org)
- **WebSocket server** (replacing echo.websocket.org)
- **GraphQL server** (for GraphQL tool testing)

## Running the Mock Server

### For Development

To run the mock server standalone on port 3333:

```bash
pnpm run mock-server:dev
```

### For Testing

The mock server is automatically started when running tests via `pnpm test`. It uses a random available port to avoid conflicts.

### Manual Usage

```bash
# Run on a specific port
PORT=4000 pnpm run mock-server

# Run with default random port
pnpm run mock-server
```

## Available Endpoints

### HTTP Endpoints (httpbin.org replacement)

- `GET /get` - Returns request details
- `POST /post` - Accepts and echoes JSON, form data, or text
- `PUT /put` - Accepts and echoes JSON data
- `DELETE /delete` - Returns request details
- `PATCH /patch` - Accepts and echoes JSON data
- `GET /headers` - Returns request headers
- `GET /status/:code` - Returns specified HTTP status code
- `GET /json` - Returns sample JSON data
- `GET /redirect/:n` - Performs n redirects

### WebSocket Endpoint

- `ws://localhost:PORT/ws` - Echo WebSocket server that:
  - Echoes all messages back to the client
  - Sends connection confirmation on connect
  - Provides metadata for JSON messages
  - Maintains persistent connections with ping/pong

### GraphQL Endpoint

- `POST /graphql` - Full GraphQL server with:
  - Query operations: `users`, `user`, `posts`, `post`, `hello`
  - Mutations: `createUser`, `updateUser`, `deleteUser`, `createPost`
  - Full introspection support
  - Nested resolvers for relationships

### Health Check

- `GET /health` - Returns server status and connected WebSocket clients count

## Architecture

- `http-server.ts` - Express server mimicking httpbin.org endpoints
- `websocket-server.ts` - WebSocket server with echo functionality
- `graphql-server.ts` - Apollo GraphQL server with test schema
- `test-server.ts` - Main server that combines all three services

## Example Usage in Tests

```typescript
import { getTestServerUrl } from '../setup/jest.setup';

test('should fetch data', async () => {
  const testServerUrl = getTestServerUrl();
  const result = await client.testFetch(`${testServerUrl}/get`);
  expect(result.status).toBe(200);
});
```
