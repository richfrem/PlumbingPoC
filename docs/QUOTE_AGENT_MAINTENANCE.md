# Quote Agent Maintenance Guide

**Audience:** Product Managers, Business Analysts, Developers  
**Purpose:** Learn how to modify and maintain the quote intake conversation flow using the YAML configuration file.

---

## Table of Contents

1. [Overview](#overview)
2. [Understanding the YAML Structure](#understanding-the-yaml-structure)
3. [Adding New Questions](#adding-new-questions)
4. [Modifying Existing Questions](#modifying-existing-questions)
5. [Service-Specific Question Flows](#service-specific-question-flows)
6. [Testing Your Changes](#testing-your-changes)
7. [Common Patterns & Best Practices](#common-patterns--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Quote Agent uses a **YAML-driven workflow** defined in `/agents/quote-agent.yaml`. This file controls:

- What questions are asked
- The order of questions
- Which options are available
- How the conversation branches based on service type
- When AI clarification is triggered

**Key Benefit:** You can modify the entire conversation flow without touching any React or TypeScript code.

---

## Understanding the YAML Structure

### Basic Node Anatomy

Every question or decision point in the conversation is a "node":

```yaml
- id: emergency_check              # Unique identifier for this step
  type: choice                     # Type of interaction (choice, static, model, etc.)
  prompt: "Is this an emergency?"  # Question shown to the user
  options:                         # Available response options
    - "Yes, it's an emergency"
    - "No"
  capture: is_emergency            # Where to store the answer
  next: type_of_property           # Which node to go to next
```

### Node Types

| Type | Purpose | Example Use Case |
|------|---------|------------------|
| `choice` | Multiple choice question | "Is this an emergency?" |
| `static` | Open-ended text input | "Describe your plumbing issue" |
| `switch` | Branch based on a variable | Route to service-specific questions |
| `model` | AI-generated questions | Intelligent follow-up questions |
| `decision` | Conditional logic | Check if more info is needed |

### Workflow Flow

The conversation follows a directed graph:

```
emergency_check 
    ↓
type_of_property
    ↓
do_you_own
    ↓
when_schedule
    ↓
select_service
    ↓
service_questions (branches by service type)
    ↓
check_completion
    ↓
ai_followup (if needed) OR review_summary
```

---

## Adding New Questions

### Example: Add a "Contact Preference" Question

**Goal:** Ask customers how they prefer to be contacted.

**Step 1:** Decide where to insert the question in the flow.

For this example, let's add it after `do_you_own` and before `when_schedule`.

**Step 2:** Add the new node in the YAML file:

```yaml
# 3. Do you own the property?
- id: do_you_own
  type: choice
  prompt: "Do you own this property?"
  options: [Yes, No]
  capture: is_homeowner
  next: contact_preference  # ← Changed to point to our new question

# 3.5 Contact Preference (NEW)
- id: contact_preference
  type: choice
  prompt: "How would you prefer we contact you?"
  options:
    - "Phone Call"
    - "Text Message"
    - "Email"
  capture: preferred_contact_method
  next: when_schedule  # ← Points to the next existing question

# 4. When to schedule service
- id: when_schedule
  type: static
  prompt: "When would you like this service to be scheduled?"
  capture: preferred_timing
  next: select_service
```

**Step 3:** Save the file.

**Step 4:** Test locally (see [Testing Your Changes](#testing-your-changes)).

**Step 5:** Commit and deploy:

```bash
git add agents/quote-agent.yaml
git commit -m "Add contact preference question to quote flow"
git push
```

That's it! The question will automatically appear in the conversation flow.

---

## Modifying Existing Questions

### Change Question Text

**Before:**
```yaml
- id: emergency_check
  type: choice
  prompt: "Is this an emergency?"
  options:
    - "Yes, it's an emergency"
    - "No"
```

**After:**
```yaml
- id: emergency_check
  type: choice
  prompt: "Do you need immediate emergency service?"  # ← Updated
  options:
    - "Yes - Emergency (within 24 hours)"              # ← Updated
    - "No - Regular service is fine"                   # ← Updated
```

### Add/Remove Options

**Add an option:**
```yaml
- id: type_of_property
  type: choice
  prompt: "What type of property is this service for?"
  options:
    - Residential
    - Apartment
    - Commercial
    - Industrial  # ← New option added
    - Other
```

**Remove an option:**
```yaml
- id: do_you_own
  type: choice
  prompt: "Do you own this property?"
  options:
    - Yes
    # Removed "No" option - simplified to single choice
```

### Change Question Order

Simply update the `next:` field to route to a different node:

```yaml
- id: emergency_check
  next: type_of_property  # Original flow

# Change to:
- id: emergency_check
  next: when_schedule  # Skip property questions for emergencies
```

---

## Service-Specific Question Flows

### How Service Branching Works

The `service_questions` node uses a **switch statement** to ask different questions based on the selected service:

```yaml
- id: service_questions
  type: switch
  variable: selected_service  # Branch based on this value
  cases:
    "Leak Detection & Repair":
      type: static
      prompt: "Where is the leak located?"
      capture: leak_location
    "Drain Cleaning":
      type: static
      prompt: "Which fixture is clogged?"
      capture: clogged_fixture
```

### Adding Questions to an Existing Service

**Example:** Add follow-up questions to "Water Heater Installation/Repair"

**Before:**
```yaml
"Water Heater Installation/Repair":
  type: static
  prompt: "What size water heater do you currently have?"
  capture: heater_size
```

**After (multiple questions using array):**
```yaml
"Water Heater Installation/Repair":
  - type: choice
    prompt: "What type of water heater do you have?"
    options: [Tank, Tankless, Heat Pump]
    capture: heater_type
  - type: static
    prompt: "What size water heater do you currently have?"
    capture: heater_size
  - type: static
    prompt: "What is the age of your current water heater?"
    capture: heater_age
```

### Adding a New Service Type

**Step 1:** Add the service to the `select_service` node options:

```yaml
- id: select_service
  type: choice
  prompt: "What type of plumbing service do you need?"
  options:
    - "Leak Detection & Repair"
    - "Drain Cleaning"
    - "Water Heater Installation/Repair"
    - "Sump Pump Installation"  # ← New service added
```

**Step 2:** Add the service-specific questions to the `service_questions` switch:

```yaml
- id: service_questions
  type: switch
  variable: selected_service
  cases:
    # ... existing services ...
    
    "Sump Pump Installation":  # ← New case
      - type: choice
        prompt: "Do you have an existing sump pump?"
        options: [Yes - Replace, No - New Installation]
        capture: sump_pump_status
      - type: static
        prompt: "Where will the sump pump be installed?"
        capture: sump_pump_location
```

---

## Testing Your Changes

### Local Testing

1. **Start the development servers:**
   ```bash
   ./startup.sh
   ```

2. **Open the app:**
   Navigate to `http://localhost:5173`

3. **Sign in and click "Request a Quote"**

4. **Walk through the conversation:**
   - Verify new questions appear
   - Test all option branches
   - Ensure the flow reaches the summary screen
   - Check that answers are captured correctly

5. **Check the browser console:**
   Look for any errors or warnings

### Testing Specific Scenarios

**Test Emergency Flow:**
```yaml
# Make sure emergency questions appear first
emergency_check → [select "Yes"] → verify priority handling
```

**Test Service-Specific Questions:**
```yaml
# For each service type:
select_service → [choose service] → service_questions → verify correct questions
```

**Test AI Follow-up:**
```yaml
# Provide incomplete answers and verify AI asks clarifying questions
```

### Validation Checklist

- [ ] All questions display correctly
- [ ] Options are clear and actionable
- [ ] Flow reaches the summary screen
- [ ] Summary shows all captured answers
- [ ] No console errors
- [ ] Mobile view renders properly
- [ ] Buttons are clickable and responsive

---

## Common Patterns & Best Practices

### 1. Use Clear, Action-Oriented Prompts

**❌ Bad:**
```yaml
prompt: "Property?"
```

**✅ Good:**
```yaml
prompt: "What type of property is this service for?"
```

### 2. Keep Options Concise

**❌ Bad:**
```yaml
options:
  - "Yes, I own this property and I am authorized to request services"
  - "No, I do not own this property but I am a tenant or authorized representative"
```

**✅ Good:**
```yaml
options:
  - "Yes - I own it"
  - "No - I'm a tenant/renter"
```

### 3. Use Descriptive Node IDs

**❌ Bad:**
```yaml
- id: q1
- id: step2
- id: node_a
```

**✅ Good:**
```yaml
- id: emergency_check
- id: contact_preference
- id: service_selection
```

### 4. Capture Data with Meaningful Keys

**❌ Bad:**
```yaml
capture: answer1
capture: response
capture: data
```

**✅ Good:**
```yaml
capture: is_emergency
capture: preferred_contact_method
capture: leak_location
```

### 5. Progressive Disclosure

Ask the most important questions first:
1. Emergency status (affects pricing/scheduling)
2. Service type (determines follow-up questions)
3. Specific details (tailored to service)
4. Preferences (timing, contact method)

### 6. Avoid Deep Nesting

**❌ Difficult to maintain:**
```yaml
- id: complex_flow
  type: switch
  cases:
    CaseA:
      type: switch
      cases:
        SubCaseA1:
          type: choice
          # ... 5 levels deep
```

**✅ Flattened and clear:**
```yaml
- id: step1
  next: step2

- id: step2
  next: step3
```

### 7. Test Edge Cases

Consider:
- What if the user selects "Other"?
- What if they skip optional questions?
- What if they go back and change answers?

---

## Troubleshooting

### Question Not Appearing

**Symptom:** Added a question, but it doesn't show in the UI.

**Possible Causes:**

1. **Incorrect `next:` pointer**
   ```yaml
   - id: do_you_own
     next: contact_preferense  # ← Typo! Should be "contact_preference"
   ```
   **Fix:** Ensure the `next:` value matches an existing node `id` exactly.

2. **YAML syntax error**
   ```yaml
   - id: contact_preference
   type: choice  # ← Missing indentation!
   ```
   **Fix:** Validate YAML syntax at [yamllint.com](http://www.yamllint.com/)

3. **Node unreachable in flow**
   - Check that at least one node points to your new node via `next:`

### Options Not Displaying Correctly

**Symptom:** Options appear as `[object Object]` or are missing.

**Cause:** Incorrect YAML array syntax.

**❌ Wrong:**
```yaml
options: "Phone Call", "Email", "Text"
```

**✅ Correct:**
```yaml
options:
  - "Phone Call"
  - "Email"
  - "Text"
```

Or inline:
```yaml
options: ["Phone Call", "Email", "Text"]
```

### Changes Not Reflecting in Production

**Symptom:** Updated YAML locally, but Netlify still shows old questions.

**Solution:**

1. **Check deployment status:**
   - Go to Netlify dashboard
   - Verify latest commit deployed successfully

2. **Clear browser cache:**
   ```bash
   # Hard refresh
   Cmd + Shift + R (Mac)
   Ctrl + Shift + R (Windows/Linux)
   ```

3. **Check netlify.toml configuration:**
   Ensure `included_files` contains the YAML:
   ```toml
   [functions."quote-agent"]
     included_files = [
       "agents/quote-agent.yaml"
     ]
   ```

4. **Verify git commit includes YAML:**
   ```bash
   git log --name-only -1
   # Should show: agents/quote-agent.yaml
   ```

### Conversation Flow Breaks

**Symptom:** Modal freezes, infinite loop, or conversation jumps unexpectedly.

**Debugging Steps:**

1. **Check browser console for errors:**
   ```
   [QuoteAgent] Failed to load YAML config
   ```

2. **Trace the flow manually:**
   - Start at `emergency_check`
   - Follow each `next:` pointer
   - Ensure no circular references (A → B → A)

3. **Validate required fields:**
   Every node must have:
   - `id` (unique)
   - `type`
   - `prompt` (for user-facing nodes)
   - `next` (unless it's a terminal node)

### AI Follow-up Not Triggering

**Symptom:** Expecting AI clarification questions, but conversation jumps to summary.

**Check:**

1. **`check_completion` decision logic:**
   ```yaml
   - id: check_completion
     type: decision
     condition: has_sufficient_info
     true: review_summary
     false: ai_followup  # ← Should trigger AI if false
   ```

2. **AI model configuration:**
   ```yaml
   - id: ai_followup
     type: model
     model: gpt-4o  # ← Check model is specified
   ```

---

## Quick Reference: Node Type Examples

### Choice Node (Multiple Choice)
```yaml
- id: example_choice
  type: choice
  prompt: "Choose one option:"
  options:
    - "Option A"
    - "Option B"
    - "Option C"
  capture: user_choice
  next: next_node_id
```

### Static Node (Text Input)
```yaml
- id: example_static
  type: static
  prompt: "Please describe your issue:"
  capture: problem_description
  next: next_node_id
```

### Switch Node (Conditional Branching)
```yaml
- id: example_switch
  type: switch
  variable: selected_service
  cases:
    "Service A":
      type: static
      prompt: "Question for Service A"
      capture: service_a_answer
    "Service B":
      type: static
      prompt: "Question for Service B"
      capture: service_b_answer
  next: next_node_id
```

### Model Node (AI-Generated)
```yaml
- id: example_ai
  type: model
  model: gpt-4o
  prompt: >
    Based on the customer's answers, generate 1-3 clarifying questions.
    Context: {{ all_previous_answers }}
  next: review_summary
```

### Decision Node (Conditional Logic)
```yaml
- id: example_decision
  type: decision
  condition: has_sufficient_info
  true: review_summary
  false: ai_followup
```

---

## Support & Resources

- **YAML Syntax Validator:** [yamllint.com](http://www.yamllint.com/)
- **Quote Agent Code:** `packages/backend/netlify/functions/quote-agent.mjs` (self-contained, works locally and on Netlify)
- **Frontend Component:** `packages/frontend/src/features/requests/components/QuoteAgentModal-ChatKit.tsx`
- **YAML Configuration:** `agents/quote-agent.yaml`

**Questions?** Check the team documentation or reach out to the development team.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-11 | Initial documentation | System |

---

**Happy Maintaining! 🛠️**
