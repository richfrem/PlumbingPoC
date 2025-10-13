// packages/frontend/src/features/requests/components/ModalHeader.tsx

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { X as XIcon } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  // The 'actions' prop allows us to pass in any button or component, like the "AI Triage" button
  actions?: React.ReactNode;
  // Optional status color to theme the header
  statusColor?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, subtitle, onClose, actions, statusColor }) => {
  // Use status color if provided, otherwise default to grey
  const bgColor = statusColor || 'grey.800';
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      bgcolor: bgColor, 
      color: '#fff', 
      px: 3, 
      py: 2, 
      flexShrink: 0 
    }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {actions}
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <XIcon size={24} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ModalHeader;