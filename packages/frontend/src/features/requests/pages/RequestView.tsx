import React from 'react';
import { Box, Typography, CircularProgress, Grid, Paper } from '@mui/material';
import { useRequestById } from '../../../hooks';
import { useAuth } from '../../auth/AuthContext';
import CustomerInfoSection from '../components/CustomerInfoSection';
import RequestProblemDetails from '../components/RequestProblemDetails';
import QuoteList from '../components/QuoteList';
import ModalHeader from '../components/ModalHeader';
import RequestActions from '../components/RequestActions';

interface RequestViewProps {
  requestId: string;
}

const RequestView: React.FC<RequestViewProps> = ({ requestId }) => {
  const { data: requestArray, loading, error } = useRequestById(requestId, { enabled: !!requestId });
  const request = Array.isArray(requestArray) ? requestArray[0] : requestArray;
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  if (!requestId) {
    return <Typography color="error">Request id is missing from the URL.</Typography>;
  }

  if (loading) {
    return (
      <Box className="p-8 text-center">
        <CircularProgress />
        <Typography mt={2}>Loading request...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">Failed to load request: {String(error)}</Typography>;
  }

  if (!request) {
    return <Typography>No request found with id {requestId}</Typography>;
  }

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Paper sx={{ maxWidth: 1024, mx: 'auto', bgcolor: '#f9fafb', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        <ModalHeader 
          title={`Job Docket: ${request.problem_category ? request.problem_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Request'}`} 
          subtitle={`ID: ${request.id}`} 
          onClose={() => { window.history.back(); }}
          actions={<RequestActions request={request} isAdmin={isAdmin} currentStatus={request.status} isUpdating={false} onStatusChange={() => {}} />}
          statusColor={undefined}
        />

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <CustomerInfoSection
                mode="view"
                initialAddress={request.service_address}
                isAdmin={isAdmin}
                request={request}
                showCustomerInfo={true}
                canEdit={isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RequestProblemDetails request={request} />
            </Grid>
            <Grid item xs={12}>
              <QuoteList
                request={request}
                isReadOnly={!isAdmin}
                isUpdating={false}
                onAcceptQuote={() => { console.log('Accept quote called from RequestView (noop)'); }}
                onUpdateRequest={() => { /* noop for read-only view */ }}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default RequestView;
