// packages/frontend/src/features/requests/components/CommunicationLog.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import apiClient from '../../../lib/apiClient';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { RequestNote } from '../types'; // Import the type from the central location

interface CommunicationLogProps {
  requestId: string;
  initialNotes: RequestNote[];
  onNoteAdded: () => void;
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ requestId, initialNotes, onNoteAdded }) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This real-time listener is the SINGLE SOURCE OF TRUTH for all updates to the log.
  // It works for both the sender and the receiver.
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
          console.log('Real-time note received. Telling parent to re-fetch.', payload);
          // This call is the key. It tells the Dashboard/MyRequests to get fresh data,
          // which then flows down to this component.
          onNoteAdded();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, onNoteAdded]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !requestId) return;
    setIsSubmitting(true);
    try {
      // We simply post the new note to the database.
      await apiClient.post(`/requests/${requestId}/notes`, { note: newNote });
      setNewNote("");
      // *** THE FIX: The manual `onNoteAdded()` call is REMOVED from here. ***
      // We now confidently rely on the useEffect listener above to receive the
      // broadcast from Supabase, just like the other user will. This ensures
      // both clients use the exact same update mechanism.
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <Typography variant="overline" sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 1 }}>
        <MessageSquare size={16} /> Communication Log
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, minHeight: '200px' }}>
        {initialNotes.length > 0 ? (
          initialNotes.map(note => (
            <Box
              key={note.id}
              sx={{ mb: 1.5, display: 'flex', justifyContent: note.author_role === 'admin' ? 'flex-start' : 'flex-end' }}
            >
              <Box>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: note.author_role === 'admin' ? '#e3f2fd' : '#ede7f6', borderRadius: 2 }}>
                  <Typography variant="body2">{note.note}</Typography>
                </Paper>
                <Typography variant="caption" display="block" sx={{ px: 1, color: 'text.secondary', textAlign: note.author_role === 'admin' ? 'left' : 'right' }}>
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); }}}
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