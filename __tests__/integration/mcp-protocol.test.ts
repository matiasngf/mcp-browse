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
      
      // Check if tools is the array directly or if it has a tools property
      const toolsArray = tools.tools || tools;
      expect(toolsArray).toBeDefined();
      expect(Array.isArray(toolsArray)).toBe(true);
      expect(toolsArray.length).toBeGreaterThan(0);
    });
  });


  describe('Basic Integration', () => {
    test('should handle basic tool calls', async () => {
      const result = await client.testGetRules();
      expect(result.quickStart).toBeDefined();
    });
  });

});
