import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"

// Define the schema for tool parameters
export const schema = {
  url: z.string().describe("The URL to fetch from"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    .optional()
    .default("GET")
    .describe("The HTTP method to use. Defaults to GET"),
  headers: z.record(z.string())
    .optional()
    .describe("HTTP headers to include in the request as key-value pairs"),
  body: z.string()
    .optional()
    .describe("The request body. Can be a string, JSON, or form data"),
  mode: z.enum(["cors", "no-cors", "same-origin"])
    .optional()
    .describe("The mode for the request (cors, no-cors, or same-origin)"),
  credentials: z.enum(["omit", "same-origin", "include"])
    .optional()
    .describe("Whether to include credentials with the request"),
  cache: z.enum(["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"])
    .optional()
    .describe("The cache mode for the request"),
  redirect: z.enum(["follow", "error", "manual"])
    .optional()
    .default("follow")
    .describe("How to handle redirects. Defaults to follow"),
  referrer: z.string()
    .optional()
    .describe("The referrer to send with the request"),
  referrerPolicy: z.enum([
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
    "unsafe-url"
  ])
    .optional()
    .describe("The referrer policy for the request"),
  signal: z.any()
    .optional()
    .describe("An AbortSignal to abort the request"),
  timeout: z.number()
    .optional()
    .describe("Request timeout in milliseconds"),
  followRedirects: z.boolean()
    .optional()
    .default(true)
    .describe("Whether to follow redirects. Defaults to true"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "fetch",
  description: "Perform HTTP requests with full control over method, headers, body, and other fetch options",
  annotations: {
    title: "HTTP Fetch",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function fetch(params: InferSchema<typeof schema>) {
  try {
    const { url, method, headers, body, timeout, followRedirects, signal, ...fetchOptions } = params

    // Build fetch options
    const options: RequestInit = {
      method,
      headers: headers || {},
      ...fetchOptions,
    }

    // Add body if provided and method supports it
    if (body && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      options.body = body

      // Ensure headers is a proper object for type safety
      const requestHeaders = options.headers as Record<string, string>

      // Auto-detect content type if not provided
      if (!requestHeaders["Content-Type"] && !requestHeaders["content-type"]) {
        try {
          JSON.parse(body)
          requestHeaders["Content-Type"] = "application/json"
        } catch {
          // If not JSON, assume plain text
          requestHeaders["Content-Type"] = "text/plain"
        }
      }
    }

    // Create abort controller for timeout
    let abortController: AbortController | undefined
    let timeoutId: NodeJS.Timeout | undefined

    if (timeout) {
      abortController = new AbortController()
      options.signal = abortController.signal

      timeoutId = setTimeout(() => {
        abortController?.abort()
      }, timeout)
    }

    // Perform the fetch
    const startTime = Date.now()
    const response = await globalThis.fetch(url, options)
    const responseTime = Date.now() - startTime

    // Clear timeout if set
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Determine response content type
    const contentType = response.headers.get("content-type") || ""
    let responseBody: any

    try {
      if (contentType.includes("application/json")) {
        responseBody = await response.json()
      } else if (contentType.includes("text/") || contentType.includes("application/xml")) {
        responseBody = await response.text()
      } else {
        // For binary data, convert to base64
        const buffer = await response.arrayBuffer()
        responseBody = {
          type: "binary",
          size: buffer.byteLength,
          base64: Buffer.from(buffer).toString("base64")
        }
      }
    } catch (error) {
      responseBody = {
        error: "Failed to parse response body",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    }

    return JSON.stringify({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      url: response.url,
      redirected: response.redirected,
      responseTime: `${responseTime}ms`,
      request: {
        method,
        url: params.url,
        headers: headers || {}
      }
    }, null, 2)

  } catch (error) {
    // Handle different error types
    let errorMessage = "Unknown error occurred"
    let errorType = "UnknownError"

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.name === "AbortError") {
        errorType = "TimeoutError"
        errorMessage = `Request timed out after ${params.timeout}ms`
      } else if (error.message.includes("Failed to fetch")) {
        errorType = "NetworkError"
        errorMessage = "Network error - could not connect to the server"
      } else if (error.message.includes("Invalid URL")) {
        errorType = "InvalidURLError"
      }
    }

    return JSON.stringify({
      success: false,
      error: errorMessage,
      errorType,
      request: {
        method: params.method,
        url: params.url,
        headers: params.headers || {}
      }
    }, null, 2)
  }
}
