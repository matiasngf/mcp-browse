import { MCPTestHelper } from '../test-utils/jest-mcp-helper';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Extend the global namespace
declare global {
  var mcpClient: MCPTestHelper;
  var mcpClientInitialized: boolean;
}

let globalMCPClient: MCPTestHelper;

// Build the server before all tests - but only once
beforeAll(async () => {
  // Check if we already initialized (for parallel test runs)
  if (global.mcpClientInitialized) {
    return;
  }

  console.log('Building MCP server...');

  // Check if build is needed by looking for the dist directory
  const distPath = path.join(process.cwd(), 'dist', 'stdio.js');
  const needsBuild = !fs.existsSync(distPath);

  if (needsBuild) {
    try {
      execSync('pnpm run build', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('Build completed successfully');
    } catch (error) {
      console.error('Failed to build server:', error);
      throw error;
    }
  } else {
    console.log('Using existing build');
  }

  console.log('Initializing MCP client...');

  try {
    globalMCPClient = await MCPTestHelper.createTestClient();
    global.mcpClient = globalMCPClient;
    global.mcpClientInitialized = true;
    console.log('MCP client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP client:', error);
    throw error;
  }
}, 60000); // 60 second timeout for build and initialization

// Clean up after all tests
afterAll(async () => {
  // Only cleanup if we're the ones who initialized
  if (globalMCPClient && global.mcpClientInitialized) {
    console.log('Cleaning up MCP client...');

    try {
      await globalMCPClient.cleanup();
      console.log('MCP client cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up MCP client:', error);
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

// Add fail function for tests that use it
global.fail = (reason?: string | Error) => {
  throw new Error(reason instanceof Error ? reason.message : reason || 'Test failed');
};
