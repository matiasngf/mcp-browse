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
      },
      {
        title: "Step-by-Step Web Interaction",
        description: "For complex web apps, use multiple exec-page calls to understand and interact with the page progressively.",
        example: `// Step 1: Understand the page structure
exec-page({ source: \`
  const structure = await page.evaluate(() => ({
    url: window.location.href,
    buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText),
    inputs: document.querySelectorAll('input').length,
    mainElements: Array.from(document.querySelectorAll('[id]')).slice(0, 10).map(e => e.id)
  }));
  return structure;
\` })

// Step 2: Based on the structure, interact with specific elements
exec-page({ source: \`
  // Now you know what elements exist, interact with them
  const button = document.querySelector('button[innerText="Start"]');
  if (button) button.click();
  return 'clicked start button';
\` })`
      },
      {
        title: "Page Management with Unified Page Tool",
        description: "Use the unified page tool to list, open, and close browser pages with a flexible action-based interface.",
        example: `Use page tool with different actions:
// List all pages
page({ action: { type: "list-pages" } })

// Open a new page in a browser
page({ action: { type: "open-page", browserId: "browser_123" } })

// Open a new page with a URL
page({ action: { type: "open-page", browserId: "browser_123", url: "https://example.com" } })

// Close a specific page
page({ action: { type: "close-page", pageId: "page_456" } })`
      },
      {
        title: "Browser Management with Unified Browser Tool",
        description: "Use the unified browser tool to list, launch, and close browser instances with a flexible action-based interface.",
        example: `Use browser tool with different actions:
// List all browsers
browser({ action: { type: "list-browsers" } })

// Launch a new browser
browser({ action: { type: "launch-browser", headless: false, width: 1280, height: 720 } })

// Launch a new browser with initial URL
browser({ action: { type: "launch-browser", headless: false, url: "https://example.com" } })

// Close a specific browser
browser({ action: { type: "close-browser", browserId: "browser_123" } })`
      }
    ],

    bestPractices: [
      "Always close browsers when done to free up system resources",
      "Use headless mode for automation tasks to improve performance",
      "Use headed mode (headless: false) for debugging and development",
      "Store browser IDs from browser tool (action: launch-browser) to manage multiple instances",
      "Store page IDs from page tool (action: open-page) to manage and interact with specific pages",
      "Check browser tool (action: list-browsers) before launching new instances to avoid resource waste",
      "Use page tool (action: list-pages) to track all active pages across browsers",
      "Close pages when done to free memory, or they'll be cleaned when browser closes",
      "Handle errors gracefully - browsers may crash or become unresponsive",
      "For exec-page: Always return a value at the end of your code",
      "For exec-page: Use try-catch blocks in your source code for better error handling"
    ],

    effectiveWebInteraction: {
      title: "Effective Web Interaction Strategy",
      description: "When interacting with complex web pages, follow a systematic approach rather than making assumptions",
      steps: [
        {
          step: 1,
          action: "Inspect Page Structure First",
          example: `// First, get the HTML structure to understand the page
const html = await page.content();
const structure = await page.evaluate(() => {
  return {
    title: document.title,
    bodyClasses: document.body.className,
    mainContainers: Array.from(document.querySelectorAll('div[id], main, section')).slice(0, 10).map(el => ({
      tag: el.tagName,
      id: el.id,
      classes: el.className
    })),
    buttons: Array.from(document.querySelectorAll('button')).slice(0, 10).map(btn => ({
      text: btn.innerText,
      onclick: btn.onclick ? 'has handler' : 'no handler',
      type: btn.type
    })),
    iframes: document.querySelectorAll('iframe').length
  }
});
return { structure, htmlLength: html.length };`
        },
        {
          step: 2,
          action: "Check for Overlays and Modals",
          example: `// Check for popups, modals, or overlays that might block interaction
const overlays = await page.evaluate(() => {
  const potentialOverlays = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return (style.position === 'fixed' || style.position === 'absolute') && 
           style.zIndex && parseInt(style.zIndex) > 100 &&
           el.offsetWidth > 100 && el.offsetHeight > 100;
  });
  return potentialOverlays.slice(0, 5).map(el => ({
    tag: el.tagName,
    id: el.id,
    classes: el.className,
    zIndex: window.getComputedStyle(el).zIndex,
    visible: el.offsetParent !== null
  }));
});
return overlays;`
        },
        {
          step: 3,
          action: "Plan Actions Based on Actual DOM",
          example: `// After understanding the structure, plan your interactions
const elements = await page.evaluate(() => {
  // Look for actual elements instead of guessing selectors
  const results = {};
  
  // Find interactive elements
  const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
    text: btn.innerText,
    id: btn.id,
    classes: btn.className
  }));
  
  const links = Array.from(document.querySelectorAll('a')).slice(0, 10).map(link => ({
    text: link.innerText,
    href: link.href
  }));
  
  const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(input => ({
    type: input.type,
    name: input.name,
    id: input.id,
    placeholder: input.placeholder
  }));
  
  return { buttons, links, inputs };
});
return elements;`
        },
        {
          step: 4,
          action: "Use Small, Verifiable Steps",
          example: `// Execute actions in small steps and verify each one
// Step 1: Try to interact with a specific element
const interactionResult = await page.evaluate(() => {
  const targetElement = document.querySelector('input[type="text"]');
  if (targetElement) {
    targetElement.focus();
    return { focused: true, elementId: targetElement.id };
  }
  return { focused: false };
});

// Step 2: Verify the interaction worked before proceeding
if (interactionResult.focused) {
  await page.keyboard.type('test input');
  
  // Verify the input was received
  const valueSet = await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    return input ? input.value : null;
  });
  
  return { interactionResult, valueSet };
}`
        }
      ],
      antiPatterns: [
        "Don't assume selector names - inspect first",
        "Don't chain multiple actions without verification",
        "Don't use complex selectors like ':has-text()' that might not be supported",
        "Don't ignore page load states and animations",
        "Don't skip error handling for each interaction"
      ]
    },

    limitations: [
      "Browser instances are stored in memory and will be lost if the MCP server restarts",
      "Each browser instance consumes system resources (RAM, CPU)",
      "Puppeteer requires Chromium to be downloaded (happens automatically on first install)"
    ],
  }

  return JSON.stringify(documentation, null, 2)
}
