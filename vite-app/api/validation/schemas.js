// /validation/schemas.js
/*
This file centralizes all zod schemas. Keeping them here makes your API's 
data contracts explicit and easy to find. If you need to change 
what data a route accepts, you only need to look in this one file.
*/
const { z } = require('zod');

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
    requestId: z.string().uuid("Invalid request ID format.") 
  }),
  body: z.object({ 
    note: z.string().min(1, "Note cannot be empty.") 
  }),
});

// Schema for an admin creating a quote for a request
const createQuoteSchema = z.object({
  params: z.object({ 
    requestId: z.string().uuid("Invalid request ID format.") 
  }),
  body: z.object({
    quote_amount: z.number().positive("Quote amount must be a positive number."),
    details: z.string().min(1, "Quote details cannot be empty."),
  }),
});

// Schema for getting an object from storage
const getObjectSchema = z.object({
    params: z.object({
        // The '*' in Express routes doesn't have a name, it's just index 0
        0: z.string().min(1, "Object path cannot be empty."),
    })
});

module.exports = {
  gptRequestSchema,
  submitQuoteSchema,
  addNoteSchema,
  createQuoteSchema,
  getObjectSchema,
};