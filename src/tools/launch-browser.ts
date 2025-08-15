import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import puppeteer from "puppeteer"
import { BrowserInstance, getBrowsers } from "../utils/browser-instances"

// Define the schema for tool parameters
export const schema = {
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
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "launch-browser",
  description: "Launch a new browser instance and store it for later use",
  annotations: {
    title: "Launch Browser",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function launchBrowser({
  headless,
  width,
  height
}: InferSchema<typeof schema>) {
  try {
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

    return JSON.stringify({
      success: true,
      browserId: id,
      message: `Browser launched successfully with ID: ${id}`,
      config: {
        headless,
        width,
        height,
      },
    }, null, 2)
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
