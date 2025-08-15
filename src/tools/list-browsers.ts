import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { getBrowsers } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list-browsers",
  description: "List all active browser instances with their details including tabs and titles",
  annotations: {
    title: "List Browsers",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

// Tool implementation
export default async function listBrowsers() {
  try {
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
            isConnected: browser.isConnected(),
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
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
