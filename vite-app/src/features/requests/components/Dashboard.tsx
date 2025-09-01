// vite-app/src/features/requests/components/Dashboard.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestDetailModal from './RequestDetailModal';
import { AlertTriangle } from 'lucide-react';
import { getRequestStatusChipColor } from '../../../lib/statusColors';
import { useRequests } from '../hooks/useRequests';
import { QuoteRequest, Quote } from '../types';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { requests: allRequests, loading, error, refreshRequests } = useRequests();
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('all');

  // *** THE DEFINITIVE FIX: State Synchronization Effect ***
  // This effect listens for changes in the main `allRequests` array.
  // If a modal is open (`selectedRequest` has an ID), it finds the NEW version
  // of that request in the updated array and forces the `selectedRequest` state
  // to be updated. This ensures the modal always receives the freshest data.
  useEffect(() => {
    if (selectedRequest && allRequests.length > 0) {
      const newRequestData = allRequests.find(r => r.id === selectedRequest.id);
      if (newRequestData) {
        setSelectedRequest(newRequestData);
      }
    }
  }, [allRequests, selectedRequest?.id]); // Dependency array is stable and correct

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
    { field: 'triage_summary', headerName: 'Triage Summary', flex: 1 },
    { field: 'is_emergency', headerName: 'Urgency', width: 120,
      renderCell: (params) => ( params.value ? ( <Chip icon={<AlertTriangle size={14} />} label="Emergency" color="error" size="small" variant="outlined" /> ) : null ),
    },
    { field: 'problem_category', headerName: 'Request Type', width: 180,
      valueFormatter: (value) => value ? String(value).replace(/_/g, " ").replace(/\b\w/g, (l:string) => l.toUpperCase()) : 'N/A'
    },
    { field: 'customer_name', headerName: 'Customer Name', width: 180,
      valueGetter: (value, row) => row.user_profiles?.name || row.customer_name || 'N/A'
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Plumber's Command Center
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {allStatuses.map(status => ( <Chip key={status} label={status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} onClick={() => setActiveFilterStatus(status)} color={status === 'all' ? 'default' : getRequestStatusChipColor(status)} variant={activeFilterStatus === status ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} /> ))}
          </Box>
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid rows={filteredRequests} columns={columns} onRowClick={handleRowClick} initialState={{ pagination: { paginationModel: { pageSize: 10 } }, sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] }, }} pageSizeOptions={[10, 25, 50]} sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#e3f2fd', fontSize: '1rem' }, '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' }, '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: '#f0f7ff' } }} />
          </Paper>
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