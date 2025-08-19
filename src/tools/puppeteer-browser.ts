import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { closeBrowser } from "../utils/puppeteer/close-browsers"
import { listBrowsers } from "../utils/puppeteer/list-browsers"
import { launchBrowser } from "../utils/puppeteer/launch-browser"

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
  name: "puppeteer-browser",
  description: "Manage browser instances - list all browsers, launch new browsers, or close existing browsers",
  annotations: {
    title: "Puppeteer Browser Management",
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
