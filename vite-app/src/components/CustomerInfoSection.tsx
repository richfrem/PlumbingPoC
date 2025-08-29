// vite-app/src/components/CustomerInfoSection.tsx

import React from 'react';
import { Box, Typography, Paper, TextField, Button, Grid } from '@mui/material';
import { User } from 'lucide-react';

interface CustomerInfoSectionProps {
  request: any; // Full request object which should include user_profiles
  isAdmin: boolean;
  isDateEditable?: boolean;
  scheduledStartDate?: string;
  setScheduledStartDate?: (date: string) => void;
  currentStatus?: string;
  setCurrentStatus?: (status: string) => void;
  isUpdating?: boolean;
  editable?: boolean;
  goodUntil?: string;
  setGoodUntil?: (date: string) => void;
  loadingRequest?: boolean;
  errorRequest?: string | null;
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
}) => {
  // REMOVED: The useEffect hook and local state for customerProfile are gone.
  // We will now use the nested `user_profiles` object directly from the `request` prop.

  const isRequestDetail = setScheduledStartDate !== undefined;
  const customerProfile = request?.user_profiles; // Use the nested object directly.

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><User size={16} /> Customer Info</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {/* CHANGED: Use `customerProfile` derived from the prop, not local state */}
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
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Scheduled Work Start</Typography>
            <TextField
              type="date"
              value={scheduledStartDate}
              onChange={(e) => {
                if (setScheduledStartDate) setScheduledStartDate(e.target.value);
                if (e.target.value && currentStatus === 'accepted' && setCurrentStatus) {
                  setCurrentStatus('scheduled');
                }
              }}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={isUpdating || !(isDateEditable)}
              sx={{ mt: 0.5 }}
            />
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