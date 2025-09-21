// packages/frontend/src/features/requests/components/CommunicationLog.tsx

import React, { useState } from 'react';
import apiClient from '../../../lib/apiClient';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { RequestNote } from '../types'; // Import the type from the central location
import { useRequestById } from '../../../hooks/useSpecializedQueries';

interface CommunicationLogProps {
  requestId: string;
  initialNotes?: RequestNote[]; // Kept for backward compatibility but not used
  onNoteAdded?: () => void; // Kept for backward compatibility
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ requestId, onNoteAdded }) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use standardized real-time system to get request data including notes
  const { data: requestArray, loading, error, refetch } = useRequestById(requestId, {
    enabled: !!requestId // Only fetch when we have a requestId
  });
  const request = requestArray?.[0]; // Extract single request from array
  const notes = request?.request_notes || [];
  
  console.log('🔍 CommunicationLog render:', {
    notesLength: notes?.length,
    noteIds: notes?.map(n => n.id) || [],
    noteTexts: notes?.map(n => n.note.substring(0, 30) + '...') || [],
    requestId,
    loading,
    error,
    hasRequest: !!request,
    timestamp: new Date().toISOString()
  });

  // Log when notes change to detect realtime updates
  React.useEffect(() => {
    console.log('📝 CommunicationLog notes updated:', {
      notesCount: notes?.length,
      latestNote: notes?.[notes.length - 1]?.note?.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
  }, [notes?.length]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !requestId) return;

    console.log('💬 BEFORE adding note:', {
      noteText: newNote,
      requestId,
      currentNotesCount: notes?.length,
      currentNotes: notes?.map(n => ({ id: n.id, note: n.note.substring(0, 20) + '...' }))
    });

    setIsSubmitting(true);
    try {
      // Add the note to the database
      const response = await apiClient.post(`/requests/${requestId}/notes`, { note: newNote });
      console.log('🗄️ API response for adding note:', response.data);

      setNewNote("");

      // Trigger refresh of the request data to show the new message
      console.log('🔄 Refreshing request data to show new message...');
      onNoteAdded?.();
      console.log('✅ Note added successfully and UI updated');
    } catch (error) {
      console.error("💥 Failed to add note:", error);
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
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Loading notes...
          </Typography>
        ) : error ? (
          <Typography variant="body2" color="error" sx={{ p: 2, textAlign: 'center' }}>
            Error loading notes: {error}
          </Typography>
        ) : notes.length > 0 ? (
          notes.map((note: RequestNote) => (
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