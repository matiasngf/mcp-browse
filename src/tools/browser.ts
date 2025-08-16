import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import puppeteer from "puppeteer"
import { BrowserInstance, getBrowsers, getPages } from "../utils/browser-instances"

// Define the schema for tool parameters using discriminated union
export const schema = {
  action: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("list-browsers"),
    }),
    z.object({
      type: z.literal("launch-browser"),
      headless: z.boolean()
        .optional()
        .default(false)
        .describe("Whether to run browser in headless mode. Defaults to false"),
      width: z.number()
        .optional()
        .default(1280)
        .describe("Browser window width in pixels. Defaults to 1280"),
      height: z.number()
        .optional()
        .default(720)
        .describe("Browser window height in pixels. Defaults to 720"),
      url: z.string()
        .optional()
        .describe("Optional URL to navigate to after launching the browser"),
    }),
    z.object({
      type: z.literal("close-browser"),
      browserId: z.string().describe("The ID of the browser instance to close"),
    }),
  ]).describe("The action to perform on browsers"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "browser",
  description: "Manage browser instances - list all browsers, launch new browsers, or close existing browsers",
  annotations: {
    title: "Browser Management",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function browser({ action }: InferSchema<typeof schema>) {
  try {
    switch (action.type) {
      case "list-browsers":
        return await listBrowsers()

      case "launch-browser":
        return await launchBrowser(action.headless, action.width, action.height, action.url)

      case "close-browser":
        return await closeBrowser(action.browserId)

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

// List all browsers implementation
async function listBrowsers() {
  const browsers = getBrowsers()
  const browserIds = Object.keys(browsers)

  if (browserIds.length === 0) {
    return JSON.stringify({
      success: true,
      browsers: [],
      message: "No active browser instances",
    }, null, 2)
  }

  const browserList = await Promise.all(
    browserIds.map(async (id) => {
      const browserInstance = browsers[id]
      const { browser, createdAt } = browserInstance

      try {
        // Get all pages (tabs) from the browser
        const pages = await browser.pages()

        // Get tab information
        const tabs = await Promise.all(
          pages.map(async (page, index) => {
            const url = page.url()
            const title = await page.title().catch(() => "Untitled")

            return {
              index,
              url,
              title,
            }
          })
        )

        return {
          id,
          createdAt: createdAt.toISOString(),
          tabCount: tabs.length,
          tabs,
          isConnected: browser.connected,
        }
      } catch (error) {
        // If we can't get browser info, it might be disconnected
        return {
          id,
          createdAt: createdAt.toISOString(),
          error: "Failed to get browser information",
          isConnected: false,
        }
      }
    })
  )

  return JSON.stringify({
    success: true,
    browserCount: browserList.length,
    browsers: browserList,
  }, null, 2)
}

// Launch a new browser implementation
async function launchBrowser(headless: boolean, width: number, height: number, url?: string) {
  // Generate unique ID for this browser instance
  const id = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Launch browser with specified options
  const browser = await puppeteer.launch({
    headless,
    defaultViewport: {
      width,
      height,
    },
    args: [
      `--window-size=${width},${height}`,
    ],
  })

  // Store browser instance in global object
  const browserInstance: BrowserInstance = {
    id,
    browser,
    createdAt: new Date(),
  }

  const browsers = getBrowsers()
  browsers[id] = browserInstance

  // Navigate to URL if provided
  let initialUrl = undefined
  if (url) {
    try {
      // Get the default page (first tab)
      const pages = await browser.pages()
      if (pages.length > 0) {
        await pages[0].goto(url, { waitUntil: 'networkidle2' })
        initialUrl = pages[0].url()
      }
    } catch (error) {
      // If navigation fails, continue but include a warning
      return JSON.stringify({
        success: true,
        browserId: id,
        message: `Browser launched successfully with ID: ${id}`,
        warning: `Failed to navigate to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        config: {
          headless,
          width,
          height,
        },
      }, null, 2)
    }
  }

  return JSON.stringify({
    success: true,
    browserId: id,
    message: `Browser launched successfully with ID: ${id}`,
    config: {
      headless,
      width,
      height,
    },
    ...(initialUrl && { url: initialUrl }),
  }, null, 2)
}

// Close a browser implementation
async function closeBrowser(browserId: string) {
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
    if (browser.connected) {
      await browser.close()
    }
  } catch {
    // do nothing
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
}
