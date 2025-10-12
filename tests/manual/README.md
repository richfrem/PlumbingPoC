# Manual Testing Scripts

This directory is reserved for manual testing scripts.

## Note

After testing the OpenAI Agents SDK (see ADR-028), we determined it's not suitable for our structured YAML-driven workflows. The SDK is designed for function calling and AI-driven conversations, not deterministic question flows.

**Our custom YAML approach is the correct architecture for this use case.**

## Testing Our Agents

To test the quote and triage agents:

### Local Testing
```bash
# Start the application
./startup.sh

# Navigate to http://localhost:5173
# Click "Get Quote" to test the quote agent
# Submit requests to test the triage agent
```

### E2E Testing
```bash
# Run all E2E tests
./tests/e2e/run-tests.sh

# Run specific test patterns
./tests/e2e/run-tests.sh --test-pattern user-journeys
```

## Related Documentation

- [ChatKit Experiment Results](../../docs/CHATKIT_EXPERIMENT.md) - Why we didn't use the OpenAI Agents SDK
- [ADR-028](../../adrs/028-choice-of-custom-yaml-over-openai-agents-sdk.md) - Architectural decision
- [Quote Agent Maintenance](../../docs/QUOTE_AGENT_MAINTENANCE.md)
- [Agent Contracts](../../docs/AIContracts.md)
