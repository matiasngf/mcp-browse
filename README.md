# MCP Fetch

A Model Context Protocol server providing tools for HTTP requests, GraphQL queries, WebSocket connections, and browser automation using Puppeteer.

<p align="center">
  <img src="https://raw.githubusercontent.com/matiasngf/mcp-fetch/refs/heads/main/mcp-fetch-2.png" alt="MCP Fetch Logo"/>
</p>


## Configuration

Add this to your MCP settings configuration file:

```json
{
  "mcp-fetch": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "mcp-fetch"
    ]
  }
}
```

## Installation

If the puppeteer tool is not working, remember to install the chrome browser

```bash
npx puppeteer browsers install chrome
```

## Features

- **HTTP Requests**: Perform HTTP requests with full control over method, headers, and body
- **GraphQL Client**: Execute queries/mutations and introspect GraphQL schemas
- **WebSocket Management**: Connect, send, receive messages, and manage WebSocket connections
- **Browser Automation**: Launch browsers, create pages, and execute JavaScript using Puppeteer
- **Comprehensive Docs**: AI-ready documentation via `get-rules` tool

## Available Tools

### HTTP Requests

#### `fetch`
Perform HTTP requests with full control over method, headers, body, and other fetch options.

**Parameters:**
- `url` (string, required): The URL to fetch from
- `method` (string, optional): HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS). Default: "GET"
- `headers` (object, optional): HTTP headers as key-value pairs
- `body` (string, optional): Request body for POST, PUT, PATCH, DELETE
- `mode` (string, optional): Request mode (cors, no-cors, same-origin)
- `credentials` (string, optional): Credentials mode (omit, same-origin, include)
- `cache` (string, optional): Cache mode (default, no-store, reload, no-cache, force-cache, only-if-cached)
- `redirect` (string, optional): Redirect handling (follow, error, manual). Default: "follow"
- `referrer` (string, optional): Referrer URL
- `referrerPolicy` (string, optional): Referrer policy
- `timeout` (number, optional): Request timeout in milliseconds
- `followRedirects` (boolean, optional): Whether to follow redirects. Default: true

**Returns:**
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": { "content-type": "application/json" },
  "body": "Response body as string",
  "redirected": false,
  "url": "https://api.example.com/data"
}
```

**Example Usage:**
```javascript
// Simple GET request
fetch({ url: "https://api.example.com/users" })

// POST request with JSON body
fetch({
  url: "https://api.example.com/users",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "John Doe", email: "john@example.com" })
})

// Request with authentication and timeout
fetch({
  url: "https://api.example.com/protected",
  headers: { "Authorization": "Bearer token123" },
  timeout: 5000
})
```

### GraphQL

#### `graphql`
Execute GraphQL queries and mutations with support for variables and custom headers.

**Parameters:**
- `action` (object, required): Action to perform with discriminated union:
  - For execution:
    - `type`: "execute"
    - `endpoint` (string): GraphQL endpoint URL
    - `query` (string): GraphQL query or mutation string
    - `variables` (object, optional): Variables for the query/mutation
    - `headers` (object, optional): HTTP headers (e.g., authorization)
    - `operationName` (string, optional): Operation name when query contains multiple operations
    - `timeout` (number, optional): Request timeout in milliseconds. Default: 30000
  - For introspection:
    - `type`: "introspect"
    - `endpoint` (string): GraphQL endpoint URL
    - `headers` (object, optional): HTTP headers
    - `action` (string): What to fetch: "full-schema", "list-operations", or "get-type"
    - `typeName` (string, optional): Type name (required when action is "get-type")
    - `useCache` (boolean, optional): Use cached schema if available. Default: true
    - `cacheTTL` (number, optional): Cache time-to-live in milliseconds. Default: 300000

**Returns:**
For execution:
```json
{
  "data": { "user": { "id": "1", "name": "John Doe" } },
  "errors": [],
  "extensions": {}
}
```

For introspection:
```json
{
  "operations": {
    "queries": ["getUser", "listUsers"],
    "mutations": ["createUser", "updateUser"],
    "subscriptions": []
  }
}
```

**Example Usage:**
```javascript
// Execute a query
graphql({
  action: {
    type: "execute",
    endpoint: "https://api.example.com/graphql",
    query: `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `,
    variables: { id: "123" },
    headers: { "Authorization": "Bearer token123" }
  }
})

// Introspect schema
graphql({
  action: {
    type: "introspect",
    endpoint: "https://api.example.com/graphql",
    action: "list-operations"
  }
})
```

### WebSocket

#### `socket`
Manage WebSocket connections - connect, send, receive messages, list connections, and close.

**Parameters:**
- `action` (object, required): Action to perform with discriminated union:
  - For listing connections:
    - `type`: "list"
  - For connecting:
    - `type`: "connect"
    - `url` (string): WebSocket URL (ws:// or wss://)
    - `protocols` (array, optional): WebSocket subprotocols
    - `headers` (object, optional): HTTP headers for connection
    - `autoReconnect` (boolean, optional): Auto-reconnect on disconnection. Default: false
    - `maxReconnectAttempts` (number, optional): Max reconnection attempts. Default: 5
    - `reconnectInterval` (number, optional): Base reconnect interval in ms. Default: 1000
    - `messageHistoryLimit` (number, optional): Max messages to keep. Default: 100
  - For sending:
    - `type`: "send"
    - `socketId` (string): Socket connection ID
    - `message` (string or object): Message to send
    - `binary` (boolean, optional): Send as binary data. Default: false
  - For receiving:
    - `type`: "receive"
    - `socketId` (string): Socket connection ID
    - `action` (string): "get-latest", "get-all", or "get-since"
    - `since` (string, optional): ISO timestamp for get-since
    - `clearAfterRead` (boolean, optional): Clear queue after reading. Default: false
  - For closing:
    - `type`: "close"
    - `socketId` (string): Socket connection ID
    - `code` (number, optional): Close code. Default: 1000
    - `reason` (string, optional): Close reason. Default: "Normal closure"

**Returns:**
For connect:
```json
{
  "socketId": "ws_1234567890_abc123",
  "url": "wss://example.com/socket",
  "readyState": "OPEN",
  "protocol": "",
  "messageCount": 0
}
```

**Example Usage:**
```javascript
// Connect to WebSocket
socket({
  action: {
    type: "connect",
    url: "wss://example.com/socket",
    headers: { "Authorization": "Bearer token123" },
    autoReconnect: true
  }
})

// Send message
socket({
  action: {
    type: "send",
    socketId: "ws_1234567890_abc123",
    message: { type: "subscribe", channel: "updates" }
  }
})

// Receive messages
socket({
  action: {
    type: "receive",
    socketId: "ws_1234567890_abc123",
    action: "get-latest"
  }
})
```

### Browser Automation

#### `puppeteer`
Control browsers and pages with Puppeteer - launch/close browsers, open/close pages, execute JavaScript, and more.

**Parameters:**
- `action` (object, required): Action to perform with discriminated union:
  - For listing browsers:
    - `type`: "list-browsers"
  - For launching browser:
    - `type`: "launch-browser"
    - `headless` (boolean, optional): Run in headless mode. Default: false
    - `width` (number, optional): Window width. Default: 1280
    - `height` (number, optional): Window height. Default: 720
    - `url` (string, optional): URL to navigate to after launch
  - For closing browser:
    - `type`: "close-browser"
    - `browserId` (string): Browser instance ID
  - For listing pages:
    - `type`: "list-pages"
  - For opening page:
    - `type`: "open-page"
    - `browserId` (string): Browser instance ID
    - `url` (string, optional): URL to navigate to
  - For closing page:
    - `type`: "close-page"
    - `pageId` (string): Page ID
  - For executing code:
    - `type`: "exec-page"
    - `pageId` (string): Page ID
    - `source` (string): JavaScript code to execute (has access to `page` object)

**Returns:**
For launch-browser:
```json
{
  "success": true,
  "browserId": "browser_1234567890_abc123",
  "message": "Browser launched successfully",
  "config": {
    "headless": false,
    "width": 1280,
    "height": 720
  }
}
```

**Example Usage:**
```javascript
// Launch browser and navigate
puppeteer({
  action: {
    type: "launch-browser",
    headless: false,
    url: "https://example.com"
  }
})

// Execute page automation
puppeteer({
  action: {
    type: "exec-page",
    pageId: "page_id",
    source: `
      await page.goto('https://example.com');
      await page.type('#search', 'hello world');
      await page.click('#submit');
      const title = await page.title();
      return title;
    `
  }
})
```

### Documentation

#### `get-rules`
Get comprehensive documentation about this MCP server.

**Parameters:**
- `random_string` (string): Dummy parameter for no-parameter tools

**Returns:** Complete documentation including schemas, use cases, and best practices.

## Use Cases

### API Integration
Use the `fetch` tool to integrate with REST APIs, webhooks, and external services.

```javascript
// Fetch data from REST API
fetch({
  url: "https://api.github.com/users/octocat",
  headers: { "Accept": "application/vnd.github.v3+json" }
})

// Submit form data
fetch({
  url: "https://api.example.com/submit",
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: "name=John&email=john@example.com"
})
```

### GraphQL Operations
Use the `graphql` tool for type-safe API queries and schema exploration.

```javascript
// Query user data
graphql({
  action: {
    type: "execute",
    endpoint: "https://api.example.com/graphql",
    query: `query { users { id name email } }`
  }
})

// Explore available operations
graphql({
  action: {
    type: "introspect",
    endpoint: "https://api.example.com/graphql",
    action: "list-operations"
  }
})
```

### Real-time Communication
Use the `socket` tool for WebSocket connections, chat applications, and live data feeds.

```javascript
// Connect to chat server
socket({
  action: {
    type: "connect",
    url: "wss://chat.example.com",
    autoReconnect: true
  }
})

// Subscribe to live updates
socket({
  action: {
    type: "send",
    socketId: "socket_id",
    message: { action: "subscribe", topics: ["news", "alerts"] }
  }
})
```

### Web Automation
Use the `puppeteer` tool for web scraping, automated testing, and browser interactions.

```javascript
// Automated form submission
puppeteer({
  action: {
    type: "exec-page",
    pageId: "page_id",
    source: `
      await page.goto('https://forms.example.com');
      await page.type('#name', 'John Doe');
      await page.type('#email', 'john@example.com');
      await page.click('#submit');
      await page.waitForNavigation();
      return page.url();
    `
  }
})

// Screenshot generation
puppeteer({
  action: {
    type: "exec-page",
    pageId: "page_id",
    source: `
      await page.goto('https://example.com');
      const screenshot = await page.screenshot({ encoding: 'base64' });
      return screenshot;
    `
  }
})
```

## Best Practices

### General
1. **Always handle errors** - Wrap operations in try-catch blocks
2. **Use appropriate timeouts** - Set reasonable timeouts for network operations
3. **Clean up resources** - Close connections when done (browsers, websockets)
4. **Follow rate limits** - Respect API rate limits and add delays if needed

### HTTP & GraphQL
1. **Use proper headers** - Set Content-Type, Accept, and Authorization headers
2. **Handle redirects appropriately** - Consider security implications
3. **Validate responses** - Check status codes and response formats
4. **Use HTTPS** - Always prefer secure connections

### WebSockets
1. **Implement reconnection logic** - Use autoReconnect for critical connections
2. **Handle connection states** - Check readyState before sending
3. **Process messages efficiently** - Clear message queues regularly
4. **Use appropriate close codes** - Follow WebSocket close code standards

### Browser Automation
1. **Use headless mode for automation** - Better performance and resource usage
2. **Wait for elements** - Use waitForSelector before interacting
3. **Handle navigation** - Use waitForNavigation after clicks
4. **Limit concurrent browsers** - Avoid resource exhaustion
5. **Clean up pages and browsers** - Prevent memory leaks

## Installation

Dependencies are automatically installed when running the server. If you encounter issues:

```bash
# For browser automation (Puppeteer)
npx puppeteer browsers install chrome

# For all dependencies
npm install mcp-fetch
```

## Limitations

- Browser instances and WebSocket connections are stored in memory and lost on restart
- Each browser instance consumes significant system resources
- WebSocket message history is limited by messageHistoryLimit
- GraphQL introspection cache is temporary and cleared on restart
- File uploads are not directly supported (use base64 encoding in body)

## License

MIT
