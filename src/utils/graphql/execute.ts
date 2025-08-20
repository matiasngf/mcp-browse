import { GraphQLClient, gql } from "graphql-request"
import { detectOperationType, maskSensitiveHeaders } from "./index"

export async function executeGraphQL(
  endpoint: string,
  query: string,
  variables?: Record<string, any>,
  headers?: Record<string, string>,
  operationName?: string,
  timeout: number = 30000
): Promise<string> {
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
        headers: maskSensitiveHeaders(headers)
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
      headers: maskSensitiveHeaders(headers)
    }

    return JSON.stringify(errorDetails, null, 2)
  }
}
