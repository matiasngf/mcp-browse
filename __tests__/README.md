# MCP Fetch Testing Infrastructure

This directory contains comprehensive tests for the MCP Fetch server using Jest and the official MCP TypeScript SDK.

## Overview

The testing infrastructure uses the official [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) to create a proper MCP client that communicates with our server via stdio transport. This ensures our tests accurately reflect how the server will be used in production.

## Test Structure

```
__tests__/
├── setup/
│   └── jest.setup.ts        # Global test setup and teardown
├── test-utils/
│   ├── mcp-client.ts        # MCP client wrapper using official SDK
│   └── jest-mcp-helper.ts   # Test helper utilities
├── tools/                   # Unit tests for each tool
│   ├── fetch.test.ts
│   ├── socket.test.ts
│   ├── puppeteer-browser.test.ts
│   ├── puppeteer-page.test.ts
│   ├── puppeteer-exec-page.test.ts
│   ├── graphql.test.ts
│   ├── graphql-introspect.test.ts
│   └── get-rules.test.ts
├── integration/             # Integration tests
│   └── mcp-protocol.test.ts
└── README.md               # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only tool tests
npm run test:tools

# Run only integration tests
npm run test:integration

# Run tests with verbose output
npm run test:verbose
```

## Test Categories

### Tool Tests
Each tool has its own test file covering:
- Basic functionality
- Edge cases
- Error handling
- Parameter validation
- Response validation

### Integration Tests
- Tool discovery and capabilities
- Cross-tool workflows
- State management
- Concurrent operations
- Performance characteristics

## Key Components

### MCP Client (`mcp-client.ts`)
- Uses the official MCP SDK's `Client` and `StdioClientTransport`
- Handles connection management and retries
- Provides type-safe tool invocation
- Manages error handling and response parsing

### Test Helper (`jest-mcp-helper.ts`)
- Wraps the MCP client with test-friendly methods
- Provides simplified APIs for each tool
- Handles common test scenarios
- Includes utility methods for testing

### Global Setup (`jest.setup.ts`)
- Builds the server before running tests
- Initializes a single MCP client for all tests
- Handles cleanup after tests complete
- Configures test timeouts

## Writing New Tests

### Tool Test Template
```typescript
import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Tool Name', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  test('should perform basic operation', async () => {
    const result = await client.testToolMethod(params);
    expect(result).toBeDefined();
    // Add assertions
  });
});
```

### Best Practices
1. **Cleanup**: Always clean up resources (browsers, sockets) in `afterEach`
2. **Timeouts**: Use appropriate timeouts for async operations
3. **Error Testing**: Test both success and failure scenarios
4. **Real Services**: Use real test services (httpbin.org, echo.websocket.org) when possible
5. **Isolation**: Each test should be independent and not rely on others

## Debugging Tests

### Verbose Output
```bash
npm run test:verbose
```

### Single Test File
```bash
npm test -- fetch.test.ts
```

### Single Test
```bash
npm test -- --testNamePattern="should perform GET request"
```

### Debug Mode
Add `console.log` statements or use VS Code's Jest debugger

## Coverage

Run coverage reports to ensure comprehensive testing:
```bash
npm run test:coverage
```

Coverage reports are generated in:
- Terminal output (summary)
- `coverage/lcov-report/index.html` (detailed HTML report)

## CI/CD Integration

The test suite is designed to run in CI environments:
- Automatic server build before tests
- Headless browser support for Puppeteer
- Configurable timeouts
- Clean resource management

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure the server builds successfully with `npm run build`
2. **Connection Timeouts**: Check that no other process is using the stdio streams
3. **Browser Tests**: Puppeteer may need to download Chromium on first run
4. **Network Tests**: Some tests require internet connectivity

### Tips
- Run tests individually to isolate issues
- Check the server logs if tests fail unexpectedly
- Ensure all dependencies are installed with `npm install`
- Use `--runInBand` flag for sequential test execution if needed
