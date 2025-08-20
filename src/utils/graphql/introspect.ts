import { GraphQLClient, gql } from "graphql-request"
import { getIntrospectionQuery, buildClientSchema, printSchema } from "graphql"
import { schemaCache } from "./index"

// Get schema with caching
export async function getSchema(
  endpoint: string,
  headers: Record<string, string>,
  useCache: boolean,
  cacheTTL: number
): Promise<any> {
  const cacheKey = `${endpoint}:${JSON.stringify(headers)}`

  // Check cache
  if (useCache) {
    const cached = schemaCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.schema
    }
  }

  // Fetch schema
  const client = new GraphQLClient(endpoint, { headers })
  const introspectionQuery = getIntrospectionQuery()
  const result = await client.request(gql`${introspectionQuery}`)

  // The result should already be in the correct format for buildClientSchema
  // Cache the entire result
  schemaCache.set(cacheKey, {
    schema: result,
    timestamp: Date.now(),
  })

  return result
}

// Handle full schema request
export function handleFullSchema(schema: any): string {
  const schemaSDL = printSchema(schema)

  return JSON.stringify({
    success: true,
    schemaSDL,
    stats: {
      totalTypes: schema.getTypeMap ? Object.keys(schema.getTypeMap()).length : 0,
    }
  }, null, 2)
}

// Handle list operations request
export function handleListOperations(schema: any): string {
  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  const subscriptionType = schema.getSubscriptionType()

  const operations = {
    queries: queryType ? Object.keys(queryType.getFields()) : [],
    mutations: mutationType ? Object.keys(mutationType.getFields()) : [],
    subscriptions: subscriptionType ? Object.keys(subscriptionType.getFields()) : [],
  }

  // Get detailed info for each operation
  const detailedOperations = {
    queries: queryType ? getOperationDetails(queryType) : [],
    mutations: mutationType ? getOperationDetails(mutationType) : [],
    subscriptions: subscriptionType ? getOperationDetails(subscriptionType) : [],
  }

  return JSON.stringify({
    success: true,
    operations,
    detailedOperations,
    stats: {
      totalQueries: operations.queries.length,
      totalMutations: operations.mutations.length,
      totalSubscriptions: operations.subscriptions.length,
    }
  }, null, 2)
}

// Get detailed operation information
function getOperationDetails(type: any) {
  const fields = type.getFields()
  return Object.entries(fields).map(([name, field]: [string, any]) => ({
    name,
    description: field.description,
    args: field.args.map((arg: any) => ({
      name: arg.name,
      type: arg.type.toString(),
      description: arg.description,
      defaultValue: arg.defaultValue,
    })),
    returnType: field.type.toString(),
  }))
}

// Handle get type request
export function handleGetType(schema: any, typeName: string): string {
  const type = schema.getType(typeName)

  if (!type) {
    return JSON.stringify({
      success: false,
      error: `Type '${typeName}' not found in schema`,
    }, null, 2)
  }

  // Get type details based on type kind
  let typeDetails: any = {
    name: type.name,
    description: type.description,
    kind: type.constructor.name,
  }

  // Add fields for object types
  if (type.getFields) {
    const fields = type.getFields()
    typeDetails.fields = Object.entries(fields).map(([fieldName, field]: [string, any]) => ({
      name: fieldName,
      description: field.description,
      type: field.type.toString(),
      args: field.args?.map((arg: any) => ({
        name: arg.name,
        type: arg.type.toString(),
        description: arg.description,
      })) || [],
    }))
  }

  // Add values for enum types
  if (type.getValues) {
    typeDetails.values = type.getValues().map((value: any) => ({
      name: value.name,
      description: value.description,
      deprecationReason: value.deprecationReason,
    }))
  }

  // Add possible types for interfaces and unions
  if (type.getPossibleTypes) {
    typeDetails.possibleTypes = type.getPossibleTypes().map((t: any) => t.name)
  }

  return JSON.stringify({
    success: true,
    type: typeDetails,
  }, null, 2)
}

// Main introspection function
export async function introspectGraphQL(
  endpoint: string,
  headers: Record<string, string> = {},
  action: string,
  typeName?: string,
  useCache: boolean = true,
  cacheTTL: number = 300000
): Promise<string> {
  try {
    // Get schema (from cache or fetch)
    const introspectionData = await getSchema(endpoint, headers, useCache, cacheTTL)

    // Build schema from introspection result
    const schema = buildClientSchema(introspectionData)

    switch (action) {
      case "full-schema":
        return handleFullSchema(schema)

      case "list-operations":
        return handleListOperations(schema)

      case "get-type":
        if (!typeName) {
          return JSON.stringify({
            success: false,
            error: "typeName is required when action is 'get-type'",
          }, null, 2)
        }
        return handleGetType(schema, typeName)

      default:
        return JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`,
        }, null, 2)
    }

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      errorType: error instanceof Error && error.message.includes("Network") ? "NetworkError" : "IntrospectionError",
      endpoint,
    }, null, 2)
  }
}
