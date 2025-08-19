import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

export interface MCPClientConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export class MCPTestClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private connected = false;

  constructor(private config: MCPClientConfig) {
    this.client = new Client(
      {
        name: "mcp-fetch-test-client",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );
  }

  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error("Client is already connected");
    }

    console.log(`[MCP Client] Connecting with command: ${this.config.command} ${this.config.args.join(' ')}`);

    // Filter out undefined values from process.env
    const processEnv = Object.entries(process.env).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args,
      env: {
        ...processEnv,
        ...this.config.env
      }
    });

    try {
      await this.client.connect(this.transport);
      this.connected = true;
      console.log('[MCP Client] Successfully connected to MCP server');
    } catch (error) {
      console.error('[MCP Client] Failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.close();
    this.transport = null;
    this.connected = false;
  }

  async connectWithRetry(maxRetries = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.connect();
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async discoverCapabilities(): Promise<{
    tools: any[];
    resources: any[];
    prompts: any[];
  }> {
    if (!this.connected) {
      throw new Error("Client is not connected");
    }

    const [tools, resources, prompts] = await Promise.all([
      this.listTools(),
      this.listResources(),
      this.listPrompts()
    ]);

    return { tools, resources, prompts };
  }

  async listTools(): Promise<any[]> {
    console.log('[MCP Client] Listing tools...');
    try {
      const result = await this.client.listTools();
      console.log(`[MCP Client] Found ${result.tools.length} tools:`, result.tools.map(t => t.name));
      return result.tools;
    } catch (error) {
      console.error('[MCP Client] Failed to list tools:', error);
      throw error;
    }
  }

  async listResources(): Promise<any[]> {
    const result = await this.client.listResources();
    return result.resources;
  }

  async listPrompts(): Promise<any[]> {
    const result = await this.client.listPrompts();
    return result.prompts;
  }

  // Generic tool call with error handling
  async callTool(name: string, args: any): Promise<any> {
    if (!this.connected) {
      throw new Error("Client is not connected");
    }

    console.log(`[MCP Client] Calling tool '${name}' with args:`, JSON.stringify(args, null, 2));

    try {
      const result = await this.client.callTool({
        name,
        arguments: args
      });

      console.log(`[MCP Client] Tool '${name}' raw result:`, JSON.stringify(result, null, 2));

      // Parse the result based on the CallToolResultSchema
      const validatedResult = CallToolResultSchema.parse(result);

      // Extract the actual content from the result
      if (validatedResult.content && validatedResult.content.length > 0) {
        const firstContent = validatedResult.content[0];
        if (firstContent.type === 'text') {
          const text = firstContent.text;

          // Special handling for get-rules which returns a JSON string
          if (name === 'get-rules') {
            try {
              const parsed = JSON.parse(text);
              console.log(`[MCP Client] Tool '${name}' parsed result:`, parsed);
              return parsed;
            } catch {
              console.log(`[MCP Client] Tool '${name}' text result:`, text);
              return text;
            }
          }

          // For other tools, try to parse as JSON if it looks like JSON
          try {
            const parsed = JSON.parse(text);
            console.log(`[MCP Client] Tool '${name}' parsed result:`, parsed);
            return parsed;
          } catch {
            // If not JSON, return as text
            console.log(`[MCP Client] Tool '${name}' text result:`, text);
            return text;
          }
        }
        console.log(`[MCP Client] Tool '${name}' content result:`, firstContent);
        return firstContent;
      }

      console.log(`[MCP Client] Tool '${name}' validated result:`, validatedResult);
      return validatedResult;
    } catch (error: any) {
      console.error(`[MCP Client] Tool '${name}' error:`, error);
      if (error.code === -32601) {
        throw new Error(`Tool '${name}' not found`);
      }
      if (error.code === -32602) {
        throw new Error(`Invalid parameters for tool '${name}': ${error.message}`);
      }
      throw error;
    }
  }

  // HTTP/Fetch tool
  async callFetchTool(params: any): Promise<any> {
    return await this.callTool("fetch", params);
  }

  // WebSocket tools
  async callSocketTool(action: any): Promise<any> {
    return await this.callTool("socket", action);
  }

  // Puppeteer browser tools
  async callBrowserTool(action: any): Promise<any> {
    return await this.callTool("puppeteer-browser", action);
  }

  async callPageTool(action: any): Promise<any> {
    return await this.callTool("puppeteer-page", action);
  }

  async callExecPageTool(pageId: string, source: string): Promise<any> {
    return await this.callTool("puppeteer-exec-page", { pageId, source });
  }

  // GraphQL tools
  async callGraphQLTool(params: any): Promise<any> {
    return await this.callTool("graphql", params);
  }

  async callGraphQLIntrospectTool(params: any): Promise<any> {
    return await this.callTool("graphql-introspect", params);
  }

  // Documentation tool
  async callGetRulesTool(): Promise<any> {
    return await this.callTool("get-rules", { random_string: "test" });
  }
}
