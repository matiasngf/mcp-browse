import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('MCP Protocol Integration', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  describe('Tool Discovery', () => {
    test('should list tools directly', async () => {
      const tools = await (client as any).client.listTools();
      
      expect(tools.tools).toBeDefined();
      expect(Array.isArray(tools.tools)).toBe(true);
      expect(tools.tools.length).toBeGreaterThan(0);
    });
  });


  describe('Basic Integration', () => {
    test('should handle basic tool calls', async () => {
      const result = await client.testGetRules();
      expect(result.quickStart).toBeDefined();
    });
  });

});
