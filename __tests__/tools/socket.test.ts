import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('WebSocket Tool', () => {
  let client: MCPTestHelper;
  let socketId: string | null = null;

  beforeAll(() => {
    client = getClient();
  });

  afterEach(async () => {
    // Clean up any open sockets after each test
    if (socketId) {
      try {
        await client.testSocketClose(socketId);
      } catch (error) {
        // Socket might already be closed
      }
      socketId = null;
    }
  });

  describe('Connection Management', () => {
    test('should connect to WebSocket server', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org');

      expect(socketId).toBeDefined();
      expect(typeof socketId).toBe('string');
      expect(socketId).toMatch(/^socket-/);
    });

    test('should list connected sockets', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org');

      const result = await client.testSocketList();

      expect(result.success).toBe(true);
      expect(result.sockets).toBeDefined();
      expect(result.sockets.length).toBeGreaterThan(0);

      const socket = result.sockets.find((s: any) => s.id === socketId);
      expect(socket).toBeDefined();
      expect(socket.status).toBe('open');
      expect(socket.url).toBe('wss://echo.websocket.org');
    });

    test('should close WebSocket connection', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org');

      const closeResult = await client.testSocketClose(socketId);

      expect(closeResult.success).toBe(true);
      expect(closeResult.message).toContain('closed successfully');

      // Verify socket is no longer in the list
      const listResult = await client.testSocketList();
      const socket = listResult.sockets.find((s: any) => s.id === socketId);
      expect(socket).toBeUndefined();

      socketId = null; // Already closed
    });

    test('should connect with custom configuration', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org', {
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
      // Create a fresh connection for each message test
      socketId = await client.testSocketConnect('wss://echo.websocket.org');
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('should send and receive text messages', async () => {
      const testMessage = 'Hello WebSocket!';

      const sendResult = await client.testSocketSend(socketId!, testMessage);
      expect(sendResult.success).toBe(true);

      // Wait a bit for echo
      await new Promise(resolve => setTimeout(resolve, 500));

      const messages = await client.testSocketReceive(socketId!);

      expect(messages.success).toBe(true);
      expect(messages.messages).toBeDefined();
      expect(messages.messages.length).toBeGreaterThan(0);

      // Find the received message (data might be Buffer or string)
      const receivedMessage = messages.messages.find((m: any) => {
        if (m.type !== 'received') return false;
        const data = typeof m.data === 'string' ? m.data : m.data.toString();
        return data === testMessage;
      });
      expect(receivedMessage).toBeDefined();
    });

    test('should send and receive JSON messages', async () => {
      const testData = { type: 'test', value: 123, nested: { key: 'value' } };

      const sendResult = await client.testSocketSend(socketId!, testData);
      expect(sendResult.success).toBe(true);

      // Wait for echo
      await new Promise(resolve => setTimeout(resolve, 500));

      const messages = await client.testSocketReceive(socketId!);

      expect(messages.success).toBe(true);
      const receivedMessage = messages.messages.find((m: any) => {
        if (m.type !== 'received') return false;
        const data = typeof m.data === 'string' ? m.data : m.data.toString();
        return data.includes('"type":"test"');
      });
      expect(receivedMessage).toBeDefined();
    });

    test('should handle binary messages', async () => {
      const sendResult = await client.testSocketSend(socketId!, 'Binary test', true);
      expect(sendResult.success).toBe(true);

      // Wait for echo
      await new Promise(resolve => setTimeout(resolve, 500));

      const messages = await client.testSocketReceive(socketId!);
      expect(messages.success).toBe(true);
      expect(messages.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Message History Management', () => {
    beforeEach(async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org', {
        messageHistoryLimit: 5
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('should retrieve latest messages', async () => {
      // Send multiple messages
      for (let i = 0; i < 3; i++) {
        await client.testSocketSend(socketId!, `Message ${i}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Wait for all echoes
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await client.testSocketReceive(socketId!, 'get-latest');

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBeLessThanOrEqual(10); // get-latest returns last 10
    });

    test('should retrieve all messages', async () => {
      // Send messages
      for (let i = 0; i < 3; i++) {
        await client.testSocketSend(socketId!, `All message ${i}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Wait for echoes
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await client.testSocketReceive(socketId!, 'get-all');

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
      // Should have both sent and received messages
      expect(result.messages.length).toBeGreaterThanOrEqual(3);
    });

    test('should clear message history after read', async () => {
      // Send a message
      await client.testSocketSend(socketId!, 'Clear test');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all messages with clear flag
      const result = await client.testSocketReceive(socketId!, 'get-all', true);
      expect(result.success).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);

      // Check that history is cleared
      const afterClear = await client.testSocketReceive(socketId!, 'get-all');
      expect(afterClear.messages.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle connection to invalid URL', async () => {
      const result = await client.testSocketConnect('ws://invalid-websocket-url-12345.com');

      // xmcp tools return error objects instead of throwing
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle send to non-existent socket', async () => {
      const result = await client.testSocketSend('non-existent-socket-id', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    test('should handle receive from non-existent socket', async () => {
      const result = await client.testSocketReceive('non-existent-socket-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    test('should handle close non-existent socket', async () => {
      const result = await client.testSocketClose('non-existent-socket-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    test('should validate WebSocket URL protocol', async () => {
      const result = await client.testSocketConnect('https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('WebSocket URL must start with ws:// or wss://');
    });
  });

  describe('Multiple Connections', () => {
    let socketId2: string | null = null;

    afterEach(async () => {
      if (socketId2) {
        try {
          await client.testSocketClose(socketId2);
        } catch (error) {
          // Socket might already be closed
        }
        socketId2 = null;
      }
    });

    test('should handle multiple concurrent connections', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org');
      socketId2 = await client.testSocketConnect('wss://echo.websocket.org');

      expect(socketId).not.toBe(socketId2);

      const result = await client.testSocketList();
      expect(result.sockets.length).toBeGreaterThanOrEqual(2);

      // Send different messages to each
      await client.testSocketSend(socketId, 'Socket 1 message');
      await client.testSocketSend(socketId2, 'Socket 2 message');

      // Wait for echoes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check messages are separate
      const messages1 = await client.testSocketReceive(socketId);
      const messages2 = await client.testSocketReceive(socketId2);

      // Convert data to string for comparison
      const hasMessage1 = messages1.messages.some((m: any) => {
        const data = typeof m.data === 'string' ? m.data : m.data.toString();
        return data.includes('Socket 1');
      });
      const hasMessage2 = messages2.messages.some((m: any) => {
        const data = typeof m.data === 'string' ? m.data : m.data.toString();
        return data.includes('Socket 2');
      });

      expect(hasMessage1).toBe(true);
      expect(hasMessage2).toBe(true);
    });
  });
});
