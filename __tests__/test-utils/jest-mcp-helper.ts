import { MCPTestClient } from './mcp-client';
import path from 'path';

export class MCPTestHelper {
  private client: MCPTestClient;

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

  // Browser test helpers
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
      endpoint,
      query,
      variables,
      headers
    });
  }

  async testGraphQLIntrospect(endpoint: string, action: string, typeName?: string): Promise<any> {
    return await this.client.callGraphQLIntrospectTool({
      endpoint,
      action,
      typeName
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
