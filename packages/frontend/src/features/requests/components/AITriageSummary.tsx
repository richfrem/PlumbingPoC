// packages/frontend/src/features/requests/components/AITriageSummary.tsx

import React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';
import { Zap, TrendingUp, Award } from 'lucide-react';
import { QuoteRequest } from '../types';

interface AITriageSummaryProps {
  request: QuoteRequest;
}

// Helper function to determine priority color (Chip compatible)
const getPriorityColorChip = (score: number | null): 'default' | 'error' | 'warning' | 'success' | 'info' => {
  if (score === null) return 'default';
  if (score >= 8) return 'error';    // Red for high priority (8-10)
  if (score >= 5) return 'warning';  // Orange for medium priority (5-7)
  return 'success';                  // Green for low priority (1-4)
};

// Helper function for LinearProgress (no 'default' option)
const getPriorityColorProgress = (score: number | null): 'error' | 'warning' | 'success' | 'info' | 'inherit' => {
  if (score === null) return 'inherit';
  if (score >= 8) return 'error';    // Red for high priority (8-10)
  if (score >= 5) return 'warning';  // Orange for medium priority (5-7)
  return 'success';                  // Green for low priority (1-4)
};

// Helper function to determine profitability color (Chip compatible)
const getProfitabilityColorChip = (score: number | null): 'default' | 'error' | 'warning' | 'success' | 'info' => {
  if (score === null) return 'default';
  if (score >= 8) return 'success';  // Green for high profit (8-10)
  if (score >= 5) return 'info';     // Blue for medium profit (5-7)
  return 'warning';                  // Orange for low profit (1-4)
};

// Helper function for LinearProgress (no 'default' option)
const getProfitabilityColorProgress = (score: number | null): 'error' | 'warning' | 'success' | 'info' | 'inherit' => {
  if (score === null) return 'inherit';
  if (score >= 8) return 'success';  // Green for high profit (8-10)
  if (score >= 5) return 'info';     // Blue for medium profit (5-7)
  return 'warning';                  // Orange for low profit (1-4)
};

// Helper function to determine expertise color
const getExpertiseColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'master': return 'error';     // Red for master
    case 'journeyman': return 'warning'; // Orange for journeyman
    case 'apprentice': return 'info';   // Blue for apprentice
    default: return 'default';
  }
};

const AITriageSummary: React.FC<AITriageSummaryProps> = ({ request }) => {
  // This component only renders if the triage summary exists.
  if (!request.triage_summary) {
    return null;
  }

  // Determine background and border color based on priority
  const getBackgroundColors = () => {
    const score = request.priority_score;
    if (score === null) return { 
      headerBg: 'grey.100', 
      contentBg: 'grey.50', 
      borderColor: 'grey.400' 
    };
    if (score >= 8) return { 
      headerBg: 'error.100', 
      contentBg: 'error.50', 
      borderColor: 'error.400' 
    };
    if (score >= 5) return { 
      headerBg: 'warning.100', 
      contentBg: 'warning.50', 
      borderColor: 'warning.400' 
    };
    return { 
      headerBg: 'success.100', 
      contentBg: 'success.50', 
      borderColor: 'success.400' 
    };
  };

  const { headerBg, contentBg, borderColor } = getBackgroundColors();

  return (
    <Paper variant="outlined">
      {/* Header Section - Darker background */}
      <Box sx={{ 
        p: 2, 
        borderLeft: 4, 
        borderColor, 
        bgcolor: headerBg,
        borderBottom: 1,
        borderBottomColor: 'divider'
      }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <Zap size={16} /> AI TRIAGE SUMMARY
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {request.triage_summary}
        </Typography>
      </Box>

      {/* Content Section - Lighter background */}
      <Box sx={{ p: 2, bgcolor: contentBg }}>

        {/* Priority Score with visual indicator */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Priority Score:
            </Typography>
            <Chip 
              label={`${request.priority_score}/10`}
              color={getPriorityColorChip(request.priority_score)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(request.priority_score || 0) * 10} 
            color={getPriorityColorProgress(request.priority_score)}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {request.priority_explanation && (
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
              {request.priority_explanation}
            </Typography>
          )}
        </Box>

        {/* Profitability Score with visual indicator */}
        {request.profitability_score != null && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <TrendingUp size={16} />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Profitability Score:
              </Typography>
              <Chip 
                label={`${request.profitability_score}/10`}
                color={getProfitabilityColorChip(request.profitability_score)}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(request.profitability_score || 0) * 10} 
              color={getProfitabilityColorProgress(request.profitability_score)}
              sx={{ height: 8, borderRadius: 1 }}
            />
            {request.profitability_explanation && (
              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                {request.profitability_explanation}
              </Typography>
            )}
          </Box>
        )}

        {/* Required Expertise with badge */}
        {request.required_expertise && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Award size={16} />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Required Expertise:
              </Typography>
              <Chip 
                label={request.required_expertise.skill_level?.charAt(0).toUpperCase() + request.required_expertise.skill_level?.slice(1)}
                color={getExpertiseColor(request.required_expertise.skill_level)}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            {request.required_expertise.specialized_skills && request.required_expertise.specialized_skills.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {request.required_expertise.specialized_skills.map((skill, idx) => (
                  <Chip 
                    key={idx}
                    label={skill}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            )}
            {request.required_expertise.reasoning && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                {request.required_expertise.reasoning}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default AITriageSummary;