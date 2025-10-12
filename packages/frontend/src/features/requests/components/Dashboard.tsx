// packages/frontend/src/features/requests/components/Dashboard.tsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip, Button, ButtonGroup, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestDetailModal from './RequestDetailModal';
import PipelineView from './PipelineView';
import { AlertTriangle, Map, Table, Siren, CalendarDays } from 'lucide-react';
import { getRequestStatusChipColor, getRequestStatusPinColor } from '../../../lib/statusColors';
import statusColors from '../../../lib/statusColors.json';
import { QuoteRequest, Quote } from '../types';
import MapView from '../../admin/components/MapView';
import { useRealtimeInvalidation } from '../../../hooks/useSupabaseRealtimeV3';

interface DashboardProps {
  requests: QuoteRequest[];
  loading: boolean;
  error: string | null;
  refreshRequests: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ requests: allRequests, loading, error, refreshRequests }) => {
  const { profile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('all');
  const [activePipelineStage, setActivePipelineStage] = useState<string | null>(null);
  const [pipelineFilterStatuses, setPipelineFilterStatuses] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [isEmergencyFilter, setIsEmergencyFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const dataGridRef = useRef<HTMLDivElement>(null);

  // Enable centralized real-time invalidation for admin dashboard
  useRealtimeInvalidation();

  useEffect(() => {
    console.log('📊 Dashboard: allRequests prop updated', {
      requestCount: allRequests.length,
      requestStatuses: allRequests.map(r => ({ id: r.id, status: r.status, hasQuotes: r.quotes?.length || 0 })),
      timestamp: new Date().toISOString()
    });

    if (selectedRequest && allRequests.length > 0) {
      const newRequestData = allRequests.find(r => r.id === selectedRequest.id);
      if (newRequestData) {
        console.log('📊 Dashboard: updating selectedRequest', {
          id: newRequestData.id,
          oldStatus: selectedRequest.status,
          newStatus: newRequestData.status,
          timestamp: new Date().toISOString()
        });
        setSelectedRequest(newRequestData);
      }
    }
  }, [allRequests, selectedRequest?.id]);

  const filteredRequests = useMemo(() => {
    let requests = allRequests;

    // Apply pipeline stage filter if active (takes precedence)
    if (pipelineFilterStatuses.length > 0) {
      requests = requests.filter(request => 
        pipelineFilterStatuses.includes(request.status)
      );
    }
    // Otherwise apply single status filter from chips
    else if (activeFilterStatus !== 'all') {
      requests = requests.filter(request => request.status === activeFilterStatus);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

      requests = requests.filter(request => {
        const scheduledDate = request.scheduled_start_date ? new Date(request.scheduled_start_date) : null;

        switch (dateFilter) {
          case 'today':
            return scheduledDate && scheduledDate.toDateString() === today.toDateString();
          case 'week':
            return scheduledDate && scheduledDate >= weekStart && scheduledDate <= weekEnd;
          case 'unscheduled':
            return request.status === 'accepted' && !scheduledDate;
          case 'overdue':
            return scheduledDate && scheduledDate < today && request.status !== 'completed';
          default:
            return true;
        }
      });
    }

    // Then, apply emergency filter on top
    if (isEmergencyFilter) {
      requests = requests.filter(request => request.is_emergency === true);
    }

    return requests;
  }, [allRequests, activeFilterStatus, pipelineFilterStatuses, dateFilter, isEmergencyFilter]);

  // Add data-request-id attributes to DataGrid rows for integration testing
  useEffect(() => {
    console.log('🔍 DataGrid useEffect running:', {
      hasRef: !!dataGridRef.current,
      requestCount: filteredRequests.length,
      viewMode
    });

    if (dataGridRef.current && filteredRequests.length > 0) {
      const rows = dataGridRef.current.querySelectorAll('[role="row"]');
      console.log(`🔍 Found ${rows.length} rows in DataGrid`);

      rows.forEach((row, index) => {
        if (index > 0 && filteredRequests[index - 1]) { // Skip header row
          const requestId = filteredRequests[index - 1].id;
          row.setAttribute('data-request-id', requestId);
          console.log(`✅ Added data-request-id="${requestId}" to row ${index}`);
        }
      });
    }
  }, [filteredRequests, viewMode]);

  const handleRowClick = (params: any) => {
    const fullRequestData = allRequests.find(r => r.id === params.id);
    if (fullRequestData) {
      setSelectedRequest(fullRequestData);
      setIsModalOpen(true);
    }
  };

  const handleModalUpdate = useCallback(() => {
    refreshRequests();
  }, [refreshRequests]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleStageClick = useCallback((stageId: string, statuses: string[]) => {
    // If clicking the same stage, clear filter to show all
    if (activePipelineStage === stageId) {
      setActivePipelineStage(null);
      setPipelineFilterStatuses([]);
      setActiveFilterStatus('all');
    } else {
      // Set active stage and filter to ALL statuses in the stage's array
      setActivePipelineStage(stageId);
      setPipelineFilterStatuses(statuses);
      setActiveFilterStatus('all'); // Clear chip filter when using pipeline
    }
  }, [activePipelineStage]);

  const allStatuses = [
    'all', 
    'new', 
    'viewed', 
    'quoted', 
    'accepted', 
    'scheduled', 
    'in_progress', 
    'completed', 
    'invoiced', 
    'paid', 
    'overdue', 
    'disputed', 
    'cancelled'
  ];

  const columns: GridColDef[] = [
    // 1. STATUS: Most important workflow state.
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value || 'default';
        const color = statusColors[status as keyof typeof statusColors] || statusColors.default;
        // Determine text color based on background for better contrast
        const textColor = ['#FBC02D', '#F57C00'].includes(color) ? '#000' : '#fff';

        return (
          <Chip
            label={params.value || 'N/A'}
            size="small"
            sx={{
              textTransform: 'capitalize',
              fontWeight: 'bold',
              backgroundColor: color,
              color: textColor,
            }}
          />
        );
      },
    },
    // 2. PRIORITY: AI-generated score for triage.
    {
      field: 'priority_score',
      headerName: 'Priority',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        params.value == null
          ? <Typography variant="body2" color="text.secondary">—</Typography>
          : <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
      )
    },
    // 3. URGENCY: Clear visual flag for emergencies.
    {
      field: 'is_emergency',
      headerName: 'Urgency',
      width: 120,
      renderCell: (params) => (
        params.value
          ? <Chip icon={<AlertTriangle size={14} />} label="Emergency" color="error" size="small" variant="outlined" />
          : null
      ),
    },
    // 4. CUSTOMER NAME: Essential context.
    {
      field: 'customer_name',
      headerName: 'Customer Name',
      width: 180,
      valueGetter: (value, row) => row.user_profiles?.name || row.customer_name || 'N/A',
    },
    // 5. REQUEST TYPE: What is the job?
    {
      field: 'problem_category',
      headerName: 'Request Type',
      width: 180,
      valueFormatter: (value) => value ? String(value).replace(/_/g, " ").replace(/\b\w/g, (l:string) => l.toUpperCase()) : 'N/A',
    },
    // 6. RECEIVED DATE: How old is the lead?
    {
      field: 'created_at',
      headerName: 'Received',
      width: 180,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value) => value ? new Date(value).toLocaleString() : '',
    },
    // 7. SCHEDULED DATE: When is the job scheduled?
    {
      field: 'scheduled_start_date',
      headerName: 'Scheduled',
      width: 180,
      type: 'dateTime',
      valueGetter: (value, row) => {
        // Only show scheduled date if status is 'scheduled' or 'accepted' with a date
        if (row.status === 'scheduled' && value) {
          return new Date(value);
        }
        if (row.status === 'accepted' && value) {
          return new Date(value);
        }
        return null;
      },
      valueFormatter: (value) => value ? new Date(value).toLocaleString() : '',
      renderCell: (params) => {
        const scheduledDate = params.value;
        if (!scheduledDate) {
          // Show different text based on status
          const status = params.row.status;
          if (status === 'accepted') {
            return <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>Needs Scheduling</Typography>;
          }
          return <Typography variant="body2" color="text.secondary">—</Typography>;
        }
        return <Typography variant="body2">{new Date(scheduledDate).toLocaleString()}</Typography>;
      }
    },
    // 8. ADDRESS: Geographic context. Takes remaining space.
    {
      field: 'service_address',
      headerName: 'Address',
      flex: 1
    },
  ];

  if (loading && allRequests.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!profile || profile.role !== 'admin') return <Box sx={{ p: 4 }}><Typography>Access Denied. You must be an administrator to view this page.</Typography></Box>;
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <>
      <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: '1200px', margin: 'auto' }}>
          {/* Main Dashboard Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Plumber's Command Center
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Date Filter */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="date-filter-label">Schedule</InputLabel>
                <Select
                  labelId="date-filter-label"
                  value={dateFilter}
                  label="Schedule"
                  onChange={(e) => setDateFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarDays size={16} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Scheduled Today</MenuItem>
                  <MenuItem value="week">Scheduled This Week</MenuItem>
                  <MenuItem value="unscheduled">Unscheduled (Accepted)</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>

              {/* Emergency Toggle */}
              <FormControlLabel
                control={<Switch checked={isEmergencyFilter} onChange={(e) => setIsEmergencyFilter(e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Siren size={16} />
                    Emergencies Only
                  </Box>
                }
              />
              
              <ButtonGroup variant="outlined" size="small">
                <Button
                  startIcon={<Table size={16} />}
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </Button>
                <Button
                  startIcon={<Map size={16} />}
                  variant={viewMode === 'map' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('map')}
                >
                  Map
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          {/* Pipeline Workflow Visualization */}
          <Box sx={{ mb: 3 }}>
            <PipelineView
              requests={filteredRequests}
              activeStage={activePipelineStage}
              onStageClick={handleStageClick}
              activeFilterStatus={activeFilterStatus}
              onStatusClick={(status) => {
                setActiveFilterStatus(status);
                setPipelineFilterStatuses([status]);
              }}
            />
            
            {/* Clear Filters Button - Only show when filters are active */}
            {(activePipelineStage || activeFilterStatus !== 'all' || dateFilter !== 'all' || isEmergencyFilter) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setActivePipelineStage(null);
                    setPipelineFilterStatuses([]);
                    setActiveFilterStatus('all');
                    setDateFilter('all');
                    setIsEmergencyFilter(false);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>

          {viewMode === 'table' ? (
            <Paper ref={dataGridRef} sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredRequests}
                columns={columns}
                getRowId={(row) => row.id}
                onRowClick={handleRowClick}
                disableColumnFilter={false}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
                }}
                pageSizeOptions={[10, 25, 50]}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#e3f2fd',
                    fontSize: '1rem'
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 'bold'
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '60px !important', // Increase row height
                    '&:hover': {
                      cursor: 'pointer',
                      backgroundColor: '#f0f7ff'
                    }
                  },
                  '& .MuiDataGrid-cell': {
                    padding: '12px 16px', // Add more padding to cells
                  }
                }}
              />
            </Paper>
          ) : (
            <MapView
              requests={filteredRequests}
              onRequestSelect={(request) => {
                setSelectedRequest(request);
                setIsModalOpen(true);
              }}
            />
          )}
        </Box>
      </Box>
      {selectedRequest && ( 
        <RequestDetailModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          request={selectedRequest} 
          onUpdateRequest={handleModalUpdate}
        /> 
      )}
    </>
  );
};

export default Dashboard;