// vite-app/src/features/requests/components/Dashboard.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip, Button, ButtonGroup } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestDetailModal from './RequestDetailModal';
import { AlertTriangle, Map, Table } from 'lucide-react';
import { getRequestStatusChipColor } from '../../../lib/statusColors';
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

  useEffect(() => {
    if (selectedRequest && allRequests.length > 0) {
      const newRequestData = allRequests.find(r => r.id === selectedRequest.id);
      if (newRequestData) {
        setSelectedRequest(newRequestData);
      }
    }
  }, [allRequests, selectedRequest?.id]);

  const filteredRequests = useMemo(() => {
    if (activeFilterStatus === 'all') return allRequests;
    return allRequests.filter(request => request.status === activeFilterStatus);
  }, [allRequests, activeFilterStatus]);

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
    { field: 'priority_score', headerName: 'Priority', width: 100, type: 'number' },
    {
      field: 'triage_summary',
      headerName: 'Triage Summary',
      flex: 1,
      renderCell: (params) => (
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%'
        }}>
          {params.value || '—'}
        </div>
      )
    },
    { field: 'is_emergency', headerName: 'Urgency', width: 120,
      renderCell: (params) => ( params.value ? ( <Chip icon={<AlertTriangle size={14} />} label="Emergency" color="error" size="small" variant="outlined" /> ) : null ),
    },
    { field: 'problem_category', headerName: 'Request Type', width: 180,
      valueFormatter: (value) => value ? String(value).replace(/_/g, " ").replace(/\b\w/g, (l:string) => l.toUpperCase()) : 'N/A',
      renderCell: (params) => (
        <span style={{ fontWeight: 500 }}>
          {params.formattedValue}
        </span>
      )
    },
    { field: 'customer_name', headerName: 'Customer Name', width: 180,
      valueGetter: (value, row) => row.user_profiles?.name || row.customer_name || 'N/A',
      renderCell: (params) => (
        <span style={{ fontWeight: 500 }}>
          {params.value}
        </span>
      )
    },
    { field: 'created_at', headerName: 'Received', width: 180, type: 'dateTime', valueGetter: (value) => value ? new Date(value) : null },
    { field: 'quote_amount', headerName: 'Quote Amount', width: 130, type: 'number',
      valueGetter: (value, row) => row.quotes?.sort((a: Quote, b: Quote) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.quote_amount,
      renderCell: (params) => params.value != null ? `${params.value.toFixed(2)}` : '—'
    },
    { field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => ( <Chip label={params.value || 'N/A'} color={getRequestStatusChipColor(params.value)} size="small" sx={{ textTransform: 'capitalize' }}/> )
    },
    { field: 'service_address', headerName: 'Address', flex: 1 },
  ];

  if (loading && allRequests.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!profile || profile.role !== 'admin') return <Box sx={{ p: 4 }}><Typography>Access Denied. You must be an administrator to view this page.</Typography></Box>;
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <>
      <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: '1200px', margin: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {allStatuses.map(status => ( <Chip key={status} label={status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} onClick={() => setActiveFilterStatus(status)} color={status === 'all' ? 'default' : getRequestStatusChipColor(status)} variant={activeFilterStatus === status ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} /> ))}
          </Box>
          {viewMode === 'table' ? (
            <Paper sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredRequests}
                columns={columns}
                onRowClick={handleRowClick}
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