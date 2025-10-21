---
id: 0046
status: planned
priority: medium
owner: richfrem
estimate: 4 weeks
created: 2024-10-01
links:
  - docs/TASKS.md#long-term-roadmap
acceptance_criteria:
  - AI agent can read technician notes and extract service details
  - Generate reasonable invoice draft with line items and pricing
  - Include variance explanations and dispute risk scoring
  - Human can accept/edit AI-generated invoice before sending
  - Integration with existing quote and request workflow
  - Proper error handling for AI generation failures
notes: |
  Phase 2 strategic feature to add AI-assisted invoice generation capabilities. AI reads technician notes to suggest line items, variance explanations, and dispute risk scores. Human oversight required for final invoice approval.
---

# AI-Assisted Invoice Generation (Phase 2)

## Details
- [ ] Create invoice-generator-agent with AI capabilities
- [ ] Implement technician notes parsing and service extraction
- [ ] Build invoice draft generation with line items and pricing
- [ ] Add variance explanation and dispute risk scoring
- [ ] Create human review and edit workflow
- [ ] Integrate with existing quote and request system
- [ ] Add comprehensive error handling and fallbacks

## Key Tasks

- [ ] Build invoice-generator-agent.yaml
- [ ] AI reads completion notes → suggests line items
- [ ] Variance detection and explanation generation
- [ ] Dispute risk scoring
- [ ] Test with historical job data

## AI Capabilities (Detailed Implementation)

### 1. Smart Invoice Generation from Job Notes
- AI reads technician completion notes
- Example input: "Replaced 3 shut-off valves, 2 hours labor, discovered corroded main line (customer approved repair)"
- AI generates:
  ```
  Line Items:
  - Labor (2 hours @ $125/hr): $250
  - Shut-off valves (3 @ $45 ea): $135
  - Main line repair (customer-approved): $380
  - Materials & fittings: $75
  Total: $840
  ```

### 2. Variance Detection & Explanation
- AI compares quote amount vs actual invoice
- Flags discrepancies > 10%
- Auto-generates customer-friendly explanations:
  > "During the bathroom renovation, we discovered the main shower valve was also corroded and posed a leak risk. You approved this additional repair on-site for $180. Your original quote was $3,500, and the final invoice is $3,680."

### 3. Upsell Itemization
- AI identifies work beyond original scope
- Suggests proper billing codes
- Recommends explanatory notes
- Example: "Gas line work" → AI flags: "Requires gas fitter certification, premium rate applies"

### 4. Dispute Prevention
- AI reviews invoice before sending
- Flags potential issues:
  - Invoice > 20% over quote without explanation
  - Missing line item descriptions
  - Ambiguous charges
- Suggests adding clarification notes

### 5. Price Optimization
- AI analyzes completed jobs database
- Suggests pricing adjustments based on:
  - Material costs
  - Labor time vs estimate
  - Job complexity vs quote
- Learns to improve future quote accuracy

## Implementation Architecture
```yaml
agent: InvoiceGeneratorAgent
nodes:
  - id: analyze_completion
    prompt: "Review technician notes and generate invoice line items"
    output:
      line_items: array
      variance_explanation: string
      dispute_risk_score: integer (1-10)
      recommended_notes: array
```
