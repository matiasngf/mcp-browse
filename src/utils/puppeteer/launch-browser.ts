import puppeteer from "puppeteer"
import { BrowserInstance, generateBrowserId, generatePageId, getBrowsers, getPages, PageInstance } from "../browser-instances"

// Launch a new browser implementation
export async function launchBrowser(headless: boolean, width: number, height: number, url?: string) {
  // Generate unique ID for this browser instance
  const id = generateBrowserId()

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
  let initialPageId = undefined
  if (url) {
    try {
      // Get the default page (first tab)
      const browserPages = await browser.pages()
      if (browserPages.length > 0) {
        const defaultPage = browserPages[0]
        await defaultPage.goto(url, { waitUntil: 'networkidle2' })
        initialUrl = defaultPage.url()

        // Register this page in the page tracking system
        const pageId = generatePageId()
        const pages = getPages()
        const pageInstance: PageInstance = {
          id: pageId,
          page: defaultPage,
          browserId: id,
          createdAt: new Date(),
        }
        pages[pageId] = pageInstance
        initialPageId = pageId
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
    ...(initialPageId && { pageId: initialPageId }),
  }, null, 2)
}
