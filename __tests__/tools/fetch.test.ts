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
      expect(result.content).toBeDefined();
      expect(result.content).toContain('"url": "https://httpbin.org/get"');
      expect(result.content).toContain('"method": "GET"');
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
      expect(result.content).toContain('"test": "data"');
      expect(result.content).toContain('"number": 123');
    });

    test('should perform PUT request', async () => {
      const result = await client.testFetch('https://httpbin.org/put', {
        method: 'PUT',
        body: JSON.stringify({ update: 'value' }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"update": "value"');
    });

    test('should perform DELETE request', async () => {
      const result = await client.testFetch('https://httpbin.org/delete', {
        method: 'DELETE'
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"method": "DELETE"');
    });

    test('should perform PATCH request', async () => {
      const result = await client.testFetch('https://httpbin.org/patch', {
        method: 'PATCH',
        body: JSON.stringify({ patch: 'data' }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"patch": "data"');
    });
  });

  describe('Headers and Authentication', () => {
    test('should send custom headers', async () => {
      const customHeaders = {
        'X-Custom-Header': 'test-value',
        'Authorization': 'Bearer test-token'
      };

      const result = await client.testFetch('https://httpbin.org/headers', {
        headers: customHeaders
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"X-Custom-Header": "test-value"');
      expect(result.content).toContain('"Authorization": "Bearer test-token"');
    });

    test('should handle basic authentication', async () => {
      const result = await client.testFetch('https://httpbin.org/basic-auth/user/pass', {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
        }
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"authenticated": true');
      expect(result.content).toContain('"user": "user"');
    });
  });

  describe('Response Handling', () => {
    test('should handle different status codes', async () => {
      const result404 = await client.testFetch('https://httpbin.org/status/404');
      expect(result404.status).toBe(404);

      const result500 = await client.testFetch('https://httpbin.org/status/500');
      expect(result500.status).toBe(500);
    });

    test('should handle large responses', async () => {
      const result = await client.testFetch('https://httpbin.org/bytes/10000');

      expect(result.status).toBe(200);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(10000); // Base64 encoded
    });

    test('should handle JSON responses', async () => {
      const result = await client.testFetch('https://httpbin.org/json');

      expect(result.status).toBe(200);
      expect(result.content).toContain('"slideshow"');
    });
  });

  describe('Request Options', () => {
    test('should handle redirects', async () => {
      const result = await client.testFetch('https://httpbin.org/redirect/2', {
        redirect: 'follow'
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('"url": "https://httpbin.org/get"');
    });

    test('should handle redirect with manual mode', async () => {
      const result = await client.testFetch('https://httpbin.org/redirect/1', {
        redirect: 'manual'
      });

      // Manual mode should not follow redirects
      expect([301, 302, 303, 307, 308]).toContain(result.status);
    });

    test('should not follow redirects when specified', async () => {
      const result = await client.testFetch('https://httpbin.org/redirect/1', {
        followRedirects: false
      });

      expect([301, 302, 303, 307, 308]).toContain(result.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      try {
        await client.testFetch('https://invalid-domain-that-does-not-exist-12345.com');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('fetch failed');
      }
    });

    test('should handle timeout', async () => {
      try {
        // Using httpbin delay endpoint with a short timeout
        await client.testFetch('https://httpbin.org/delay/5', {
          timeout: 1000 // 1 second timeout for a 5 second delay
        });
        fail('Should have thrown a timeout error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toMatch(/timeout|aborted/i);
      }
    });

    test('should validate URL parameter', async () => {
      try {
        await client.testFetch('');
        fail('Should have thrown an error for empty URL');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Invalid parameters');
      }
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

      expect(result.status).toBe(200);
      expect(result.content).toContain('"field1": "value1"');
      expect(result.content).toContain('"field2": "value2"');
    });

    test('should handle text content', async () => {
      const result = await client.testFetch('https://httpbin.org/post', {
        method: 'POST',
        body: 'Plain text content',
        headers: { 'Content-Type': 'text/plain' }
      });

      expect(result.status).toBe(200);
      expect(result.content).toContain('Plain text content');
    });
  });
});
