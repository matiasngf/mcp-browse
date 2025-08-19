import { getBrowsers, getPages } from "../browser-instances"

// Close a browser implementation
export async function closeBrowser(browserId: string) {
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
