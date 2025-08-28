# Plumbing Quote Agent MCP Persona Repos

This document lists the MCP agent personas used in this project and provides links to relevant GitHub repositories for browser automation and agent frameworks.

## Browser Automation & Testing MCP Agents

For all browser automation and testing tasks, use Playwright-based MCP servers. Playwright is the recommended and standardized solution for browser interaction, web scraping, and UI testing in the MCP ecosystem.

**Recommended MCP Server:**
- [Playwright MCP Server](https://mcp.so/server/playwright-mcp/microsoft)

**Why Playwright?**
- Cross-browser support (Chromium, Firefox, WebKit)
- Modern automation features
- Robust integration with LLMs and MCP clients
- Active community and ongoing development

**Usage:**
Integrate Playwright MCP servers for any agent requiring browser automation, UI testing, or web scraping. Other tools (e.g., Puppeteer) are available but Playwright is preferred for consistency and reliability.

---
# Plumbing Quote Agent MCP Persona Repos

This document lists the MCP agent personas used in this project and provides links to relevant GitHub repositories for browser automation and agent frameworks.

## Agent Personas & Recommended MCP Server Repos

### 1. Project Manager Agent (`project-manager-mcp`)
- **Role:** Project manager and task tracker
- **Recommended Repo:** No direct MCP server; use a generic agent framework or [MCP-Agent](https://github.com/lastmile-ai/mcp-agent)

### 2. UI Designer Agent (`ui-designer-mcp`)
- **Role:** Visionary UI designer
- **Recommended Browser MCP Server:**
  - [Playwright MCP Server](https://github.com/executeautomation/mcp-playwright)
  - [Browser-Use MCP Server (Playwright/Chromium)](https://github.com/co-browser/browser-use-mcp-server)
  - [Puppeteer Vision MCP Server](https://github.com/djannot/puppeteer-vision-mcp)

### 3. Frontend Developer Agent (`frontend-developer-mcp`)
- **Role:** Elite frontend developer
- **Recommended Browser MCP Server:**
  - [Playwright MCP Server](https://github.com/executeautomation/mcp-playwright)
  - [Browser-Use MCP Server](https://github.com/co-browser/browser-use-mcp-server)

### 4. Backend Architect Agent (`backend-architect-mcp`)
- **Role:** Backend architect
- **Recommended Repo:**
  - [MCP-Agent](https://github.com/lastmile-ai/mcp-agent) (for agent orchestration)
  - [MCP-Framework](https://mcp-framework.com/) (TypeScript server framework)

## MCP Client Frameworks

## Notes

## Playwright MCP Server Installation & Usage

**Recommended: Install globally. You can run these commands from any folder.**

### Steps:
1. **Install Node.js** (if not already installed)
  - On macOS: `brew install node`

2. **Install Playwright MCP server globally:**
  - `sudo npm install -g @executeautomation/playwright-mcp-server`

3. **Start the Playwright MCP server:**
  - `npx playwright run-server`

4. **Verify the server is running:**
  - You should see output indicating the server has started, including port and endpoint details.

---
**Tip:** You do not need to clone the repo or build manually. The global install provides the CLI entry point for the server.

**Testing:**
- After running `playwright-mcp-server`, check the terminal for startup messages. If you see a message like "Playwright MCP server started" or similar, the server is working.

**Update this file as new agents or MCP server repos are added to your workflow.**
**Update this file as new agents or MCP server repos are added to your workflow.**
---
**Update this file as new agents or MCP server repos are added to your workflow.**
