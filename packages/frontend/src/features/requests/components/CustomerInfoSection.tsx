// packages/frontend/src/features/requests/components/CustomerInfoSection.tsx

import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, IconButton } from '@mui/material';
import { User, Edit, Check, X } from 'lucide-react';

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
  onAddressUpdate?: (address: string) => void; // New prop for address updates
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
  onAddressUpdate, // New address update prop
}) => {
  const isRequestDetail = setScheduledStartDate !== undefined;
  const customerProfile = request?.user_profiles;

  // State for editing address
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState(request?.service_address || '');

  // Only show the scheduling section if the status is 'accepted' or 'scheduled'
  const canShowScheduling = isAdmin && isRequestDetail && (currentStatus === 'accepted' || currentStatus === 'scheduled');

  // Address editing handlers
  const handleStartEditingAddress = () => {
    setEditedAddress(request?.service_address || '');
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (onAddressUpdate && editedAddress.trim() !== request?.service_address) {
      onAddressUpdate(editedAddress.trim());
    }
    setIsEditingAddress(false);
  };

  const handleCancelEditingAddress = () => {
    setEditedAddress(request?.service_address || '');
    setIsEditingAddress(false);
  };

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
        {canShowScheduling ? (
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
        ) : (
             <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Service Address</Typography>
                {isEditingAddress ? (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
                    <TextField
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      disabled={isUpdating}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={handleSaveAddress}
                        disabled={isUpdating || !editedAddress.trim()}
                        color="success"
                      >
                        <Check size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancelEditingAddress}
                        disabled={isUpdating}
                        color="error"
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      component="a"
                      href={`https://maps.google.com/?q=${encodeURIComponent(request?.service_address)}`}
                      target="_blank"
                      size="small"
                      sx={{ p: 0, justifyContent: 'flex-start', textAlign: 'left', flex: 1 }}
                    >
                      {request?.service_address || 'N/A'}
                    </Button>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={handleStartEditingAddress}
                        disabled={isUpdating}
                        sx={{ ml: 1 }}
                      >
                        <Edit size={14} />
                      </IconButton>
                    )}
                  </Box>
                )}
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