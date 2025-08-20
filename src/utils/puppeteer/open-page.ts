import { getBrowsers, getPages, generatePageId, PageInstance } from "../browser-instances"

export async function openPage(browserId: string, url?: string) {
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
  const pageId = generatePageId()

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
