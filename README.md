# PlumbingPOC: AI-Powered Client Management & Quoting Platform

**PlumbingPOC** is an end-to-end, fullstack client management and quoting platform built for local trades businesses. It transforms the initial point of contact from a simple form into an intelligent, AI-driven conversation, and extends into a full client portal for managing the entire job lifecycle.

Beyond intelligent lead qualification, it provides a secure command center for business owners to manage job statuses, create quotes, and communicate directly with clients. The platform features a responsive Vite + React frontend, a scalable MVC-patterned Node.js/Express backend, and deep integrations with OpenAI and Supabase for its core functionality.

## Features

-   **Modern Frontend:** A fully responsive web app built with Vite, React, and Tailwind CSS (TypeScript/TSX).
-   **Intelligent Quoting Agent:** A guided, conversational modal that uses expert logic and dynamic, AI-generated questions to ensure every lead is perfectly qualified.
-   **Scalable MVC Backend:** A robust Express/Node API architected for maintainability, featuring separate layers for routing, controllers, middleware, and validation.
-   **Secure Database & Auth:** Full integration with Supabase for user profiles, requests, quotes, notes, file storage, and secure authentication (Email/Password, Google, and Azure/Microsoft).
-   **Comprehensive Admin Dashboard:** A "Command Center" for business owners to view, manage, and act on all incoming quote requests in a professional, interactive UI.
-   **Interactive Job Management:** Update the status of any job (`new`, `quoted`, `scheduled`, `completed`) directly from the dashboard.
-   **Integrated Quoting & Communication:** Admins can create official quotes and both parties can add notes, creating a persistent, secure communication log for each job.

## Project Structure

The repository is organized for clarity and professional development standards.

```
.
├── PROMPTS/ # Prompt engineering & agent logic
├── vite-app/
│ ├── public/ # Static assets (images, etc.)
│ ├── src/ # Frontend React application (TSX)
│ ├── api/ # Backend API (Express/Node)
│ │ ├── controllers/ # Contains the core business logic for each route.
│ │ ├── middleware/ # Handles auth, validation, etc. before the controller.
│ │ ├── routes/ # Defines API endpoints and connects them to controllers.
│ │ ├── validation/ # Holds all Zod data validation schemas.
│ │ ├── README.md # Detailed API architecture documentation.
│ │ └── server.js # Initializes and wires up the Express server.
│ ├── SUPABASE_DATABASE_AND_AUTH_SETUP.md # Full setup guide for Supabase
│ └── ... # Vite config, etc.
├── blueprint.md # The original "Operation Overmatch" strategic plan
└── startup.sh # Convenience script for local development
```

---

---

## Local Development & Setup

### 1. Prerequisites

-   Node.js (v20 or higher recommended)
-   npm (or yarn/pnpm)
-   A Supabase account (free tier is sufficient)
-   An OpenAI API key

### 2. Initial Setup

1.  **Clone the repository:**
    ```sh
    git clone [your-repo-url]
    cd PlumbingPOC
    ```

2.  **Configure Supabase:**
    Follow the detailed instructions in `vite-app/SUPABASE_DATABASE_AND_AUTH_SETUP.md`. Run the **Master SQL Setup Script** to create all tables and apply the necessary Row Level Security (RLS) policies.

3.  **Set Up Environment Variables:**
    Navigate to the `vite-app/` directory, create a copy of `.env.example` named `.env`, and fill in your Supabase and OpenAI API keys.

4.  **Install Dependencies:**
    ```sh
    cd vite-app
    npm install
    ```

### 3. Running the Application

Both the backend API and the frontend server must be running simultaneously.

#### Recommended Method: Startup Script

From the project root directory, run the convenience script:
```sh
./startup.sh
```
This script will start both services in the background and provide you with the URLs. It will also give you a command to stop both services when you're done.

#### Manual Method

1.  **Start the Backend API Server:**
    In your first terminal, from the `vite-app/` directory:
    ```sh
    npm run start:api
    ```
    The API will start, typically on `http://localhost:3000/`.

2.  **Start the Frontend Vite Server:**
    In a second terminal, from the `vite-app/` directory:
    ```sh
    npm run dev
    ```
    The frontend will start, typically on `http://localhost:5173/`.

3.  **Access the App:**
    Open your browser and navigate to `http://localhost:5173/`.

---

## Application Flows
### 1. The AI-Powered Intake Flow
This diagram illustrates the initial, intelligent lead qualification process.
The intelligent agent is the core of this POC. Here's how it works:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend API
    participant OpenAI API
    participant Supabase

    User->>Frontend: Signs in or registers
    Frontend->>Supabase: Authenticates user, gets session
    Supabase-->>Frontend: Returns user session & profile

    User->>Frontend: Clicks "Request a Quote"
    Frontend->>User: Asks initial, pre-defined questions
    User-->>Frontend: Provides answers

    Frontend->>Backend API: POST /api/requests/gpt-follow-up (with answers)
    activate Backend API
    Backend API->>OpenAI API: Packages info and asks GPT-4 for follow-up questions
    activate OpenAI API
    OpenAI API-->>Backend API: Returns context-aware questions (or confirms none needed)
    deactivate OpenAI API
    Backend API-->>Frontend: Relays follow-up questions
    deactivate Backend API
    
    loop Until GPT has no more questions
        Frontend->>User: Asks AI-generated follow-up question
        User-->>Frontend: Provides answer
    end
    
    Frontend->>User: Displays a final summary for confirmation

    User->>Frontend: Confirms and submits the final request
    Frontend->>Backend API: POST /api/requests/submit (with all data)
    activate Backend API
    Backend API->>Supabase: Inserts the new row into 'requests' table
    
    opt User uploaded a file
        Frontend->>Backend API: POST /api/requests/attachments (with file)
        Backend API->>Supabase: Uploads file to Storage & inserts record into 'quote_attachments'
    end

    Backend API-->>Frontend: Returns success confirmation
    deactivate Backend API
    Frontend->>User: Displays "Thank you" message
```

### 2. The Client & Admin Management Flow

This diagram shows how admins and clients interact with a request after it has been submitted, turning the app into a client portal.

```mermaid
sequenceDiagram
    participant Admin
    participant Customer
    participant Frontend
    participant Backend API
    participant Supabase

    Admin->>Frontend: Logs in and navigates to Dashboard
    Frontend->>Backend API: GET /api/requests (fetch all data)
    Backend API->>Supabase: SELECT * from requests with joins
    Supabase-->>Backend API: Returns all request data
    Backend API-->>Frontend: Sends data to dashboard
    Frontend->>Admin: Displays list of active requests

    Admin->>Frontend: Clicks on a request to open details modal
    Admin->>Frontend: Adds a new note in the modal
    Frontend->>Backend API: POST /api/requests/:id/notes (with note text)
    activate Backend API
    Backend API->>Supabase: INSERT new row into 'request_notes'
    Supabase-->>Backend API: Confirms note saved
    Backend API-->>Frontend: Returns new note data
    deactivate Backend API
    Frontend->>Admin: UI updates instantly with the new note

    Customer->>Frontend: Logs in and views their request
    Frontend->>Backend API: GET /api/requests/:id (fetch single request)
    Backend API->>Supabase: SELECT request data for this user
    Supabase-->>Backend API: Returns request, including admin's note
    Backend API-->>Frontend: Sends data to client view
    Frontend->>Customer: Displays the conversation log
```
