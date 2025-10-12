# AI Triage Agent Configuration Guide

## Overview

The AI Triage Agent analyzes incoming plumbing service requests and provides intelligent assessments to help business owners prioritize work and estimate profitability. The agent is fully configurable via YAML, making it easy for non-technical users to customize the analysis behavior.

**Location:** `agents/triage-agent.yaml`

**Backend Implementation:** `packages/backend/netlify/functions/triage-agent.mjs`

---

## What the Triage Agent Does

The triage agent analyzes each service request and generates:

1. **Triage Summary** - A 2-3 sentence overview of what the customer needs
2. **Priority Score** (1-10) - How urgent is this request?
3. **Priority Explanation** - Why this priority score?
4. **Profitability Score** (1-10) - How profitable is this job likely to be?
5. **Profitability Explanation** - Factors affecting profitability
6. **Required Expertise** - What skill level and specialized skills are needed?
   - Skill Level: `apprentice`, `journeyman`, or `master`
   - Specialized Skills: Array of specific capabilities needed
   - Reasoning: Why this expertise level is required

---

## YAML Configuration Structure

### Basic Agent Information

```yaml
agent: TriageAgent
description: >
  Analyze plumbing requests and provide AI-powered triage summaries,
  priority scores, and profitability analysis for business owners.
```

---

### The Analysis Node

The heart of the triage agent is the `analyze_request` node, which defines how OpenAI should analyze requests:

```yaml
nodes:
  - id: analyze_request
    type: model
    model: gpt-4o  # The AI model to use
    prompt: >
      [Your analysis instructions here]
    output:
      [Schema defining the response structure]
```

#### **Key Configuration Fields:**

**`model`** - Which OpenAI model to use
- `gpt-4o` - Most capable, recommended for complex analysis (current)
- `gpt-4o-mini` - Faster and cheaper, good for simpler analysis
- `gpt-3.5-turbo` - Budget option (not recommended for triage)

**`prompt`** - Instructions for the AI analyst

This is where you define the AI's persona and analysis criteria. The current prompt:
- Sets the persona as an "expert plumbing business analyst with 25 years of experience"
- Lists what to provide (summary, priority, profitability, expertise)
- Lists factors to consider (urgency, complexity, upsell potential, etc.)

**Best Practices for Prompts:**
- Be specific about the industry context
- List explicit criteria to consider
- Define the scoring scale (1-10)
- Mention what makes something high vs low priority/profitability
- Include expertise considerations (certifications, special skills)

**`output`** - The JSON schema defining the response structure

This tells OpenAI exactly what fields to return and their data types.

---

## Customizing the Analysis Prompt

### Current Prompt Structure:

```yaml
prompt: >
  You are an expert plumbing business analyst with 25 years of experience.
  Analyze this customer request and provide a comprehensive triage assessment.

  Provide:
  1. A concise triage summary (2-3 sentences) explaining what the customer needs
  2. Priority score (1-10, where 10 is highest priority)
  3. Priority explanation (why this score?)
  4. Profitability score (1-10, where 10 is most profitable)
  5. Profitability explanation (why this score?)
  6. Required expertise level and specialized skills needed

  Consider:
  - Urgency of the problem
  - Technical complexity of the job
  - Potential for upselling or additional services
  - Customer's timeline and flexibility
  - Emergency status and its impact on scheduling
  - Property type and accessibility challenges
  - Skill level required (gas fitting certification, code knowledge, diagnostic ability)
  - Specialized equipment or tools needed
```

### How to Customize:

**1. Change the persona:**
```yaml
prompt: >
  You are a senior operations manager at a family-owned plumbing business...
```

**2. Add new considerations:**
```yaml
  Consider:
  - Urgency of the problem
  - Technical complexity of the job
  - Distance from our service area (add travel time considerations)
  - Customer history (repeat vs new customer)
  - Weather conditions impact
```

**3. Adjust scoring criteria:**
```yaml
  Priority Scoring Rules:
  - Score 9-10: Emergency situations, water damage risk, no water service
  - Score 7-8: Urgent but contained, customer needs quick response
  - Score 4-6: Standard timeline, routine maintenance
  - Score 1-3: Flexible, cosmetic, or non-essential work
```

**4. Add business-specific factors:**
```yaml
  Profitability Considerations:
  - Our specialty services (gas lines, perimeter drains) are higher margin
  - Multi-unit properties = higher revenue potential
  - Emergency callouts include premium pricing
  - Consider parts markup opportunities
```

---

## Output Schema Configuration

The `output` section defines what data the AI must return. **This must match the database schema** in `requests` table.

### Current Schema:

```yaml
output:
  type: object
  properties:
    triage_summary:
      type: string
      description: Concise summary of the request (2-3 sentences)
    priority_score:
      type: integer
      minimum: 1
      maximum: 10
    priority_explanation:
      type: string
    profitability_score:
      type: integer
      minimum: 1
      maximum: 10
    profitability_explanation:
      type: string
    required_expertise:
      type: object
      properties:
        skill_level:
          type: string
          enum: [apprentice, journeyman, master]
        specialized_skills:
          type: array
          items:
            type: string
        reasoning:
          type: string
      required: [skill_level, specialized_skills, reasoning]
  required: [triage_summary, priority_score, priority_explanation, 
             profitability_score, profitability_explanation, required_expertise]
```

### Adding New Output Fields:

**⚠️ WARNING:** If you add new fields to the output schema, you MUST:

1. **Add the column to Supabase database:**
   ```sql
   ALTER TABLE public.requests ADD COLUMN your_new_field TEXT;
   ```

2. **Update `triage-agent.mjs`** to return the new field:
   ```javascript
   return {
     // ... existing fields
     your_new_field: analysis.your_new_field
   };
   ```

3. **Update `triageController.js`** to save the new field:
   ```javascript
   .update({
     // ... existing fields
     your_new_field: analysis.your_new_field
   })
   ```

4. **Update TypeScript types** in `packages/frontend/src/features/requests/types/index.ts`:
   ```typescript
   export interface QuoteRequest {
     // ... existing fields
     your_new_field: string | null;
   }
   ```

5. **Update frontend display** in `AITriageSummary.tsx` if needed

---

## Expertise Level Configuration

### Skill Levels

The agent can assign one of three skill levels:

- **`apprentice`** - Basic plumbing tasks, minimal experience required
  - Examples: Toilet repair, faucet replacement, drain cleaning
  
- **`journeyman`** - Intermediate complexity, licensed plumber
  - Examples: Water heater installation, bathroom renovations, standard pipe repairs
  
- **`master`** - Complex work requiring certifications or extensive experience
  - Examples: Gas line work, main line repairs, code-critical installations

### Specialized Skills Examples

The agent identifies specific capabilities needed:

- `gas fitting certification` - Required for gas line services
- `bathroom renovation experience` - Layout changes, fixture coordination
- `diagnostic ability` - Complex leak detection, system troubleshooting
- `code knowledge` - Permit-required work, inspections
- `perimeter drain expertise` - Foundation drainage systems
- `confined space work` - Crawlspaces, tight attics
- `multi-story plumbing` - Vertical pipe runs, pressure considerations

### Customizing Expertise Analysis

To change how expertise is assessed, edit the `prompt` section:

```yaml
prompt: >
  ...
  
  Expertise Assessment Guidelines:
  - Apprentice: Routine repairs, basic installations, no certifications needed
  - Journeyman: Most service work, requires Red Seal or equivalent license
  - Master: Gas work (requires gas fitter ticket), complex diagnostics, 
    multi-system coordination
  
  Specialized Skills to flag:
  - Gas fitting certification (MANDATORY for gas lines)
  - Backflow prevention certification
  - HVAC integration knowledge
  - Commercial plumbing experience
  - [Add your business-specific requirements]
```

---

## Tools Configuration

The YAML includes two utility tools for preliminary scoring:

### 1. Calculate Job Complexity

```yaml
tools:
  - name: calculate_job_complexity
    description: Assess the technical complexity of a plumbing job
    parameters:
      # Defines inputs
    execute: |
      # JavaScript code that calculates complexity score
```

**How it works:**
- Maps service categories to base complexity scores (1-10)
- Adjusts for location difficulty (basement, crawlspace, attic)
- Returns a preliminary complexity score

**To customize:** Edit the `complexityMap` in the `execute` section:

```yaml
execute: |
  const complexityMap = {
    'leak_repair': 6,
    'water_heater': 7,
    'bathroom_reno': 8,  // Adjust these values
    'your_custom_service': 9
  };
```

### 2. Assess Customer Urgency

Evaluates how urgent the customer's situation is based on:
- Emergency flag
- Requested timeline
- Problem severity keywords

**To customize:** Edit the `urgencyMap` or severity detection:

```yaml
execute: |
  const urgencyMap = {
    'today': 9,
    'tomorrow': 8,
    'asap': 8,
    'your_custom_timeline': 7  // Add custom timelines
  };
```

---

## Example: Adding a "Scheduling Difficulty" Score

Let's say you want to add a new metric for how hard this job is to schedule.

### Step 1: Update the YAML Output Schema

```yaml
output:
  type: object
  properties:
    # ... existing properties
    scheduling_difficulty:
      type: integer
      minimum: 1
      maximum: 10
      description: How difficult this job is to schedule (availability, duration, etc.)
    scheduling_explanation:
      type: string
      description: Explanation of scheduling challenges
  required: [..., scheduling_difficulty, scheduling_explanation]
```

### Step 2: Update the Prompt

```yaml
prompt: >
  ...
  Provide:
  6. Scheduling difficulty score (1-10)
  7. Scheduling difficulty explanation
  
  Consider:
  - Job duration estimate
  - Required team size
  - Equipment availability
  - Weather dependencies
```

### Step 3: Add Database Column

```sql
ALTER TABLE public.requests 
ADD COLUMN scheduling_difficulty INTEGER,
ADD COLUMN scheduling_explanation TEXT;
```

### Step 4: Update Backend Code

In `triage-agent.mjs`:
```javascript
return {
  // ... existing fields
  scheduling_difficulty: analysis.scheduling_difficulty,
  scheduling_explanation: analysis.scheduling_explanation
};
```

In `triageController.js`:
```javascript
.update({
  // ... existing fields
  scheduling_difficulty: analysis.scheduling_difficulty,
  scheduling_explanation: analysis.scheduling_explanation
})
```

### Step 5: Update Frontend

Add to `QuoteRequest` interface and `AITriageSummary.tsx` display.

---

## Testing Changes

After modifying the YAML:

1. **Restart your backend server** to reload the YAML file
2. **Run triage on a test request** in your admin dashboard
3. **Check the console logs** to see what OpenAI returned
4. **Verify the UI displays** all expected fields

### Debug Tips:

**The agent isn't using my changes:**
- Make sure you restarted the server (YAML is loaded once at startup)
- Check console logs for YAML path: `[TriageAgent] Loaded YAML from: ...`

**OpenAI isn't following my prompt:**
- Be more specific in your instructions
- Add explicit examples in the prompt
- Consider switching to `gpt-4o` if using a smaller model

**Fields not saving to database:**
- Check if the column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'requests';`
- Verify `triage-agent.mjs` returns the field
- Verify `triageController.js` includes it in the update

---

## Best Practices

### ✅ DO:
- Keep prompts clear and specific
- Use the most capable model (`gpt-4o`) for consistent results
- Test changes on multiple request types
- Document any business-specific scoring rules
- Keep the output schema synchronized with the database

### ❌ DON'T:
- Make the prompt too long (OpenAI has token limits)
- Ask for subjective opinions (stick to business metrics)
- Change field names without updating database + backend + frontend
- Remove required fields from the schema
- Use `gpt-3.5-turbo` for complex analysis (less reliable)

---

## Monitoring and Optimization

### Reviewing AI Performance:

Check your triage results regularly to ensure quality:
- Are priority scores matching actual urgency?
- Are profitability estimates aligned with final invoices?
- Is expertise assessment accurate for job assignments?

### Cost Optimization:

- **Model choice:** `gpt-4o-mini` is ~80% cheaper than `gpt-4o`
- **Prompt length:** Shorter prompts = lower cost
- **Frequency:** Only run triage when needed (not on every update)

### Improving Accuracy:

**If priority scores seem off:**
- Add more specific criteria to the prompt
- Include examples of high vs low priority jobs
- Add business rules (e.g., "Always prioritize multi-unit buildings")

**If profitability is inaccurate:**
- Include your actual pricing structure in the prompt
- Add typical job costs for context
- Mention your highest-margin services

**If expertise assessment is wrong:**
- Be explicit about certification requirements
- List your team's skill levels for reference
- Add examples of jobs that require master vs journeyman

---

## Integration with Quote Agent

The triage agent works in tandem with the quote agent:

1. **Quote Agent** collects detailed service information via conversation
2. **Triage Agent** analyzes the collected data to assess business value
3. **Admin Dashboard** displays both the quote details and triage assessment

Both agents are YAML-driven and follow the same architectural pattern (see ADR-027).

---

## File Structure

```
agents/
  triage-agent.yaml          # Configuration (edit this)
packages/backend/
  netlify/functions/
    triage-agent.mjs          # Implementation (rarely needs changes)
  api/controllers/
    triageController.js       # Saves results to database
packages/frontend/
  src/features/requests/
    components/
      AITriageSummary.tsx     # Displays triage results
    types/
      index.ts                # QuoteRequest interface
supabase/
  schema.sql                  # Database schema
```

---

## Quick Reference: Common Customizations

### Change the AI Model

```yaml
model: gpt-4o-mini  # Faster and cheaper
```

### Add a New Consideration Factor

```yaml
prompt: >
  Consider:
  - Urgency of the problem
  - [Your new factor here]
```

### Modify Skill Level Definitions

```yaml
required_expertise:
  properties:
    skill_level:
      enum: [beginner, intermediate, expert]  # Custom levels
```

### Adjust Complexity Scoring

Edit the `calculate_job_complexity` tool in the YAML:

```yaml
tools:
  - name: calculate_job_complexity
    execute: |
      const complexityMap = {
        'bathroom_reno': 9,  # Increased from 8
        'custom_service': 7   # Added new service
      };
```

---

## Troubleshooting

### Issue: Triage analysis failing

**Check:**
1. Is `OPENAI_API_KEY` set in your environment?
2. Are you on the latest version of the YAML?
3. Check backend logs for OpenAI errors

### Issue: Results not saving to database

**Check:**
1. Does the database column exist?
2. Is `triageController.js` updated to save the field?
3. Check Supabase logs for permission errors

### Issue: Frontend not displaying a field

**Check:**
1. Is the field in the `QuoteRequest` TypeScript interface?
2. Is `AITriageSummary.tsx` rendering the field?
3. Is the data actually in the database? (Check via Supabase dashboard)

---

## Version History

- **v1.0** - Initial triage agent (hardcoded prompts)
- **v2.0** - YAML-driven configuration (current)
- **v2.1** - Added `required_expertise` analysis

---

## Related Documentation

- **Quote Agent Configuration:** `docs/QUOTE_AGENT_MAINTENANCE.md`
- **ADR-027:** Self-Contained Agent Functions
- **ADR-028:** Custom YAML Over OpenAI Agents SDK
- **Deployment Guide:** `docs/NETLIFY_DEPLOYMENT.md`
