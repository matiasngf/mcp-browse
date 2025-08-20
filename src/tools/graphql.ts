import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { executeGraphQL } from "../utils/graphql/execute"
import { introspectGraphQL } from "../utils/graphql/introspect"

// Define the schema for tool parameters using discriminated union
export const schema = {
  action: z.discriminatedUnion("type", [
    // GraphQL execution action
    z.object({
      type: z.literal("execute"),
      endpoint: z.string().describe("The GraphQL endpoint URL"),
      query: z.string().describe("The GraphQL query or mutation string"),
      variables: z.record(z.any())
        .optional()
        .describe("Variables to pass to the GraphQL query/mutation"),
      headers: z.record(z.string())
        .optional()
        .describe("HTTP headers to include in the request (e.g., authorization tokens)"),
      operationName: z.string()
        .optional()
        .describe("Name of the operation to execute (useful when query contains multiple operations)"),
      timeout: z.number()
        .optional()
        .default(30000)
        .describe("Request timeout in milliseconds. Defaults to 30 seconds"),
    }),
    // GraphQL introspection action
    z.object({
      type: z.literal("introspect"),
      endpoint: z.string().describe("The GraphQL endpoint URL to introspect"),
      headers: z.record(z.string())
        .optional()
        .describe("HTTP headers to include in the request (e.g., authorization tokens)"),
      action: z.enum(["full-schema", "list-operations", "get-type"])
        .describe("What to fetch: full-schema gets the complete schema, list-operations lists available queries/mutations, get-type gets a specific type definition"),
      typeName: z.string()
        .optional()
        .describe("The name of the type to fetch (required when action is 'get-type')"),
      useCache: z.boolean()
        .optional()
        .default(true)
        .describe("Whether to use cached schema if available"),
      cacheTTL: z.number()
        .optional()
        .default(300000)
        .describe("Cache time-to-live in milliseconds. Defaults to 5 minutes"),
    }),
  ]).describe("The action to perform with GraphQL"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "graphql",
  description: "Execute GraphQL queries and mutations with support for variables and custom headers",
  annotations: {
    title: "GraphQL Client",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function graphql({ action }: InferSchema<typeof schema>) {
  try {
    switch (action.type) {
      case "execute":
        return await executeGraphQL(
          action.endpoint,
          action.query,
          action.variables,
          action.headers,
          action.operationName,
          action.timeout
        )

      case "introspect":
        return await introspectGraphQL(
          action.endpoint,
          action.headers || {},
          action.action,
          action.typeName,
          action.useCache,
          action.cacheTTL
        )

      default:
        return JSON.stringify({
          success: false,
          error: "Invalid action type",
        }, null, 2)
    }
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
