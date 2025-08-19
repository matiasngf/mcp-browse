import { getClient } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('Fetch Tool', () => {
  let client: MCPTestHelper;

  beforeAll(() => {
    client = getClient();
  });

  describe('Basic HTTP Methods', () => {
    test('should perform GET request', async () => {
      const result = await client.testFetch('https://httpbin.org/get');

      expect(result).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.body.url).toBe('https://httpbin.org/get');
      expect(result.body.headers).toBeDefined();
      expect(result.status).toBe(200);
    });

    test('should perform POST request with JSON body', async () => {
      const testData = { test: 'data', number: 123 };
      const result = await client.testFetch('https://httpbin.org/post', {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(result.status).toBe(200);
      expect(result.body.json).toBeDefined();
      expect(result.body.json.test).toBe('data');
      expect(result.body.json.number).toBe(123);
    });

    test('should perform PUT request', async () => {
      const result = await client.testFetch('https://httpbin.org/put', {
        method: 'PUT',
        body: JSON.stringify({ update: 'value' }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(result.status).toBe(200);
      expect(result.body.json).toBeDefined();
      expect(result.body.json.update).toBe('value');
    });

    test('should perform DELETE request', async () => {
      const result = await client.testFetch('https://httpbin.org/delete', {
        method: 'DELETE'
      });

      expect(result.status).toBe(200);
      expect(result.body.url).toBe('https://httpbin.org/delete');
      expect(result.body.headers).toBeDefined();
    });

    test('should perform PATCH request', async () => {
      const result = await client.testFetch('https://httpbin.org/patch', {
        method: 'PATCH',
        body: JSON.stringify({ patch: 'data' }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(result.status).toBe(200);
      expect(result.body.json).toBeDefined();
      expect(result.body.json.patch).toBe('data');
    });
  });

  describe('Headers and Authentication', () => {
    test('should send custom headers', async () => {
      const customHeaders = {
        'X-Custom-Header': 'test-value'
      };

      const result = await client.testFetch('https://httpbin.org/headers', {
        headers: customHeaders
      });

      expect(result.status).toBe(200);
      expect(result.body.headers).toBeDefined();
    });
  });

  describe('Response Handling', () => {
    test('should handle different status codes', async () => {
      const result404 = await client.testFetch('https://httpbin.org/status/404');
      expect(result404.status).toBe(404);
    });

    test('should handle JSON responses', async () => {
      const result = await client.testFetch('https://httpbin.org/json');

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
    });
  });

  describe('Request Options', () => {
    test('should handle redirects', async () => {
      const result = await client.testFetch('https://httpbin.org/redirect/1', {
        redirect: 'follow'
      });

      expect(result.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle basic error cases', async () => {
      const result = await client.testFetch('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Content Types', () => {
    test('should handle form data', async () => {
      const formData = new URLSearchParams({
        field1: 'value1',
        field2: 'value2'
      }).toString();

      const result = await client.testFetch('https://httpbin.org/post', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      expect(result).toBeDefined();
      expect([200, 503]).toContain(result.status); // Allow 503 for service unavailable
    });

    test('should handle text content', async () => {
      const result = await client.testFetch('https://httpbin.org/post', {
        method: 'POST',
        body: 'Plain text content',
        headers: { 'Content-Type': 'text/plain' }
      });

      expect(result).toBeDefined();
      expect([200, 503]).toContain(result.status); // Allow 503 for service unavailable
    });
  });
});
