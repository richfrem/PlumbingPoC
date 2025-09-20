// packages/frontend/src/features/requests/components/QuoteList.tsx

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import { FilePlus } from 'lucide-react';
import { QuoteRequest } from '../types';
import QuoteFormModal from './QuoteFormModal';
import { getQuoteStatusChipColor } from '../../../lib/statusColors';

interface QuoteListProps {
  request: QuoteRequest;
  isReadOnly: boolean;
  isUpdating: boolean;
  onAcceptQuote: (quoteId: string) => void;
  onUpdateRequest: () => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ request, isReadOnly, isUpdating, onAcceptQuote, onUpdateRequest }) => {
  const { profile } = useAuth();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<'create' | 'update' | 'change_order' | 'view'>('create');
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  const isAdmin = profile?.role === 'admin';

  const handleOpenQuoteForm = (mode: 'create' | 'update' | 'change_order' | 'view', quote?: any) => {
    setQuoteModalMode(mode);
    setSelectedQuote(quote || null);
    setShowQuoteForm(true);
  };

  const handleQuoteFormClose = useCallback((updated?: boolean) => {
    setShowQuoteForm(false);
    setSelectedQuote(null);
    if (updated) {
      onUpdateRequest();
    }
  }, [onUpdateRequest]);

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilePlus size={16} /> Quotes
        </Typography>

        {request.quotes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No quotes yet.
          </Typography>
        ) : (
          <List>
            {request.quotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((quote) => (
              <ListItem key={quote.id} disablePadding secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isAdmin && quote.status !== 'accepted' && quote.status !== 'rejected' && request.status !== 'accepted' && (
                    <Button variant="contained" size="small" color="success" onClick={() => { console.log('Accepting quote:', quote.id); onAcceptQuote(quote.id); }} disabled={isUpdating}>
                      Accept
                    </Button>
                  )}
                  {isAdmin && !isReadOnly && quote.status !== 'accepted' && (
                    <Button variant="outlined" size="small" onClick={() => handleOpenQuoteForm('update', quote)}>
                      Update
                    </Button>
                  )}
                  {isAdmin && !isReadOnly && quote.status === 'accepted' && (
                    <Button variant="outlined" size="small" color="warning" onClick={() => handleOpenQuoteForm('change_order', quote)}>
                      Change Order
                    </Button>
                  )}
                  {!isAdmin && (quote.status === 'accepted' || quote.status === 'rejected') && (
                    <Button variant="outlined" size="small" onClick={() => handleOpenQuoteForm('view', quote)}>
                      View Details
                    </Button>
                  )}
                </Box>
              }>
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={`${quote.status === 'change_order' ? 'Change Order' : 'Quote'} #${quote.quote_number} - $${quote.quote_amount.toFixed(2)}`}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={quote.status === 'change_order' ? 'Change Order' : (quote.status || 'N/A')}
                        color={getQuoteStatusChipColor(quote.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        | Created: {new Date(quote.created_at).toLocaleDateString()}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {isAdmin && !isReadOnly && (
          <Button variant="contained" startIcon={<FilePlus />} sx={{ mt: 2 }} onClick={() => handleOpenQuoteForm('create')}>
            Add New Quote
          </Button>
        )}
      </Paper>

      <QuoteFormModal
        isOpen={showQuoteForm}
        onClose={handleQuoteFormClose}
        quote={selectedQuote}
        mode={quoteModalMode}
        request={request}
        requestId={request.id}
      />
    </>
  );
};

export default QuoteList;