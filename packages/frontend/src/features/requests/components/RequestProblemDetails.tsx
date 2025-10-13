// packages/frontend/src/features/requests/components/RequestProblemDetails.tsx

import React from 'react';
import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { QuoteRequest } from '../types';

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
  // Look for various description questions (most workflows have one)
  const answers = request.answers || [];
  
  const problemDescriptionAnswer = answers.find((a: { question: string; answer: string }) => {
    const q = a.question.toLowerCase();
    return q.includes('describe') || q.includes('detail') || q.includes('issue') || q.includes('problem');
  });
  
  const otherAnswers = answers.filter((a: { question: string; answer: string }) => 
    a !== problemDescriptionAnswer
  );

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 2, borderLeft: 4, borderColor: 'orange.400', bgcolor: 'orange.50' }}>
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
          {otherAnswers.map((ans: { question: string; answer: string }) => (
            <AnswerItem key={ans.question} question={ans.question} answer={ans.answer} />
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default RequestProblemDetails;