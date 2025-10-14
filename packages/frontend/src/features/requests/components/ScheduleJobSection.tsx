// packages/frontend/src/features/requests/components/ScheduleJobSection.tsx

import React from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { Calendar, Save } from 'lucide-react';

interface ScheduleJobSectionProps {
  scheduledDate: string;
  onDateChange: (date: string) => void;
  onSaveSchedule: () => void;
  isUpdating: boolean;
  dateChanged: boolean;
}

const ScheduleJobSection: React.FC<ScheduleJobSectionProps> = ({
  scheduledDate,
  onDateChange,
  onSaveSchedule,
  isUpdating,
  dateChanged
}) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Calendar size={20} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Schedule Job
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Set the date when this job should be scheduled. The customer will be notified of the scheduled date.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Scheduled Date"
          type="date"
          value={scheduledDate}
          onChange={(e) => onDateChange(e.target.value)}
          fullWidth
          size="small"
          InputLabelProps={{
            shrink: true,
          }}
          disabled={isUpdating}
        />

        {scheduledDate && (
          <Alert severity="info" sx={{ mb: 1 }}>
            Ready to schedule job for {new Date(scheduledDate).toLocaleDateString()}. Click "Schedule Job" to confirm.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onSaveSchedule}
            disabled={isUpdating || !scheduledDate}
            startIcon={<Save size={16} />}
            sx={{ minWidth: 140 }}
          >
            {isUpdating ? 'Scheduling...' : 'Schedule Job'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ScheduleJobSection;
