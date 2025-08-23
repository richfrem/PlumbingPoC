// vite-app/src/components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemButton, ListItemText, Divider, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';

// Interfaces remain the same
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

  const refreshRequestData = async (requestId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`*, user_profiles(*), quote_attachments(*), quotes(*), request_notes(*)`)
        .eq('id', requestId)
        .single();
      
      if (fetchError) throw fetchError;

      if (data) {
        const updatedRequest = data as QuoteRequest;
        setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
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

  const getStatusChipColor = (status: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const colorMap: { [key: string]: 'primary' | 'info' | 'warning' | 'success' | 'default' } = {
      new: 'primary',
      viewed: 'info',
      quoted: 'warning',
      scheduled: 'success',
      completed: 'default'
    };
    return colorMap[status] || 'default';
  };
  
  if (loading) { /* ... */ }
  if (!profile || profile.role !== 'admin') { /* ... */ }
  if (error) { /* ... */ }

  return (
    <>
      {/* --- NEW STYLING APPLIED HERE --- */}
      <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: '1000px', margin: 'auto' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Plumber's Command Center
          </Typography>
          
          {requests.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requests.map((req) => (
                <Paper 
                  key={req.id} 
                  component={ListItemButton} // Makes the whole paper clickable
                  onClick={() => handleOpenModal(req)}
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'box-shadow 0.3s',
                    '&:hover': {
                      boxShadow: 3, // Elevate on hover
                    }
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
                      {req.problem_category.replace(/_/g, " ")} - {req.customer_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Received: {new Date(req.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip 
                    label={req.status} 
                    color={getStatusChipColor(req.status)}
                    size="small"
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  />
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No new quote requests found.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          onUpdateRequest={() => refreshRequestData(selectedRequest.id)}
        />
      )}
    </>
  );
};

export default Dashboard;