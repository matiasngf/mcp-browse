import { Browser } from "puppeteer"

// Define the type for browser instance
export interface BrowserInstance {
  id: string
  browser: Browser
  createdAt: Date
}

// Initialize global object to store browser instances
declare global {
  var mcpBrowsers: Record<string, BrowserInstance>
}

// Initialize the global object if it doesn't exist
if (!global.mcpBrowsers) {
  global.mcpBrowsers = {}
}

export { global }
