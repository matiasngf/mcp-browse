import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getPages } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {
  pageId: z.string()
    .describe("The ID of the page to execute code on"),
  source: z.string()
    .describe("JavaScript code to execute on the page. The code has access to the 'page' object and should return a value"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "exec-page",
  description: "Execute arbitrary JavaScript code on a page with access to Puppeteer's page API",
  annotations: {
    title: "Execute Page Code",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function execPage({ pageId, source }: InferSchema<typeof schema>) {
  try {
    const pages = getPages()
    const pageInstance = pages[pageId]

    if (!pageInstance) {
      return JSON.stringify({
        success: false,
        error: `Page with ID '${pageId}' not found`,
      }, null, 2)
    }

    const { page } = pageInstance

    if (page.isClosed()) {
      return JSON.stringify({
        success: false,
        error: `Page '${pageId}' is closed`,
      }, null, 2)
    }

    try {
      // Create and execute an async function with page as parameter
      const execFunction = new Function('page', `
        return (async () => {
          ${source}
        })()
      `)

      // Execute the function with the page object
      const result = await execFunction(page)

      // Convert result to string if it's not already
      const resultString = result === undefined ? "undefined" :
        result === null ? "null" :
          typeof result === "string" ? result :
            JSON.stringify(result, null, 2)

      return JSON.stringify({
        success: true,
        result: resultString,
      }, null, 2)

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }, null, 2)
    }
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
