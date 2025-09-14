# Architectural Refactoring Mandate: PlumbingPOC v2.0

**Objective:** To refactor the PlumbingPOC application to align with modern React best practices, focusing on modularity, reusability, and long-term maintainability. This mandate will transition the project from a component-centric structure to a professional, feature-based architecture powered by custom hooks.

**Primary AI Agent:** Gemini CLI 2.5
**Human Steward:** Richard Fremmerlid

---

## I. Core Philosophy & Guiding Principles

This refactoring is guided by the following principles:

1.  **Component-Based Architecture:** Continue to break down large components into smaller, single-responsibility components.
2.  **Feature-Based Organization:** Co-locate all files related to a single feature (components, hooks, types) to improve developer experience and scalability.
3.  **Logic Encapsulation via Custom Hooks:** Abstract all complex, non-visual logic (especially data fetching and real-time subscriptions) into reusable custom hooks.
4.  **One-Way Data Flow:** Maintain the predictable pattern of data flowing down through props and events flowing up through callbacks.

---

## II. Mandate 1: Implement a Feature-Based Directory Structure

The current `src/` directory will be reorganized into a feature-based structure.

**Action:**
Restructure the `packages/frontend/src/` directory to match the following target layout. You will need to create new directories and move existing files accordingly. Update all import paths across the application to reflect the new file locations.

**Target Directory Structure:**

```
packages/frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── AuthModal.tsx
│   │   │   └── UserMenu.tsx
│   │   └── AuthContext.tsx  // Keep AuthContext here for now
│   ├── profile/
│   │   └── components/
│   │       └── ProfileModal.tsx
│   └── requests/
│       ├── components/
│       │   ├── Dashboard.tsx
│       │   ├── MyRequests.tsx
│       │   ├── RequestDetailModal.tsx
│       │   ├── QuoteList.tsx
│       │   ├── CommunicationLog.tsx
│       │   └── ... (all other request-related components)
│       ├── hooks/
│       │   └── useRequests.ts  // To be created in Mandate 2
│       └── types/
│           └── index.ts        // To be created in Mandate 3
├── hooks/ 
│   └── (empty for now, will contain useRequests.ts)
├── lib/
│   ├── apiClient.ts
│   ├── supabaseClient.ts
│   └── ... (other shared library files)
└── main.tsx
```
*(Note: I have moved the empty `hooks/` directory to the `requests` feature folder for better co-location, which is a refinement of our initial discussion.)*

---

## III. Mandate 2: Create the `useRequests` Custom Hook

**Action:**
Create a new file at `packages/frontend/src/features/requests/hooks/useRequests.ts`. This hook will encapsulate all data fetching and real-time subscription logic for quote requests.

**`useRequests.ts` Implementation:**

```typescript
// packages/frontend/src/features/requests/hooks/useRequests.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { QuoteRequest } from '../types'; // Will be created in the next mandate

export function useRequests(userId?: string) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (requests.length === 0) setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('requests')
        .select(`*, user_profiles!inner(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      console.error("useRequests hook error:", err);
      setError("Failed to fetch requests.");
    } finally {
      setLoading(false);
    }
  }, [userId, requests.length]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const channelId = userId ? `user-requests-${userId}` : 'admin-dashboard';
    const channel = supabase.channel(channelId);

    const handleUpdate = (payload: any) => {
      console.log(`Realtime update on channel ${channelId}:`, payload);
      fetchRequests();
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_notes' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_attachments' }, handleUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRequests]);

  return { requests, loading, error, refreshRequests: fetchRequests };
}
```

---

## IV. Mandate 3: Centralize Type Definitions

**Action:**
Create a new file at `packages/frontend/src/features/requests/types/index.ts`. Move all request-related TypeScript interfaces (`QuoteRequest`, `Quote`, `RequestNote`) from `Dashboard.tsx` into this new file and export them.

**`features/requests/types/index.ts` Implementation:**

```typescript
// packages/frontend/src/features/requests/types/index.ts

export interface Quote { 
  id: string; 
  quote_amount: number; 
  details: string; 
  status: string; 
  created_at: string; 
}

export interface RequestNote { 
  id: string; 
  note: string; 
  author_role: 'admin' | 'customer'; 
  created_at: string; 
}

export interface QuoteAttachment {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  quote_id?: string;
}

export interface QuoteRequest {
  id: string;
  created_at: string;
  customer_name: string;
  problem_category: string;
  status: string;
  is_emergency: boolean;
  answers: { question: string; answer: string }[];
  quote_attachments: QuoteAttachment[];
  user_profiles: { name: string; email: string; phone: string; [key: string]: any; } | null;
  service_address: string;
  quotes: Quote[];
  request_notes: RequestNote[];
  scheduled_start_date: string | null;
  triage_summary: string | null;
  priority_score: number | null;
  priority_explanation: string | null;
  profitability_score: number | null;
  profitability_explanation: string | null;
}
```

---

## V. Mandate 4: Refactor `Dashboard.tsx` and `MyRequests.tsx`

**Action:**
Update both `Dashboard.tsx` and `MyRequests.tsx` to use the new `useRequests` hook and import types from the new central location. This will dramatically simplify both components.

*   **Remove all `useState`, `useEffect`, and `useCallback` hooks related to data fetching and subscriptions from both files.**
*   **Replace them with a single call to the `useRequests` hook.**
*   **Update all type imports to point to `../types`.**

**Example (`Dashboard.tsx`):**
```typescript
import { useRequests } from '../hooks/useRequests';
import { QuoteRequest, Quote, RequestNote } from '../types'; // New import

// ...

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  // ... state for modal ...

  // All data logic is now clean and encapsulated!
  const { requests: allRequests, loading, error, refreshRequests } = useRequests();

  // ... rest of the component ...
};
```

---

## VI. Future Considerations (For the Steward)

This mandate focuses on the most critical refactoring. Long-term, we should also consider:
*   **`useAuth` Hook:** Refactoring the `AuthContext.tsx` into a more conventional `useAuth.ts` hook.
*   **TanStack Query:** Investigating this library to further simplify data fetching and caching, which would replace the custom `useRequests` hook with an even more powerful, industry-standard solution.

Execute these mandates in order. This will result in a more professional, scalable, and maintainable codebase.
