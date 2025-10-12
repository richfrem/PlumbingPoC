# Manual Testing Scripts

This directory contains scripts for manually testing OpenAI Agent functionality outside of the full application context.

## Available Scripts

### `test-agent-sdk.mjs`
Tests the QuoteAgent logic using the OpenAI Agents SDK.

**Purpose**: Simulates the YAML workflow and validates agent behavior in isolation

**Features**:
- Static question simulation
- Tool execution testing (assess_leak_severity, check_emergency_status, analyze_water_heater_issue)
- Conversational flow validation

**Usage**:
```bash
node tests/manual/test-agent-sdk.mjs
```

**Requirements**:
- `OPENAI_API_KEY` environment variable must be set
- OpenAI Agents SDK (`@openai/agents`) must be installed

---

### `test-agent.mjs`
Simple test script for basic OpenAI Agents SDK functionality.

**Purpose**: Minimal agent testing for SDK verification

**Usage**:
```bash
node tests/manual/test-agent.mjs
```

**Requirements**:
- `OPENAI_API_KEY` environment variable must be set
- OpenAI Agents SDK (`@openai/agents`) must be installed

---

## When to Use These Scripts

- **During Development**: Test agent logic changes without running the full app
- **Debugging**: Isolate agent behavior from backend/frontend concerns
- **SDK Validation**: Verify OpenAI SDK integration and API connectivity
- **Workflow Testing**: Validate YAML-based workflows before deployment

## Related Documentation

- [OpenAI Agent Setup and Testing Guide](../../docs/OPENAI_AGENT_SETUP_AND_TESTING_GUIDE.md)
- [Agent Contracts](../../docs/AIContracts.md)
- [Quote Agent Maintenance](../../docs/QUOTE_AGENT_MAINTENANCE.md)
