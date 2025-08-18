import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getBrowsers, getPages, PageInstance } from "../utils/browser-instances"

// Define the schema for tool parameters using discriminated union
export const schema = {
  action: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("list-pages"),
    }),
    z.object({
      type: z.literal("open-page"),
      browserId: z.string().describe("The ID of the browser instance to create a page in"),
      url: z.string().optional().describe("Optional URL to navigate to after creating the page"),
    }),
    z.object({
      type: z.literal("close-page"),
      pageId: z.string().describe("The ID of the page to close"),
    }),
  ]).describe("The action to perform on pages"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "puppeteer-page",
  description: "Manage browser pages - list all pages, open new pages, or close existing pages",
  annotations: {
    title: "Puppeteer Page Management",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function page({ action }: InferSchema<typeof schema>) {
  try {
    switch (action.type) {
      case "list-pages":
        return await listPages()

      case "open-page":
        return await openPage(action.browserId, action.url)

      case "close-page":
        return await closePage(action.pageId)

      default:
        return JSON.stringify({
          success: false,
          error: "Invalid action type",
        }, null, 2)
    }
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}

// List all pages implementation
async function listPages() {
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
}

// Open a new page implementation
async function openPage(browserId: string, url?: string) {
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

  // Navigate to URL if provided
  if (url) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' })
    } catch (error) {
      // If navigation fails, still return success but include a warning
      return JSON.stringify({
        success: true,
        pageId,
        browserId,
        message: `Page created successfully with ID: ${pageId}`,
        warning: `Failed to navigate to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url: page.url(),
      }, null, 2)
    }
  }

  return JSON.stringify({
    success: true,
    pageId,
    browserId,
    message: `Page created successfully with ID: ${pageId}`,
    url: page.url(),
  }, null, 2)
}

// Close a page implementation
async function closePage(pageId: string) {
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
  } catch {
    // do nothing
  }

  // Remove from global object
  delete pages[pageId]

  return JSON.stringify({
    success: true,
    message: `Page ${pageId} closed successfully`,
  }, null, 2)
}
