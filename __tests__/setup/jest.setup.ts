import { MCPTestHelper } from '../test-utils/jest-mcp-helper';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { startTestServer, TestServerInstance } from '../mocks/test-server';

// Extend the global namespace
declare global {
  var mcpClient: MCPTestHelper;
  var mcpClientInitialized: boolean;
  var testServer: TestServerInstance;
  var testServerUrl: string;
}

let globalMCPClient: MCPTestHelper;
let globalTestServer: TestServerInstance;

// Build the server before all tests - but only once
beforeAll(async () => {
  // Check if we already initialized (for parallel test runs)
  if (global.mcpClientInitialized) {
    return;
  }

  // Start the test server first
  globalTestServer = await startTestServer(0); // Use port 0 for automatic port assignment
  global.testServer = globalTestServer;
  global.testServerUrl = `http://localhost:${globalTestServer.port}`;

  // Check if build is needed by looking for the dist directory
  const distPath = path.join(process.cwd(), 'dist', 'stdio.js');
  const needsBuild = !fs.existsSync(distPath);

  if (needsBuild) {
    try {
      execSync('pnpm run build', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      throw error;
    }
  }

  try {
    globalMCPClient = await MCPTestHelper.createTestClient();
    global.mcpClient = globalMCPClient;
    global.mcpClientInitialized = true;
  } catch (error) {
    throw error;
  }
}, 60000); // 60 second timeout for build and initialization

// Clean up after all tests
afterAll(async () => {
  // Only cleanup if we're the ones who initialized
  if (globalMCPClient && global.mcpClientInitialized) {
    try {
      await globalMCPClient.cleanup();
    } catch (error) {
      // Silent cleanup
    }
  }

  // Stop the test server
  if (globalTestServer) {
    try {
      await globalTestServer.close();
    } catch (error) {
      // Silent cleanup
    }
  }
}, 10000);

// Add test timeout extension
jest.setTimeout(30000);

// Export helper functions for tests
export function getClient(): MCPTestHelper {
  if (!global.mcpClient) {
    throw new Error('MCP client not initialized');
  }
  return global.mcpClient;
}

export function getTestServerUrl(): string {
  if (!global.testServerUrl) {
    throw new Error('Test server not initialized');
  }
  return global.testServerUrl;
}

// Add fail function for tests that use it
global.fail = (reason?: string | Error) => {
  throw new Error(reason instanceof Error ? reason.message : reason || 'Test failed');
};
