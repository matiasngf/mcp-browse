# MCP Fetch

A Model Context Protocol server for browser automation using Puppeteer. Control browsers, create pages, and execute arbitrary JavaScript - all through the MCP interface.

## Configuration

Add this to your MCP settings configuration file:

```json
{
  "mcp-fetch": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "mcp-fetch"
    ]
  }
}
```

## Features

- 🌐 **Browser Management**: Launch, list, and close browser instances
- 📄 **Page Control**: Create, list, and close pages (tabs) in browsers
- 🔧 **Flexible Execution**: Execute arbitrary JavaScript on pages with full Puppeteer API access
- 📋 **Comprehensive Docs**: Built-in documentation via `get-rules` tool

## Available Tools

### Browser Management

#### `launch-browser`
Launch a new browser instance with customizable settings.

**Parameters:**
- `headless` (boolean, optional): Run in headless mode. Default: `false`
- `width` (number, optional): Browser window width. Default: `1280`
- `height` (number, optional): Browser window height. Default: `720`

**Returns:**
```json
{
  "success": true,
  "browserId": "browser_1234567890_abc123",
  "message": "Browser launched successfully with ID: browser_1234567890_abc123",
  "config": {
    "headless": false,
    "width": 1280,
    "height": 720
  }
}
```

#### `list-browsers`
List all active browser instances with their details.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "browserCount": 1,
  "browsers": [{
    "id": "browser_1234567890_abc123",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "tabCount": 2,
    "tabs": [{
      "index": 0,
      "url": "https://example.com",
      "title": "Example Domain"
    }],
    "isConnected": true
  }]
}
```

#### `close-browser`
Close a browser instance and clean up resources.

**Parameters:**
- `browserId` (string, required): The ID of the browser to close

**Returns:**
```json
{
  "success": true,
  "message": "Browser browser_1234567890_abc123 closed successfully",
  "cleanedPagesCount": 2
}
```

### Page Management

#### `create-page`
Create a new page (tab) in a specified browser instance.

**Parameters:**
- `browserId` (string, required): The ID of the browser to create a page in

**Returns:**
```json
{
  "success": true,
  "pageId": "page_1234567890_xyz789",
  "browserId": "browser_1234567890_abc123",
  "message": "Page created successfully with ID: page_1234567890_xyz789"
}
```

#### `list-pages`
List all active pages across all browser instances.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "pageCount": 2,
  "pages": [{
    "id": "page_1234567890_xyz789",
    "browserId": "browser_1234567890_abc123",
    "browserExists": true,
    "createdAt": "2025-01-15T10:31:00.000Z",
    "url": "https://example.com",
    "title": "Example Domain",
    "isClosed": false
  }]
}
```

#### `close-page`
Close a specific page and remove it from active pages.

**Parameters:**
- `pageId` (string, required): The ID of the page to close

**Returns:**
```json
{
  "success": true,
  "message": "Page page_1234567890_xyz789 closed successfully"
}
```

### Page Interaction

#### `exec-page`
Execute arbitrary JavaScript code on a page with full Puppeteer API access.

**Parameters:**
- `pageId` (string, required): The ID of the page to execute code on
- `source` (string, required): JavaScript code to execute. Has access to the `page` object

**Returns:**
```json
{
  "success": true,
  "result": "The return value from your code as a string"
}
```

**Example Usage:**
```javascript
// Navigate and interact with a page
await page.goto('https://example.com');
await page.type('#search', 'hello world');
await page.click('#submit');

// Extract data
const title = await page.title();
const results = await page.$$eval('.result', els => els.length);

return { title, resultCount: results };
```

### Documentation

#### `get-rules`
Get comprehensive documentation about this MCP server.

**Parameters:** None

**Returns:** Complete documentation including schemas, use cases, and best practices.

## Use Cases

### Web Development & Debugging
Launch browsers to test your web applications during development. View real-time changes, debug JavaScript, inspect elements, and test responsive designs.

```javascript
// Launch a visible browser
launch-browser({ headless: false })

// Create a page and navigate to your dev server
create-page({ browserId: "browser_id" })
exec-page({
  pageId: "page_id",
  source: `
    await page.goto('http://localhost:3000');
    const title = await page.title();
    return title;
  `
})
```

### Automated Testing
Run automated tests in headless mode to verify functionality, take screenshots, or perform regression testing.

```javascript
// Launch headless browser for testing
launch-browser({ headless: true })

// Run your test suite
exec-page({
  pageId: "page_id",
  source: `
    await page.goto('https://myapp.com');
    await page.click('#login');
    await page.type('#username', 'test@example.com');
    await page.type('#password', 'password');
    await page.click('#submit');
    
    // Wait for navigation
    await page.waitForNavigation();
    
    // Check if login was successful
    const url = page.url();
    return url.includes('/dashboard') ? 'Login successful' : 'Login failed';
  `
})
```

### Web Scraping
Extract data from websites that require JavaScript execution or complex interactions.

```javascript
exec-page({
  pageId: "page_id",
  source: `
    await page.goto('https://news.site.com');
    
    // Wait for content to load
    await page.waitForSelector('.article');
    
    // Extract article data
    const articles = await page.$$eval('.article', elements => 
      elements.map(el => ({
        title: el.querySelector('.title')?.textContent,
        summary: el.querySelector('.summary')?.textContent,
        link: el.querySelector('a')?.href
      }))
    );
    
    return articles;
  `
})
```

## Best Practices

1. **Always close browsers when done** to free up system resources
2. **Use headless mode** for automation tasks to improve performance
3. **Use headed mode** (headless: false) for debugging and development
4. **Store browser and page IDs** to manage multiple instances
5. **Check existing browsers** with `list-browsers` before launching new ones
6. **Handle errors gracefully** - browsers may crash or become unresponsive
7. **For exec-page**: Always return a value at the end of your code
8. **For exec-page**: Use try-catch blocks for better error handling

## Installation

The browser (Chromium) will be automatically downloaded on first use. If you encounter issues, you can manually install it:

```bash
npx puppeteer browsers install chrome
```

## Limitations

- Browser instances are stored in memory and will be lost if the MCP server restarts
- Each browser instance consumes system resources (RAM, CPU)
- Puppeteer requires Chromium to be downloaded (happens automatically)

## License

MIT
