// packages/frontend/src/features/requests/components/RequestActions.tsx

import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Chip } from '@mui/material';
import { Phone, CheckCircle } from 'lucide-react';
import { QuoteRequest } from '../types';
import { getRequestStatusChipColor, getRequestStatusPinColor } from '../../../lib/statusColors';

interface RequestActionsProps {
  request: QuoteRequest;
  isAdmin: boolean;
  currentStatus: string;
  isUpdating: boolean;
  onStatusChange: (newStatus: string) => void;
  scheduledDateChanged?: boolean;
  onSaveAndSchedule?: () => void;
  onMarkCompleted?: () => void;
}

const RequestActions: React.FC<RequestActionsProps> = ({
  request,
  isAdmin,
  currentStatus,
  isUpdating,
  onStatusChange,
  scheduledDateChanged = false,
  onSaveAndSchedule,
  onMarkCompleted
}) => {
  return (
    <>
      <Typography component="div" variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Status: <Chip label={currentStatus} color={getRequestStatusChipColor(currentStatus)} size="small" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} />
      </Typography>

      {isAdmin && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {currentStatus === 'scheduled' ? (
            // STATE 1: Scheduled job - show "Start Job" button to mark as in_progress
            <Button
              variant="contained"
              color="primary"
              onClick={() => onStatusChange('in_progress')}
              disabled={isUpdating}
              startIcon={<CheckCircle size={16} />}
            >
              Start Job
            </Button>
          ) : currentStatus === 'in_progress' ? (
            // STATE 2: In progress job - show "Mark as Completed" button
            <Button
              variant="contained"
              color="success"
              onClick={onMarkCompleted}
              disabled={isUpdating}
              startIcon={<CheckCircle size={16} />}
            >
              Mark as Completed
            </Button>
          ) : scheduledDateChanged ? (
            // STATE 3: Date has been changed, show the primary action button
            <Button
              variant="contained"
              color="success"
              onClick={onSaveAndSchedule}
              disabled={isUpdating}
            >
              Save & Schedule
            </Button>
          ) : (
            // STATE 4: Default view with status dropdown (for new, viewed, quoted, accepted, etc.)
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Update Status</InputLabel>
              <Select
                value={currentStatus}
                label="Update Status"
                onChange={(e) => onStatusChange(e.target.value as string)}
                disabled={isUpdating || request.status === 'completed'}
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="viewed">Viewed</MenuItem>
                <MenuItem value="quoted">Quoted</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          )}
          <Button
            variant="outlined"
            component="a"
            href={`tel:${request.user_profiles?.phone}`}
            disabled={!request.user_profiles?.phone}
            startIcon={<Phone />}
          >
            Call Customer
          </Button>
        </Box>
      )}
    </>
  );
};

export default RequestActions;