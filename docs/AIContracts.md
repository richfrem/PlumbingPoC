# AI Agent Contracts

These contracts define the interaction between our backend and the external OpenAI LLM.

### AI Triage Agent

*   **Endpoint:** `POST /api/triage/:requestId`
*   **Controller:** `vite-app/api/controllers/triageController.js`
*   **Description:** Analyzes a request and returns a structured summary for the admin dashboard.

**Example LLM Output (`application/json`):**
```json
{
  "triage_summary": "An urgent leak under the kitchen sink requires immediate attention.",
  "priority_score": 9,
  "priority_explanation": "Active leaks are high priority to prevent water damage.",
  "profitability_score": 7,
  "profitability_explanation": "Standard repair with high likelihood of conversion."
}
```

### AI Follow-Up Question Agent

*   **Endpoint:** `POST /api/requests/gpt-follow-up`
*   **Controller:** `vite-app/api/controllers/requestController.js`
*   **Description:** Reviews the conversation so far and generates clarifying questions if needed.

**Example LLM Output (Text, to be parsed):**
```text
1. Is the water actively running from the leak?
2. Is the leak located on a hot or cold water line?
```
*Note: As per the refactoring plan, this text-based output is considered fragile and should be updated to a more robust JSON format.*
```