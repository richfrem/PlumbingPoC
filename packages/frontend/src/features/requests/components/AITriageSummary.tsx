// packages/frontend/src/features/requests/components/AITriageSummary.tsx

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Zap } from 'lucide-react';
import { QuoteRequest } from '../types';

interface AITriageSummaryProps {
  request: QuoteRequest;
}

const AITriageSummary: React.FC<AITriageSummaryProps> = ({ request }) => {
  // This component only renders if the triage summary exists.
  if (!request.triage_summary) {
    return null;
  }

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 2, borderLeft: 4, borderColor: 'purple.400', bgcolor: 'purple.50' }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Zap size={16} /> AI Triage Summary
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {request.triage_summary}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Priority Score: {request.priority_score}/10
        </Typography>
        {request.priority_explanation && (
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            Explanation: {request.priority_explanation}
          </Typography>
        )}
        {request.profitability_score != null && (
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
            Profitability Score: {request.profitability_score}/10
          </Typography>
        )}
        {request.profitability_explanation && (
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            Explanation: {request.profitability_explanation}
          </Typography>
        )}
        {request.required_expertise && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Required Expertise: {request.required_expertise.skill_level?.charAt(0).toUpperCase() + request.required_expertise.skill_level?.slice(1)}
            </Typography>
            {request.required_expertise.specialized_skills && request.required_expertise.specialized_skills.length > 0 && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Specialized Skills: {request.required_expertise.specialized_skills.join(', ')}
              </Typography>
            )}
            {request.required_expertise.reasoning && (
              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                Reasoning: {request.required_expertise.reasoning}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default AITriageSummary;