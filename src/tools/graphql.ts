import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { GraphQLClient, gql } from "graphql-request"

// Define the schema for tool parameters
export const schema = {
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
export default async function graphql(params: InferSchema<typeof schema>) {
  const { endpoint, query, variables, headers, operationName, timeout } = params

  try {
    // Validate query syntax
    const document = gql`${query}`

    // Create GraphQL client with configuration
    const client = new GraphQLClient(endpoint, {
      headers: headers || {},
    })

    // Execute the GraphQL request
    const startTime = Date.now()

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined
    const timeoutPromise = timeout ? new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    }) : null

    // Race between request and timeout
    const data = await (timeoutPromise
      ? Promise.race([
        client.request(document, variables || {}),
        timeoutPromise
      ])
      : client.request(document, variables || {}))

    const responseTime = Date.now() - startTime

    // Clear timeout if set
    if (timeoutId) clearTimeout(timeoutId)

    // Parse operation type from query
    const operationType = detectOperationType(query)

    return JSON.stringify({
      success: true,
      data,
      operationType,
      responseTime: `${responseTime}ms`,
      request: {
        endpoint,
        operationName,
        variables: variables || {},
        headers: Object.keys(headers || {}).reduce((acc, key) => {
          // Mask sensitive headers
          if (key.toLowerCase().includes('authorization') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('key')) {
            acc[key] = '[REDACTED]'
          } else {
            acc[key] = headers![key]
          }
          return acc
        }, {} as Record<string, string>)
      }
    }, null, 2)

  } catch (error) {
    // Handle different error types
    let errorDetails: any = {
      success: false,
      error: "Unknown error occurred",
      errorType: "UnknownError",
    }

    if (error instanceof Error) {
      // GraphQL errors from graphql-request
      if ('response' in error && error.response) {
        const graphqlError = error as any
        errorDetails = {
          success: false,
          errorType: "GraphQLError",
          errors: graphqlError.response.errors || [],
          data: graphqlError.response.data || null,
          status: graphqlError.response.status,
          headers: graphqlError.response.headers,
        }
      }
      // Network or other errors
      else {
        errorDetails.error = error.message

        if (error.message.includes('timeout')) {
          errorDetails.errorType = "TimeoutError"
          errorDetails.error = `Request timed out after ${timeout}ms`
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorDetails.errorType = "NetworkError"
        } else if (error.message.includes('Syntax Error')) {
          errorDetails.errorType = "SyntaxError"
          errorDetails.error = "Invalid GraphQL query syntax"
        }
      }
    }

    // Add request details to error response
    errorDetails.request = {
      endpoint,
      operationName,
      variables: variables || {},
      headers: Object.keys(headers || {}).reduce((acc, key) => {
        if (key.toLowerCase().includes('authorization') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key')) {
          acc[key] = '[REDACTED]'
        } else {
          acc[key] = headers![key]
        }
        return acc
      }, {} as Record<string, string>)
    }

    return JSON.stringify(errorDetails, null, 2)
  }
}

// Helper function to detect operation type
function detectOperationType(query: string): string {
  const normalizedQuery = query.trim().toLowerCase()

  // Remove comments
  const withoutComments = normalizedQuery.replace(/#.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  // Check for operation type keywords
  if (withoutComments.match(/^\s*query\b/) || withoutComments.match(/^\s*{\s*\w+/)) {
    return "query"
  } else if (withoutComments.match(/^\s*mutation\b/)) {
    return "mutation"
  } else if (withoutComments.match(/^\s*subscription\b/)) {
    return "subscription"
  }

  return "query" // Default to query
}
