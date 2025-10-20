# Plumbing Quote Agent Requirements

## 1. User Registration & Profile
- Users must register and be signed in to request a quote.
- The agent pulls contact info from the user profile to complete the quote request.
- A profile with contact info is required.

## 2. Efficient Questioning & Cost Reduction
- The agent reduces chattiness with GPT-4 to minimize API costs.
- Common questions are anticipated and built into the app.
- The first question is: "What would you like a quote for?" (user selects from a list of service types).

## 3. Service Quote Request Types & Common Questions
- Maintain a separate JSON/TypeScript file of service quote request types (e.g., bathroom reno, perimeter drains, water heater install, etc.).
- For each type, maintain a list of common anticipated questions. Example for bathroom reno:
  - What specific fixtures does the homeowner plan to use, or would they like options/recommendations?
  - Are there any special requirements or features the homeowner is interested in, such as water-saving or smart fixtures?
  - Is there an existing blueprint or design plan to follow for the renovation?
  - Will any additional renovations be happening simultaneously that might affect the plumbing work?
  - Are there any known issues with the existing plumbing that might complicate the renovation process?
- Maintain similar common questions for other service types.

## 4. Conversational Flow
- Ask all questions one at a time in a chat-style conversation.
- Use a text box at the bottom for user answers.

## 5. Profile Data Usage
- Pull user profile information into the quote request.
- Do not ask for information already known.

## 6. Privacy & GPT Interaction
- Do not share personal information (name, phone, email, address) with GPT.
- Only send context-specific info needed for follow-up questions.

## 7. Packaging & Submitting the Quote
- Package the quote for GPT with all answers and known info, formatted efficiently.
- Ask GPT if additional questions are required for the current context.
- If GPT returns more questions, ask them in the same conversational style (user is unaware they are talking to GPT).
- Repeat until GPT confirms all key questions are answered.

## 8. Final Summary & Submission
- Package a summary of the request in a user-readable format, including contact info.
- Display the summary to the user before submission.
- On submission, show: "Submitting request for quote. We will get back to you with a quote soon. Thank you very much."
