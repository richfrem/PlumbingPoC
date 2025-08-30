// vite-app/src/components/CustomerInfoSection.tsx

import React from 'react';
import { Box, Typography, Paper, TextField, Button, Grid } from '@mui/material';
import { User } from 'lucide-react';

interface CustomerInfoSectionProps {
  request: any; // Full request object which should include user_profiles
  isAdmin: boolean;
  isDateEditable?: boolean;
  scheduledStartDate?: string | null; // Changed to allow null
  setScheduledStartDate?: (date: string | null) => void; // Changed to allow null
  currentStatus?: string;
  setCurrentStatus?: (status: string) => void;
  isUpdating?: boolean;
  editable?: boolean;
  goodUntil?: string;
  setGoodUntil?: (date: string) => void;
  loadingRequest?: boolean;
  errorRequest?: string | null;
  onSaveScheduledDate?: () => Promise<void>; // New prop
  scheduledDateChanged?: boolean; // New prop
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  request,
  isAdmin,
  isDateEditable,
  scheduledStartDate,
  setScheduledStartDate,
  currentStatus,
  setCurrentStatus,
  isUpdating,
  editable,
  goodUntil,
  setGoodUntil,
  onSaveScheduledDate, // Destructure new prop
  scheduledDateChanged, // Destructure new prop
}) => {
  const isRequestDetail = setScheduledStartDate !== undefined;
  const customerProfile = request?.user_profiles; // Use the nested object directly.

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><User size={16} /> Customer Info</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</Typography>
          <Typography variant="body1">{customerProfile?.name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Phone</Typography>
          <Button component="a" href={`tel:${customerProfile?.phone}`} size="small" sx={{ p: 0, justifyContent: 'flex-start' }}>{customerProfile?.phone || 'N/A'}</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</Typography>
          <Button component="a" href={`mailto:${customerProfile?.email}`} size="small" sx={{ p: 0, justifyContent: 'flex-start', textTransform: 'none' }}>{customerProfile?.email || 'N/A'}</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Service Address</Typography>
          <Button component="a" href={`https://maps.google.com/?q=${encodeURIComponent(request?.service_address)}`} target="_blank" size="small" sx={{ p: 0, justifyContent: 'flex-start', textAlign: 'left' }}>{request?.service_address || 'N/A'}</Button>
        </Grid>

        {isRequestDetail && isAdmin && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <TextField
                label="Scheduled Work Start"
                type="date"
                value={scheduledStartDate || ''}
                onChange={(e) => {
                  if (setScheduledStartDate) setScheduledStartDate(e.target.value);
                }}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={isUpdating || !(isDateEditable)}
                sx={{ mt: 0.5 }}
              />
              {isDateEditable && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={onSaveScheduledDate}
                  disabled={!scheduledDateChanged || isUpdating}
                  sx={{ whiteSpace: 'nowrap', height: '40px' }} // Adjust height to align with TextField
                >
                  Save
                </Button>
              )}
            </Box>
          </Grid>
        )}

        {!isRequestDetail && (
          <Grid item xs={12} sm={6}>
            <Box>
              <TextField label="Good Until" type="date" value={goodUntil} onChange={e => setGoodUntil && setGoodUntil(e.target.value)} size="small" InputLabelProps={{ shrink: true }} disabled={!editable} sx={{ bgcolor: '#fff', borderRadius: 1 }} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CustomerInfoSection;