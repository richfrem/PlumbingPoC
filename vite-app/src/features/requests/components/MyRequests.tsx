// vite-app/src/features/requests/components/MyRequests.tsx

import React, { useState, useEffect, useCallback } from 'react'; // <-- IMPORT useCallback
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';
import { QuoteRequest } from '../types';
import { getRequestStatusChipColor } from '../../../lib/statusColors';
import { useRequests } from '../hooks/useRequests';

interface MyRequestsProps {
  setAddNewRequestCallback?: (callback: (request: QuoteRequest) => void) => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ setAddNewRequestCallback }) => {
  const { user } = useAuth();
  const { requests, loading, refreshRequests } = useRequests(user?.id);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (setAddNewRequestCallback) {
      setAddNewRequestCallback(() => {
        refreshRequests();
      });
    }
  }, [setAddNewRequestCallback, refreshRequests]);

  const handleOpenModal = (req: QuoteRequest) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  
  // --- THE INFINITE LOOP FIX IS HERE ---
  // We wrap the function we pass down as a prop in useCallback.
  const handleModalUpdate = useCallback(() => {
    refreshRequests();
  }, [refreshRequests]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading && requests.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

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
          onUpdateRequest={handleModalUpdate} // Pass the stable function
        />
      )}
    </>
  );
};

export default MyRequests;