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

    // Check main sections exist
    expect(result.quickStart).toBeDefined();
    expect(result.commonErrors).toBeDefined();
    expect(result.interactions).toBeDefined();
    expect(result.tools).toBeDefined();
    expect(result.performanceOptimization).toBeDefined();
    expect(result.gamingTips).toBeDefined();
  });

  test('should include quickStart section', async () => {
    const result = await client.testGetRules();

    expect(result.quickStart).toBeDefined();
    expect(result.quickStart.title).toBe('Fast & Safe Web Automation');
    expect(result.quickStart.bestApproach).toBeDefined();
    expect(result.quickStart.rules).toBeDefined();
    expect(Array.isArray(result.quickStart.rules)).toBe(true);
  });

  test('should include common errors and fixes', async () => {
    const result = await client.testGetRules();

    expect(result.commonErrors).toBeDefined();
    expect(Array.isArray(result.commonErrors)).toBe(true);
    expect(result.commonErrors.length).toBeGreaterThan(0);

    // Check error structure
    result.commonErrors.forEach((error: any) => {
      expect(error.error).toBeDefined();
      expect(error.fix).toBeDefined();
    });
  });

  test('should include interactions section', async () => {
    const result = await client.testGetRules();

    expect(result.interactions).toBeDefined();
    expect(result.interactions.title).toBe('User Interactions - Clicking, Typing, etc.');
    expect(result.interactions.bestPractices).toBeDefined();
    expect(Array.isArray(result.interactions.bestPractices)).toBe(true);
    expect(result.interactions.examples).toBeDefined();
  });

  test('should include tool information', async () => {
    const result = await client.testGetRules();

    expect(result.tools).toBeDefined();
    expect(result.tools.browser).toBeDefined();
    expect(typeof result.tools.browser).toBe('string');
    expect(result.tools.page).toBeDefined();
    expect(typeof result.tools.page).toBe('string');
    expect(result.tools.execPage).toBeDefined();
    expect(typeof result.tools.execPage).toBe('string');
  });

  test('should include performance optimization tips', async () => {
    const result = await client.testGetRules();

    expect(result.performanceOptimization).toBeDefined();
    expect(result.performanceOptimization.title).toBe('Performance Best Practices');
    expect(result.performanceOptimization.tips).toBeDefined();
    expect(Array.isArray(result.performanceOptimization.tips)).toBe(true);
    expect(result.performanceOptimization.example).toBeDefined();
  });

  test('should include gaming/dynamic site tips', async () => {
    const result = await client.testGetRules();

    expect(result.gamingTips).toBeDefined();
    expect(result.gamingTips.title).toBe('Tips for Dynamic/Real-time Sites');
    expect(result.gamingTips.tips).toBeDefined();
    expect(Array.isArray(result.gamingTips.tips)).toBe(true);
  });

  test('should provide comprehensive documentation', async () => {
    const result = await client.testGetRules();

    // Convert back to string to check it's valid JSON
    const jsonString = JSON.stringify(result);
    expect(jsonString.length).toBeGreaterThan(1000); // Should be substantial documentation

    // Can be parsed back
    const reparsed = JSON.parse(jsonString);
    expect(reparsed).toEqual(result);
  });
});
