// vite-app/src/components/RequestProblemDetails.tsx

import React from 'react';
import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { QuoteRequest } from './Dashboard'; // Assuming interfaces are in Dashboard.tsx

// This sub-component now lives inside the component that uses it.
const AnswerItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <Grid container spacing={1} sx={{ mb: 1 }}>
    <Grid item xs={12} sm={5}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{question}</Typography>
    </Grid>
    <Grid item xs={12} sm={7}>
      <Typography variant="body1">{answer || 'N/A'}</Typography>
    </Grid>
  </Grid>
);

interface RequestProblemDetailsProps {
  request: QuoteRequest;
}

const RequestProblemDetails: React.FC<RequestProblemDetailsProps> = ({ request }) => {
  // Logic to separate the main description from other Q&A
  const problemDescriptionAnswer = request.answers.find(a => a.question.toLowerCase().includes('describe the general problem'));
  const otherAnswers = request.answers.filter(a => !a.question.toLowerCase().includes('describe the general problem'));

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 2, borderLeft: 4, borderColor: 'warning.main', bgcolor: '#fff3e0' }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle size={16} /> Reported Problem
        </Typography>
        <Typography variant="body1" sx={{ fontStyle: 'italic', mt: 1 }}>
          "{problemDescriptionAnswer?.answer || 'N/A'}"
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {otherAnswers.map(ans => (
            <AnswerItem key={ans.question} question={ans.question} answer={ans.answer} />
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default RequestProblemDetails;