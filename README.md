# PlumbingPOC Mini-GPT Agent

This project is a proof-of-concept GPT agent for plumbing businesses. It replaces a simple request quote form with a guided intake flow, qualifying leads and capturing structured details for plumbers to efficiently process leads.

## Features
- Guided intake questions for plumbing leads
- Structured JSON output for backend processing
- Uses OpenAI GPT-4o-mini via API

## Setup
1. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
   ```
2. Install dependencies:
   ```
   pip install openai python-dotenv
   ```
3. Run the sample agent:
   ```
   python plumbing_agent/main.py
   ```

## Next Steps
- Customize intake questions and output schema
- Integrate with backend or CRM
