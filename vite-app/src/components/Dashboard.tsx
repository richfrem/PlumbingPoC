// vite-app/src/components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestDetailModal from './RequestDetailModal';
import { AlertTriangle } from 'lucide-react';
import { getRequestStatusChipColor } from '../lib/statusColors';

// Interfaces remain the same
export interface Quote { id: string; quote_amount: number; details: string; status: string; created_at: string; }
export interface RequestNote { id: string; note: string; author_role: 'admin' | 'customer'; created_at: string; }
export interface QuoteRequest {
  id: string;
  created_at: string;
  customer_name: string;
  problem_category: string;
  status: string;
  is_emergency: boolean;
  answers: { question: string; answer: string }[];
  quote_attachments: {
    id: string;
    file_name: string;
    file_url: string;
    mime_type: string;
    quote_id?: string;
  }[];
  user_profiles: {
    name: string;
    email: string;
    phone: string;
  } | null;
  service_address: string;
  quotes: Quote[];
  request_notes: RequestNote[];
}

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAllRequests = async () => {
    if (!profile || profile.role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`*, user_profiles(name, email, phone), quote_attachments(*), quotes(*), request_notes(*)`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data as QuoteRequest[]) || []);
    } catch (err: any) {
      setError("Failed to fetch quote requests.");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllRequests();
  }, [profile]);
  
  const refreshRequestData = async () => {
    if (!selectedRequest) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`*, user_profiles(*), quote_attachments(*), quotes(*), request_notes(*)`)
        .eq('id', selectedRequest.id)
        .single();
      
      if (fetchError) throw fetchError;
      if (data) {
        const updatedRequest = data as QuoteRequest;
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
        setSelectedRequest(updatedRequest);
      }
    } catch (err) {
      console.error("Error refreshing request data:", err);
    }
  };

  const handleRowClick = (params: any) => {
    const fullRequestData = requests.find(r => r.id === params.id);
    if (fullRequestData) {
      setSelectedRequest(fullRequestData);
      setIsModalOpen(true);
    } 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const columns: GridColDef[] = [
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
      renderCell: (params) => params.value != null ? `$${params.value.toFixed(2)}` : '—'
    },
    { field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => ( <Chip label={params.value || 'N/A'} color={getRequestStatusChipColor(params.value)} size="small" sx={{ textTransform: 'capitalize' }}/> )
    },
    { field: 'service_address', headerName: 'Address', flex: 1 },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!profile || profile.role !== 'admin') return <Box sx={{ p: 4 }}><Typography>Access Denied.</Typography></Box>;
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <>
      <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: '1200px', margin: 'auto' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Plumber's Command Center
          </Typography>
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={requests}
              columns={columns}
              onRowClick={handleRowClick}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#e3f2fd', fontSize: '1rem' }, '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' }, '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: '#f0f7ff' } }}
            />
          </Paper>
        </Box>
      </Box>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          onUpdateRequest={refreshRequestData}
        />
      )}
    </>
  );
};

export default Dashboard;