// packages/frontend/src/features/requests/components/MyRequests.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';
import { QuoteRequest } from '../types';
import { getRequestStatusChipColor, getRequestStatusPinColor } from '../../../lib/statusColors';
import statusColors from '../../../lib/statusColors.json';
import { useRealtimeInvalidation } from '../../../hooks/useSupabaseRealtimeV3';

interface MyRequestsProps {
  requests: QuoteRequest[];
  loading: boolean;
  error: string | null;
  refreshRequests: () => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ requests, loading, error, refreshRequests }) => {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Enable centralized real-time invalidation for user requests
  useRealtimeInvalidation(user?.id);

  useEffect(() => {
    console.log('📋 MyRequests: requests prop updated', {
      requestCount: requests.length,
      requestIds: requests.map(r => ({ id: r.id, status: r.status }))
    });

    if (selectedRequest && requests.length > 0) {
      const newRequestData = requests.find(r => r.id === selectedRequest.id);
      if (newRequestData) {
        console.log('📋 MyRequests: updating selectedRequest', {
          id: newRequestData.id,
          oldStatus: selectedRequest.status,
          newStatus: newRequestData.status
        });
        setSelectedRequest(newRequestData);
      }
    }
  }, [requests, selectedRequest?.id]);

  const handleOpenModal = (req: QuoteRequest) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  
  const handleModalUpdate = useCallback(() => {
    refreshRequests();
  }, [refreshRequests]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading && requests.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

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
                  <button key={`${req.id}-${req.status}-${req.quotes?.length || 0}`} data-request-id={req.id} onClick={() => handleOpenModal(req)} className="w-full bg-white p-4 rounded-lg shadow-md flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200">
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
                      <Chip
                        label={req.status}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 'bold',
                          backgroundColor: statusColors[req.status as keyof typeof statusColors] || statusColors.default,
                          // Set text color to black for yellow/orange, otherwise white
                          color: ['#FBC02D', '#F57C00'].includes(statusColors[req.status as keyof typeof statusColors]) ? '#000' : '#fff',
                        }}
                      />
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
          onUpdateRequest={handleModalUpdate}
        />
      )}
    </>
  );
};

export default MyRequests;