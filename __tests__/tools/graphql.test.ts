import { getClient, getTestServerUrl } from '../setup/jest.setup';
import { MCPTestHelper } from '../test-utils/jest-mcp-helper';

describe('GraphQL Tool', () => {
  let client: MCPTestHelper;
  let graphqlEndpoint: string;

  beforeAll(() => {
    client = getClient();
    const testServerUrl = getTestServerUrl();
    graphqlEndpoint = `${testServerUrl}/graphql`;
  });

  describe('GraphQL Queries', () => {
    test('should execute a simple query', async () => {
      const query = `
        query {
          hello(name: "Test")
        }
      `;

      const result = await client.testGraphQL(graphqlEndpoint, query);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.hello).toBe('Hello Test!');
    });

    test('should fetch users', async () => {
      const query = `
        query {
          users {
            id
            name
            email
          }
        }
      `;

      const result = await client.testGraphQL(graphqlEndpoint, query);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.users).toBeInstanceOf(Array);
      expect(result.data.users.length).toBeGreaterThan(0);
      expect(result.data.users[0]).toHaveProperty('id');
      expect(result.data.users[0]).toHaveProperty('name');
      expect(result.data.users[0]).toHaveProperty('email');
    });

    test('should fetch a specific user with posts', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
            posts {
              id
              title
              content
            }
          }
        }
      `;

      const variables = { id: '1' };
      const result = await client.testGraphQL(graphqlEndpoint, query, variables);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.id).toBe('1');
      expect(result.data.user.posts).toBeInstanceOf(Array);
    });
  });

  describe('GraphQL Mutations', () => {
    test('should create a new user', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            email
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await client.testGraphQL(graphqlEndpoint, mutation, variables);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.createUser).toBeDefined();
      expect(result.data.createUser.name).toBe('Test User');
      expect(result.data.createUser.email).toBe('test@example.com');
      expect(result.data.createUser.id).toBeDefined();
    });
  });

  describe('GraphQL Introspection', () => {
    test('should list available operations', async () => {
      const result = await client.testGraphQLIntrospect(graphqlEndpoint, 'list-operations');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.operations).toBeDefined();
      expect(result.operations.queries).toContain('users');
      expect(result.operations.queries).toContain('user');
      expect(result.operations.mutations).toContain('createUser');
    });

    test('should get type information', async () => {
      const result = await client.testGraphQLIntrospect(graphqlEndpoint, 'get-type', 'User');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.type).toBeDefined();
      expect(result.type.name).toBe('User');
      expect(result.type.fields).toBeDefined();
      expect(result.type.fields).toBeInstanceOf(Array);
      expect(result.type.fields.map((f: any) => f.name)).toContain('id');
      expect(result.type.fields.map((f: any) => f.name)).toContain('name');
      expect(result.type.fields.map((f: any) => f.name)).toContain('email');
      expect(result.type.fields.map((f: any) => f.name)).toContain('posts');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queries', async () => {
      const invalidQuery = `
        query {
          nonExistentField
        }
      `;

      const result = await client.testGraphQL(graphqlEndpoint, invalidQuery);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
