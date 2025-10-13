-- Migration: Add request_id to invoices table
-- Date: 2025-10-12
-- Description: Adds request_id column to invoices table to link invoices to requests
-- INSTRUCTIONS: Copy and paste this entire file into Supabase SQL Editor and run

-- Add request_id column to invoices table
ALTER TABLE public.invoices ADD COLUMN request_id UUID;

-- Add foreign key relationship to requests
ALTER TABLE public.invoices
  ADD CONSTRAINT fk_invoices_request
  FOREIGN KEY (request_id) REFERENCES public.requests(id)
  ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_invoices_request_id ON public.invoices(request_id);
CREATE INDEX idx_requests_invoice_id ON public.requests(invoice_id);
