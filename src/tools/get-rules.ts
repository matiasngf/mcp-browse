import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"

// Define the schema for tool parameters
export const schema = {}

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-rules",
  description: "Get detailed documentation about this MCP server including schemas, usage instructions, and use cases",
  annotations: {
    title: "Get Rules and Documentation",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

// Tool implementation
export default function getRules() {
  const documentation = {
    name: "MCP Browse Server",
    version: "0.1.0",
    description: "A Model Context Protocol server for browser automation using Puppeteer. Perfect for web development, debugging, testing, and automation tasks.",

    tools: {
      "launch-browser": {
        description: "Launch a new browser instance with customizable settings",
        schema: {
          headless: {
            type: "boolean",
            optional: true,
            default: false,
            description: "Whether to run browser in headless mode. Set to true for automation, false for debugging"
          },
          width: {
            type: "number",
            optional: true,
            default: 1280,
            description: "Browser window width in pixels"
          },
          height: {
            type: "number",
            optional: true,
            default: 720,
            description: "Browser window height in pixels"
          }
        },
        returns: {
          success: "boolean",
          browserId: "string (unique identifier)",
          message: "string",
          config: "object with launch configuration"
        }
      },

      "list-browsers": {
        description: "List all active browser instances with detailed tab information",
        schema: {},
        returns: {
          success: "boolean",
          browserCount: "number",
          browsers: [{
            id: "string",
            createdAt: "ISO 8601 timestamp",
            tabCount: "number",
            tabs: [{
              index: "number",
              url: "string",
              title: "string"
            }],
            isConnected: "boolean"
          }]
        }
      },

      "close-browser": {
        description: "Close a specific browser instance and clean up resources",
        schema: {
          browserId: {
            type: "string",
            required: true,
            description: "The ID of the browser instance to close (obtained from launch-browser)"
          }
        },
        returns: {
          success: "boolean",
          message: "string or error",
          cleanedPagesCount: "number of pages cleaned up"
        }
      },

      "create-page": {
        description: "Create a new page (tab) in a specified browser instance",
        schema: {
          browserId: {
            type: "string",
            required: true,
            description: "The ID of the browser instance to create a page in"
          }
        },
        returns: {
          success: "boolean",
          pageId: "string (unique page identifier)",
          browserId: "string",
          message: "string"
        }
      },

      "list-pages": {
        description: "List all active pages across all browser instances",
        schema: {},
        returns: {
          success: "boolean",
          pageCount: "number",
          pages: [{
            id: "string",
            browserId: "string",
            browserExists: "boolean",
            createdAt: "ISO 8601 timestamp",
            url: "string",
            title: "string",
            isClosed: "boolean"
          }]
        }
      },

      "close-page": {
        description: "Close a specific page and remove it from active pages",
        schema: {
          pageId: {
            type: "string",
            required: true,
            description: "The ID of the page to close (obtained from create-page)"
          }
        },
        returns: {
          success: "boolean",
          message: "string or error"
        }
      },

      "exec-page": {
        description: "Execute arbitrary JavaScript code on a page with full Puppeteer API access",
        schema: {
          pageId: {
            type: "string",
            required: true,
            description: "The ID of the page to execute code on"
          },
          source: {
            type: "string",
            required: true,
            description: "JavaScript code to execute. Has access to 'page' object and should return a value"
          }
        },
        returns: {
          success: "boolean",
          result: "string representation of the returned value or error message"
        }
      },

      "get-rules": {
        description: "Get this documentation",
        schema: {},
        returns: "Complete documentation object"
      }
    },

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

    upcomingFeatures: [
      "screenshot: Take screenshots of pages or elements",
      "pdf: Generate PDF from pages",
      "get-cookies: Retrieve browser cookies",
      "set-cookies: Set browser cookies",
      "intercept-requests: Monitor and modify network requests",
      "emulate-device: Emulate mobile devices and screen sizes",
      "record-video: Record page interactions as video",
      "performance-metrics: Collect detailed performance metrics"
    ]
  }

  return JSON.stringify(documentation, null, 2)
}
