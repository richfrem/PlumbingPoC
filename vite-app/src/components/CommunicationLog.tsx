// vite-app/src/components/CommunicationLog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import apiClient from '../lib/apiClient';
import { Box, Typography, Paper, TextField, Button, CircularProgress } from '@mui/material';
import { MessageSquare } from 'lucide-react';

interface RequestNote {
  id: string;
  note: string;
  author_role: 'admin' | 'customer';
  created_at: string;
}

interface CommunicationLogProps {
  requestId: string;
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ requestId }) => {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<RequestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    // Only fetch if we have a valid requestId
    if (!requestId) return;
    try {
      const { data, error } = await supabase
        .from('request_notes')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Real-time subscription for this specific request's notes
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-notes-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_notes',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          console.log('New note received via realtime!', payload);
          // Add the new note to our state without a full re-fetch
          setNotes(currentNotes => [...currentNotes, payload.new as RequestNote]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !requestId) return;
    setIsSubmitting(true);
    try {
      // The API call will insert the note, and the realtime subscription
      // will handle updating the UI for all connected clients.
      await apiClient.post(`/requests/${requestId}/notes`, { note: newNote });
      setNewNote(""); // Clear the input field on success
    } catch (error) {
      console.error("Failed to add note:", error);
      // You could add user-facing error handling here
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isAdmin = profile?.role === 'admin';

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <Typography variant="overline" sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 1 }}>
        <MessageSquare size={16} /> Communication Log
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, minHeight: '200px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : notes.length > 0 ? (
          notes.map(note => (
            <Box
              key={note.id}
              sx={{
                mb: 1.5,
                display: 'flex',
                justifyContent: note.author_role === 'admin' ? 'flex-start' : 'flex-end'
              }}
            >
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: note.author_role === 'admin' ? '#e3f2fd' : '#ede7f6',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2">{note.note}</Typography>
                </Paper>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    px: 1,
                    color: 'text.secondary',
                    textAlign: note.author_role === 'admin' ? 'left' : 'right'
                  }}
                >
                  {note.author_role === 'admin' ? 'Admin' : 'You'} - {new Date(note.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No notes yet.
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Add a note or message..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            fullWidth
            multiline
            maxRows={3}
            size="small"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                }
            }}
          />
          <Button variant="contained" onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
            {isSubmitting ? '...' : 'Send'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CommunicationLog;