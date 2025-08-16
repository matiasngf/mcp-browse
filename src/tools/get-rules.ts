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
        "ALWAYS wrap page.evaluate() in try-catch",
        "ALWAYS use || '' for properties that might be undefined",
        "className is STRING not array - use className.includes('x')",
        "Check elements exist: element?.innerText || ''",
        "Keep page.evaluate() SIMPLE - avoid setTimeout or complex async ops",
        "The exec-page tool supports direct Puppeteer methods, not just page.evaluate()"
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
        fix: "This puppeteer method is deprecated and not available anymore. Use page.evaluate() with setTimeout if needed"
      },
      {
        error: "Manual event dispatching doesn't work",
        fix: "Use Puppeteer's native methods: await page.type() instead of dispatching keyboard events"
      }
    ],

    interactions: {
      title: "User Interactions - Clicking, Typing, etc.",
      bestPractices: [
        "Use Puppeteer's native methods for reliability",
        "Always click before typing to ensure focus",
        "Use appropriate typing delays for game/timed interactions"
      ],
      examples: `// ✅ GOOD: Use native Puppeteer methods
await page.click('.input-field');
await page.type('.input-field', 'Hello World', { delay: 10 });

// ❌ BAD: Manual event dispatching (often fails)
await page.evaluate(() => {
  const input = document.querySelector('input');
  const event = new KeyboardEvent('keydown', { key: 'a' });
  input.dispatchEvent(event); // Often doesn't work!
});

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
      "Use exec-page to analyze page structure",
      "For interactions: use Puppeteer methods (page.click, page.type)",
      "For data extraction: use page.evaluate with simple synchronous code",
      "Close browser when done"
    ],

    gamingTips: {
      title: "Tips for Gaming/Real-time Sites",
      tips: [
        "Use very low delays (5-10ms) for competitive typing games",
        "Focus inputs before typing: await page.click() then page.type()",
        "Check for completion indicators after actions",
        "Some games require specific event sequences - native methods work best"
      ]
    }
  }

  return JSON.stringify(documentation, null, 2)
}