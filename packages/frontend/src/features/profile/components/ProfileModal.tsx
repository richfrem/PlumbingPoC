// packages/frontend/src/features/profile/components/ProfileModal.tsx

import React, { useState, useEffect } from 'react';
import apiClient from '../../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl, CircularProgress, IconButton } from '@mui/material';
import { X as XIcon, User, MapPin } from 'lucide-react';
import ModalHeader from '../../requests/components/ModalHeader';
import ModalFooter from '../../requests/components/ModalFooter';
import { logger } from '../../../lib/logger';

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
      </div>
    </div>
  );

  const { user, profile: contextProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(contextProfile?.name || '');
  const [phone, setPhone] = useState(contextProfile?.phone || '');
  const [province, setProvince] = useState(contextProfile?.province || 'BC');
  const [city, setCity] = useState(contextProfile?.city || 'Victoria');
  const [address, setAddress] = useState(contextProfile?.address || '');
  const [postalCode, setPostalCode] = useState(contextProfile?.postal_code || '');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (contextProfile) {
      setName(contextProfile.name || '');
      setPhone(contextProfile.phone || '');
      setProvince(contextProfile.province || 'BC');
      setCity(contextProfile.city || 'Victoria');
      setAddress(contextProfile.address || '');
      setPostalCode(contextProfile.postal_code || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [contextProfile, user]);

  // Reset geocoding status when address fields change
  useEffect(() => {
    if (geocodingStatus === 'success' || geocodingStatus === 'error') {
      setGeocodingStatus('idle');
    }
  }, [address, city, province, postalCode]);

  const geocodeAddress = async () => {
    if (!address.trim() || !city.trim() || !province.trim() || !postalCode.trim()) {
      return null;
    }

    setGeocodingStatus('loading');

    try {
      const fullAddress = `${address}, ${city}, ${province} ${postalCode}, Canada`;
      logger.log('Geocoding profile address:', fullAddress);

      // Load Google Maps API if not already loaded
      if (!window.google || !window.google.maps) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDkEszizq7L57f0sY73jl99ZvvwDwZ_MGY';

        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        logger.log('Loading Google Maps API for profile geocoding');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
        script.async = true;
        script.defer = true;

        await new Promise((resolve, reject) => {
          script.onload = () => {
            logger.log('Google Maps API loaded for profile');
            resolve(void 0);
          };
          script.onerror = (error) => {
            console.error('Failed to load Google Maps API for profile:', error);
            reject(error);
          };
          document.head.appendChild(script);
        });
      }

      // Use Google Maps Geocoding service
      const geocoder = new (window as any).google.maps.Geocoder();

      return new Promise<{lat: number, lng: number, formattedAddress: string} | null>((resolve) => {
        geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
          logger.log('Profile geocoding response:', {
            status,
            resultsCount: results?.length,
            firstResult: results?.[0]?.formatted_address
          });

          if (status === (window as any).google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const formattedAddress = results[0].formatted_address;

            logger.log('Profile geocoding successful:', { lat, lng, formattedAddress });
            setGeocodingStatus('success');
            resolve({ lat, lng, formattedAddress });
          } else {
            console.error('Profile geocoding failed with status:', status);
            setGeocodingStatus('error');
            resolve(null);
          }
        });
      });

    } catch (error) {
      console.error('Profile geocoding setup error:', error);
      setGeocodingStatus('error');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveError(''); // Clear both error states
    setSaveSuccess(false);

    // 1. EMAIL VALIDATION (read-only but check it exists)
    if (!email || !email.trim()) {
      setSaveError('Email is required but missing. Please refresh and try again.');
      setLoading(false);
      return;
    }

    // 2. NAME VALIDATION
    if (!name || !name.trim()) {
      setSaveError('Name is required');
      setLoading(false);
      return;
    }
    if (name.trim().length < 2) {
      setSaveError('Name must be at least 2 characters long');
      setLoading(false);
      return;
    }
    if (name.trim().length > 100) {
      setSaveError('Name cannot be longer than 100 characters');
      setLoading(false);
      return;
    }

    // 3. PHONE VALIDATION
    if (!phone || !phone.trim()) {
      setSaveError('Phone number is required');
      setLoading(false);
      return;
    }

    // More detailed phone validation with specific error messages
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      if (!phone.includes('-')) {
        setSaveError('Phone number must include dashes. Format: 250-885-7003');
      } else if (phone.length < 12) {
        setSaveError('Phone number is too short. Format: 250-885-7003 (12 characters)');
      } else if (phone.length > 12) {
        setSaveError('Phone number is too long. Format: 250-885-7003 (12 characters)');
      } else if (!/^\d/.test(phone)) {
        setSaveError('Phone number must start with a digit. Format: 250-885-7003');
      } else if (!/^\d{3}-/.test(phone)) {
        setSaveError('First 3 digits must be followed by a dash. Format: 250-885-7003');
      } else if (!/^\d{3}-\d{3}-/.test(phone)) {
        setSaveError('Missing dash after area code and prefix. Format: 250-885-7003');
      } else if (!/\d{4}$/.test(phone)) {
        setSaveError('Phone number must end with 4 digits. Format: 250-885-7003');
      } else {
        setSaveError('Phone number format is invalid. Use only numbers and dashes: 250-885-7003');
      }
      setLoading(false);
      return;
    }

    // 4. PROVINCE VALIDATION
    if (!province || !province.trim()) {
      setSaveError('Province is required');
      setLoading(false);
      return;
    }
    const validProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];
    if (!validProvinces.includes(province)) {
      setSaveError('Please select a valid Canadian province or territory');
      setLoading(false);
      return;
    }

    // 5. CITY VALIDATION
    if (!city || !city.trim()) {
      setSaveError('City is required');
      setLoading(false);
      return;
    }
    if (city.trim().length < 2) {
      setSaveError('City name must be at least 2 characters long');
      setLoading(false);
      return;
    }
    if (city.trim().length > 100) {
      setSaveError('City name cannot be longer than 100 characters');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(city.trim())) {
      setSaveError('City name can only contain letters, spaces, hyphens, apostrophes, and periods');
      setLoading(false);
      return;
    }

    // 6. ADDRESS VALIDATION
    if (!address || !address.trim()) {
      setSaveError('Street address is required');
      setLoading(false);
      return;
    }
    if (address.trim().length < 5) {
      setSaveError('Street address must be at least 5 characters long (e.g., "123 Main St")');
      setLoading(false);
      return;
    }
    if (address.trim().length > 200) {
      setSaveError('Street address cannot be longer than 200 characters');
      setLoading(false);
      return;
    }
    // Basic address format validation (should contain at least a number and some letters)
    if (!/\d/.test(address)) {
      setSaveError('Street address should include a house/building number');
      setLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(address)) {
      setSaveError('Street address should include a street name');
      setLoading(false);
      return;
    }

    // 7. POSTAL CODE VALIDATION
    if (!postalCode || !postalCode.trim()) {
      setSaveError('Postal code is required');
      setLoading(false);
      return;
    }

    const postalCodePattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalCodePattern.test(postalCode)) {
      if (postalCode.length < 6) {
        setSaveError('Postal code is too short. Format: V8N 2L4 or V8N-2L4');
      } else if (postalCode.length > 7) {
        setSaveError('Postal code is too long. Format: V8N 2L4 or V8N-2L4');
      } else if (!/^[A-Za-z]/.test(postalCode)) {
        setSaveError('Postal code must start with a letter. Format: V8N 2L4');
      } else if (!/^[A-Za-z]\d/.test(postalCode)) {
        setSaveError('Second character must be a number. Format: V8N 2L4');
      } else if (!/^[A-Za-z]\d[A-Za-z]/.test(postalCode)) {
        setSaveError('Third character must be a letter. Format: V8N 2L4');
      } else if (!/\d[A-Za-z]\d$/.test(postalCode)) {
        setSaveError('Last 3 characters must be: number-letter-number. Format: V8N 2L4');
      } else {
        setSaveError('Invalid postal code format. Use Canadian format: V8N 2L4 or V8N-2L4');
      }
      setLoading(false);
      return;
    }

    const formattedPostalCode = postalCode.toUpperCase().replace(/\s/g, '').replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, '$1-$2');

    // Geocode the address if it's complete
    const geocodedData = await geocodeAddress();

    const profilePayload = {
      name,
      email, // Add email to payload for backend insertion
      phone,
      province,
      city,
      address,
      postal_code: formattedPostalCode,
      latitude: geocodedData?.lat || null,
      longitude: geocodedData?.lng || null,
      geocoded_address: geocodedData?.formattedAddress || null
    };

    try {
      let profileExists = !!contextProfile;

      if (profileExists) {
        await apiClient.put('/profile', profilePayload);
      } else {
        await apiClient.post('/profile', profilePayload);
      }

      setSaveSuccess(true);
      setGeocodingStatus('idle'); // Reset geocoding status
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
      setGeocodingStatus('idle'); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #4b5563',
            background: '#374151',
            color: 'white',
            borderRadius: '12px 12px 0 0'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
              📝 Update Your Profile
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(85vh - 140px)' }}>
            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              {/* Contact Information Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                padding: '20px',
                marginBottom: '20px',
                borderRadius: '10px',
                border: '1px solid #e1e8ed'
              }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  color: '#2c3e50',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  👤 Contact Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#555'
                    }}>Email:</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        background: '#f8f9fa'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#555'
                    }}>Name:</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#555'
                    }}>Phone:</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="250-555-1234"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                      Format: 250-555-1234
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Address Card */}
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #90caf9'
              }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  color: '#1565c0',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📍 Service Address
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#555'
                    }}>Province:</label>
                    <select
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select Province</option>
                      {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#555'
                    }}>City:</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Victoria"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#555'
                  }}>Street Address:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#555'
                  }}>Postal Code:</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="V8N 2L4"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    Format: V8N 2L4 or V8N-2L4
                  </div>
                </div>

                {/* Geocoding Status */}
                {geocodingStatus === 'loading' && (
                  <div style={{
                    padding: '10px',
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '6px',
                    color: '#856404',
                    fontSize: '0.9rem'
                  }}>
                    🔍 Verifying address location...
                  </div>
                )}
                {geocodingStatus === 'success' && (
                  <div style={{
                    padding: '10px',
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '6px',
                    color: '#155724',
                    fontSize: '0.9rem'
                  }}>
                    ✅ Address location verified and cached
                  </div>
                )}
                {geocodingStatus === 'error' && (
                  <div style={{
                    padding: '10px',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '6px',
                    color: '#721c24',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ Address verification failed - coordinates will be calculated later
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Save and Cancel Buttons */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e0e0e0',
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              {saveError && (
                <div style={{
                  color: '#dc3545',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  padding: '8px',
                  background: '#f8d7da',
                  borderRadius: '6px',
                  width: '100%'
                }}>
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div style={{
                  color: '#28a745',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  padding: '8px',
                  background: '#d4edda',
                  borderRadius: '6px',
                  width: '100%'
                }}>
                  ✅ Profile saved successfully!
                </div>
              )}

              {/* Button Container */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                width: '100%'
              }}>
                {/* Cancel Button - Only show if closable */}
                {isClosable && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      color: '#6c757d',
                      border: '1px solid #6c757d',
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = '#6c757d';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6c757d';
                    }}
                  >
                    Cancel
                  </button>
                )}

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading || saveSuccess}
                  style={{
                    background: loading || saveSuccess ? '#6c757d' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '6px',
                    cursor: loading || saveSuccess ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => {
                    if (!loading && !saveSuccess) {
                      e.currentTarget.style.background = '#1d4ed8';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && !saveSuccess) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default ProfileModal;
