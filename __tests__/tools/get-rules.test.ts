import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Get Rules Tool', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  test('should return documentation object', async () => {
    const result = await client.testGetRules();

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});
