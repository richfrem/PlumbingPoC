// packages/frontend/src/features/requests/components/CustomerInfoSection.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Grid, Button } from '@mui/material';
import { User } from 'lucide-react';

interface CustomerInfoSectionProps {
  request: any;
  isAdmin: boolean;
  isDateEditable?: boolean;
  scheduledStartDate?: string | null; // Allow null
  setScheduledStartDate?: (date: string) => void;
  currentStatus?: string;
  setCurrentStatus?: (status: string) => void;
  isUpdating?: boolean;
  editable?: boolean; // For QuoteFormModal
  goodUntil?: string; // For QuoteFormModal
  setGoodUntil?: (date: string) => void; // For QuoteFormModal
  onDateChange?: (date: string) => void; // New prop for streamlined workflow
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
  onDateChange, // New streamlined prop
}) => {
  const isRequestDetail = setScheduledStartDate !== undefined;
  const customerProfile = request?.user_profiles;

  // Only show the scheduling section if the status is 'accepted' or 'scheduled'
  const canShowScheduling = isAdmin && isRequestDetail && (currentStatus === 'accepted' || currentStatus === 'scheduled');

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

        {/* Conditional rendering for the date input */}
        {canShowScheduling && (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Scheduled Work Start</Typography>
            <TextField
              type="date"
              value={scheduledStartDate ? scheduledStartDate.split('T')[0] : ''}
              onChange={(e) => {
                if (setScheduledStartDate) setScheduledStartDate(e.target.value);
                // Streamlined workflow: when date is selected, automatically set status to scheduled
                if (e.target.value && currentStatus === 'accepted' && setCurrentStatus) {
                  setCurrentStatus('scheduled');
                }
                // Notify parent of date change for dynamic footer
                if (onDateChange) onDateChange(e.target.value);
              }}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={isUpdating}
              sx={{ mt: 0.5 }}
            />
          </Grid>
        )}

        {/* This is for the QuoteFormModal, which doesn't show the scheduled date */}
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