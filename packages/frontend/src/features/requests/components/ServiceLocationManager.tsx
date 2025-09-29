// packages/frontend/src/features/requests/components/ServiceLocationManager.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, IconButton, Alert } from '@mui/material';
import { Pencil, Check, X } from 'lucide-react';

interface AddressData {
  service_address: string;
  latitude: number | null;
  longitude: number | null;
  geocoded_address: string | null;
}

interface ServiceLocationManagerProps {
  mode: 'view' | 'edit' | 'create';
  initialAddress?: string | AddressData;
  isAdmin: boolean;
  onSave?: (addressData: AddressData) => Promise<void>;
  onCancel?: () => void;
  onDataChange?: (addressData: Partial<AddressData>) => void;
  onModeChange?: (useProfileAddress: boolean) => void;
  isUpdating?: boolean;
}

const ServiceLocationManager: React.FC<ServiceLocationManagerProps> = ({
  mode,
  initialAddress,
  isAdmin,
  onSave,
  onCancel,
  onDataChange,
  onModeChange,
  isUpdating = false,
}) => {
  // State for edit mode
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [serviceProvince, setServiceProvince] = useState('BC'); // Default to BC
  const [servicePostalCode, setServicePostalCode] = useState('');
  const [serviceCoordinates, setServiceCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Initialize state based on mode and initialAddress
  useEffect(() => {
    if (mode === 'view' && typeof initialAddress === 'string') {
      // For view mode, we just display the address string
      setIsEditing(false);
    } else if (mode === 'edit' && typeof initialAddress === 'string') {
      // Parse existing address for editing
      const parts = initialAddress.split(', ');
      if (parts.length >= 2) {
        setServiceAddress(parts[0]);
        const cityPostal = parts[1].split(' ');
        if (cityPostal.length >= 2) {
          setServiceCity(cityPostal.slice(0, -2).join(' '));
          setServicePostalCode(cityPostal.slice(-2).join(' '));
        }
      }
      setIsEditing(true);
    } else if (mode === 'create') {
      // For create mode, start with empty fields
      setUseProfileAddress(true);
      setServiceAddress('');
      setServiceCity('');
      setServicePostalCode('');
      setServiceCoordinates(null);
      setGeocodingStatus('idle');
    }
  }, [mode, initialAddress]);

  // Geocoding function
  const geocodeServiceAddress = async () => {
    if (!serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim()) {
      return;
    }

    setGeocodingStatus('loading');

    try {
      const fullAddress = `${serviceAddress}, ${serviceCity}, ${serviceProvince} ${servicePostalCode}, Canada`;
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
          const coords = { lat: location.lat(), lng: location.lng() };
          setServiceCoordinates(coords);
          setGeocodingStatus('success');

          // Notify parent of geocoding success
          if (onDataChange) {
            onDataChange({
              service_address: `${serviceAddress}, ${serviceCity}, ${serviceProvince} ${servicePostalCode}`,
              latitude: coords.lat,
              longitude: coords.lng,
              geocoded_address: `${serviceAddress}, ${serviceCity}, ${serviceProvince} ${servicePostalCode}, Canada`,
            });
          }
        } else {
          setGeocodingStatus('error');
        }
      });

    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus('error');
    }
  };

  // Handle field changes
  const handleFieldChange = (field: string, value: string) => {
    let newAddress = serviceAddress;
    let newCity = serviceCity;
    let newProvince = serviceProvince;
    let newPostalCode = servicePostalCode;

    switch (field) {
      case 'street':
        newAddress = value;
        setServiceAddress(value);
        break;
      case 'city':
        newCity = value;
        setServiceCity(value);
        break;
      case 'province':
        newProvince = value;
        setServiceProvince(value);
        break;
      case 'postalCode':
        newPostalCode = value;
        setServicePostalCode(value);
        break;
    }

    // Reset geocoding status when user changes address
    if (geocodingStatus !== 'idle') {
      setGeocodingStatus('idle');
      setServiceCoordinates(null);
    }

    // Notify parent of data changes with full address
    if (onDataChange) {
      const fullAddress = `${newAddress}, ${newCity}, ${newProvince} ${newPostalCode}`;
      onDataChange({
        service_address: fullAddress,
        latitude: serviceCoordinates?.lat || null,
        longitude: serviceCoordinates?.lng || null,
        geocoded_address: serviceCoordinates ? `${newAddress}, ${newCity}, ${newProvince} ${newPostalCode}, Canada` : null,
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (((mode === 'view' && isEditing) || mode === 'edit') && serviceCoordinates && onSave) {
      const addressData: AddressData = {
        service_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}`,
        latitude: serviceCoordinates.lat,
        longitude: serviceCoordinates.lng,
        geocoded_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada`
      };

      try {
        await onSave(addressData);
        // Exit edit mode on successful save
        setIsEditing(false);
      } catch (error) {
        // Keep in edit mode on error so user can try again
        console.error('Failed to save address:', error);
      }
    } else if (mode === 'create' && onDataChange) {
      // For create mode, just notify parent of the current state
      onDataChange({
        service_address: useProfileAddress ? '' : `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}`,
        latitude: serviceCoordinates?.lat || null,
        longitude: serviceCoordinates?.lng || null,
        geocoded_address: serviceCoordinates ? `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada` : null,
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (mode === 'view' || mode === 'edit') {
      setIsEditing(false);
    }
    if (onCancel) {
      onCancel();
    }
  };

  // Render view mode
  if (mode === 'view' && !isEditing) {
    return (
      <Grid item xs={12} sm={6}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Service Address
          </Typography>
          {isAdmin && (
            <IconButton size="small" onClick={() => setIsEditing(true)} disabled={isUpdating}>
              <Pencil size={16} />
            </IconButton>
          )}
        </Box>
        <Button
          component="a"
          href={`https://maps.google.com/?q=${encodeURIComponent(typeof initialAddress === 'string' ? initialAddress : '')}`}
          target="_blank"
          size="small"
          sx={{ p: 0, justifyContent: 'flex-start', textAlign: 'left' }}
        >
          {typeof initialAddress === 'string' ? initialAddress : 'N/A'}
        </Button>
      </Grid>
    );
  }

  // Render edit mode (for both 'view' mode when editing and 'edit' mode)
  if ((mode === 'view' && isEditing) || (mode === 'edit' && isEditing)) {
    return (
      <Grid item xs={12}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>
          Service Address
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            label="Street Address"
            value={serviceAddress}
            onChange={(e) => handleFieldChange('street', e.target.value)}
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
              onChange={(e) => handleFieldChange('city', e.target.value)}
              size="small"
              fullWidth
              placeholder="Victoria"
              disabled={isUpdating}
            />
            <TextField
              label="Postal Code"
              value={servicePostalCode}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              size="small"
              placeholder="V8W 1A1"
              sx={{ minWidth: 120 }}
              disabled={isUpdating}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={isUpdating || geocodingStatus !== 'success'}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </Grid>
    );
  }

  // Render create mode (for QuoteAgentModal)
  if (mode === 'create') {
    return (
      <Paper sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Service Location
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Where do you need the plumbing service performed?
        </Typography>

        {/* Address Option Toggle */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={useProfileAddress ? "contained" : "outlined"}
              size="small"
              onClick={() => {
                setUseProfileAddress(true);
                setServiceAddress("");
                setServiceCity("");
                setServiceProvince("BC");
                setServicePostalCode("");
                setServiceCoordinates(null);
                setGeocodingStatus('idle');
                if (onModeChange) {
                  onModeChange(true);
                }
              }}
              sx={{ flex: 1 }}
            >
              Use My Address
            </Button>
            <Button
              variant={!useProfileAddress ? "contained" : "outlined"}
              size="small"
              onClick={() => {
                setUseProfileAddress(false);
                if (onModeChange) {
                  onModeChange(false);
                }
              }}
              sx={{ flex: 1 }}
            >
              Different Address
            </Button>
          </Box>

          {useProfileAddress ? (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Service will be at your registered address:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {/* This would be populated from user profile */}
                Profile address would go here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Street Address"
                value={serviceAddress}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                fullWidth
                size="small"
                placeholder="123 Main Street"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="City"
                  value={serviceCity}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Victoria"
                />
                <TextField
                  label="Province"
                  value={serviceProvince}
                  onChange={(e) => handleFieldChange('province', e.target.value)}
                  size="small"
                  placeholder="BC"
                  sx={{ minWidth: 80 }}
                />
                <TextField
                  label="Postal Code"
                  value={servicePostalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  size="small"
                  placeholder="V8W 1A1"
                  sx={{ minWidth: 120 }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={geocodeServiceAddress}
                  disabled={geocodingStatus === 'loading' || !serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim()}
                >
                  {geocodingStatus === 'loading' ? 'Verifying...' : 'Verify Address'}
                </Button>
                {geocodingStatus === 'success' && (
                  <Typography variant="body2" sx={{ color: 'success.main', fontSize: '0.8rem' }}>
                    ✓ Address verified and located on map
                  </Typography>
                )}
                {geocodingStatus === 'error' && (
                  <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8rem' }}>
                    ✗ Could not verify address - please check spelling
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }

  return null;
};

export default ServiceLocationManager;