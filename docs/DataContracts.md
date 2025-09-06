# PlumbingPOC: Data Contracts

This document provides a human-readable overview of the critical data structures and contracts that govern the flow of information through the PlumbingPOC system. It is the single source of truth for understanding our data model.

## 1. Core Data Models

These are the primary entities persisted in our Supabase database. The source code for these types can be found in `vite-app/src/features/requests/types/index.ts`.

### QuoteRequest

The central entity in the application. Represents a single job from initial customer contact to completion.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (uuid) | The unique identifier for the request. |
| `created_at` | `string` (timestamp) | When the request was first submitted. |
| `user_id` | `string` (uuid) | Foreign key linking to the `auth.users` table. |
| `status` | `string` | The current stage of the job (`new`, `quoted`, `scheduled`, etc.). |
| `problem_category`| `string` | The main service requested (e.g., "leak_repair"). |
| `answers` | `JSON` | A structured array of all questions asked and answers given during the intake flow. |
| `user_profiles` | `object` | The joined profile data of the customer (name, email, phone). |
| `quote_attachments`| `Array<QuoteAttachment>` | A list of all files attached to this request. |
| `quotes` | `Array<Quote>` | A list of all formal quotes provided for this request. |
| `request_notes` | `Array<RequestNote>` | The communication log between the admin and customer. |
| `triage_summary` | `string` (nullable) | The AI-generated summary of the request for the admin. |
| `priority_score` | `number` (nullable) | The AI-generated priority score (1-10). |
| `profitability_score` | `number` (nullable) | The AI-generated profitability score (1-10). |

## 2. API Endpoint Contracts

These contracts define the shape of data for requests and responses to our Node.js/Express API. The source code for these contracts is in `vite-app/api/validation/schemas.js`.

### POST `/api/requests/submit`

This endpoint is used by the client to submit a new, fully-formed quote request.

**Example Request Body (`application/json`):**
```json
{
  "clarifyingAnswers": [
    { "question": "What is the property type?", "answer": "Residential" },
    { "question": "Are you the homeowner?", "answer": "Yes" }
  ],
  "contactInfo": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "555-123-4567"
  },
  "category": "leak_repair",
  "isEmergency": true
}