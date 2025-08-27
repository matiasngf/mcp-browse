import { z } from "zod"
import { type ToolMetadata, type InferSchema } from "xmcp"

const AVAILABLE_RULES = [
  "quickStart",
  "commonErrors",
  "interactions",
  "tools",
  "workflow",
  "performanceOptimization",
  "gamingTips",
  "debuggingWithPuppeteer"
] as const

type RuleKey = typeof AVAILABLE_RULES[number]

export const schema = {
  rules: z.array(z.enum(AVAILABLE_RULES)).describe("The documentation sections to retrieve")
}

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

type GetRulesArgs = InferSchema<typeof schema>

export default function getRules({ rules }: GetRulesArgs) {
  const documentation: Record<RuleKey, any> = {
    quickStart: {
      title: "Fast & Safe Web Automation",
      bestApproach: `// Get everything at once - MUCH faster than multiple calls
const pageData = await page.evaluate(() => {
  try {
    return {
      html: document.body.innerHTML.slice(0, 10000),
      title: document.title || '',
      url: window.location.href,
      buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
        text: (btn.innerText || '').trim(),
        className: btn.className || '', // STRING not array!
        id: btn.id || ''
      })),
      inputs: Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type || 'text',
        id: input.id || '',
        value: (input.value || '').slice(0, 50)
      }))
    };
  } catch (err) {
    return { error: err.toString() };
  }
});`,
      rules: [
        "DO NOT USE page.waitForTimeout, its deprecated",
        "ALWAYS wrap page.evaluate() in try-catch",
        "ALWAYS use || '' for properties that might be undefined",
        "className is STRING not array - use className.includes('x')",
        "Check elements exist: element?.innerText || ''",
        "Keep page.evaluate() SIMPLE - avoid setTimeout or complex async ops",
        "The exec-page tool supports direct Puppeteer methods, not just page.evaluate()",
        "Minimize tool calls - get all data in ONE page.evaluate() when possible",
        "Avoid complex selectors - they often get truncated and fail"
      ]
    },

    commonErrors: [
      {
        error: "className.includes is not a function",
        fix: "className is string! Use: element.className.includes('myclass')"
      },
      {
        error: "Cannot read property of null",
        fix: "Use optional chaining: element?.innerText || ''"
      },
      {
        error: "page.waitForTimeout is not a function",
        fix: "This puppeteer method is deprecated and not available anymore. Use await new Promise(resolve => setTimeout(resolve, ms)) instead"
      },
      {
        error: "Manual event dispatching doesn't work",
        fix: "Use Puppeteer's native methods: await page.type() instead of dispatching keyboard events"
      },
      {
        error: "Tool call truncated with <remaining_args_truncated />",
        fix: "Your query is too complex. Simplify and focus on essential data only"
      },
      {
        error: "Multiple sequential tool calls are slow",
        fix: "Combine multiple data extractions into ONE page.evaluate() call"
      }
    ],

    interactions: {
      title: "User Interactions - Clicking, Typing, etc.",
      bestPractices: [
        "Use Puppeteer's native methods for reliability",
        "Always click before typing to ensure focus",
        "Use appropriate typing delays for game/timed interactions",
        "Get ALL needed data in one call before starting interactions",
        "Check results after actions in the same tool call when possible"
      ],
      examples: `// ✅ GOOD: Efficient approach - one analysis, then interact
const pageData = await page.evaluate(() => ({
  inputSelector: '.input-field',
  textToType: document.querySelector('.prompt')?.textContent || '',
  hasInput: !!document.querySelector('.input-field')
}));
await page.click(pageData.inputSelector);
await page.type(pageData.inputSelector, pageData.textToType, { delay: 10 });

// ❌ BAD: Multiple sequential analysis calls
const input = await page.evaluate(() => document.querySelector('.input-field'));
const text = await page.evaluate(() => document.querySelector('.prompt')?.textContent);
// Too many separate calls!

// ✅ GOOD: Simple data extraction
const data = await page.evaluate(() => ({
  inputValue: document.querySelector('input')?.value || '',
  buttonText: document.querySelector('button')?.innerText || ''
}));

// ❌ BAD: Complex async operations in evaluate
const data = await page.evaluate(() => {
  return new Promise(resolve => {
    setTimeout(() => { // This often returns undefined!
      resolve({ data: 'something' });
    }, 1000);
  });
});`
    },

    tools: {
      browser: "launch-browser, list-browsers, close-browser",
      page: "open-page, list-pages, close-page",
      execPage: "Execute JavaScript on page AND Puppeteer methods (click, type, etc.)"
    },

    workflow: [
      "Launch browser with URL",
      "Use ONE exec-page call to analyze ALL page structure needed",
      "For interactions: use Puppeteer methods (page.click, page.type)",
      "For data extraction: use page.evaluate with simple synchronous code",
      "Minimize tool calls - batch operations when possible",
      "Close browser when done"
    ],

    performanceOptimization: {
      title: "Performance Best Practices",
      tips: [
        "CRITICAL: Minimize exec-page calls - each one is expensive",
        "Get ALL data you need in ONE page.evaluate() call",
        "Avoid making 3+ separate calls to check different page states",
        "Use selectors directly in Puppeteer methods instead of finding them first",
        "Keep queries simple to avoid truncation",
        "For delays, use: await new Promise(resolve => setTimeout(resolve, ms))"
      ],
      example: `// ❌ BAD: Too many tool calls
const hasButton = await page.evaluate(() => !!document.querySelector('.btn'));
const buttonText = await page.evaluate(() => document.querySelector('.btn')?.innerText);
const isEnabled = await page.evaluate(() => !document.querySelector('.btn')?.disabled);

// ✅ GOOD: One efficient call
const buttonData = await page.evaluate(() => {
  const btn = document.querySelector('.btn');
  return {
    exists: !!btn,
    text: btn?.innerText || '',
    enabled: btn ? !btn.disabled : false
  };
});`
    },

    gamingTips: {
      title: "Tips for Dynamic/Real-time Sites",
      tips: [
        "Use very low delays (5-10ms) for time-sensitive interactions",
        "Focus inputs before typing: await page.click() then page.type()",
        "Check for completion indicators after actions",
        "Some sites require specific event sequences - native methods work best",
        "Avoid screenshots unless specifically needed - they're expensive"
      ]
    },

    debuggingWithPuppeteer: {
      title: "Debug Web Page with Puppeteer MCP Tool",
      description: "Complete workflow for debugging web pages, especially WebGL/Three.js applications",
      steps: [
        {
          step: 1,
          title: "Launch browser",
          tool: "mcp_mcp-fetch_puppeteer",
          action: { type: "launch-browser", headless: false, width: 1280, height: 720 }
        },
        {
          step: 2,
          title: "Navigate and setup console monitoring",
          tool: "mcp_mcp-fetch_puppeteer",
          code: `// Setup console listeners
const consoleLogs = [];
page.on('console', msg => {
  consoleLogs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
    timestamp: new Date().toISOString()
  });
});

page.on('pageerror', error => {
  consoleLogs.push({
    type: 'pageerror',
    text: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

// Navigate to URL
await page.goto('[URL]', { waitUntil: 'networkidle2' });

// Wait for any async operations
await new Promise(resolve => setTimeout(resolve, 3000));

return { 
  setupComplete: true, 
  url: page.url(),
  consoleLogsCount: consoleLogs.length 
};`
        },
        {
          step: 3,
          title: "Check WebGL and shader errors",
          tool: "mcp_mcp-fetch_puppeteer",
          code: `const webglStatus = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'No canvas found' };
  
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return { error: 'No WebGL context' };
  
  // Collect GL errors
  const errors = [];
  const errorMap = {
    0x0500: 'INVALID_ENUM',
    0x0501: 'INVALID_VALUE', 
    0x0502: 'INVALID_OPERATION',
    0x0503: 'STACK_OVERFLOW',
    0x0504: 'STACK_UNDERFLOW',
    0x0505: 'OUT_OF_MEMORY',
    0x0506: 'INVALID_FRAMEBUFFER_OPERATION',
    0x9242: 'CONTEXT_LOST_WEBGL'
  };
  
  let error;
  while ((error = gl.getError()) !== 0) {
    errors.push(errorMap[error] || \`Unknown error: 0x\${error.toString(16)}\`);
  }
  
  // Get shader compilation info
  const ext = gl.getExtension('WEBGL_debug_shaders');
  
  return {
    errors,
    renderer: gl.getParameter(gl.RENDERER),
    vendor: gl.getParameter(gl.VENDOR),
    webglVersion: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    extensions: gl.getSupportedExtensions(),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
  };
});

return webglStatus;`
        },
        {
          step: 4,
          title: "Get console logs and performance metrics",
          tool: "mcp_mcp-fetch_puppeteer",
          code: `// Get accumulated console logs
const metrics = await page.metrics();
const coverage = await page.coverage.startJSCoverage();
await page.coverage.stopJSCoverage();

const performanceData = await page.evaluate(() => {
  const perfData = performance.getEntriesByType('navigation')[0];
  return {
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
  };
});

return {
  consoleLogs,
  metrics: {
    timestamp: metrics.Timestamp,
    documents: metrics.Documents,
    frames: metrics.Frames,
    jsEventListeners: metrics.JSEventListeners,
    nodes: metrics.Nodes,
    layoutCount: metrics.LayoutCount,
    recalcStyleCount: metrics.RecalcStyleCount,
    layoutDuration: metrics.LayoutDuration,
    recalcStyleDuration: metrics.RecalcStyleDuration,
    scriptDuration: metrics.ScriptDuration,
    taskDuration: metrics.TaskDuration,
    jsHeapUsedSize: metrics.JSHeapUsedSize,
    jsHeapTotalSize: metrics.JSHeapTotalSize
  },
  performance: performanceData
};`
        },
        {
          step: 5,
          title: "Take screenshot and check network errors",
          tool: "mcp_mcp-fetch_puppeteer",
          code: `// Check for failed network requests
const failedRequests = [];
page.on('requestfailed', request => {
  failedRequests.push({
    url: request.url(),
    method: request.method(),
    failure: request.failure()
  });
});

// Take screenshot
const screenshot = await page.screenshot({ 
  path: 'debug-screenshot.png',
  fullPage: false 
});

// Check for specific Three.js errors
const threejsErrors = await page.evaluate(() => {
  const logs = [];
  if (window.console && window.console.threejs) {
    logs.push('Three.js specific logs found');
  }
  // Check for shader compilation errors in DOM
  const shaderErrors = document.querySelectorAll('.shader-error');
  return {
    hasThreejsErrors: logs.length > 0,
    shaderErrorElements: shaderErrors.length,
    canvasCount: document.querySelectorAll('canvas').length
  };
});

return {
  screenshotTaken: true,
  failedRequestsCount: failedRequests.length,
  failedRequests,
  threejsStatus: threejsErrors
};`
        },
        {
          step: 6,
          title: "Close browser",
          tool: "mcp_mcp-fetch_puppeteer",
          action: { type: "close-browser", browserId: "[BROWSER_ID]" }
        }
      ],
      notes: [
        "Replace [URL] with the actual URL to debug",
        "Replace [PAGE_ID] with the actual page ID from step 2",
        "Replace [BROWSER_ID] with the actual browser ID from step 1",
        "The consoleLogs array persists across exec-page calls as it's defined in the page context",
        "WebGL error codes are mapped to human-readable names for easier debugging",
        "Performance metrics provide detailed timing and memory usage information",
        "Screenshot is saved locally for visual debugging",
        "Network failures are tracked to identify loading issues"
      ]
    }
  }

  // Build result object with only requested rules
  const result: Partial<Record<RuleKey, any>> = {}

  for (const rule of rules) {
    if (rule in documentation) {
      result[rule] = documentation[rule]
    }
  }

  return JSON.stringify(result, null, 2)
}