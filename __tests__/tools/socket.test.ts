import { getClient, getTestServerUrl } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('WebSocket Tool', () => {
  let client: MCPTestHelper;
  let socketId: string | null = null;
  let wsUrl: string;

  beforeAll(() => {
    client = getClient();
    const testServerUrl = getTestServerUrl();
    wsUrl = testServerUrl.replace('http://', 'ws://') + '/ws';
  });

  afterEach(async () => {
    // Clean up any open sockets after each test
    if (socketId) {
      try {
        await client.testSocketClose(socketId!);
      } catch (error) {
        // Socket might already be closed
      }
      socketId = null;
    }
  });

  describe('Connection Management', () => {
    test('should connect to WebSocket server', async () => {
      socketId = await client.testSocketConnect(wsUrl);

      expect(socketId).toBeDefined();
      expect(typeof socketId).toBe('string');
      expect(socketId).toMatch(/^socket-/);
    });

    test('should list connected sockets', async () => {
      socketId = await client.testSocketConnect(wsUrl);

      const result = await client.testSocketList();

      expect(result.success).toBe(true);
      expect(result.sockets).toBeDefined();
      expect(result.sockets.length).toBeGreaterThan(0);

      const socket = result.sockets.find((s: any) => s.id === socketId);
      expect(socket).toBeDefined();
      expect(socket.status).toBe('open');
      expect(socket.url).toBe(wsUrl);
    });

    test('should close WebSocket connection', async () => {
      socketId = await client.testSocketConnect(wsUrl);

      const closeResult = await client.testSocketClose(socketId!);

      expect(closeResult.success).toBe(true);
      expect(closeResult.message).toContain('closed successfully');

      // Verify socket is no longer in the list
      const listResult = await client.testSocketList();
      const socket = listResult.sockets.find((s: any) => s.id === socketId);
      expect(socket).toBeUndefined();

      socketId = null; // Already closed
    });

    test('should connect with custom configuration', async () => {
      socketId = await client.testSocketConnect(wsUrl, {
        headers: {
          'X-Custom-Header': 'test-value'
        },
        autoReconnect: true,
        maxReconnectAttempts: 3,
        reconnectInterval: 500
      });

      expect(socketId).toBeDefined();

      const result = await client.testSocketList();
      const socket = result.sockets.find((s: any) => s.id === socketId);
      expect(socket).toBeDefined();
      expect(socket.status).toBe('open');
    });
  });

  describe('Message Exchange', () => {
    beforeEach(async () => {
      socketId = await client.testSocketConnect(wsUrl);
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('should send text messages', async () => {
      const testMessage = 'Hello WebSocket!';
      const sendResult = await client.testSocketSend(socketId!, testMessage);
      expect(sendResult.success).toBe(true);
    });
  });

  describe('Message History Management', () => {
    test('should retrieve messages', async () => {
      socketId = await client.testSocketConnect(wsUrl);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await client.testSocketReceive(socketId!, 'get-all');
      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle basic error cases', async () => {
      const result = await client.testSocketSend('non-existent-socket-id', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Multiple Connections', () => {
    test('should handle multiple connections', async () => {
      socketId = await client.testSocketConnect(wsUrl);
      const socketId2 = await client.testSocketConnect(wsUrl);

      try {
        expect(socketId).not.toBe(socketId2);
        const result = await client.testSocketList();
        expect(result.sockets.length).toBeGreaterThanOrEqual(2);
      } finally {
        await client.testSocketClose(socketId2);
      }
    });
  });
});
