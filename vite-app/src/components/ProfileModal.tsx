// vite-app/src/components/ProfileModal.tsx

import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient'; // <-- IMPORT apiClient
import { UserProfile } from '../contexts/AuthContext';
import { Box, Typography, Paper, TextField, Button, Grid, Select, MenuItem, InputLabel, FormControl, CircularProgress, IconButton } from '@mui/material';
import { X as XIcon } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onComplete: () => void;
  isClosable?: boolean;
}

const provinces = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, profile, onClose, onComplete, isClosable = true }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [postalError, setPostalError] = useState('');

  useEffect(() => {
    if (profile && isOpen) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setProvince(profile.province || '');
      setPostalCode(profile.postal_code || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/i;
    let isValid = true;
    
    if (!phone.trim() || !phoneRegex.test(phone)) {
      setPhoneError('Format: 123-456-7890');
      isValid = false;
    } else {
      setPhoneError('');
    }

    if (!postalCode.trim() || !postalRegex.test(postalCode)) {
      setPostalError('Format: A1A 1A1');
      isValid = false;
    } else {
      setPostalError('');
    }

    if (!isValid) return;
    
    setLoading(true);

    // --- THIS IS THE FIX ---
    // Use the new API endpoint instead of a direct Supabase call
    try {
      const payload = {
        name,
        phone,
        address,
        city,
        province,
        postal_code: postalCode.toUpperCase().replace(/(\w{3})[ -]?(\w{3})/, '$1 $2'),
      };

      await apiClient.put('/users/profile', payload);

      setLoading(false);
      onComplete(); // Signal parent to refresh and close
    } catch (error: any) {
      setLoading(false);
      console.error("Profile update error:", error);
      alert(`Failed to save profile: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ width: '95%', maxWidth: '600px', p: 0, position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8', maxHeight: '90vh', overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 3, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {profile?.name ? 'Update Your Profile' : 'Complete Your Profile'}
          </Typography>
          {isClosable && (
            <IconButton onClick={onClose} sx={{ color: '#fff' }}><XIcon size={24} /></IconButton>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email" value={profile?.email || ''} fullWidth disabled sx={{ bgcolor: '#eeeeee' }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} fullWidth required error={!!phoneError} helperText={phoneError} placeholder="123-456-7890" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Street Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="City" value={city} onChange={e => setCity(e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel id="province-select-label">Province</InputLabel>
                  <Select labelId="province-select-label" value={province} label="Province" onChange={e => setProvince(e.target.value)}>
                    <MenuItem value=""><em>Select Province</em></MenuItem>
                    {provinces.map(p => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} fullWidth required error={!!postalError} helperText={postalError} placeholder="A1A 1A1" />
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ p: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ py: 1.5, fontSize: '1rem' }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Profile'}
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
};

export default ProfileModal;