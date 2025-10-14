// packages/backend/api/validation/schemas.js

import { z } from 'zod';

// Schema for the initial request from the AI agent for follow-up questions
const gptRequestSchema = z.object({
  body: z.object({
    clarifyingAnswers: z.array(z.object({ question: z.string(), answer: z.string() })),
    category: z.string(),
    problem_description: z.string().optional(),
  }),
});

// Schema for the final submission of the entire quote request form
const submitQuoteSchema = z.object({
  body: z.object({
    clarifyingAnswers: z.array(z.object({ question: z.string(), answer: z.string() })),
    contactInfo: z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postal_code: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }),
    category: z.string(),
    isEmergency: z.boolean().optional(),
    property_type: z.string().optional(),
    is_homeowner: z.string().optional(),
    problem_description: z.string().optional(),
    preferred_timing: z.string().optional(),
    additional_notes: z.string().optional(),
  }),
});

// Schema for adding a new note to a request
const addNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid request ID format.")
  }),
  body: z.object({
    note: z.string().min(1, "Note cannot be empty.")
  }),
});

// Schema for an admin creating a quote for a request
const createQuoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid request ID format.")
  }),
  body: z.object({
    quote_amount: z.number().positive("Quote amount must be a positive number."),
    details: z.string().min(1, "Quote details cannot be empty."),
  }),
});

// --- NEW SCHEMA FOR UPDATING A QUOTE ---
const updateQuoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid request ID format."),
    quoteId: z.string().uuid("Invalid quote ID format."),
  }),
  body: z.object({
    quote_amount: z.number().positive("Quote amount must be a positive number."),
    details: z.string().min(1, "Quote details cannot be empty."),
  }),
});

// Schema for getting an object from storage
const getObjectSchema = z.object({
    params: z.object({
        0: z.string().min(1, "Object path cannot be empty."),
    })
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid request ID format."),
  }),
  body: z.object({
    status: z.string().min(1, "Status cannot be empty."),
    scheduled_start_date: z.string().datetime({ offset: true }).nullable().optional(),
  }),
});

export {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  updateQuoteSchema,
  getObjectSchema,
  updateStatusSchema,
};
