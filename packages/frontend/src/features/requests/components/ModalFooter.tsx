// packages/frontend/src/features/requests/components/ModalFooter.tsx

import React from 'react';
import { Box } from '@mui/material';

interface ModalFooterProps {
  children: React.ReactNode; // This allows us to pass any buttons or content into the footer
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        bgcolor: 'grey.50' // Added a slight background color for consistency
      }}
    >
      {children}
    </Box>
  );
};

export default ModalFooter;
