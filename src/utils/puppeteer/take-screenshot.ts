import { getPages } from "../browser-instances"

// Define the MCP image content structure
interface MCPImageContent {
  type: "image"
  data: string
  mimeType: "image/png" | "image/jpeg"
  annotations?: {
    audience?: string[]
    priority?: number
  }
}

// Define the MCP response structure
interface MCPImageResponse {
  content: MCPImageContent[]
}

export async function takeScreenshot(
  pageId: string,
  fullPage: boolean = false,
  format: "png" | "jpeg" = "png",
  quality?: number
): Promise<MCPImageResponse> {
  const pages = getPages()
  const pageInstance = pages[pageId]

  if (!pageInstance) {
    throw new Error(`Page with ID ${pageId} not found`)
  }

  try {
    // Take the screenshot
    const screenshotOptions: any = {
      fullPage,
      type: format,
      encoding: "base64",
    }

    // Add quality option only for jpeg
    if (format === "jpeg" && quality !== undefined) {
      screenshotOptions.quality = quality
    }

    const screenshotBase64 = await pageInstance.page.screenshot(screenshotOptions) as string

    // Return in MCP format
    return {
      content: [
        {
          type: "image",
          data: screenshotBase64,
          mimeType: format === "png" ? "image/png" : "image/jpeg",
        },
      ],
    }
  } catch (error) {
    throw new Error(
      `Failed to take screenshot: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
