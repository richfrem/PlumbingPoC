# PROMPTS Directory: Quantum Diamond Framework Guides

This directory contains specialized prompts and playbooks for building AI-native applications using the **Quantum Diamond Framework**. Each prompt serves a specific purpose in the development lifecycle, from initial concept to production deployment.

## Quick Start Guide: Which Prompt Should I Use?

### 🚀 Starting a Net New Project (Similar to Plumbing POC)

**Start Here:** [Quantum Diamond Framework Overview](./00_framework-overview.md)

**Prompt to use:** "You are a Principal Software Architect. I want to build an AI-native application similar to my plumbing quote intake system. Please read and analyze [Quantum Diamond Framework Overview](./00_framework-overview.md) and provide a project plan following the two-cycle workflow."

This provides the complete methodology for new AI-native projects. Then follow the two-cycle workflow:

1. **[Genesis Cycle Playbook](./01_playbook-genesis-cycle.md)** - For creative exploration and validation
   - **Prompt:** "You are a Senior Product Manager. I need to run the Genesis Cycle for my new AI application. Please read [Genesis Cycle Playbook](./01_playbook-genesis-cycle.md), consider [Framework Overview](./00_framework-overview.md), and guide me through the creative exploration phase."

2. **[Engineering Cycle Playbook](./02_playbook-engineering-cycle.md)** - For disciplined implementation
   - **Prompt:** "You are a Principal Engineer. I have a validated vision from the Genesis Cycle. Please read [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md) and [Framework Overview](./00_framework-overview.md), then guide me through the architecture-first implementation."

3. **[Meta Agent Prompt](./meta-agent-prompt.md)** - Domain-specific implementation example
   - **Prompt:** "You are an expert AI Solutions Architect. I want to build a conversational AI agent for service qualification. Please read [Meta Agent Prompt](./meta-agent-prompt.md), [Framework Overview](./00_framework-overview.md), and adapt it for my specific domain."

### 🔄 Iterating on an Existing Project

**Start Here:** [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md)

**Prompt to use:** "You are a Principal Engineer, Architect, Full-stack developer expert with deep knowledge of React, Node, express, supabase, OpenAI, MCP servers, and more. I have an existing AI-native application and want to add new features or improve the current implementation. Please read [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md) and [Framework Overview](./00_framework-overview.md), then guide me through structured improvements."

For projects already in development, focus on the structured implementation phase:

- Use the Engineering Cycle to add features, refactor, or improve existing code
- **[Master Prompt for Architecting Full Test Suite](./MasterPromptArchitectingFullTestSuite.md.md)** - If you need comprehensive testing
  - **Prompt:** "You are a Principal Software Development Engineer in Test (SDET). I need to build a complete test suite for my existing application. Please read [Master Prompt for Architecting Full Test Suite](./MasterPromptArchitectingFullTestSuite.md.md), [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md), and guide me through implementing multi-layered testing."
- **[Meta Agent Prompt](./meta-agent-prompt.md)** - For AI component improvements
  - **Prompt:** "You are an expert AI Solutions Architect. I want to improve the AI components in my existing application. Please read [Meta Agent Prompt](./meta-agent-prompt.md), [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md), and help me enhance the conversational AI features."

### 🎯 Deep Dive: Improving Specific Areas

#### For E2E Testing Improvements:
**[Playwright Automated Testing Prompt](./PlaywrightAutomatedTestingPrompt.md)**

**Prompt to use:** "You are a Senior Software Development Engineer in Test (SDET). I need to build or improve E2E tests for my application. Please read [Playwright Automated Testing Prompt](./PlaywrightAutomatedTestingPrompt.md), [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md), and guide me through creating a modular Playwright test suite."

Use this when you need to build or enhance end-to-end test suites with Playwright.

#### For Full Test Suite Architecture:
**[Master Prompt for Architecting Full Test Suite](./MasterPromptArchitectingFullTestSuite.md.md)**

**Prompt to use:** "You are a Principal Software Development Engineer in Test (SDET). I need a comprehensive testing strategy for my application. Please read [Master Prompt for Architecting Full Test Suite](./MasterPromptArchitectingFullTestSuite.md.md), [Engineering Cycle Playbook](./02_playbook-engineering-cycle.md), and help me build a complete multi-layered test suite."

Use this for comprehensive multi-layered testing (Unit, Integration, E2E).

#### For AI Agent Development:
**[Meta Agent Prompt](./meta-agent-prompt.md)**

**Prompt to use:** "You are an expert AI Solutions Architect. I want to build or improve a conversational AI agent. Please read [Meta Agent Prompt](./meta-agent-prompt.md), [Framework Overview](./00_framework-overview.md), and guide me through creating an intelligent qualification system."

Use this for building conversational AI agents, chatbots, or intelligent qualification systems.

## Framework Overview

The **Quantum Diamond Framework** consists of two main cycles:

### 🌀 Genesis Cycle (Envision the Right Thing)
- Creative exploration with AI agents
- Human-AI collaboration for problem discovery
- Rapid prototyping and validation

### ⚙️ Engineering Cycle (Build the Thing Right)
- Architecture-first development
- Rigorous testing and validation
- Production-ready implementation

## Prompt Categories

### Framework Core
- **[00_framework-overview.md](./00_framework-overview.md)** - Complete methodology overview
- **[01_playbook-genesis-cycle.md](./01_playbook-genesis-cycle.md)** - Creative exploration guide
- **[02_playbook-engineering-cycle.md](./02_playbook-engineering-cycle.md)** - Implementation guide

### Implementation Examples
- **[meta-agent-prompt.md](./meta-agent-prompt.md)** - AI agent development for service qualification

### Testing & Quality Assurance
- **[MasterPromptArchitectingFullTestSuite.md.md](./MasterPromptArchitectingFullTestSuite.md.md)** - Full test suite architecture
- **[PlaywrightAutomatedTestingPrompt.md](./PlaywrightAutomatedTestingPrompt.md)** - E2E testing with Playwright

## Usage Tips

1. **New Projects**: Always start with the Framework Overview, then follow the Genesis → Engineering cycle
2. **Existing Projects**: Jump into the Engineering Cycle for structured improvements
3. **Specific Improvements**: Use the specialized prompts (testing, AI agents) as needed
4. **Cross-References**: Each prompt includes links to related resources for comprehensive coverage

## Contributing

When adding new prompts, ensure they include:
- Clear use case identification
- Cross-references to related prompts
- Integration with the Quantum Diamond Framework
- Reusability for similar project types