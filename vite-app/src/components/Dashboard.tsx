// vite-app/src/components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';

// Interface remains the same
export interface Quote { id: string; quote_amount: number; details: string; status: string; created_at: string; }
export interface RequestNote { id: string; note: string; author_role: 'admin' | 'customer'; created_at: string; }
export interface QuoteRequest {
  id: string;
  created_at: string;
  customer_name: string;
  problem_category: string;
  status: string;
  answers: { question: string; answer: string }[];
  quote_attachments: {
    file_name: string;
    mime_type: string | null;
  }[];
  user_profiles: {
    name: string;
    email: string;
    phone: string;
  } | null;
  service_address: string;
  quotes: Quote[];
  request_notes: RequestNote[];
}

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // This function fetches the initial list of all requests
  const fetchAllRequests = async () => {
    if (!profile || profile.role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          user_profiles ( name, email, phone ),
          quote_attachments ( file_name, mime_type ),
          quotes ( * ),
          request_notes ( * )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      setError("Failed to fetch quote requests.");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllRequests();
  }, [profile]);

  // --- NEW FUNCTION TO REFRESH A SINGLE REQUEST ---
  // This is more efficient than refetching the entire list every time.
  const refreshRequestData = async (requestId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          user_profiles ( name, email, phone ),
          quote_attachments ( file_name, mime_type ),
          quotes ( * ),
          request_notes ( * )
        `)
        .eq('id', requestId)
        .single();
      
      if (fetchError) throw fetchError;

      if (data) {
        const updatedRequest = data as QuoteRequest;
        // 1. Update the request in the main list
        setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
        // 2. Update the request being viewed in the modal
        setSelectedRequest(updatedRequest);
      }
    } catch (err) {
      console.error("Error refreshing request data:", err);
    }
  };

  const handleOpenModal = (req: QuoteRequest) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };
  
  if (loading) { /* ... no changes here ... */ }
  if (!profile || profile.role !== 'admin') { /* ... no changes here ... */ }
  if (error) { /* ... no changes here ... */ }

  return (
    <>
      <Box sx={{ maxWidth: '1200px', margin: 'auto', p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Plumber's Command Center
        </Typography>
        <Paper elevation={3}>
          <List>
            {requests.length > 0 ? (
              requests.map((req, index) => (
                <React.Fragment key={req.id}>
                  <ListItemButton onClick={() => handleOpenModal(req)}>
                    <ListItemText
                      primary={`${req.problem_category.replace(/_/g, " ")} - ${req.customer_name || 'N/A'}`}
                      secondary={`Received: ${new Date(req.created_at).toLocaleString()} | Status: ${req.status}`}
                      primaryTypographyProps={{ sx: { textTransform: 'capitalize' } }}
                    />
                  </ListItemButton>
                  {index < requests.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem><ListItemText primary="No new quote requests found." /></ListItem>
            )}
          </List>
        </Paper>
      </Box>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          // --- PASS THE REFRESH FUNCTION DOWN ---
          onUpdateRequest={() => refreshRequestData(selectedRequest.id)}
        />
      )}
    </>
  );
};

export default Dashboard;