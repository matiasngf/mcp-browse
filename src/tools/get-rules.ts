import { type ToolMetadata } from "xmcp"

// Define the schema for tool parameters
export const schema = {}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-rules",
  description: "Get use cases and best practices for using the tools in this MCP server",
  annotations: {
    title: "Get Use Cases and Best Practices",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

// Tool implementation
export default function getRules() {
  const documentation = {
    useCases: [
      {
        title: "Web Development & Debugging",
        description: "Launch browsers to test your web applications during development. View real-time changes, debug JavaScript, inspect elements, and test responsive designs.",
        example: "Launch a browser with headless: false, navigate to localhost:3000, and debug your React application"
      },
      {
        title: "Automated Testing",
        description: "Run automated tests in headless mode to verify functionality, take screenshots, or perform regression testing.",
        example: "Launch headless browser, navigate to production site, verify critical user flows"
      },
      {
        title: "Web Scraping",
        description: "Extract data from websites that require JavaScript execution or complex interactions.",
        example: "Launch browser, navigate to dynamic content site, wait for content to load, extract data"
      },
      {
        title: "PDF Generation",
        description: "Convert web pages to PDF documents with accurate rendering.",
        example: "Launch browser, navigate to report page, generate PDF with specific dimensions"
      },
      {
        title: "Performance Monitoring",
        description: "Monitor website performance metrics, loading times, and resource usage.",
        example: "Launch browser, navigate to site, collect performance metrics and lighthouse scores"
      },
      {
        title: "Cross-Browser Testing",
        description: "Test your applications across different browser configurations and viewports.",
        example: "Launch multiple browsers with different viewport sizes to test responsive design"
      },
      {
        title: "Dynamic Page Interaction with exec-page",
        description: "Execute complex page interactions using the flexible exec-page tool with full Puppeteer API access.",
        example: `Use exec-page to navigate, interact, and extract data:
await page.goto('https://example.com');
await page.type('#search', 'query');
await page.click('#submit');
const results = await page.$$eval('.result', els => els.map(el => el.textContent));
return results;`
      }
    ],

    bestPractices: [
      "Always close browsers when done to free up system resources",
      "Use headless mode for automation tasks to improve performance",
      "Use headed mode (headless: false) for debugging and development",
      "Store browser IDs from launch-browser to manage multiple instances",
      "Store page IDs from create-page to manage and interact with specific pages",
      "Check list-browsers before launching new instances to avoid resource waste",
      "Use list-pages to track all active pages across browsers",
      "Close pages when done to free memory, or they'll be cleaned when browser closes",
      "Handle errors gracefully - browsers may crash or become unresponsive",
      "For exec-page: Always return a value at the end of your code",
      "For exec-page: Use try-catch blocks in your source code for better error handling"
    ],

    limitations: [
      "Browser instances are stored in memory and will be lost if the MCP server restarts",
      "Each browser instance consumes system resources (RAM, CPU)",
      "Puppeteer requires Chromium to be downloaded (happens automatically on first install)"
    ],
  }

  return JSON.stringify(documentation, null, 2)
}
