import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getPages, getBrowsers } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list-pages",
  description: "List all active pages across all browser instances with their details",
  annotations: {
    title: "List Pages",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

// Tool implementation
export default async function listPages() {
  try {
    const pages = getPages()
    const pageIds = Object.keys(pages)

    if (pageIds.length === 0) {
      return JSON.stringify({
        success: true,
        pages: [],
        message: "No active pages",
      }, null, 2)
    }

    const browsers = getBrowsers()

    const pageList = await Promise.all(
      pageIds.map(async (pageId) => {
        const pageInstance = pages[pageId]
        const { page, browserId, createdAt } = pageInstance

        try {
          // Check if the browser still exists
          const browserExists = browserId in browsers

          // Get page information
          const url = page.url()
          const title = await page.title().catch(() => "Untitled")
          const isClosed = page.isClosed()

          return {
            id: pageId,
            browserId,
            browserExists,
            createdAt: createdAt.toISOString(),
            url,
            title,
            isClosed,
          }
        } catch (error) {
          // If we can't get page info, it might be closed
          return {
            id: pageId,
            browserId,
            browserExists: browserId in browsers,
            createdAt: createdAt.toISOString(),
            error: "Failed to get page information",
            isClosed: true,
          }
        }
      })
    )

    return JSON.stringify({
      success: true,
      pageCount: pageList.length,
      pages: pageList,
    }, null, 2)
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
