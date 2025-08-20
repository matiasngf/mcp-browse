import { getPages } from "../browser-instances"

export async function execPage(pageId: string, source: string) {
  const pages = getPages()
  const pageInstance = pages[pageId]

  if (!pageInstance) {
    return JSON.stringify({
      success: false,
      error: `Page with ID '${pageId}' not found`,
    }, null, 2)
  }

  const { page } = pageInstance

  if (page.isClosed()) {
    return JSON.stringify({
      success: false,
      error: `Page '${pageId}' is closed`,
    }, null, 2)
  }

  try {
    // Create and execute an async function with page as parameter
    const execFunction = new Function('page', `
      return (async () => {
        ${source}
      })()
    `)

    // Execute the function with the page object
    const result = await execFunction(page)

    // Convert result to string if it's not already
    const resultString = result === undefined ? "undefined" :
      result === null ? "null" :
        typeof result === "string" ? result :
          JSON.stringify(result, null, 2)

    return JSON.stringify({
      success: true,
      result: resultString,
    }, null, 2)

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }, null, 2)
  }
}
