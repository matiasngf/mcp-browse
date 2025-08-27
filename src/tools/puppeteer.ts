import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"
import { closeBrowser } from "../utils/puppeteer/close-browsers"
import { listBrowsers } from "../utils/puppeteer/list-browsers"
import { launchBrowser } from "../utils/puppeteer/launch-browser"
import { listPages } from "../utils/puppeteer/list-pages"
import { openPage } from "../utils/puppeteer/open-page"
import { closePage } from "../utils/puppeteer/close-page"
import { execPage } from "../utils/puppeteer/exec-page"
import { takeScreenshot } from "../utils/puppeteer/take-screenshot"

// Define the schema for tool parameters using discriminated union
export const schema = {
  action: z.discriminatedUnion("type", [
    // Browser actions
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
    // Page actions
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
    // Exec action
    z.object({
      type: z.literal("exec-page"),
      pageId: z.string()
        .describe("The ID of the page to execute code on"),
      source: z.string()
        .describe("JavaScript code to execute. Will be executed outside of the page context. You can run commands like await page.goto('https://example.com') or await page.evaluate(() => { ... }). The code you write should return a string value that will serve as the result of the tool call."),
    }),
    // Screenshot action
    z.object({
      type: z.literal("take-screenshot"),
      pageId: z.string()
        .describe("The ID of the page to take a screenshot of"),
      fullPage: z.boolean()
        .optional()
        .default(false)
        .describe("Whether to take a screenshot of the full scrollable page. Defaults to false"),
      format: z.enum(["png", "jpeg"])
        .optional()
        .default("png")
        .describe("Image format for the screenshot. Defaults to png"),
      quality: z.number()
        .min(0)
        .max(100)
        .optional()
        .describe("Quality of the screenshot, only applicable for jpeg format (0-100)"),
    }),
  ]).describe("The action to perform with Puppeteer"),
}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "puppeteer",
  description: "Control browsers and pages with Puppeteer - launch/close browsers, open/close pages, execute JavaScript, take screenshots, and more",
  annotations: {
    title: "Puppeteer Control",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}

// Tool implementation
export default async function puppeteer({ action }: InferSchema<typeof schema>) {
  try {
    switch (action.type) {
      // Browser actions
      case "list-browsers":
        return await listBrowsers()

      case "launch-browser":
        return await launchBrowser(action.headless, action.width, action.height, action.url)

      case "close-browser":
        return await closeBrowser(action.browserId)

      // Page actions
      case "list-pages":
        return await listPages()

      case "open-page":
        return await openPage(action.browserId, action.url)

      case "close-page":
        return await closePage(action.pageId)

      // Exec action
      case "exec-page":
        return await execPage(action.pageId, action.source)

      // Screenshot action
      case "take-screenshot":
        return await takeScreenshot(action.pageId, action.fullPage, action.format, action.quality)

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
