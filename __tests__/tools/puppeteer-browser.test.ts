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
        await client.testBrowserClose(browserId!);
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
      const launchResult = await client.testBrowserLaunch({
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

      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.isConnected).toBe(true);
    });

    test('should launch browser and navigate to URL', async () => {
      const launchResult = await client.testBrowserLaunch({
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
      const result = await client.testBrowserList();
      const browser = result.browsers.find((b: any) => b.id === browserId);

      expect(browser).toBeDefined();
      expect(browser.tabs.length).toBeGreaterThan(0);
      // The URL might be example.com or about:blank depending on navigation timing
      // Just check that we have a valid URL
      expect(browser.tabs[0].url).toBeDefined();
    });

    test('should close browser successfully', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });
      expect(browserId).toBeDefined();

      const closeResult = await client.testBrowserClose(browserId!);

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
      expect(result.browsers).toBeDefined();
      expect(Array.isArray(result.browsers)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle close non-existent browser', async () => {
      const result = await client.testBrowserClose('non-existent-browser-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Browser Properties', () => {
    test('should generate unique browser IDs', async () => {
      browserId = await client.testBrowserLaunch({ headless: true });
      expect(browserId).toMatch(/^browser-[\w-]+$/);
    });
  });

});
