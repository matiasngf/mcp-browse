import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('MCP Protocol Integration', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  describe('Tool Discovery', () => {
    test('should discover all available tools', async () => {
      const capabilities = await client.getCapabilities();
      
      expect(capabilities.tools).toBeDefined();
      expect(Array.isArray(capabilities.tools)).toBe(true);
      expect(capabilities.tools.length).toBeGreaterThan(0);
      
      // Check for expected tools
      const toolNames = capabilities.tools.map((t: any) => t.name);
      expect(toolNames).toContain('fetch');
      expect(toolNames).toContain('socket');
      expect(toolNames).toContain('puppeteer-browser');
      expect(toolNames).toContain('puppeteer-page');
      expect(toolNames).toContain('puppeteer-exec-page');
      expect(toolNames).toContain('graphql');
      expect(toolNames).toContain('graphql-introspect');
      expect(toolNames).toContain('get-rules');
    });

    test('should provide tool descriptions', async () => {
      const capabilities = await client.getCapabilities();
      
      capabilities.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    test('should provide tool input schemas', async () => {
      const capabilities = await client.getCapabilities();
      
      capabilities.tools.forEach((tool: any) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe('Resource Discovery', () => {
    test('should list available resources', async () => {
      const capabilities = await client.getCapabilities();
      
      expect(capabilities.resources).toBeDefined();
      expect(Array.isArray(capabilities.resources)).toBe(true);
      // Resources might be empty, which is fine
    });
  });

  describe('Prompt Discovery', () => {
    test('should list available prompts', async () => {
      const capabilities = await client.getCapabilities();
      
      expect(capabilities.prompts).toBeDefined();
      expect(Array.isArray(capabilities.prompts)).toBe(true);
      // Prompts might be empty, which is fine
    });
  });

  describe('Cross-Tool Integration', () => {
    let browserId: string | null = null;
    let pageId: string | null = null;

    afterEach(async () => {
      if (browserId) {
        try {
          await client.testBrowserClose(browserId);
        } catch (error) {
          // Ignore
        }
        browserId = null;
        pageId = null;
      }
    });

    test('should fetch content and scrape with puppeteer', async () => {
      // First, fetch content with HTTP
      const fetchResult = await client.testFetch('https://example.com');
      expect(fetchResult.status).toBe(200);
      expect(fetchResult.content).toContain('Example Domain');
      
      // Then scrape the same page with Puppeteer
      browserId = await client.testBrowserLaunch({ headless: true });
      pageId = await client.testPageCreate(browserId);
      
      const execResult = await client.testExecPage(pageId, `
        await page.goto('https://example.com');
        const title = await page.title();
        const h1Text = await page.$eval('h1', el => el.textContent);
        return { title, h1Text };
      `);
      
      expect(execResult.result.title).toBe('Example Domain');
      expect(execResult.result.h1Text).toBe('Example Domain');
    });

    test('should handle concurrent tool calls', async () => {
      // Run multiple tool calls concurrently
      const [fetchResult, rulesResult, capabilitiesResult] = await Promise.all([
        client.testFetch('https://httpbin.org/get'),
        client.testGetRules(),
        client.getCapabilities()
      ]);
      
      expect(fetchResult.status).toBe(200);
      expect(rulesResult.content).toContain('MCP Fetch');
      expect(capabilitiesResult.tools.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle tool not found error', async () => {
      try {
        await (client as any).client.callTool('non-existent-tool', {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      }
    });

    test('should handle invalid parameters across tools', async () => {
      const invalidCalls = [
        () => client.testFetch(''), // Empty URL
        () => client.testSocketConnect(''), // Empty WebSocket URL
        () => client.testExecPage('invalid-page-id', 'return 1;'), // Invalid page ID
      ];
      
      for (const invalidCall of invalidCalls) {
        try {
          await invalidCall();
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error).toBeDefined();
          expect(error.message).toMatch(/invalid|error|not found/i);
        }
      }
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle rapid sequential tool calls', async () => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await client.testFetch(`https://httpbin.org/get?index=${i}`);
        results.push(result);
      }
      
      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.content).toContain(`index=${index}`);
      });
    });

    test('should maintain state across tool calls', async () => {
      // Launch browser
      const browserId = await client.testBrowserLaunch({ headless: true });
      
      try {
        // Create multiple pages
        const pageIds = [];
        for (let i = 0; i < 3; i++) {
          const pageId = await client.testPageCreate(browserId);
          pageIds.push(pageId);
        }
        
        // Verify all pages exist
        const pageList = await client.testPageList();
        pageIds.forEach(id => {
          const page = pageList.pages.find((p: any) => p.id === id);
          expect(page).toBeDefined();
          expect(page.browserId).toBe(browserId);
        });
        
        // Clean up pages
        for (const pageId of pageIds) {
          await client.testPageClose(pageId);
        }
        
        // Verify pages are cleaned
        const finalPageList = await client.testPageList();
        pageIds.forEach(id => {
          const page = finalPageList.pages.find((p: any) => p.id === id);
          expect(page).toBeUndefined();
        });
      } finally {
        await client.testBrowserClose(browserId);
      }
    });
  });
});
