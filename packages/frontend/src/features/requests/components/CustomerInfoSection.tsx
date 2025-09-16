// packages/frontend/src/features/requests/components/CustomerInfoSection.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, IconButton } from '@mui/material';
import { User, Edit, Check, X } from 'lucide-react';

interface CustomerInfoSectionProps {
  request: any;
  isAdmin: boolean;
  isDateEditable?: boolean;
  scheduledStartDate?: string | null; // Allow null
  setScheduledStartDate?: (date: string) => void;
  currentStatus?: string;
  setCurrentStatus?: (status: string) => void;
  isUpdating?: boolean;
  editable?: boolean; // For QuoteFormModal
  goodUntil?: string; // For QuoteFormModal
  setGoodUntil?: (date: string) => void; // For QuoteFormModal
  onDateChange?: (date: string) => void; // New prop for streamlined workflow
  onAddressUpdate?: (address: { service_address: string; latitude: number | null; longitude: number | null; geocoded_address: string | null }) => void; // Updated prop for structured address updates
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  request,
  isAdmin,
  isDateEditable,
  scheduledStartDate,
  setScheduledStartDate,
  currentStatus,
  setCurrentStatus,
  isUpdating,
  editable,
  goodUntil,
  setGoodUntil,
  onDateChange, // New streamlined prop
  onAddressUpdate, // New address update prop
}) => {
  const isRequestDetail = setScheduledStartDate !== undefined;
  const customerProfile = request?.user_profiles;

  // State for editing address (structured like QuoteAgentModal)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [servicePostalCode, setServicePostalCode] = useState('');
  const [serviceCoordinates, setServiceCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Only show the scheduling section if the status is 'accepted' or 'scheduled'
  const canShowScheduling = isAdmin && isRequestDetail && (currentStatus === 'accepted' || currentStatus === 'scheduled');

  // Geocoding function (similar to QuoteAgentModal)
  const geocodeServiceAddress = async () => {
    if (!serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim()) {
      return;
    }

    setGeocodingStatus('loading');

    try {
      const fullAddress = `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada`;
      console.log('Geocoding address:', fullAddress);

      // Load Google Maps API if not already loaded
      if (!window.google || !window.google.maps) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDkEszizq7L57f0sY73jl99ZvvwDwZ_MGY';

        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
        script.async = true;
        script.defer = true;

        await new Promise((resolve, reject) => {
          script.onload = () => resolve(void 0);
          script.onerror = (error) => reject(error);
          document.head.appendChild(script);
        });
      }

      // Use Google Maps Geocoding service
      const geocoder = new (window as any).google.maps.Geocoder();

      geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
        if (status === (window as any).google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          setServiceCoordinates({ lat: location.lat(), lng: location.lng() });
          setGeocodingStatus('success');
        } else {
          setGeocodingStatus('error');
        }
      });

    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus('error');
    }
  };

  // Address editing handlers
  const handleStartEditingAddress = () => {
    // Parse existing address into components (simple parsing)
    const existingAddress = request?.service_address || '';
    const parts = existingAddress.split(', ');
    if (parts.length >= 2) {
      setServiceAddress(parts[0]);
      const cityPostal = parts[1].split(' ');
      if (cityPostal.length >= 2) {
        setServiceCity(cityPostal.slice(0, -2).join(' ')); // City name
        setServicePostalCode(cityPostal.slice(-2).join(' ')); // Postal code
      }
    }
    setServiceCoordinates(null);
    setGeocodingStatus('idle');
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (onAddressUpdate && serviceCoordinates) {
      const addressData = {
        service_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}`,
        latitude: serviceCoordinates.lat,
        longitude: serviceCoordinates.lng,
        geocoded_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada`
      };
      onAddressUpdate(addressData);
    }
    setIsEditingAddress(false);
  };

  const handleCancelEditingAddress = () => {
    setServiceAddress('');
    setServiceCity('');
    setServicePostalCode('');
    setServiceCoordinates(null);
    setGeocodingStatus('idle');
    setIsEditingAddress(false);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><User size={16} /> Customer Info</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</Typography>
          <Typography variant="body1">{customerProfile?.name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Phone</Typography>
          <Button component="a" href={`tel:${customerProfile?.phone}`} size="small" sx={{ p: 0, justifyContent: 'flex-start' }}>{customerProfile?.phone || 'N/A'}</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</Typography>
          <Button component="a" href={`mailto:${customerProfile?.email}`} size="small" sx={{ p: 0, justifyContent: 'flex-start', textTransform: 'none' }}>{customerProfile?.email || 'N/A'}</Button>
        </Grid>
        
        {/* Conditional rendering for the date input */}
        {canShowScheduling ? (
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Scheduled Work Start</Typography>
            <TextField
              type="date"
              value={scheduledStartDate ? scheduledStartDate.split('T')[0] : ''}
              onChange={(e) => {
                if (setScheduledStartDate) setScheduledStartDate(e.target.value);
                // Streamlined workflow: when date is selected, automatically set status to scheduled
                if (e.target.value && currentStatus === 'accepted' && setCurrentStatus) {
                  setCurrentStatus('scheduled');
                }
                // Notify parent of date change for dynamic footer
                if (onDateChange) onDateChange(e.target.value);
              }}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={isUpdating}
              sx={{ mt: 0.5 }}
            />
          </Grid>
        ) : (
             <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Service Address</Typography>
                {isEditingAddress ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
                    <TextField
                      label="Street Address"
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="123 Main Street"
                      disabled={isUpdating}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="City"
                        value={serviceCity}
                        onChange={(e) => setServiceCity(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Victoria"
                        disabled={isUpdating}
                      />
                      <TextField
                        label="Postal Code"
                        value={servicePostalCode}
                        onChange={(e) => setServicePostalCode(e.target.value)}
                        size="small"
                        placeholder="V8W 1A1"
                        sx={{ minWidth: 120 }}
                        disabled={isUpdating}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={geocodeServiceAddress}
                        disabled={geocodingStatus === 'loading' || !serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim() || isUpdating}
                      >
                        {geocodingStatus === 'loading' ? 'Verifying...' : 'Verify Address'}
                      </Button>
                      {geocodingStatus === 'success' && (
                        <Typography variant="body2" sx={{ color: 'success.main', fontSize: '0.8rem' }}>
                          ✓ Address verified
                        </Typography>
                      )}
                      {geocodingStatus === 'error' && (
                        <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8rem' }}>
                          ✗ Could not verify
                        </Typography>
                      )}
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={handleSaveAddress}
                          disabled={isUpdating || !serviceCoordinates}
                          color="success"
                        >
                          <Check size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCancelEditingAddress}
                          disabled={isUpdating}
                          color="error"
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      component="a"
                      href={`https://maps.google.com/?q=${encodeURIComponent(request?.service_address)}`}
                      target="_blank"
                      size="small"
                      sx={{ p: 0, justifyContent: 'flex-start', textAlign: 'left', flex: 1 }}
                    >
                      {request?.service_address || 'N/A'}
                    </Button>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={handleStartEditingAddress}
                        disabled={isUpdating}
                        sx={{ ml: 1 }}
                      >
                        <Edit size={14} />
                      </IconButton>
                    )}
                  </Box>
                )}
             </Grid>
        )}

        {/* This is for the QuoteFormModal, which doesn't show the scheduled date */}
        {!isRequestDetail && (
          <Grid item xs={12} sm={6}>
            <Box>
              <TextField label="Good Until" type="date" value={goodUntil} onChange={e => setGoodUntil && setGoodUntil(e.target.value)} size="small" InputLabelProps={{ shrink: true }} disabled={!editable} sx={{ bgcolor: '#fff', borderRadius: 1 }} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CustomerInfoSection;