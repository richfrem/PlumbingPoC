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

### Core Quote Intake Routes (`/api/requests`)

#### POST `/api/requests/gpt-follow-up`
Generates AI-powered follow-up questions based on user answers.

**Request Body:**
```json
{
  "clarifyingAnswers": [
    { "question": "string", "answer": "string" }
  ],
  "category": "string",
  "problem_description": "string"
}
```

**Response:**
```json
{
  "additionalQuestions": ["string"]
}
```

#### POST `/api/requests/submit`
Submits a new quote request.

**Request Body:**
```json
{
  "clarifyingAnswers": [
    { "question": "string", "answer": "string" }
  ],
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "province": "string",
    "postal_code": "string"
  },
  "category": "string",
  "isEmergency": boolean,
  "property_type": "string",
  "is_homeowner": boolean,
  "problem_description": "string",
  "preferred_timing": "string",
  "additional_notes": "string"
}
```

**Response:**
```json
{
  "message": "Quote request submitted successfully.",
  "request": { /* QuoteRequest object */ }
}
```

#### POST `/api/requests/attachments`
Uploads files attached to a request.

**Request Body (FormData):**
- `attachment`: File[]
- `request_id`: string
- `quote_id`: string (optional)

**Response:**
```json
{
  "message": "Attachments uploaded successfully.",
  "attachments": [/* Attachment objects */]
}
```

#### GET `/api/requests/storage-object/*`
Retrieves a file from storage.

**Response:** File stream

### Client Portal & Admin Routes (`/api/requests`)

#### POST `/api/requests/:id/notes`
Adds a note to a request.

**Request Body:**
```json
{
  "note": "string"
}
```

**Response:** Note object

#### PATCH `/api/requests/:id/status`
Updates request status (admin only).

**Request Body:**
```json
{
  "status": "string",
  "scheduled_start_date": "string" // optional
}
```

**Response:** Updated request object

#### POST `/api/requests/:id/quotes`
Creates a quote for a request (admin only).

**Request Body:**
```json
{
  "quote_amount": number,
  "details": "string"
}
```

**Response:** Quote object

#### PUT `/api/requests/:id/quotes/:quoteId`
Updates an existing quote (admin only).

**Request Body:**
```json
{
  "quote_amount": number,
  "details": "string"
}
```

**Response:** Updated quote object

#### POST `/api/requests/:id/quotes/:quoteId/accept`
Accepts a quote.

**Response:**
```json
{
  "message": "Quote accepted successfully."
}
```

#### GET `/api/requests/:id`
Retrieves a single request with all related data.

**Response:** Full QuoteRequest object with joins

### User Profile Routes (`/api`)

#### GET `/api/profile`
Gets the current user's profile.

**Response:** User profile object

#### POST `/api/profile`
Creates a new user profile.

**Request Body:** Profile data

**Response:** Created profile object

#### PUT `/api/profile`
Updates the current user's profile.

**Request Body:** Profile data

**Response:** Updated profile object

### AI Triage Routes (`/api/triage`)

#### POST `/api/triage/:requestId`
Performs AI-powered triage analysis (admin only).

**Response:**
```json
{
  "message": "Triage complete.",
  "triage_summary": "string",
  "priority_score": number,
  "priority_explanation": "string",
  "profitability_score": number,
  "profitability_explanation": "string"
}
```