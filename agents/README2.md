# AI Agent-Driven Development Workflow

This document provides a comprehensive guide to setting up and running the AI agent-driven development workflow for the PlumbingPOC project. The workflow leverages a multi-agent system to automate UI/UX analysis, code implementation, and task management in a state-aware loop.

## 1. Prerequisites

Before you begin, ensure you have the following:
*   **Node.js** (v18 or higher recommended).
*   **npm** (comes with Node.js).
*   A running instance of the **PlumbingPOC web application**.

## 2. One-Time Setup

These steps only need to be performed once to prepare your environment.

### Step 1: Install Node.js Dependencies

Install all necessary Node.js packages by running the following command from the **project root directory** (`PlumbingPOC/`):

```bash
npm install playwright @google/generative-ai --legacy-peer-deps dotenv
```

This command installs:
*   `playwright`: For browser automation.
*   `@google/generative-ai`: For integrating with the Gemini API.
*   `dotenv`: For loading environment variables from the `.env` file.

### Step 2: Configure Environment Variables

The agents require API keys and URLs to function.

1.  Create a file named `.env` in the **project root directory**.
2.  Copy and paste the following content into the `.env` file, replacing the placeholder values with your actual keys and URLs.

    ```
    # Your Gemini API Key from Google AI Studio
    GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

    # The full URL where your local Vite/React app is running
    VITE_FRONTEND_BASE_URL=http://localhost:5173

    # The WebSocket endpoint for the Playwright server (default)
    PLAYWRIGHT_SERVER_URL=http://localhost:49982/
    ```

### Step 3: Run the Playwright Server

For the agents to control a browser, the Playwright server must be running. Open a **separate, dedicated terminal** and run the following command. Leave this terminal running in the background.

```bash
npx playwright run-server
```
*Note: This uses the official, built-in Playwright server, which is simpler and more reliable than third-party alternatives.*

### Step 4:  run the chrome as a host for testing
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-mcp
```

---

## 3. The End-to-End AI Workflow

This is the main, orchestrated workflow that uses the Project Manager agent to automate the entire UI improvement lifecycle.

### How It Works: The State-Aware Feedback Loop

This workflow is designed to prevent duplicate work and create a clear audit trail.

1.  **Task Generation:** The `project-manager-mcp-agent` first calls the `ui-designer-mcp-agent`. The designer analyzes the UI and creates a `ui-feedback.json` file with a `status` of `"pending"`.
2.  **Task Assignment:** The Project Manager reads the pending feedback and formally assigns the implementation task.
3.  **Implementation & State Update:** The `frontend-developer-mcp-agent` is called. It checks the file's status. Since it's `"pending"`, it implements the code change and then updates the `ui-feedback.json` file's `status` to `"implemented"`.
4.  **Verification & Archiving:** The Project Manager agent takes over again, verifies the status is now `"implemented"`, and archives the completed feedback file to a `feedback/archive/` directory with a timestamp. This "closes the ticket" and prepares the system for the next run.

### Running the Workflow

To run the entire automated workflow, execute the following command from the **project root directory**. Replace `<email>` and `<password>` with valid login credentials for your application.

```bash
node agents/project-manager-mcp-agent.js run-workflow <email> <password>
```

---

## 4. Standalone Agent Commands (for Testing & Debugging)

You can also run the agents individually. **Note:** Always run these commands from the `PlumbingPOC/` root directory.

### UI Designer Agent

Generates a new `ui-feedback.json` file.

```bash
node agents/ui-designer-mcp-agent.js analyze-ui <email> <password>
```

### Frontend Developer Agent

Implements the feedback from an existing `ui-feedback.json` file.

```bash
node agents/frontend-developer-mcp-agent.js implement-feedback --feedback-file agents/feedback/ui-feedback.json
```

### Backend Architect Agent

Performs a high-level review of your actual backend code.

```bash
node agents/backend-architect-mcp-agent.js review-backend
```

---

## 5. How It Works: Technical Diagrams

### High-Level Workflow Orchestration

This diagram illustrates the new, state-aware workflow managed by the Project Manager agent.

```mermaid
sequenceDiagram
    participant User
    participant project-manager-mcp-agent.js
    participant ui-designer-mcp-agent.js
    participant frontend-developer-mcp-agent.js
    participant "File System (feedback.json)"

    User->>project-manager-mcp-agent.js: Run workflow command
    project-manager-mcp-agent.js->>ui-designer-mcp-agent.js: 1. Analyze UI
    ui-designer-mcp-agent.js->>"File System (feedback.json)": 2. Create feedback (status: pending)
    
    project-manager-mcp-agent.js->>"File System (feedback.json)": 3. Read & verify status is 'pending'
    project-manager-mcp-agent.js->>frontend-developer-mcp-agent.js: 4. Implement feedback
    
    frontend-developer-mcp-agent.js->>"File System (feedback.json)": 5. Read feedback & implement change
    frontend-developer-mcp-agent.js->>"File System (feedback.json)": 6. Update status to 'implemented'
    
    project-manager-mcp-agent.js->>"File System (feedback.json)": 7. Verify status is 'implemented' & archive file
    project-manager-mcp-agent.js->>User: 8. Report completion```

### Technical: Playwright Connection

This diagram shows how the agent scripts connect to and control the browser via the Playwright server.

```mermaid
sequenceDiagram
    participant Agent Script (e.g., ui-designer-mcp-agent.js)
    participant Playwright Library
    participant Playwright Server (npx playwright run-server)
    participant Browser (Chrome/Chromium)

    Agent Script->>Playwright Library: Use chromium.connectOverCDP()
    Playwright Library->>Playwright Server: Connect via WebSocket (CDP URL)
    Playwright Server->>Browser: Establishes and manages control session
    Browser-->>Playwright Server: Ready for automation
    Playwright Server-->>Playwright Library: Connection successful
    Playwright Library-->>Agent Script: Returns 'browser' object for automation
    Agent Script->>Agent Script: Executes automation steps (login, screenshot, etc.)
```