// version 2.3 - Final Query Fix after adding DB relationship.
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import RequestDetailModal from './RequestDetailModal';

// Defines the full shape of the data we are fetching, including nested relations.
interface QuoteRequest {
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
}

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile || profile.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        // This query now works because we created the foreign key relationship in the database.
        const { data, error: fetchError } = await supabase
          .from('requests')
          .select(`
            *,
            user_profiles ( name, email, phone ),
            quote_attachments ( file_name, mime_type )
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
    fetchRequests();
  }, [profile]);

  const handleOpenModal = (req: QuoteRequest) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!profile || profile.role !== 'admin') {
    return (
      <Box sx={{ maxWidth: '1200px', margin: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Access Denied</Typography>
        <Typography>You do not have permission to view this page.</Typography>
      </Box>
    );
  }

  if (error) {
    return (
        <Box sx={{ maxWidth: '1200px', margin: 'auto', p: 3, textAlign: 'center' }}>
            <Typography variant="h5" color="error">Error Loading Data</Typography>
            <Typography>{"An error occurred while fetching data. Please check the console for details."}</Typography>
        </Box>
    );
  }

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
                  <ListItem button onClick={() => handleOpenModal(req)}>
                    <ListItemText
                      primary={`${req.problem_category} - ${req.customer_name || 'N/A'}`}
                      secondary={`Received: ${new Date(req.created_at).toLocaleString()} | Status: ${req.status}`}
                    />
                  </ListItem>
                  {index < requests.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No new quote requests found." />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
        />
      )}
    </>
  );
};

export default Dashboard;