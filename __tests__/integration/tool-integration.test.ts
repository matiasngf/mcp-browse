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
    let browserId: string | null = null;
    let pageId: string | null = null;

    afterEach(async () => {
      if (browserId) {
        try {
          await client.testBrowserClose(browserId);
        } catch (error) {
          // Ignore cleanup errors
        }
        browserId = null;
        pageId = null;
      }
    });

    test('should launch browser and create page', async () => {
      // Launch browser
      browserId = await client.testBrowserLaunch({ headless: true });
      expect(browserId).toBeDefined();
      expect(typeof browserId).toBe('string');

      // Create page
      pageId = await client.testPageCreate(browserId);
      expect(pageId).toBeDefined();
      expect(typeof pageId).toBe('string');

      // Execute JavaScript on page
      const result = await client.testExecPage(pageId, `
        await page.goto('https://www.google.com');
        const title = await page.title();
        return title;
      `);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result).toContain('Google');
    });

    test('should list browsers', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      const result = await client.testBrowserList();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.browsers).toBeDefined();
      expect(Array.isArray(result.browsers)).toBe(true);
      expect(result.browsers.length).toBeGreaterThan(0);
    });

    test('should list pages', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });
      pageId = await client.testPageCreate(browserId);

      const result = await client.testPageList();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.pages).toBeDefined();
      expect(Array.isArray(result.pages)).toBe(true);
      expect(result.pages.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Tools', () => {
    let socketId: string | null = null;

    afterEach(async () => {
      if (socketId) {
        try {
          await client.testSocketClose(socketId);
        } catch (error) {
          // Ignore cleanup errors
        }
        socketId = null;
      }
    });

    test('should connect to WebSocket echo server', async () => {
      socketId = await client.testSocketConnect('wss://echo.websocket.org');

      expect(socketId).toBeDefined();
      expect(typeof socketId).toBe('string');

      const listResult = await client.testSocketList();
      expect(listResult.success).toBe(true);
      expect(listResult.sockets.length).toBeGreaterThan(0);
    });
  });

  describe('GraphQL Tools', () => {
    test('should handle GraphQL query error', async () => {
      const query = `
        query {
          __typename
        }
      `;

      const result = await client.testGraphQL('https://graphql.github.com/graphql', query);

      // GitHub GraphQL API requires authentication - might return 401 or 404
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('GraphQLError');
      expect(result.status).toBeDefined();
      expect([401, 404]).toContain(result.status);
    });

    test('should introspect GraphQL schema', async () => {
      const result = await client.testGraphQLIntrospect(
        'https://countries.trevorblades.com/',
        'list-operations'
      );

      expect(result).toBeDefined();
      // If it works, we should get operations
      if (result.success) {
        expect(result.operations).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid tool calls gracefully', async () => {
      const result = await client.testFetch(''); // Empty URL

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse URL');
    });

    test('should handle non-existent resources', async () => {
      const result = await client.testPageClose('non-existent-page-id');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple tool calls concurrently', async () => {
      const [rulesResult, fetchResult1, fetchResult2] = await Promise.all([
        client.testGetRules(),
        client.testFetch('https://httpbin.org/get?test=1'),
        client.testFetch('https://httpbin.org/get?test=2')
      ]);

      expect(rulesResult).toBeDefined();
      expect(rulesResult.quickStart).toBeDefined();

      expect(fetchResult1).toBeDefined();
      expect(fetchResult1.success).toBe(true);
      expect(fetchResult1.body).toBeDefined();
      expect(fetchResult1.body.args).toBeDefined();
      expect(fetchResult1.body.args.test).toBe('1');

      expect(fetchResult2).toBeDefined();
      expect(fetchResult2.success).toBe(true);
      expect(fetchResult2.body).toBeDefined();
      expect(fetchResult2.body.args).toBeDefined();
      expect(fetchResult2.body.args.test).toBe('2');
    });
  });
});
