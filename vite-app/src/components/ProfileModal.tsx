// vite-app/src/components/ProfileModal.tsx

import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl, CircularProgress, IconButton } from '@mui/material';
import { X as XIcon } from 'lucide-react';

interface ProfileModalProps {
  isClosable?: boolean;
  onClose?: () => void;
  onComplete?: () => void; // <-- ADD THIS NEW PROP
}

const provinces = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'
];

const ProfileModal: React.FC<ProfileModalProps> = ({ isClosable = false, onClose, onComplete }) => {
  const showDebugPanel = (import.meta.env.VITE_DEBUG_PANEL === 'true');

  const DebugOverlay = () => (
    <div style={{
      background: '#222',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      opacity: 0.97,
      maxWidth: 420,
      margin: '18px auto 0 auto',
      display: 'block'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '13px' }}>ProfileModal Debug</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        <div>User ID:</div><div>{user?.id || 'none'}</div>
        <div>Email:</div><div>{email}</div>
        <div>Loading:</div><div>{String(loading)}</div>
        <div>SaveError:</div><div>{saveError || 'none'}</div>
        <div>SaveSuccess:</div><div>{String(saveSuccess)}</div>
        <div>PhoneError:</div><div>{phoneError || 'none'}</div>
      </div>
    </div>
  );
  
  const { user, profile: contextProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(contextProfile?.name || '');
  const [phone, setPhone] = useState(contextProfile?.phone || '');
  const [province, setProvince] = useState(contextProfile?.province || '');
  const [city, setCity] = useState(contextProfile?.city || '');
  const [address, setAddress] = useState(contextProfile?.address || '');
  const [postalCode, setPostalCode] = useState(contextProfile?.postal_code || '');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (contextProfile) {
      setName(contextProfile.name || '');
      setPhone(contextProfile.phone || '');
      setProvince(contextProfile.province || '');
      setCity(contextProfile.city || '');
      setAddress(contextProfile.address || '');
      setPostalCode(contextProfile.postal_code || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [contextProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPhoneError('');
    setSaveError('');
    setSaveSuccess(false);

    if (!/^\d{3}-\d{3}-\d{4}$/.test(phone)) {
      setPhoneError('Enter a valid phone number in the format 250-885-7003');
      setLoading(false);
      return;
    }

    const postalCodePattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalCodePattern.test(postalCode)) {
      setSaveError('Enter a valid Canadian postal code (e.g., V8N 2L4 or V8N-2L4)');
      setLoading(false);
      return;
    }
    
    const formattedPostalCode = postalCode.toUpperCase().replace(/\s/g, '').replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, '$1-$2');

    const profilePayload = { 
      name, 
      email, // Add email to payload for backend insertion
      phone, 
      province, 
      city, 
      address, 
      postal_code: formattedPostalCode 
    };

    try {
      let profileExists = !!contextProfile;

      if (profileExists) {
        await apiClient.put('/profile', profilePayload);
      } else {
        await apiClient.post('/profile', profilePayload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        // <-- THE FIX: Call onComplete if it exists, otherwise call onClose
        if (onComplete) {
          onComplete();
        } else if (onClose) {
          onClose();
        }
      }, 1200);

    } catch (err: any) {
      setSaveError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={24} sx={{ width: '95%', maxWidth: '600px', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', maxHeight: '90vh', overflow: 'hidden', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {contextProfile?.name ? 'Update Your Profile' : 'Complete Your Profile'}
            </Typography>
            {isClosable && (
              <IconButton onClick={onClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
            )}
          </Box>
          <form onSubmit={handleSubmit}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
              {/* Form fields remain the same */}
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="Email" value={email} fullWidth disabled InputProps={{ sx: { height: 56, fontSize: '1rem' } }} />
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth required InputProps={{ sx: { height: 56 } }} />
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} fullWidth required error={!!phoneError} helperText={phoneError} InputProps={{ sx: { height: 56 } }} />
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <FormControl fullWidth required sx={{ height: 56 }}>
                  <InputLabel id="province-select-label">Province</InputLabel>
                  <Select labelId="province-select-label" value={province} label="Province" onChange={e => setProvince(e.target.value as string)} sx={{ height: 56 }}>
                    <MenuItem value=""><em>Select Province</em></MenuItem>
                    {provinces.map(p => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="City" value={city} onChange={e => setCity(e.target.value)} fullWidth required InputProps={{ sx: { height: 56 } }} />
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth required InputProps={{ sx: { height: 56 } }} />
              </Box>
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField label="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} fullWidth required InputProps={{ sx: { height: 56 } }} />
              </Box>
            </Box>
            <Box sx={{ p: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              {saveError && (<Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>{saveError}</Typography>)}
              {saveSuccess && (<Typography color="primary" sx={{ mb: 2, textAlign: 'center' }}>Profile saved!</Typography>)}
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading || saveSuccess} sx={{ py: 1.5, fontSize: '1rem' }}>
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Profile'}
              </Button>
              {showDebugPanel && <Box sx={{ mt: 3 }}><DebugOverlay /></Box>}
            </Box>
          </form>
        </Paper>
      </div>
    </>
  );
};
export default ProfileModal;