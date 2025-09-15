// packages/frontend/src/features/requests/components/CompleteJobModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { CheckCircle } from 'lucide-react';

// Define the shape of the data this modal will send back
interface CompletionData {
  actual_cost: number;
  completion_notes: string;
}

// Define the component's props, including the critical onConfirm function
interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CompletionData) => void; // This function will trigger the API call
  isSubmitting: boolean;
  jobTitle: string;
}

const CompleteJobModal: React.FC<CompleteJobModalProps> = ({ isOpen, onClose, onConfirm, isSubmitting, jobTitle }) => {
  // Internal state to manage the form fields
  const [actualCost, setActualCost] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // Handler for the confirm button click
  const handleConfirm = () => {
    console.log('🔘 CompleteJobModal: Confirm button clicked');
    const data = {
      actual_cost: parseFloat(actualCost) || 0,
      completion_notes: completionNotes,
    };
    console.log('📤 CompleteJobModal: Sending data:', data);
    // THE FIX: Call the onConfirm function passed down from the parent
    // and provide it with the current state of the form.
    onConfirm(data);
  };

  return (
    // Use the MUI Dialog component for a consistent look and feel
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="green" />
          Complete Job: {jobTitle}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
          {/* Use the MUI TextField for consistent input styling */}
          <TextField
            autoFocus
            required
            margin="dense"
            label="Actual Final Cost"
            type="number"
            fullWidth
            variant="outlined"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Internal Completion Notes (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        {/* Use MUI Buttons for consistent actions */}
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="success"
          disabled={isSubmitting || !actualCost}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Completion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteJobModal;