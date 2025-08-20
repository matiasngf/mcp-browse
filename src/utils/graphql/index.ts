// Cache for storing schemas
export const schemaCache = new Map<string, { schema: any; timestamp: number }>()

// Helper function to detect operation type
export function detectOperationType(query: string): string {
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

// Helper to mask sensitive headers
export function maskSensitiveHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return Object.keys(headers).reduce((acc, key) => {
    // Mask sensitive headers
    if (key.toLowerCase().includes('authorization') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('key')) {
      acc[key] = '[REDACTED]'
    } else {
      acc[key] = headers[key]
    }
    return acc
  }, {} as Record<string, string>)
}
