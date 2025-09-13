import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Box, Paper, Typography, Button } from '@mui/material';
import { QuoteRequest } from '../../requests/types';

interface MapViewProps {
  requests: QuoteRequest[];
  onRequestSelect: (request: QuoteRequest) => void;
}

const MapView: React.FC<MapViewProps> = ({ requests, onRequestSelect }) => {
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);

  // Debug: Check API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDkEszizq7L57f0sY73jl99ZvvwDwZ_MGY';
  console.log('MapView API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED');

  // Check if API key is available
  if (!apiKey) {
    return (
      <Paper sx={{ height: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Google Maps API Key Missing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Filter requests that have valid coordinates
  const geocodedRequests = requests.filter(
    request => request.latitude && request.longitude
  );

  // Helper function to get pin color based on status
  const getPinColor = (status: string): string => {
    switch (status) {
      case 'new': return '#1976D2'; // Blue
      case 'viewed': return '#FF9800'; // Orange
      case 'quoted': return '#9C27B0'; // Purple
      case 'accepted': return '#4CAF50'; // Green
      case 'scheduled': return '#FF5722'; // Deep Orange
      case 'completed': return '#607D8B'; // Blue Grey
      default: return '#757575'; // Grey
    }
  };

  const handleMarkerClick = (request: QuoteRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseInfoWindow = () => {
    setSelectedRequest(null);
  };

  return (
    <Paper sx={{ height: 600, width: '100%', position: 'relative' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 48.4284, lng: -123.3656 }} // Victoria, BC coordinates
          defaultZoom={10}
          mapId="plumbing-requests-map"
          style={{ width: '100%', height: '100%' }}
        >
          {geocodedRequests.map((request) => (
            <AdvancedMarker
              key={request.id}
              position={{ lat: request.latitude!, lng: request.longitude! }}
              onClick={() => handleMarkerClick(request)}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: getPinColor(request.status),
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                  }}
                />
              </Box>
            </AdvancedMarker>
          ))}

          {selectedRequest && (
            <InfoWindow
              position={{ lat: selectedRequest.latitude!, lng: selectedRequest.longitude! }}
              onCloseClick={handleCloseInfoWindow}
            >
              <Box sx={{ p: 1, minWidth: 250 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {selectedRequest.user_profiles?.name || selectedRequest.customer_name || 'Unknown Customer'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedRequest.service_address}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Status: {selectedRequest.status}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    onRequestSelect(selectedRequest);
                    handleCloseInfoWindow();
                  }}
                >
                  View Full Job Docket
                </Button>
              </Box>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {geocodedRequests.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No geocoded requests to display
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Requests need latitude and longitude coordinates to appear on the map
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MapView;