import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getBrowsers, getPages, PageInstance } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {
  browserId: z.string()
    .describe("The ID of the browser instance to create a page in"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "create-page",
  description: "Create a new page (tab) in a specified browser instance",
  annotations: {
    title: "Create Page",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function createPage({ browserId }: InferSchema<typeof schema>) {
  try {
    const browsers = getBrowsers()
    const browserInstance = browsers[browserId]

    if (!browserInstance) {
      return JSON.stringify({
        success: false,
        error: `Browser with ID '${browserId}' not found`,
      }, null, 2)
    }

    const { browser } = browserInstance

    if (!browser.isConnected()) {
      return JSON.stringify({
        success: false,
        error: `Browser '${browserId}' is not connected`,
      }, null, 2)
    }

    // Create a new page
    const page = await browser.newPage()

    // Generate unique ID for this page instance
    const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store page instance
    const pages = getPages()
    const pageInstance: PageInstance = {
      id: pageId,
      page,
      browserId,
      createdAt: new Date(),
    }

    pages[pageId] = pageInstance

    return JSON.stringify({
      success: true,
      pageId,
      browserId,
      message: `Page created successfully with ID: ${pageId}`,
    }, null, 2)
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
