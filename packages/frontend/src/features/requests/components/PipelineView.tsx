// packages/frontend/src/features/requests/components/PipelineView.tsx

import React from 'react';
import { Box, Typography, Paper, Badge, Chip, Collapse } from '@mui/material';
import { Inbox, DollarSign, Calendar, Wrench, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { QuoteRequest } from '../types';
import statusColors from '../../../lib/statusColors.json';

interface PipelineStage {
  id: string;
  label: string;
  statuses: string[];
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

interface PipelineViewProps {
  requests: QuoteRequest[];
  activeStage: string | null;
  onStageClick: (stageId: string, statuses: string[]) => void;
  activeFilterStatus?: string;
  onStatusClick?: (status: string) => void;
}

const PipelineView: React.FC<PipelineViewProps> = ({ 
  requests, 
  activeStage, 
  onStageClick,
  activeFilterStatus = 'all',
  onStatusClick
}) => {
  const stages: PipelineStage[] = [
    {
      id: 'intake',
      label: 'Intake',
      statuses: ['new'],
      icon: <Inbox size={18} />,
      color: '#3B82F6', // Blue
      textColor: '#fff'
    },
    {
      id: 'quoting',
      label: 'Quoting',
      statuses: ['viewed', 'quoted'],
      icon: <DollarSign size={18} />,
      color: '#8B5CF6', // Purple
      textColor: '#fff'
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      statuses: ['accepted', 'scheduled'],
      icon: <Calendar size={18} />,
      color: '#10B981', // Green
      textColor: '#fff'
    },
    {
      id: 'active',
      label: 'Active',
      statuses: ['in_progress'],
      icon: <Wrench size={18} />,
      color: '#F59E0B', // Orange
      textColor: '#fff'
    },
    {
      id: 'billing',
      label: 'Billing',
      statuses: ['completed', 'invoiced'],
      icon: <FileText size={18} />,
      color: '#14B8A6', // Teal
      textColor: '#fff'
    },
    {
      id: 'paid',
      label: 'Paid',
      statuses: ['paid'],
      icon: <CheckCircle size={18} />,
      color: '#22C55E', // Success Green
      textColor: '#fff'
    },
    {
      id: 'issues',
      label: 'Issues',
      statuses: ['overdue', 'disputed'],
      icon: <AlertTriangle size={18} />,
      color: '#EF4444', // Red
      textColor: '#fff'
    }
  ];

  // Calculate count for each stage
  const getStageCount = (statuses: string[]) => {
    return requests.filter(req => statuses.includes(req.status)).length;
  };

  // Helper to create light tint of a color (15% opacity)
  const getLightTint = (hexColor: string) => {
    // Convert hex to rgba with 15% opacity
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          Pipeline Overview
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', position: 'relative' }}>
        {stages.map((stage, idx) => {
          const count = getStageCount(stage.statuses);
          const isActive = activeStage === stage.id;
          const isInactive = count === 0 && !isActive;

          return (
            <Box
              key={stage.id}
              onClick={() => onStageClick(stage.id, stage.statuses)}
              sx={{
                flex: 1,
                py: 2,
                px: 2,
                bgcolor: isActive ? stage.color : isInactive ? 'grey.100' : getLightTint(stage.color),
                color: isActive ? stage.textColor : stage.color,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRight: idx < stages.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                // Chevron shape using pseudo-elements
                '&::after': idx < stages.length - 1 ? {
                  content: '""',
                  position: 'absolute',
                  right: '-12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderTop: '24px solid transparent',
                  borderBottom: '24px solid transparent',
                  borderLeft: `12px solid ${isActive ? stage.color : isInactive ? '#f5f5f5' : getLightTint(stage.color)}`,
                  zIndex: 1,
                  filter: 'drop-shadow(1px 0 1px rgba(0, 0, 0, 0.15))',
                } : {},
                // Add subtle shadow to the entire box for depth
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  bgcolor: stage.color,
                  color: stage.textColor,
                  opacity: 0.9,
                  '&::after': {
                    borderLeftColor: stage.color,
                  }
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                {stage.icon}
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {stage.label}
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  mt: 0.5,
                  opacity: isInactive ? 0.5 : 1
                }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Expandable Status Chips for Active Stage */}
      {activeStage && onStatusClick && (
        <Collapse in={!!activeStage}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mr: 1 }}>
              Filter {stages.find(s => s.id === activeStage)?.label}:
            </Typography>
            {stages.find(s => s.id === activeStage)?.statuses.map(status => (
              <Chip
                key={status}
                label={status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                size="small"
                onClick={() => onStatusClick(status)}
                variant={activeFilterStatus === status ? 'filled' : 'outlined'}
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: activeFilterStatus === status ? 'bold' : 'normal',
                  borderColor: statusColors[status as keyof typeof statusColors] || 'grey.400',
                  ...(activeFilterStatus === status && {
                    bgcolor: statusColors[status as keyof typeof statusColors],
                    color: ['#FBC02D', '#F57C00'].includes(statusColors[status as keyof typeof statusColors]) ? '#000' : '#fff',
                  }),
                  ...( activeFilterStatus !== status && {
                    color: statusColors[status as keyof typeof statusColors],
                  }),
                }}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default PipelineView;
