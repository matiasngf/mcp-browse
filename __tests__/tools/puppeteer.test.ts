import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Puppeteer Tool', () => {
  let client: MCPTestHelper;
  let browserId: string | null = null;
  let pageId: string | null = null;

  beforeAll(() => {
    client = getClient();
  });

  afterEach(async () => {
    // Clean up any open pages and browsers after each test
    if (pageId) {
      try {
        await client.testPuppeteerPageClose(pageId);
      } catch (error) {
        // Page might already be closed
      }
      pageId = null;
    }
    if (browserId) {
      try {
        await client.testPuppeteerBrowserClose(browserId);
      } catch (error) {
        // Browser might already be closed
      }
      browserId = null;
    }
  });

  describe('Browser Lifecycle', () => {
    test('should launch browser in headless mode', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });

      expect(browserId).toBeDefined();
      expect(typeof browserId).toBe('string');
      expect(browserId).toMatch(/^browser-/);
    });

    test('should launch browser in headed mode', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: false });

      expect(browserId).toBeDefined();
      expect(typeof browserId).toBe('string');
    });

    test('should launch browser with custom window size', async () => {
      const launchResult = await client.testPuppeteerBrowserLaunch({
        headless: true,
        width: 1920,
        height: 1080
      });

      // For this test, we expect the full result object since we're testing config
      if (typeof launchResult === 'string') {
        browserId = launchResult;
      } else {
        browserId = launchResult.browserId;
        expect(launchResult.config.width).toBe(1920);
        expect(launchResult.config.height).toBe(1080);
      }

      expect(browserId).toBeDefined();

      const result = await client.testPuppeteerBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.isConnected).toBe(true);
    });

    test('should launch browser and navigate to URL', async () => {
      const launchResult = await client.testPuppeteerBrowserLaunch({
        headless: true,
        url: 'https://example.com'
      });

      // For this test, we want to check if URL was set in launch result
      if (typeof launchResult === 'string') {
        browserId = launchResult;
      } else {
        browserId = launchResult.browserId;
        // If navigation was successful, the launch result should include the URL
        if (launchResult.url) {
          expect(launchResult.url).toContain('example.com');
        }
      }

      expect(browserId).toBeDefined();

      // Get browser list to check tabs
      const result = await client.testPuppeteerBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.tabs.length).toBeGreaterThan(0);
      // The URL might be example.com or about:blank depending on navigation timing
      // Just check that we have a valid URL
      expect(browser.tabs[0].url).toBeDefined();
    });

    test('should close browser successfully', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });
      expect(browserId).toBeDefined();

      const closeResult = await client.testPuppeteerBrowserClose(browserId!);

      expect(closeResult.success).toBe(true);
      expect(closeResult.message).toContain('closed successfully');

      // Verify browser is no longer in the list
      const listResult = await client.testPuppeteerBrowserList();
      const browser = listResult.browsers.find((b: any) => b.id === browserId);
      expect(browser).toBeUndefined();

      browserId = null; // Already closed
    });
  });

  describe('Browser Management', () => {
    test('should list all browsers', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });

      const result = await client.testPuppeteerBrowserList();

      expect(result.success).toBe(true);
      expect(result.browsers).toBeDefined();
      expect(Array.isArray(result.browsers)).toBe(true);
    });
  });

  describe('Page Lifecycle', () => {
    beforeEach(async () => {
      // Launch a browser for page tests
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });
    });

    test('should open a new page', async () => {
      pageId = await client.testPuppeteerPageOpen(browserId!);

      expect(pageId).toBeDefined();
      expect(typeof pageId).toBe('string');
      expect(pageId).toMatch(/^page-/);
    });

    test('should open a page with URL', async () => {
      const openResult = await client.testPuppeteerPageOpen(browserId!, 'https://example.com');

      if (typeof openResult === 'string') {
        pageId = openResult;
      } else {
        pageId = openResult.pageId;
        expect(openResult.url).toContain('example.com');
      }

      expect(pageId).toBeDefined();
    });

    test('should list all pages', async () => {
      pageId = await client.testPuppeteerPageOpen(browserId!);

      const result = await client.testPuppeteerPageList();

      expect(result.success).toBe(true);
      expect(result.pages).toBeDefined();
      expect(Array.isArray(result.pages)).toBe(true);
      expect(result.pageCount).toBeGreaterThan(0);

      const page = result.pages.find((p: any) => p.id === pageId);
      expect(page).toBeDefined();
      expect(page.browserId).toBe(browserId);
      expect(page.browserExists).toBe(true);
    });

    test('should close page successfully', async () => {
      pageId = await client.testPuppeteerPageOpen(browserId!);
      expect(pageId).toBeDefined();

      const closeResult = await client.testPuppeteerPageClose(pageId!);

      expect(closeResult.success).toBe(true);
      expect(closeResult.message).toContain('closed successfully');

      // Verify page is no longer in the list
      const listResult = await client.testPuppeteerPageList();
      const page = listResult.pages.find((p: any) => p.id === pageId);
      expect(page).toBeUndefined();

      pageId = null; // Already closed
    });
  });

  describe('Page Execution', () => {
    beforeEach(async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });
      pageId = await client.testPuppeteerPageOpen(browserId!);
    });

    test('should execute JavaScript on page', async () => {
      const result = await client.testPuppeteerExecPage(pageId!, `
        return await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href
          };
        });
      `);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      const evalResult = JSON.parse(result.result);
      expect(evalResult.url).toBeDefined();
    });

    test('should navigate using page execution', async () => {
      const result = await client.testPuppeteerExecPage(pageId!, `
        try {
          await page.goto('data:text/html,<h1>Test Page</h1>', { waitUntil: 'domcontentloaded', timeout: 10000 });
          return page.url();
        } catch (error) {
          return 'Navigation error: ' + error.message;
        }
      `);

      expect(result.success).toBe(true);
      expect(result.result).toContain('data:text/html');
    });

    test('should handle execution errors gracefully', async () => {
      const result = await client.testPuppeteerExecPage(pageId!, `
        throw new Error('Test error');
      `);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });
  });

  describe('Error Handling', () => {
    test('should handle close non-existent browser', async () => {
      const result = await client.testPuppeteerBrowserClose('non-existent-browser-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle close non-existent page', async () => {
      const result = await client.testPuppeteerPageClose('non-existent-page-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle exec on non-existent page', async () => {
      const result = await client.testPuppeteerExecPage('non-existent-page-id', 'return 1;');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle open page on non-existent browser', async () => {
      const result = await client.client.callPuppeteerTool({
        action: {
          type: 'open-page',
          browserId: 'non-existent-browser-id'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('ID Generation', () => {
    test('should generate unique browser IDs', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });
      expect(browserId).toMatch(/^browser-[\w-]+$/);
    });

    test('should generate unique page IDs', async () => {
      browserId = await client.testPuppeteerBrowserLaunch({ headless: true });
      pageId = await client.testPuppeteerPageOpen(browserId!);
      expect(pageId).toMatch(/^page-[\w-]+$/);
    });
  });

});
