
# PlumbingPOC API Server

This document outlines the architecture and conventions for the PlumbingPOC API server, built with Node.js and Express using an MVC-inspired pattern.

## Core Architecture: MVC Pattern

**Model:** Supabase handles all database interactions, data shaping, and enforces data integrity through its schema and Row Level Security (RLS) policies.

**View:** For a REST API, the "View" is the JSON data sent to the client. Controllers assemble and send these responses.

**Controller:** Contains the core business logic. Controllers receive requests from routes, interact with the Model (Supabase), and send a response back through the View (JSON).

---

## Directory Structure

```text
api/
├── controllers/           # Business logic (MVC: Controller)
│   └── requestController.js
├── middleware/            # Reusable functions before controllers
│   ├── authMiddleware.js
│   └── validationMiddleware.js
├── routes/                # Maps URLs to controllers
│   └── requestRoutes.js
├── validation/            # Data contracts (schemas)
│   └── schemas.js
└── server.js              # Main application entry point
```

## File Responsibilities

### `server.js`

- Initializes the Express app
- Configures core middleware (CORS, body-parser)
- Loads and delegates all API routes to the `routes/` directory
- Defines a global error handler
- Starts the server

### `/routes`

Defines endpoints (e.g., `/submit`, `/:requestId/notes`), specifies HTTP methods (GET, POST), and chains middleware before passing the request to the controller.

**Example from `requestRoutes.js`:**

```javascript
// Create a formal quote for a request (admin only)
router.post(
    '/:requestId/quotes', // The Path
    authenticate,         // Middleware 1: Is the user logged in?
    isAdmin,              // Middleware 2: Does the user have admin role?
    validate(createQuoteSchema), // Middleware 3: Is the request body valid?
    createQuoteForRequest // The Controller function to run
);
```

### `/controllers`

Self-contained business logic for specific tasks (e.g., submitting a quote, adding a note). Receives `req` and `res` after middleware.

### `/middleware`

Reusable functions between route and controller.
- `authMiddleware.js`: Handles authentication (`authenticate`) and role-based authorization (`isAdmin`).
- `validationMiddleware.js`: Generic `validate` function checks incoming request data against a schema.

### `/validation`

Defines "data contracts" using zod. Each schema in `schemas.js` clearly defines the expected shape and types for endpoint request bodies, params, or queries.

## Request Lifecycle

1. **Client Request:** React app sends a POST request to `/api/requests/:id/notes`.
2. **server.js:** Request hits `server.js`, passes through CORS and JSON body parser.
3. **routes/requestRoutes.js:** Router matches path/method, applies `authenticate` middleware and `addNote` controller.
4. **middleware/authMiddleware.js:** `authenticate` checks for valid JWT, attaches `req.user` and calls `next()`. If invalid, sends 401 Unauthorized and stops flow.
5. **controllers/requestController.js:** `addRequestNote` runs, interacts with Supabase, sends JSON response (e.g., `res.status(201).json(...)`).
6. **Client Receives Response:** React app receives JSON data or error message.

This clean separation makes the system robust and predictable.

## Mermaid diagrams

### relationship diagram
```mermaid
graph TD
    subgraph "API Server"
        A[server.js] --> B{/api/requests/*};
        
        subgraph "Routes"
            B --> C[requestRoutes.js];
        end
        
        subgraph "Middleware"
            D[authMiddleware.js];
            E[validationMiddleware.js];
        end

        subgraph "Validation"
            F[schemas.js];
        end

        subgraph "Controllers"
            G[requestController.js];
        end

        C -- "Defines Path & Chains Middleware" --> D;
        C -- " " --> E;
        E -- "Uses" --> F;
        C -- "Calls" --> G;
    end
    
    H((Supabase));
    G -- "Interacts with (Model)" --> H;
    
    I([Client]);
    I -- "HTTP Request" --> A;
    G -- "JSON Response (View)" --> I;

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#9f9,stroke:#333,stroke-width:2px
    style E fill:#9f9,stroke:#333,stroke-width:2px
    style F fill:#f99,stroke:#333,stroke-width:2px
    style G fill:#ff9,stroke:#333,stroke-width:2px
```

### Sequence Diagram Admin Creates a Quote (The Original Diagram)
```mermaid
sequenceDiagram
    participant Client
    participant server.js
    participant requestRoutes.js
    participant authMiddleware.js
    participant validationMiddleware.js
    participant requestController.js
    participant Supabase

    Client->>server.js: POST /api/requests/:id/quotes (with data & token)
    activate server.js
    
    server.js->>requestRoutes.js: Route request
    activate requestRoutes.js
    
    requestRoutes.js->>authMiddleware.js: 1. call authenticate()
    activate authMiddleware.js
    authMiddleware.js->>Supabase: supabase.auth.getUser(token)
    Supabase-->>authMiddleware.js: Returns user object
    authMiddleware.js-->>requestRoutes.js: next()
    deactivate authMiddleware.js
    
    requestRoutes.js->>authMiddleware.js: 2. call isAdmin()
    activate authMiddleware.js
    authMiddleware.js->>Supabase: Check user_profiles.role
    Supabase-->>authMiddleware.js: Returns { role: 'admin' }
    authMiddleware.js-->>requestRoutes.js: next()
    deactivate authMiddleware.js
    
    requestRoutes.js->>validationMiddleware.js: 3. call validate(schema)
    activate validationMiddleware.js
    validationMiddleware.js-->>requestRoutes.js: next() (Data is valid)
    deactivate validationMiddleware.js

    requestRoutes.js->>requestController.js: 4. call createQuoteForRequest()
    activate requestController.js
    
    requestController.js->>Supabase: INSERT into quotes table
    activate Supabase
    Supabase-->>requestController.js: Confirms insert
    deactivate Supabase
    
    requestController.js->>Supabase: UPDATE requests table status
    activate Supabase
    Supabase-->>requestController.js: Confirms update
    deactivate Supabase
    
    requestController.js-->>server.js: Sends JSON response
    deactivate requestController.js
    deactivate requestRoutes.js
    
    server.js-->>Client: 201 Created (with quote data)
    deactivate server.js
```
### Sequence diagram AI Generates Follow-up Questions
```mermaid
sequenceDiagram
    participant Client
    participant server.js
    participant requestRoutes.js
    participant authMiddleware.js
    participant validationMiddleware.js
    participant requestController.js
    participant OpenAI_API as "OpenAI API (GPT-4)"

    Client->>server.js: POST /api/requests/gpt-follow-up (with answers & token)
    activate server.js
    
    server.js->>requestRoutes.js: Route request
    activate requestRoutes.js
    
    requestRoutes.js->>authMiddleware.js: 1. call authenticate()
    activate authMiddleware.js
    authMiddleware.js-->>requestRoutes.js: next() (User is valid)
    deactivate authMiddleware.js
    
    requestRoutes.js->>validationMiddleware.js: 2. call validate(schema)
    activate validationMiddleware.js
    validationMiddleware.js-->>requestRoutes.js: next() (Data is valid)
    deactivate validationMiddleware.js

    requestRoutes.js->>requestController.js: 3. call getGptFollowUp()
    activate requestController.js
    
    requestController.js->>OpenAI_API: axios.post to /v1/chat/completions
    activate OpenAI_API
    OpenAI_API-->>requestController.js: Returns follow-up questions
    deactivate OpenAI_API
    
    requestController.js-->>server.js: Sends JSON response { additionalQuestions: [...] }
    deactivate requestController.js
    deactivate requestRoutes.js
    
    server.js-->>Client: 200 OK (with questions array)
    deactivate server.js
```