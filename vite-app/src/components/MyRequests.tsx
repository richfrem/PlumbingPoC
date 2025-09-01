// vite-app/src/components/MyRequests.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';
import { QuoteRequest } from './Dashboard';
import { getRequestStatusChipColor } from '../lib/statusColors';

interface MyRequestsProps {
  setAddNewRequestCallback?: (callback: (request: QuoteRequest) => void) => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ setAddNewRequestCallback }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          user_profiles!inner(*),
          quote_attachments(*),
          quotes(*),
          request_notes(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      console.error("Failed to fetch user requests:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  useEffect(() => {
    if (setAddNewRequestCallback) {
      setAddNewRequestCallback((newRequest: QuoteRequest) => {
        setRequests(prevRequests => [newRequest, ...prevRequests]);
      });
    }
  }, [setAddNewRequestCallback]);

  const refreshRequestData = async () => {
    if (!selectedRequest) return;
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`*, user_profiles!inner(*), quote_attachments(*), quotes(*), request_notes(*)`)
        .eq('id', selectedRequest.id)
        .single();

      if (error) throw error;
      if (data) {
        const updatedRequest = data as QuoteRequest;
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
        setSelectedRequest(updatedRequest);
      }
    } catch (err) {
      console.error("Error refreshing user request data:", err);
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <>
      <section id="my-requests" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            My Quote Requests
          </Typography>
          
          {requests.length > 0 ? (
            <Box sx={{ maxWidth: '800px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requests.map((req) => {
                const mostRecentQuote = req.quotes?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                return (
                  <button key={req.id} onClick={() => handleOpenModal(req)} className="w-full bg-white p-4 rounded-lg shadow-md flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200">
                    <Box>
                      <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
                        {req.problem_category.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submitted: {new Date(req.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {mostRecentQuote && (
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          ${mostRecentQuote.quote_amount.toFixed(2)}
                        </Typography>
                      )}
                      <Chip label={req.status} color={getRequestStatusChipColor(req.status)} size="small" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} />
                    </Box>
                  </button>
                );
              })}
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: '800px', margin: 'auto' }}>
              <Typography variant="h6" color="text.secondary">
                You have no quote requests yet. Request a quote now!
              </Typography>
            </Paper>
          )}
        </div>
      </section>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          onUpdateRequest={refreshRequestData}
        />
      )}
    </>
  );
};

export default MyRequests;