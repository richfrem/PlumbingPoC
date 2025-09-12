# Playbook: The Genesis Cycle
**Version:** 2.0
**Part of:** The Quantum Diamond Framework

This playbook is a guide for the first phase of the **Quantum Diamond Framework**. Its goal is to rapidly explore, define, and validate a product vision through creative human-AI collaboration.

## The Actors

*   **Human Lead (Designer/PM):** The director of the process. You provide the intent, curate the AI's output, and make the final strategic decisions.
*   **AI Service Designer Agent:** Your research and strategy partner. You use this agent (e.g., GPT-4, Claude) to synthesize information and explore the problem space.
*   **AI App Prototyper Agent:** Your implementation partner. You use this agent (e.g., `bolt.new`, Copilot in a scratchpad) to make ideas tangible instantly.

## The Process: A Conversation

### Step 1: Problem Framing with the AI Service Designer

Your goal is to deeply understand the user and the problem.

**Example Prompt Flow:**

1.  **Human Input:** "I've just interviewed 5 users about our support process. Here are the full transcripts: [paste transcripts]. Please act as an expert service designer. Your first task is to summarize the key pain points and pull out 3-5 powerful quotes for each user."
2.  **Human Curation:** Review the summary and provide feedback for refinement.
3.  **Human Prompt for Generation:** "Based on these refined pain points, generate three distinct user personas. Include their goals, frustrations, and a key 'How Might We' statement for each."

### Step 2: Solution Prototyping with the AI App Prototyper

Your goal is to make a potential solution visible and interactive. This is **purposeful vibe coding.** The code is disposable; the learning is permanent.

**Example Prompt Flow:**

1.  **Human Input (UI):** "Create a new web page with a title 'Support Ticket Analyzer'. It should have a large text area for pasting an email and a button that says 'Analyze'."
2.  **Human Input (Logic):** "I need a Python function using `instructor` and `pydantic`. The input is a string of text. The output should be a Pydantic model called `TicketAnalysis` containing: `summary`, `is_urgent`, and `suggested_category`. Write the function and a sample call."
3.  **Human Synthesis:** Hook the UI and logic together in a tool like Replit to create a clickable prototype.

### Step 3: Validation and Iteration

You now have a tangible artifact. Show it to stakeholders and users. This is the "observation" that collapses the wave of possibilities into a single reality.

*   "The summary is great, but the category is always wrong." -> Go back to Step 2 and refine the logic prompt.
*   "This is useful, but what I *really* need is..." -> Go back to Step 1 to re-evaluate the core problem.

## Definition of Done

The Genesis Cycle is complete when you have produced the artifacts needed to kick off the Engineering Cycle:
*   ✅ A **Validated Vision Prototype** that has received positive feedback from key stakeholders.
*   ✅ An **Initial AI Component Contract** (a simple doc outlining the prototype's inputs/outputs).

## Related Prompts and Resources

This playbook is part of the Quantum Diamond Framework. For complementary resources:

- **[Quantum Diamond Framework Overview](./00_framework-overview.md)**: High-level methodology combining creative exploration with engineering rigor.
- **[Engineering Cycle Playbook](./02_playbook-engineering-cycle.md)**: Next phase for disciplined implementation of the validated vision.
- **[Meta Agent Prompt](./meta-agent-prompt.md)**: Example prompt for building AI-powered applications, demonstrating Genesis Cycle principles in a plumbing service context.
- **[Master Prompt for Architecting Full Test Suite](./MasterPromptArchitectingFullTestSuite.md.md)**: Guide for implementing comprehensive testing aligned with the framework's validation phases.
- **[Playwright Automated Testing Prompt](./PlaywrightAutomatedTestingPrompt.md)**: Specialized prompt for E2E testing, supporting the framework's quality assurance practices.

These resources enable reuse of this playbook for future projects requiring similar creative AI-human collaboration phases.

