import { takeScreenshot } from "../../src/utils/puppeteer/take-screenshot"
import { getPages, PageInstance } from "../../src/utils/browser-instances"
import { Page } from "puppeteer"

// Mock the browser instances module
jest.mock("../../src/utils/browser-instances", () => ({
  getPages: jest.fn(),
}))

describe("puppeteer screenshot", () => {
  const mockGetPages = getPages as jest.MockedFunction<typeof getPages>
  const mockScreenshot = jest.fn()

  const mockPage: Partial<Page> = {
    screenshot: mockScreenshot,
  }

  const mockPageInstance: PageInstance = {
    id: "test-page-123",
    page: mockPage as Page,
    browserId: "test-browser-123",
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("takeScreenshot", () => {
    it("should take a screenshot and return in MCP format", async () => {
      const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      mockScreenshot.mockResolvedValue(base64Data)
      mockGetPages.mockReturnValue({
        "test-page-123": mockPageInstance,
      })

      const result = await takeScreenshot("test-page-123")

      expect(mockScreenshot).toHaveBeenCalledWith({
        fullPage: false,
        type: "png",
        encoding: "base64",
      })

      expect(result).toEqual({
        content: [
          {
            type: "image",
            data: base64Data,
            mimeType: "image/png",
          },
        ],
      })
    })

    it("should take a full page screenshot when requested", async () => {
      const base64Data = "base64-image-data"
      mockScreenshot.mockResolvedValue(base64Data)
      mockGetPages.mockReturnValue({
        "test-page-123": mockPageInstance,
      })

      await takeScreenshot("test-page-123", true)

      expect(mockScreenshot).toHaveBeenCalledWith({
        fullPage: true,
        type: "png",
        encoding: "base64",
      })
    })

    it("should take a jpeg screenshot with quality", async () => {
      const base64Data = "base64-jpeg-data"
      mockScreenshot.mockResolvedValue(base64Data)
      mockGetPages.mockReturnValue({
        "test-page-123": mockPageInstance,
      })

      const result = await takeScreenshot("test-page-123", false, "jpeg", 80)

      expect(mockScreenshot).toHaveBeenCalledWith({
        fullPage: false,
        type: "jpeg",
        encoding: "base64",
        quality: 80,
      })

      expect(result.content[0].mimeType).toBe("image/jpeg")
    })

    it("should throw error if page not found", async () => {
      mockGetPages.mockReturnValue({})

      await expect(takeScreenshot("non-existent-page")).rejects.toThrow(
        "Page with ID non-existent-page not found"
      )
    })

    it("should handle screenshot errors", async () => {
      mockScreenshot.mockRejectedValue(new Error("Screenshot failed"))
      mockGetPages.mockReturnValue({
        "test-page-123": mockPageInstance,
      })

      await expect(takeScreenshot("test-page-123")).rejects.toThrow(
        "Failed to take screenshot: Screenshot failed"
      )
    })
  })
})
