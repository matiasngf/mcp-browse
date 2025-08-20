import { getPages } from "../browser-instances"

export async function closePage(pageId: string) {
  const pages = getPages()
  const pageInstance = pages[pageId]

  if (!pageInstance) {
    return JSON.stringify({
      success: false,
      error: `Page with ID '${pageId}' not found`,
    }, null, 2)
  }

  const { page } = pageInstance

  // Close the page
  try {
    if (!page.isClosed()) {
      await page.close()
    }
  } catch {
    // do nothing
  }

  // Remove from global object
  delete pages[pageId]

  return JSON.stringify({
    success: true,
    message: `Page ${pageId} closed successfully`,
  }, null, 2)
}
