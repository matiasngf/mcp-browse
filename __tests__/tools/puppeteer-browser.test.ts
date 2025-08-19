import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Puppeteer Browser Tool', () => {
  let client: MCPTestHelper;
  let browserId: string | null = null;

  beforeAll(() => {
    client = getClient();
  });

  afterEach(async () => {
    // Clean up any open browsers after each test
    if (browserId) {
      try {
        await client.testBrowserClose(browserId);
      } catch (error) {
        // Browser might already be closed
      }
      browserId = null;
    }
  });

  describe('Browser Lifecycle', () => {
    test('should launch browser in headless mode', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      expect(browserId).toBeDefined();
      expect(typeof browserId).toBe('string');
      expect(browserId).toMatch(/^browser-/);
    });

    test('should launch browser in headed mode', async () => {
      browserId = await client.testBrowserLaunch({ headless: false });

      expect(browserId).toBeDefined();
      expect(typeof browserId).toBe('string');
    });

    test('should launch browser with custom window size', async () => {
      browserId = await client.testBrowserLaunch({
        headless: true,
        width: 1920,
        height: 1080
      });

      expect(browserId).toBeDefined();

      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.config.width).toBe(1920);
      expect(browser.config.height).toBe(1080);
    });

    test('should launch browser and navigate to URL', async () => {
      browserId = await client.testBrowserLaunch({
        headless: true,
        url: 'https://example.com'
      });

      expect(browserId).toBeDefined();

      // Get browser list to check tabs
      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.tabs.length).toBeGreaterThan(0);
      expect(browser.tabs[0].url).toContain('example.com');
    });

    test('should close browser successfully', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      const closeResult = await client.testBrowserClose(browserId);

      expect(closeResult.success).toBe(true);
      expect(closeResult.message).toContain('closed successfully');

      // Verify browser is no longer in the list
      const listResult = await client.testBrowserList();
      const browser = listResult.browsers.find((b: any) => b.id === browserId);
      expect(browser).toBeUndefined();

      browserId = null; // Already closed
    });
  });

  describe('Browser Management', () => {
    test('should list all browsers', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      const result = await client.testBrowserList();

      expect(result.success).toBe(true);
      expect(result.browserCount).toBeGreaterThanOrEqual(1);
      expect(result.browsers).toBeDefined();
      expect(Array.isArray(result.browsers)).toBe(true);

      const browser = result.browsers.find((b: any) => b.id === browserId);
      expect(browser).toBeDefined();
      expect(browser.createdAt).toBeDefined();
      expect(browser.isConnected).toBe(true);
    });

    test('should handle multiple browsers', async () => {
      const browserId1 = await client.testBrowserLaunch({ headless: true });
      const browserId2 = await client.testBrowserLaunch({ headless: true });

      try {
        expect(browserId1).not.toBe(browserId2);

        const result = await client.testBrowserList();
        expect(result.browserCount).toBeGreaterThanOrEqual(2);

        const browser1 = result.browsers.find((b: any) => b.id === browserId1);
        const browser2 = result.browsers.find((b: any) => b.id === browserId2);

        expect(browser1).toBeDefined();
        expect(browser2).toBeDefined();
      } finally {
        // Clean up both browsers
        await client.testBrowserClose(browserId1);
        await client.testBrowserClose(browserId2);
        browserId = null;
      }
    });

    test('should show browser tab information', async () => {
      browserId = await client.testBrowserLaunch({
        headless: true,
        url: 'https://example.com'
      });

      // Create additional page
      const pageId = await client.testPageCreate(browserId);

      try {
        const result = await client.testBrowserList();
        const browser = result.browsers.find((b: any) => b.id === browserId);

        expect(browser.tabCount).toBeGreaterThanOrEqual(2);
        expect(browser.tabs).toBeDefined();
        expect(browser.tabs.length).toBeGreaterThanOrEqual(2);

        // Check tab information
        browser.tabs.forEach((tab: any) => {
          expect(tab).toHaveProperty('index');
          expect(tab).toHaveProperty('url');
        });
      } finally {
        await client.testPageClose(pageId);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle close non-existent browser', async () => {
      try {
        await client.testBrowserClose('non-existent-browser-id');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      }
    });

    test('should handle browser disconnection', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      // Close the browser directly
      await client.testBrowserClose(browserId);
      browserId = null;

      // Try to list browsers - disconnected browser should not be there
      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);
      expect(browser).toBeUndefined();
    });

    test('should handle invalid browser launch options', async () => {
      // Test with invalid window size (should still work with defaults)
      browserId = await client.testBrowserLaunch({
        headless: true,
        width: -100,
        height: -100
      });

      expect(browserId).toBeDefined();

      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      // Should use default sizes or handle gracefully
      expect(browser).toBeDefined();
    });
  });

  describe('Browser Properties', () => {
    test('should track browser creation time', async () => {
      const beforeCreate = new Date();
      browserId = await client.testBrowserLaunch({ headless: true });
      const afterCreate = new Date();

      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser.createdAt).toBeDefined();
      const createdAt = new Date(browser.createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('should show browser connection status', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser.isConnected).toBe(true);
    });

    test('should generate unique browser IDs', async () => {
      const browserIds = new Set<string>();

      try {
        // Launch multiple browsers
        for (let i = 0; i < 3; i++) {
          const id = await client.testBrowserLaunch({ headless: true });
          browserIds.add(id);
        }

        // All IDs should be unique
        expect(browserIds.size).toBe(3);

        // All should follow the naming pattern
        browserIds.forEach(id => {
          expect(id).toMatch(/^browser-[\w-]+$/);
        });
      } finally {
        // Clean up all browsers
        for (const id of browserIds) {
          try {
            await client.testBrowserClose(id);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
        browserId = null;
      }
    });
  });

  describe('Browser with Pages Integration', () => {
    test('should clean up pages when browser closes', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });

      // Create multiple pages
      const pageIds = [];
      for (let i = 0; i < 3; i++) {
        const pageId = await client.testPageCreate(browserId);
        pageIds.push(pageId);
      }

      // Close browser
      const closeResult = await client.testBrowserClose(browserId);
      expect(closeResult.cleanedPagesCount).toBeGreaterThanOrEqual(3);

      // Verify pages are also cleaned up
      const pageList = await client.testPageList();
      const remainingPages = pageIds.filter(id =>
        pageList.pages.some((p: any) => p.id === id)
      );

      expect(remainingPages.length).toBe(0);
      browserId = null;
    });
  });
});
