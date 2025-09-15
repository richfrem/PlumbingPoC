// packages/frontend/src/features/requests/components/Dashboard.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip, Button, ButtonGroup, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestDetailModal from './RequestDetailModal';
import { AlertTriangle, Map, Table, Siren, CalendarDays } from 'lucide-react';
import { getRequestStatusChipColor, getRequestStatusPinColor } from '../../../lib/statusColors';
import statusColors from '../../../lib/statusColors.json';
import { QuoteRequest, Quote } from '../types';
import MapView from '../../admin/components/MapView';

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
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [isEmergencyFilter, setIsEmergencyFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (selectedRequest && allRequests.length > 0) {
      const newRequestData = allRequests.find(r => r.id === selectedRequest.id);
      if (newRequestData) {
        setSelectedRequest(newRequestData);
      }
    }
  }, [allRequests, selectedRequest?.id]);

  const filteredRequests = useMemo(() => {
    let requests = allRequests;

    // Apply status filter first
    if (activeFilterStatus !== 'all') {
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
  }, [allRequests, activeFilterStatus, dateFilter, isEmergencyFilter]);

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

  const allStatuses = ['all', 'new', 'viewed', 'quoted', 'accepted', 'scheduled', 'completed'];

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
    // 7. ADDRESS: Geographic context. Takes remaining space.
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

          {/* New Control Panel for Filters */}
          <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mr: 2, color: 'text.secondary' }}>Filter by status:</Typography>
            {allStatuses.map(status => (
              <Chip
                key={status}
                label={status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                onClick={() => setActiveFilterStatus(status)}
                variant={activeFilterStatus === status ? 'filled' : 'outlined'}
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 'bold',
                  borderColor: status === 'all' ? 'grey.400' : statusColors[status as keyof typeof statusColors],
                  // Apply background and text color ONLY if it's the active filter
                  ...(activeFilterStatus === status && status !== 'all' && {
                    bgcolor: statusColors[status as keyof typeof statusColors],
                    color: ['#FBC02D', '#F57C00'].includes(statusColors[status as keyof typeof statusColors]) ? '#000' : '#fff',
                  }),
                  // Ensure text color is correct for outlined (non-active) state
                  ...(activeFilterStatus !== status && {
                    color: status === 'all' ? 'text.primary' : statusColors[status as keyof typeof statusColors],
                  }),
                }}
              />
            ))}

            {/* Date Filter */}
            <FormControl size="small" sx={{ minWidth: 180, ml: 2 }}>
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
            <Box sx={{ flexGrow: 1 }} /> {/* This pushes the switch to the right */}
            <FormControlLabel
              control={<Switch checked={isEmergencyFilter} onChange={(e) => setIsEmergencyFilter(e.target.checked)} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Siren size={16} style={{ marginRight: '8px', color: '#d32f2f' }} />
                  <Typography variant="body2">Emergencies Only</Typography>
                </Box>
              }
              sx={{ mr: 1, color: 'text.secondary' }}
            />
          </Paper>
          {viewMode === 'table' ? (
            <Paper sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredRequests}
                columns={columns}
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