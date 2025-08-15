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
          message: "string or error"
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
      }
    ],

    bestPractices: [
      "Always close browsers when done to free up system resources",
      "Use headless mode for automation tasks to improve performance",
      "Use headed mode (headless: false) for debugging and development",
      "Store browser IDs from launch-browser to manage multiple instances",
      "Check list-browsers before launching new instances to avoid resource waste",
      "Handle errors gracefully - browsers may crash or become unresponsive"
    ],

    limitations: [
      "Browser instances are stored in memory and will be lost if the MCP server restarts",
      "Each browser instance consumes system resources (RAM, CPU)",
      "Puppeteer requires Chromium to be downloaded (happens automatically on first install)"
    ],

    upcomingFeatures: [
      "navigate-to: Navigate to a specific URL in a browser tab",
      "screenshot: Take screenshots of pages or elements",
      "click: Click on page elements",
      "type: Type text into input fields",
      "wait-for: Wait for elements or conditions",
      "evaluate: Execute JavaScript in page context",
      "get-cookies: Retrieve browser cookies",
      "set-cookies: Set browser cookies"
    ]
  }

  return JSON.stringify(documentation, null, 2)
}
