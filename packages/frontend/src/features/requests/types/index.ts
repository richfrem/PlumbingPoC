// packages/frontend/src/features/requests/types/index.ts

export interface Quote {
  id: string;
  quote_number: number; 
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
  required_expertise: {
    skill_level: 'apprentice' | 'journeyman' | 'master';
    specialized_skills: string[];
    reasoning: string;
  } | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_address: string | null;
  actual_cost: number | null;
  completion_notes: string | null;
  invoice_id: string | null;
  accepted_quote_id: string | null;
}
