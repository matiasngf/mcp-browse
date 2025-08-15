import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getPages } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {
  pageId: z.string()
    .describe("The ID of the page to close"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "close-page",
  description: "Close a specific page and remove it from the active pages list",
  annotations: {
    title: "Close Page",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function closePage({ pageId }: InferSchema<typeof schema>) {
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

    // Close the page
    try {
      if (!page.isClosed()) {
        await page.close()
      }
    } catch (error) {
      // Page might already be closed, continue with cleanup
      console.warn(`Warning: Error closing page ${pageId}:`, error)
    }

    // Remove from global object
    delete pages[pageId]

    return JSON.stringify({
      success: true,
      message: `Page ${pageId} closed successfully`,
    }, null, 2)
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
