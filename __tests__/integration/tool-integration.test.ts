import { getClient, getTestServerUrl } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Tool Integration Tests', () => {
  let client: MCPTestHelper;
  let testServerUrl: string;

  beforeAll(() => {
    client = getClient();
    testServerUrl = getTestServerUrl();
  });

  describe('Basic Tool Functionality', () => {
    test('get-rules tool should work', async () => {
      const result = await client.testGetRules();

      expect(result).toBeDefined();
      expect(result.quickStart).toBeDefined();
      expect(result.tools).toBeDefined();
    });

    test('fetch tool should work with mock httpbin', async () => {
      const result = await client.testFetch(`${testServerUrl}/get`);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      // Mock server returns JSON with the request details
      expect(result.body.url).toBe(`${testServerUrl}/get`);
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
      const wsUrl = testServerUrl.replace('http://', 'ws://') + '/ws';
      const socketId = await client.testSocketConnect(wsUrl);
      expect(socketId).toBeDefined();
      try {
        await client.testSocketClose(socketId);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });


});
