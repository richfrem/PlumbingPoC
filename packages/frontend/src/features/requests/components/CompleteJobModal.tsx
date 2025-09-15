// packages/frontend/src/features/requests/components/CompleteJobModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import { CheckCircle } from 'lucide-react';

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { actual_cost: number; completion_notes: string }) => void;
  jobTitle: string;
  isSubmitting?: boolean;
}

const CompleteJobModal: React.FC<CompleteJobModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  isSubmitting = false,
}) => {
  const [actualCost, setActualCost] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const handleSubmit = () => {
    const cost = parseFloat(actualCost);
    if (isNaN(cost) || cost < 0) {
      return; // Could add validation feedback here
    }

    onConfirm({
      actual_cost: cost,
      completion_notes: completionNotes.trim(),
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setActualCost('');
      setCompletionNotes('');
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pb: 1
      }}>
        <CheckCircle size={24} color="#4caf50" />
        Complete Job: {jobTitle}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          label="Actual Final Cost"
          type="number"
          value={actualCost}
          onChange={(e) => setActualCost(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          disabled={isSubmitting}
          autoFocus
        />

        <TextField
          label="Internal Completion Notes (Optional)"
          multiline
          rows={4}
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Add any internal notes about the job completion..."
          disabled={isSubmitting}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !actualCost || parseFloat(actualCost) < 0}
          variant="contained"
          color="success"
        >
          {isSubmitting ? 'Completing...' : 'Confirm Completion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteJobModal;