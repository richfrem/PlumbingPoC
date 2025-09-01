// vite-app/src/components/MyRequests.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';
import { QuoteRequest } from './Dashboard';
import { getRequestStatusChipColor } from '../lib/statusColors';

// Interface remains the same
interface MyRequestsProps {
  setAddNewRequestCallback?: (callback: (request: QuoteRequest) => void) => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ setAddNewRequestCallback }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ** THE FIX - PART 1: Wrap fetch logic in useCallback for stable dependency **
  const fetchUserRequests = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Set loading to true only if it's the initial load
    if (requests.length === 0) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`*, user_profiles!inner(*), quote_attachments(*), quotes(*), request_notes(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      console.error("Failed to fetch user requests:", err);
    } finally {
      setLoading(false);
    }
  }, [user, requests.length]); // Add requests.length to dependencies

  // Initial fetch
  useEffect(() => {
    fetchUserRequests();
  }, [fetchUserRequests]);

  // ** THE FIX - PART 2: Supabase Realtime Subscription **
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`my-requests-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          // Only listen to changes affecting this user's requests
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          console.log('Realtime update received in MyRequests:', payload);
          // When any change happens, simply re-fetch the data
          fetchUserRequests();
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUserRequests]);


  // setAddNewRequestCallback logic remains the same
  useEffect(() => {
    if (setAddNewRequestCallback) {
      setAddNewRequestCallback((newRequest: QuoteRequest) => {
        setRequests(prevRequests => [newRequest, ...prevRequests]);
      });
    }
  }, [setAddNewRequestCallback]);

  // refreshRequestData can be simplified or removed, as the realtime listener handles updates
  const refreshRequestData = async () => {
    await fetchUserRequests();
    // Also update the selected request if it's open
    if (selectedRequest) {
        const refreshedRequest = requests.find(r => r.id === selectedRequest.id);
        if (refreshedRequest) {
            setSelectedRequest(refreshedRequest);
        }
    }
  };
  
  // The rest of the component (handleOpenModal, handleCloseModal, render logic) remains exactly the same.
  // ... (paste the rest of your MyRequests.tsx component code here) ...
  const handleOpenModal = (req: QuoteRequest) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    // After closing modal, a quick refresh ensures consistency
    fetchUserRequests();
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