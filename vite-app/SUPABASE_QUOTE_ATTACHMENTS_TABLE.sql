-- Create quote_attachments table
CREATE TABLE quote_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  mime_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Index for faster lookup
CREATE INDEX idx_quote_attachments_request_id ON quote_attachments(request_id);
