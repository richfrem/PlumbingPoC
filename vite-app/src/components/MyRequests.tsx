// vite-app/src/components/MyRequests.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, ListItemButton, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';
import { QuoteRequest } from './Dashboard'; // Re-use the interface from Dashboard

const MyRequests: React.FC = () => {
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
      // This is the key difference: we filter by the logged-in user's ID
      const { data, error } = await supabase
        .from('requests')
        .select(`*, user_profiles(*), quote_attachments(*), quotes(*), request_notes(*)`)
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

  const refreshRequestData = async () => {
    // A simple way to refresh is to just re-fetch all requests
    await fetchUserRequests();
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <section id="my-requests" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            My Quote Requests
          </Typography>
          
          {requests.length > 0 ? (
            <Box sx={{ maxWidth: '800px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requests.map((req) => (
                <Paper 
                  key={req.id} 
                  component={ListItemButton}
                  onClick={() => handleOpenModal(req)}
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: 3 } }}
                >
                  <Box>
                    <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
                      {req.problem_category.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted: {new Date(req.created_at).toLocaleDateString()}
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
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: '800px', margin: 'auto' }}>
              <Typography variant="h6" color="text.secondary">
                You haven't made any quote requests yet.
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