import { Browser, Page } from "puppeteer"
import { generate as generateWords } from "random-words"

// Define the type for page instance
export interface PageInstance {
  id: string
  page: Page
  browserId: string
  createdAt: Date
}

// Define the type for browser instance
export interface BrowserInstance {
  id: string
  browser: Browser
  createdAt: Date
}

// Generate unique browser ID using random words
export function generateBrowserId(): string {
  const words = generateWords({ exactly: 4, join: "-" }) as string
  return `browser-${words}`
}

// Generate unique page ID using random words
export function generatePageId(): string {
  const words = generateWords({ exactly: 4, join: "-" }) as string
  return `page-${words}`
}

// Initialize global object to store browser instances
declare global {
  var mcpBrowsers: Record<string, BrowserInstance>
  var mcpPages: Record<string, PageInstance>
}

// Initialize the global object if it doesn't exist
if (!global.mcpBrowsers) {
  global.mcpBrowsers = {}
}

if (!global.mcpPages) {
  global.mcpPages = {}
}

// Get the browsers object reference for managing browser instances
export function getBrowsers(): Record<string, BrowserInstance> {
  return global.mcpBrowsers
}

// Get the pages object reference for managing page instances
export function getPages(): Record<string, PageInstance> {
  return global.mcpPages
}
