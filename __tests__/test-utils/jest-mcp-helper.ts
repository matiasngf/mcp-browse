import { MCPTestClient } from './mcp-client';
import path from 'path';

export class MCPTestHelper {
  public client: MCPTestClient;

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  static async createTestClient(): Promise<MCPTestHelper> {
    const client = new MCPTestClient({
      command: 'node',
      args: [path.join(process.cwd(), 'dist', 'stdio.js')],
      cwd: process.cwd()
    });

    await client.connectWithRetry();
    return new MCPTestHelper(client);
  }

  async cleanup(): Promise<void> {
    await this.client.disconnect();
  }

  // Capability discovery
  async getCapabilities(): Promise<{
    tools: any[];
    resources: any[];
    prompts: any[];
  }> {
    return await this.client.discoverCapabilities();
  }

  // HTTP/Fetch test helpers
  async testFetch(url: string, options?: any): Promise<any> {
    return await this.client.callFetchTool({
      url,
      ...options
    });
  }

  // WebSocket test helpers
  async testSocketConnect(url: string, options?: any): Promise<any> {
    const result = await this.client.callSocketTool({
      action: {
        type: "connect",
        url,
        ...options
      }
    });

    // For error cases, return the full result object
    // For success cases, we can still return the socketId or the full result
    if (result.success === false) {
      return result;
    }

    // For backwards compatibility, return socketId for successful connections
    // but tests expecting full result should use the result directly
    return result.socketId || result;
  }

  async testSocketSend(socketId: string, message: any, binary?: boolean): Promise<any> {
    return await this.client.callSocketTool({
      action: {
        type: "send",
        socketId,
        message,
        binary
      }
    });
  }

  async testSocketReceive(socketId: string, action: string = "get-latest", clearAfterRead?: boolean): Promise<any> {
    return await this.client.callSocketTool({
      action: {
        type: "receive",
        socketId,
        action,
        clearAfterRead
      }
    });
  }

  async testSocketList(): Promise<any> {
    return await this.client.callSocketTool({
      action: {
        type: "list"
      }
    });
  }

  async testSocketClose(socketId: string): Promise<any> {
    return await this.client.callSocketTool({
      action: {
        type: "close",
        socketId
      }
    });
  }

  // Puppeteer test helpers (consolidated tool)
  async testPuppeteerBrowserLaunch(options?: any): Promise<any> {
    const result = await this.client.callPuppeteerTool({
      action: {
        type: "launch-browser",
        headless: options?.headless ?? true,
        width: options?.width,
        height: options?.height,
        url: options?.url
      }
    });

    // Handle both old and new response formats
    if (result.success && result.browserId) {
      return result.browserId;
    }

    // Return the full result for inspection if needed
    return result.browserId || result;
  }

  async testPuppeteerBrowserList(): Promise<any> {
    return await this.client.callPuppeteerTool({
      action: {
        type: "list-browsers"
      }
    });
  }

  async testPuppeteerBrowserClose(browserId: string): Promise<any> {
    return await this.client.callPuppeteerTool({
      action: {
        type: "close-browser",
        browserId
      }
    });
  }

  async testPuppeteerPageOpen(browserId: string, url?: string): Promise<any> {
    const result = await this.client.callPuppeteerTool({
      action: {
        type: "open-page",
        browserId,
        url
      }
    });

    // Handle both old and new response formats
    if (result.success && result.pageId) {
      return result.pageId;
    }

    // Return the full result for inspection if needed
    return result.pageId || result;
  }

  async testPuppeteerPageList(): Promise<any> {
    return await this.client.callPuppeteerTool({
      action: {
        type: "list-pages"
      }
    });
  }

  async testPuppeteerPageClose(pageId: string): Promise<any> {
    return await this.client.callPuppeteerTool({
      action: {
        type: "close-page",
        pageId
      }
    });
  }

  async testPuppeteerExecPage(pageId: string, source: string): Promise<any> {
    return await this.client.callPuppeteerTool({
      action: {
        type: "exec-page",
        pageId,
        source
      }
    });
  }

  // Browser test helpers (legacy - for backward compatibility)
  async testBrowserLaunch(options?: any): Promise<any> {
    const result = await this.client.callBrowserTool({
      action: {
        type: "launch-browser",
        ...options
      }
    });

    // For error cases, return the full result object
    // For success cases, we can still return the browserId or the full result
    if (result.success === false) {
      return result;
    }

    // For backwards compatibility, return browserId for successful connections
    // but tests expecting full result should use the result directly
    return result.browserId || result;
  }

  async testBrowserList(): Promise<any> {
    return await this.client.callBrowserTool({
      action: {
        type: "list-browsers"
      }
    });
  }

  async testBrowserClose(browserId: string): Promise<any> {
    return await this.client.callBrowserTool({
      action: {
        type: "close-browser",
        browserId
      }
    });
  }

  // Page test helpers
  async testPageCreate(browserId: string): Promise<any> {
    const result = await this.client.callPageTool({
      action: {
        type: "open-page",
        browserId
      }
    });

    // For error cases, return the full result object
    // For success cases, we can still return the pageId or the full result
    if (result.success === false) {
      return result;
    }

    // For backwards compatibility, return pageId for successful page creation
    // but tests expecting full result should use the result directly
    return result.pageId || result;
  }

  async testPageList(): Promise<any> {
    return await this.client.callPageTool({
      action: {
        type: "list-pages"
      }
    });
  }

  async testPageClose(pageId: string): Promise<any> {
    return await this.client.callPageTool({
      action: {
        type: "close-page",
        pageId
      }
    });
  }

  async testExecPage(pageId: string, source: string): Promise<any> {
    return await this.client.callExecPageTool(pageId, source);
  }

  // GraphQL test helpers
  async testGraphQL(endpoint: string, query: string, variables?: any, headers?: any): Promise<any> {
    return await this.client.callGraphQLTool({
      action: {
        type: "execute",
        endpoint,
        query,
        variables,
        headers
      }
    });
  }

  async testGraphQLIntrospect(endpoint: string, action: string, typeName?: string): Promise<any> {
    return await this.client.callGraphQLTool({
      action: {
        type: "introspect",
        endpoint,
        action,
        typeName
      }
    });
  }

  // Documentation test helper
  async testGetRules(): Promise<any> {
    return await this.client.callGetRulesTool();
  }

  // Utility methods for testing
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}
