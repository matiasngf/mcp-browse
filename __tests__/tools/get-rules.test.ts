import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Get Rules Tool', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  test('should return only requested documentation sections', async () => {
    const result = await client.testGetRules(["quickStart", "tools"]);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('quickStart');
    expect(result).toHaveProperty('tools');
    expect(result).not.toHaveProperty('commonErrors');
    expect(result).not.toHaveProperty('interactions');
  });

  test('should return single rule when requested', async () => {
    const result = await client.testGetRules(["commonErrors"]);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('commonErrors');
    expect(Object.keys(result)).toHaveLength(1);
  });

  test('should return all requested rules', async () => {
    const allRules = [
      "quickStart",
      "commonErrors",
      "interactions",
      "tools",
      "workflow",
      "performanceOptimization",
      "gamingTips",
      "debuggingWithPuppeteer"
    ];

    const result = await client.testGetRules(allRules);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    allRules.forEach(rule => {
      expect(result).toHaveProperty(rule);
    });
  });

  test('should handle empty rules array', async () => {
    const result = await client.testGetRules([]);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('should default to quickStart when no rules provided', async () => {
    const result = await client.testGetRules();

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('quickStart');
  });
});
