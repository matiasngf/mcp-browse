import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Tool Integration Tests', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  describe('Basic Tool Functionality', () => {
    test('get-rules tool should work', async () => {
      const result = await client.testGetRules();

      expect(result).toBeDefined();
      expect(result.quickStart).toBeDefined();
      expect(result.tools).toBeDefined();
    });

    test('fetch tool should work with httpbin', async () => {
      const result = await client.testFetch('https://httpbin.org/get');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      // httpbin returns JSON with the request details
      expect(result.body.url).toBe('https://httpbin.org/get');
    });
  });

  describe('Browser Tools', () => {
    test('should launch browser', async () => {
      const browserId = await client.testBrowserLaunch({ headless: true });
      expect(browserId).toBeDefined();
      try {
        await client.testBrowserClose(browserId);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  describe('WebSocket Tools', () => {
    test('should connect to WebSocket', async () => {
      const socketId = await client.testSocketConnect('wss://echo.websocket.org');
      expect(socketId).toBeDefined();
      try {
        await client.testSocketClose(socketId);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });


});
