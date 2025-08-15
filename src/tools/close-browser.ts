import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getBrowsers, getPages } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {
  browserId: z.string()
    .describe("The ID of the browser instance to close"),
}


// Define tool metadata
export const metadata: ToolMetadata = {
  name: "close-browser",
  description: "Close a browser instance and remove it from the active browsers list",
  annotations: {
    title: "Close Browser",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function closeBrowser({ browserId }: InferSchema<typeof schema>) {
  try {
    // Check if browser exists
    const browsers = getBrowsers()
    const browserInstance = browsers[browserId]

    if (!browserInstance) {
      return JSON.stringify({
        success: false,
        error: `Browser with ID '${browserId}' not found`,
      }, null, 2)
    }

    const { browser } = browserInstance

    // Close the browser
    try {
      if (browser.isConnected()) {
        await browser.close()
      }
    } catch (error) {
      // Browser might already be closed, continue with cleanup
      console.warn(`Warning: Error closing browser ${browserId}:`, error)
    }

    // Clean up any pages associated with this browser
    const pages = getPages()
    const pageIds = Object.keys(pages)
    let cleanedPagesCount = 0

    for (const pageId of pageIds) {
      if (pages[pageId].browserId === browserId) {
        delete pages[pageId]
        cleanedPagesCount++
      }
    }

    // Remove from global object
    delete browsers[browserId]

    return JSON.stringify({
      success: true,
      message: `Browser ${browserId} closed successfully`,
      cleanedPagesCount,
    }, null, 2)
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
