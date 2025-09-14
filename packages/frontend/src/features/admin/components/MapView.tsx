import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Box, Paper, Typography, Button } from '@mui/material';
import { QuoteRequest } from '../../requests/types';
import { getRequestStatusPinColor } from '../../../lib/statusColors';

interface MapViewProps {
  requests: QuoteRequest[];
  onRequestSelect: (request: QuoteRequest) => void;
}

const MapView: React.FC<MapViewProps> = ({ requests, onRequestSelect }) => {
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const mapStyles = [
    {
      // Hides all business icons and labels (e.g., stores, restaurants)
      featureType: 'poi.business',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      // Hides all transit station icons (e.g., bus stops)
      featureType: 'transit',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      // Hides all road icons (e.g., highway shields)
      featureType: 'road',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      // Slightly desaturates all map colors to make our pins stand out
      featureType: 'all',
      elementType: 'all',
      stylers: [{ saturation: -70 }],
    },
  ];

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

  const geocodedRequests = requests.filter(
    request => request.latitude && request.longitude
  );


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
          defaultCenter={{ lat: 48.4284, lng: -123.3656 }}
          defaultZoom={10}
          mapId="plumbing-requests-map"
          style={{ width: '100%', height: '100%' }}
          styles={mapStyles}
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
                  backgroundColor: getRequestStatusPinColor(request.status),
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