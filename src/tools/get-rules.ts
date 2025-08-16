import { type ToolMetadata } from "xmcp"

export const schema = {}

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

export default function getRules() {
  const documentation = {
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
    }
  }

  return JSON.stringify(documentation, null, 2)
}