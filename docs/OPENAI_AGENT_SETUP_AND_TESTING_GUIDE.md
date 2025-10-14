# OpenAI Agent Testing Guide

This guide explains how to test the PlumbingPOC OpenAI agents locally and in the Agent Builder GUI.

## Overview

The PlumbingPOC application includes two OpenAI Agent Toolkit agents:
- **QuoteAgent**: Handles customer quote requests with static questions first, AI fallback
- **TriageAgent**: Analyzes requests for priority scoring and profitability assessment

## Local Testing

### Prerequisites
- Node.js and npm installed
- Supabase project configured
- OpenAI API key set in environment variables
- Local development environment running

### Testing QuoteAgent

1. **Start the Application**:
   ```bash
   npm run dev
   ```
   This starts both frontend (port 5173) and backend (port 3000).

2. **Access the Quote Modal**:
   - Navigate to the frontend application
   - Click "Request a Quote" or similar button to open the QuoteAgentModal

3. **Test the Flow**:
   - Answer the emergency question
   - Select a service category (e.g., "Leak Repair")
   - Answer static questions from `serviceDefinitions.ts`
   - Observe AI fallback for clarifying questions (if needed)
   - Review the summary and submit

4. **Monitor Backend Logs**:
   - Check terminal output for agent execution
   - Verify API calls to `/api/requests/gpt-follow-up`
   - Confirm database updates with triage information

### Testing TriageAgent

1. **Submit a Quote Request**:
   - Follow the QuoteAgent testing steps above
   - Submit a complete quote request

2. **Check Admin Dashboard**:
   - Access the admin interface
   - View the new request in the requests list
   - Look for the `AITriageSummary` component displaying:
     - Triage summary text
     - Priority score (1-10)
     - Profitability score (1-10)
     - Explanations

3. **Verify Database**:
   - Check Supabase for the request record
   - Confirm `triage_summary`, `priority_score`, `profitability_score` fields are populated

### Debugging

- **Enable Debug Panel**: Set `VITE_DEBUG_PANEL=true` in environment variables
- **Check Function Logs**: Monitor backend console for agent execution details
- **API Testing**: Use tools like Postman to test `/api/requests/gpt-follow-up` endpoint
- **Agent Configuration**: Modify `agents/quote-agent.yaml` or `agents/triage-agent.yaml` and restart the server

## Agent Builder GUI Testing

### Prerequisites
- OpenAI account with Agent Toolkit access
- Agent Builder GUI access (https://platform.openai.com/agent-builder)

### Step 1: Import into Agent Builder (GUI)

1. **Access Agent Builder**:
   - Go to https://platform.openai.com/agent-builder
   - Sign in with your OpenAI account

2. **Import QuoteAgent**:
   - Click "New Agent" → "Import from YAML"
   - Paste the full contents of `agents/quote-agent.yaml`
   - The canvas should render boxes for:
     - Static Questions
     - Decision (check completion)
     - AI Follow-up
     - Submit action

3. **Import TriageAgent**:
   - Repeat the import process with `agents/triage-agent.yaml`
   - You should see a flow: Fetch → Analyze → Update DB

4. **Save Agents**:
   - Save each agent in your Builder workspace

### Step 2: Connect to Your App

In your frontend (`packages/frontend/...`), add ChatKit:

```typescript
import { ChatKitConversation } from "@openai/agentkit-react";
```

Then render them:

```tsx
// For QuoteAgent
<ChatKitConversation agent="QuoteAgent" initialContext={{ requestId }} />

// For TriageAgent
<ChatKitConversation agent="TriageAgent" initialContext={{ requestId }} />
```

### Step 3: Round-trip Workflow

1. **Edit Locally**: Modify YAML files in VS Code
2. **Push Updates**: Commit and push changes
3. **Import to Builder**: Import updated YAML into Agent Builder
4. **Tweak Visually**: Make adjustments in the GUI
5. **Export**: Export updated YAML and replace in your repo

### Testing in GUI

1. **Test QuoteAgent Flow**:
   - Use the GUI chat interface
   - Simulate a customer quote request
   - Verify static questions are asked first
   - Test AI fallback for complex scenarios
   - Check tool execution for leak assessment

2. **Test TriageAgent Flow**:
   - Provide a sample request description
   - Verify priority and profitability scoring
   - Check structured output format
   - Test tool calculations

3. **Performance Testing**:
   - Monitor token usage and costs
   - Test response times
   - Verify guardrail filtering

### GUI vs Local Differences

- **GUI**: Pure agent testing without frontend integration
- **Local**: Full application flow with database persistence
- **GUI**: Easier for rapid agent iteration and debugging
- **Local**: Tests complete user experience and data flow

## Local CLI Testing

### Method 2: Local Testing with OpenAI CLI

**Note:** The OpenAI CLI currently only supports migration commands. Local agent development may require the Agent Toolkit beta access or different tooling. The following represents the intended workflow once available:

#### Prerequisites

1. **Node.js and npm**
   - AgentKit CLI runs in Node.js
   - Check versions: `node -v` and `npm -v`
   - Minimum: Node.js ≥ 18
   - Install latest LTS: https://nodejs.org/en/download
   - macOS recommendation: `brew install node`

2. **OpenAI npm package**
   ```bash
   npm install -g openai
   ```
   This installs the CLI tool with `agents dev` command.

3. **API Key Environment Variable**
   - Set your OpenAI API key for CLI authentication
   - For zsh (macOS default):
     ```bash
     echo 'export OPENAI_API_KEY="<REDACTED>"' >> ~/.zshrc
     source ~/.zshrc
     ```
   - For bash:
     ```bash
     echo 'export OPENAI_API_KEY="<REDACTED>"' >> ~/.bashrc
     source ~/.bashrc
     ```
   - Test: `openai models list` (should show available models like gpt-4o-mini, gpt-4o)

4. **YAML Files**
   - Ensure `agents/quote-agent.yaml` and `agents/triage-agent.yaml` are in your project
   - Checked into your feature branch

5. **Optional: Tools Folder**
   - If agents use custom tools (e.g., `submitQuoteToSupabase`, `assess_leak_severity`)
   - Create `tools/` folder alongside YAML files
   - Add matching JS/TS modules exporting tool functions
   - AgentKit dev auto-loads from this folder

#### Step 1: Run Agent Locally in Dev Mode

From your repo root (on the `OpenAIAgentToolKitMigration` branch):

```bash
# For QuoteAgent (when available)
npx openai agents dev agents/quote-agent.yaml

# For TriageAgent (when available)
npx openai agents dev agents/triage-agent.yaml
```

**What this does:**
- Starts a local AgentKit dev server
- Reads your YAML definition
- Lets you interact with the agent in your terminal
- Shows logs of node transitions (static → decision → AI fallback, etc.)

#### Step 2: Try a Test Conversation

Once the dev server is running, type directly into the terminal:

**For QuoteAgent:**
```
> I need a quote for fixing a leaking pipe
```

**For TriageAgent:**
```
> Triage request for service #123
```

You should see:
- Static question flow first
- Either finish without AI if complete, OR
- Hand off to AI node (gpt-4o-mini) for clarifiers

#### Step 3: Enable Tools in Local Dev

If you've defined tools in your YAML (like `assess_leak_severity`), create a local `tools/` folder:

```javascript
// tools/assess_leak_severity.js
export async function assess_leak_severity(context) {
  return { severity: "moderate" };
}
```

AgentKit will auto-load tools from this folder when running `npx openai agents dev`.

#### Step 4: Hot Reload

- Edit your YAML or tool files in VS Code
- The agent reloads automatically — no restart needed

#### Step 5: When Ready

- Import the same YAML into the Agent Builder canvas
- Or connect it directly in your frontend with `<ChatKitConversation />`

**Note:** Local testing via `npx openai agents dev` isn't in your CLI yet; the real way today is via the Agents SDK (`@openai/agents`).

#### Alternative: OpenAI Agents SDK for Local Testing

If CLI commands are unavailable, use the OpenAI Agents SDK for programmatic testing:

1. **Install the SDK**:
   ```bash
   npm install @openai/agents zod@3
   ```

2. **Create a Test Script**:
   ```typescript
   import { Agent, run } from "@openai/agents";

   async function main() {
     const agent = new Agent({
       name: "TestAgent",
       instructions: "You are a helpful assistant",
     });

     const result = await run(agent, "Write me a haiku about code");
     console.log(result.finalOutput);
   }

   main().catch(console.error);
   ```

3. **Use the Test Script**:
   A local test script `tests/manual/test-agent-sdk.mjs` has been created that simulates the QuoteAgent workflow using the SDK. It includes:
   - Static question simulation
   - Tool execution (assess_leak_severity, check_emergency_status)
   - Conversational flow testing

   Run it with: `node tests/manual/test-agent-sdk.mjs`

   **Note**: Requires `OPENAI_API_KEY` environment variable to be set for API calls.

4. **Build Custom Wrapper**:
   For YAML-based testing, create a script that parses your `agents/quote-agent.yaml` and `serviceDefinitions.ts` to simulate the agent flow locally.

The SDK provides full control over agent logic, tools, guardrails, and handoffs programmatically.

## Troubleshooting

### Common Issues

1. **Agent Not Loading**:
   - Check YAML syntax
   - Verify OpenAI API key permissions
   - Confirm Agent Toolkit access

2. **Tools Not Executing**:
   - Review tool parameter definitions
   - Check JavaScript execution syntax
   - Verify tool permissions

3. **High Costs**:
   - Monitor token usage
   - Adjust model selection (gpt-4o-mini vs gpt-4o)
   - Optimize prompt length

4. **Guardrails Blocking**:
   - Review guardrail rules
   - Test with various inputs
   - Adjust filter sensitivity

### Performance Optimization

- Use `gpt-4o-mini` for routine interactions
- Implement caching for repeated calculations
- Limit AI calls with static logic where possible
- Monitor and optimize token usage

## Related Documentation

- [ADR-025: OpenAI Agent Toolkit Implementation Pattern](adrs/025-choice-of-openai-agent-toolkit-implementation-pattern.md)
- [Netlify Deployment Guide](NETLIFY_DEPLOYMENT.md)
- [OpenAI Agent Toolkit Documentation](https://platform.openai.com/docs/agent-toolkit)
