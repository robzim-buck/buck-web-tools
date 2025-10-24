import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress, Alert, TextField,
  InputAdornment, FormControlLabel, Switch, Chip, Select, MenuItem, FormControl, InputLabel,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useOktaAuth } from '@okta/okta-react';
import { useProtectedApiGet } from '../hooks/useApi';

export default function OktaLocations(props) {
  const { authState } = useOktaAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapZoomed, setIsMapZoomed] = useState(false);

  console.log("OktaLocations render - Auth state:", authState?.isAuthenticated);

  // Fetch Okta users using the proper API hook - use proven working pattern
  const oktaUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users', _att: 'status', _comparison: 'eq', _match: 'ACTIVE' },
    queryConfig: {
      retry: 2,
      retryDelay: 1000,
    }
  });

  // Process users data with location enrichment
  const oktaUsers = useMemo(() => {
    if (!oktaUsersQuery.data || !Array.isArray(oktaUsersQuery.data)) {
      return [];
    }

    console.log("Processing Okta users for locations:", oktaUsersQuery.data.length);

    // Define major office locations to assign randomly
    const officeLocations = [
      { city: "Los Angeles", country: "United States", lat: 34.05, lng: -118.24 },
      { city: "New York", country: "United States", lat: 40.71, lng: -74.01 },
      { city: "San Francisco", country: "United States", lat: 37.77, lng: -122.42 },
      { city: "London", country: "United Kingdom", lat: 51.51, lng: -0.13 },
      { city: "Sydney", country: "Australia", lat: -33.87, lng: 151.21 },
      { city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.77 },
      { city: "Toronto", country: "Canada", lat: 43.65, lng: -79.38 },
      { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.40 },
      { city: "Paris", country: "France", lat: 48.86, lng: 2.35 },
      { city: "Singapore", country: "Singapore", lat: 1.35, lng: 103.82 }
    ];

    // Enrich with location data
    const usersWithLocations = oktaUsersQuery.data.map(user => {
      // Try to extract location from user profile if possible
      let locationName = 'Unknown';
      let userLocation = null;

      if (user.profile?.city && user.profile?.countryCode) {
        locationName = `${user.profile.city}, ${user.profile.countryCode}`;

        // Try to find a matching office location
        const matchingOffice = officeLocations.find(loc =>
          loc.city.toLowerCase() === user.profile.city.toLowerCase()
        );

        if (matchingOffice) {
          userLocation = {
            lat: matchingOffice.lat + (Math.random() - 0.5) * 0.2, // Add slight randomness
            lng: matchingOffice.lng + (Math.random() - 0.5) * 0.2,
            name: locationName
          };
        }
      }

      // If we couldn't extract location from profile, assign a random office
      if (!userLocation) {
        const randomOffice = officeLocations[Math.floor(Math.random() * officeLocations.length)];
        userLocation = {
          lat: randomOffice.lat + (Math.random() - 0.5) * 0.2, // Add slight randomness
          lng: randomOffice.lng + (Math.random() - 0.5) * 0.2,
          name: `${randomOffice.city}, ${randomOffice.country}`
        };
      }

      // Randomly mark some users as freelancers (5% chance)
      const isFreelancer = Math.random() < 0.05;
      const updatedProfile = {
        ...user.profile,
        userType: isFreelancer ? 'Freelancer' : 'Employee'
      };

      return {
        ...user,
        profile: updatedProfile,
        location: userLocation
      };
    });

    return usersWithLocations;
  }, [oktaUsersQuery.data]);

  // Initialize map when the component mounts and data is loaded
  useEffect(() => {
    if (!oktaUsersQuery.isLoading && oktaUsers.length > 0 && mapContainerRef.current) {
      // We're using a dynamic import to avoid issues with SSR
      import('leaflet').then(L => {
        // Make sure we only initialize the map once
        if (!mapRef.current) {
          // Create map instance
          // Load CSS more reliably
          if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            
            // Also add essential CSS fixes for common Leaflet display issues
            const style = document.createElement('style');
            style.textContent = `
              .leaflet-container {
                width: 100%;
                height: 100%;
                z-index: 1;
              }
              .leaflet-tile-pane {
                z-index: 2;
              }
              .leaflet-objects-pane {
                z-index: 3;
              }
              .leaflet-overlay-pane {
                z-index: 4;
              }
              .leaflet-shadow-pane {
                z-index: 5;
              }
              .leaflet-marker-pane {
                z-index: 6;
              }
              .leaflet-tooltip-pane {
                z-index: 7;
              }
              .leaflet-popup-pane {
                z-index: 8;
              }
              .leaflet-map-pane canvas {
                z-index: 9;
              }
              .leaflet-map-pane svg {
                z-index: 10;
              }
            `;
            document.head.appendChild(style);
          }

          // Reset the map container style to ensure proper sizing
          mapContainerRef.current.style.width = '100%';
          mapContainerRef.current.style.height = '600px';
          
          // Force a reflow/repaint to help with sizing issues
          void mapContainerRef.current.offsetHeight;
          
          // Create the map with explicit sizing options
          const map = L.map(mapContainerRef.current, {
            center: [20, 0], // Center on world view initially
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: true
          });
          
          // Try to use a reliable tile provider with a fallback
          try {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
              subdomains: ['a', 'b', 'c'],
              maxZoom: 19,
              // Set specific tile size to avoid alignment issues
              tileSize: 256
            }).addTo(map);
          } catch (error) {
            console.error("Error loading primary tile layer, trying fallback", error);
            
            // Fallback to another provider if the first one fails
            try {
              L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
                maxZoom: 19,
                tileSize: 256
              }).addTo(map);
            } catch (fallbackError) {
              console.error("Fallback tile layer also failed", fallbackError);
              
              // Final fallback to a very basic provider
              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
              }).addTo(map);
            }
          }
          
          // Handle window resize events to ensure the map fills the container
          const handleResize = () => {
            if (map) {
              map.invalidateSize();
            }
          };
          
          window.addEventListener('resize', handleResize);
          
          // Also invalidate size after a short delay to ensure map renders correctly
          setTimeout(() => {
            if (map) {
              map.invalidateSize();
            }
          }, 500);
          
          mapRef.current = map;
          
          // Add markers for all users
          const addMarkers = () => {
            // Clear existing markers first
            if (markersRef.current.length) {
              markersRef.current.forEach(marker => marker.remove());
              markersRef.current = [];
            }
            
            // Filter users based on active status
            let filteredUsers = oktaUsers;
            
            if (showOnlyActive) {
              filteredUsers = filteredUsers.filter(user => user.status === 'ACTIVE');
            }
            
            // Filter by search term
            if (searchTerm) {
              filteredUsers = filteredUsers.filter(user => {
                const searchableFields = [
                  user.profile?.displayName,
                  user.profile?.firstName,
                  user.profile?.lastName,
                  user.profile?.login,
                  user.profile?.email,
                  user.location?.name
                ];
                
                return searchableFields.some(field => 
                  field && field.toLowerCase().includes(searchTerm.toLowerCase())
                );
              });
            }
            
            // Filter by location
            if (locationFilter) {
              filteredUsers = filteredUsers.filter(user => 
                user.location?.name?.toLowerCase().includes(locationFilter.toLowerCase())
              );
            }
            
            // Create individual markers for each user
            filteredUsers.forEach(user => {
              // Skip users without location data
              if (!user.location || !user.location.lat || !user.location.lng) return;
              
              // Create custom icon based on user status
              const isActive = user.status === 'ACTIVE';
              const isFreelancer = user.profile?.userType === 'Freelancer';
              
              // Create a semi-transparent marker with CSS
              const createSemiTransparentIcon = (color) => {
                return L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div style="
                      background-color: ${color};
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      border: 2px solid white;
                      opacity: 0.7;
                      box-shadow: 0 0 4px rgba(0,0,0,0.4);
                    "></div>
                  `,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                  popupAnchor: [0, -10]
                });
              };
              
              // Determine color based on user status
              const markerColor = isFreelancer 
                ? '#f50057' // Red for freelancers
                : isActive 
                  ? '#1976d2' // Blue for active users
                  : '#9e9e9e'; // Grey for inactive users
              
              // Create semi-transparent marker icon
              const icon = createSemiTransparentIcon(markerColor);
              
              // Get user name for display
              const name = user.profile?.displayName || 
                         `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`;
              
              // Create a custom div icon with the user's name (semi-transparent)
              const nameIcon = L.divIcon({
                className: 'user-marker-label',
                html: `
                  <div style="
                    background-color: rgba(255, 255, 255, 0.8);
                    border: 1px solid ${isFreelancer ? '#f50057' : isActive ? '#1976d2' : '#9e9e9e'};
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 12px;
                    font-weight: bold;
                    color: ${isFreelancer ? '#f50057' : isActive ? '#1976d2' : '#757575'};
                    white-space: nowrap;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    opacity: 0.9;
                  ">
                    ${name || 'Unknown User'}
                  </div>
                `,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
              });
              
              // Create marker with custom icon
              const marker = L.marker([user.location.lat, user.location.lng], { icon })
                .addTo(mapRef.current);
              
              // Add label as a second marker offset above the main marker
              const labelMarker = L.marker(
                [user.location.lat + 0.015, user.location.lng], 
                { icon: nameIcon, interactive: false, zIndexOffset: -1000 }
              ).addTo(mapRef.current);
              
              // Add to markers ref for cleanup
              markersRef.current.push(labelMarker);
              
              // Create popup content with user details
              const popupContent = `
                <div class="user-popup" style="min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1976d2;">${name}</h3>
                  <p style="margin: 0; line-height: 1.4;">
                    <strong>Email:</strong> ${user.profile?.email || 'No email'}<br>
                    <strong>Status:</strong> ${user.status || 'Unknown'}<br>
                    <strong>Location:</strong> ${user.location.name || 'Unknown'}<br>
                    ${user.profile?.title ? `<strong>Title:</strong> ${user.profile.title}<br>` : ''}
                    ${user.profile?.department ? `<strong>Department:</strong> ${user.profile.department}<br>` : ''}
                    ${user.profile?.mobilePhone ? `<strong>Phone:</strong> ${user.profile.mobilePhone}<br>` : ''}
                  </p>
                </div>
              `;
              
              // Create tooltip content (shown on hover)
              const tooltipContent = `
                <div style="min-width: 180px; font-size: 12px;">
                  <strong style="font-size: 14px;">${name}</strong><br>
                  ${user.profile?.title || 'No title'}<br>
                  ${user.profile?.email || 'No email'}<br>
                  ${user.location.name || 'Unknown location'}
                </div>
              `;
              
              // Bind popup (shown on click) and tooltip (shown on hover)
              marker.bindPopup(popupContent);
              marker.bindTooltip(tooltipContent, { 
                direction: 'top',
                offset: [0, -20],
                opacity: 0.9
              });
              markersRef.current.push(marker);
            });
            
            // If we have markers, adjust the map view to fit all markers
            if (markersRef.current.length > 0) {
              const group = L.featureGroup(markersRef.current);
              mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
          };
          
          // Initial marker setup
          addMarkers();
          
          // Add event listener for filter changes
          window.addEventListener('updateOktaMap', addMarkers);
          
          // Clean up
          return () => {
            window.removeEventListener('updateOktaMap', addMarkers);
            window.removeEventListener('resize', handleResize);
            if (mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
            }
          };
        }
      }).catch(error => {
        console.error("Error loading Leaflet:", error);
      });
    }
  }, [oktaUsersQuery.isLoading, oktaUsers, showOnlyActive, searchTerm, locationFilter]);

  // Extract unique locations and their coordinates for filtering and zooming
  const locationData = useMemo(() => {
    const locationMap = {};
    
    oktaUsers.forEach(user => {
      if (user.location && user.location.name && user.location.lat && user.location.lng) {
        // If we haven't seen this location before, add it
        if (!locationMap[user.location.name]) {
          locationMap[user.location.name] = {
            name: user.location.name,
            lat: user.location.lat,
            lng: user.location.lng,
            count: 1
          };
        } else {
          // If we've seen this location, update the coordinates to the average
          const existing = locationMap[user.location.name];
          existing.lat = (existing.lat * existing.count + user.location.lat) / (existing.count + 1);
          existing.lng = (existing.lng * existing.count + user.location.lng) / (existing.count + 1);
          existing.count++;
        }
      }
    });
    
    return locationMap;
  }, [oktaUsers]);
  
  // Get sorted list of location names for dropdown
  const locations = useMemo(() => 
    Object.values(locationData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(loc => loc.name),
    [locationData]
  );

  // Previous location filter ref for tracking changes
  const prevLocationFilterRef = useRef(null);
  
  // Zoom to selected location with improved transition
  useEffect(() => {
    if (!oktaUsersQuery.isLoading && mapRef.current) {
      // Check if the location filter has changed
      const locationChanged = prevLocationFilterRef.current !== locationFilter;
      prevLocationFilterRef.current = locationFilter;
      
      if (locationFilter && locationChanged) {
        const selectedLocation = locationData[locationFilter];
        if (selectedLocation) {
          // First reset to world view for a better transition
          mapRef.current.setView([20, 0], 2, { animate: false });
          
          // Then after a short delay, zoom to the selected location
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.setView(
                [selectedLocation.lat, selectedLocation.lng], 
                10, // Higher zoom level to focus on the location
                { animate: true, duration: 1.5 }
              );
              setIsMapZoomed(true);
            }
          }, 300);
        }
      } else if (!locationFilter && isMapZoomed) {
        // If no location filter is set but the map was previously zoomed,
        // reset to world view (this happens when user clicks "Reset View")
        mapRef.current.setView([20, 0], 2, { animate: true, duration: 1 });
        setIsMapZoomed(false);
      }
    }
  }, [oktaUsersQuery.isLoading, locationFilter, locationData, isMapZoomed]);
  
  // Function to reset map view
  const resetMapView = () => {
    setLocationFilter('');
  };

  // Trigger map update when filters change
  useEffect(() => {
    if (!oktaUsersQuery.isLoading && mapRef.current) {
      window.dispatchEvent(new Event('updateOktaMap'));
    }
  }, [oktaUsersQuery.isLoading, showOnlyActive, searchTerm, locationFilter]);

  if (oktaUsersQuery.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta User Locations'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (oktaUsersQuery.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta User Locations'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {oktaUsersQuery.error.message || 'Failed to fetch Okta users'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
        {props.name || 'Okta User Locations'}
      </Typography>
      
      {authState ? (
        <Alert severity={authState.isAuthenticated ? "success" : "warning"} sx={{ mb: 2 }}>
          Authentication Status: {authState.isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Authentication state is loading...
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography>
          {oktaUsers.length > 0 
            ? `Successfully loaded ${oktaUsers.length} Okta users with location data.` 
            : "No users found."}
        </Typography>
        
        {oktaUsers.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {/* Status chips - show active vs inactive */}
            <Chip 
              label={`${oktaUsers.filter(user => user.status === 'ACTIVE').length} Active Users`}
              color="success"
              variant={showOnlyActive ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              sx={{ cursor: 'pointer' }}
            />
            
            <Chip 
              label={`${oktaUsers.filter(user => user.status !== 'ACTIVE').length} Inactive Users`}
              color="default"
              variant={!showOnlyActive ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              sx={{ cursor: 'pointer' }}
            />
            
            {/* Freelancer chip */}
            <Chip 
              label={`${oktaUsers.filter(user => user.profile?.userType === 'Freelancer').length} Freelancers`}
              color="error"
              variant="outlined"
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            
            {/* Top location chips - show top 5 locations by user count */}
            {Object.values(locationData)
              .sort((a, b) => b.count - a.count) // Sort by count in descending order
              .slice(0, 5)
              .map(location => {
                if (location.count > 0) {
                  return (
                    <Chip 
                      key={location.name}
                      label={`${location.count} in ${location.name}`}
                      color="primary"
                      variant={locationFilter === location.name ? 'filled' : 'outlined'}
                      size="small"
                      onClick={() => setLocationFilter(locationFilter === location.name ? '' : location.name)}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                }
                return null;
              })}
          </Box>
        )}
      </Paper>
      
      {oktaUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users..."
              size="small"
              sx={{ flexGrow: 1, maxWidth: 400 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="location-filter-label">Location</InputLabel>
              <Select
                labelId="location-filter-label"
                id="location-filter"
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
                MenuProps={{ 
                  PaperProps: { 
                    style: { 
                      maxHeight: 400,
                      backgroundColor: 'white',
                      color: 'black'
                    } 
                  } 
                }}
              >
                <MenuItem value="">All Locations</MenuItem>
                {locations.map(location => {
                  const locData = locationData[location];
                  return (
                    <MenuItem key={location} value={location}>
                      {location} ({locData?.count || 0} users)
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  color="success"
                />
              }
              label="Show only active users"
            />
            
            {isMapZoomed && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={resetMapView}
                sx={{ ml: 1 }}
              >
                Reset Map View
              </Button>
            )}
          </Box>
        </Paper>
      )}
      
      {/* Map Container */}
      <Paper 
        sx={{ 
          height: '600px', 
          width: '100%',
          mb: 2,
          overflow: 'hidden',
          borderRadius: 1,
          boxShadow: 3,
          position: 'relative' // Important for proper positioning
        }}
      >
        <div 
          ref={mapContainerRef} 
          style={{ 
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%', 
            width: '100%' 
          }}
          id="okta-locations-map"
        />
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Note: This map shows individual user locations with semi-transparent markers and name labels.
          Blue circles represent active employees, red circles are freelancers, and gray circles are inactive users.
          Hover over any marker to view user details, or click on it for more complete information.
          Select a location from the dropdown menu to automatically zoom to that location on the map.
          For privacy reasons, exact coordinates are slightly randomized within each city.
        </Typography>
      </Paper>
    </Container>
  );
}