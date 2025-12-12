import React from 'react';
import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import CircularProgress from '@mui/material/CircularProgress';
import { guessLocationFromName } from '../utils/locationGuesser';

export default function HammerspaceSites(props) {
  const [expanded, setExpanded] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Toggle expansion state for a specific site
  const handleToggle = (siteId) => {
    setExpanded(prev => ({
      ...prev,
      [siteId]: !prev[siteId]
    }));
  };

  const hammerspaceSitesQuery = useProtectedApiGet('/hammerspace', {
    queryParams: { item: 'sites' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  const hammerspaceSites = useMemo(() => ({
    isLoading: hammerspaceSitesQuery.isLoading,
    error: hammerspaceSitesQuery.error,
    data: hammerspaceSitesQuery.data
  }), [hammerspaceSitesQuery.isLoading, hammerspaceSitesQuery.error, hammerspaceSitesQuery.data]);

  // Process sites with location data
  const sitesWithLocations = useMemo(() => {
    if (!hammerspaceSites.data) return [];

    const rawData = hammerspaceSites.data.results || hammerspaceSites.data;
    const dataArray = Array.isArray(rawData) ? rawData : [];

    return dataArray.map(site => ({
      ...site,
      guessedLocation: guessLocationFromName(site.name)
    })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [hammerspaceSites.data]);

  // Initialize map when switching to map view
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current || sitesWithLocations.length === 0) return;

    import('leaflet').then(L => {
      // Load CSS if not already loaded
      if (!document.getElementById('leaflet-css-sites')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-sites';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.textContent = `
          .leaflet-container { width: 100%; height: 100%; z-index: 1; }
          .site-marker { background: #667eea; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
          .site-marker.high-confidence { background: #48bb78; }
          .site-marker.medium-confidence { background: #ed8936; }
          .site-marker.low-confidence { background: #a0aec0; }
        `;
        document.head.appendChild(style);
      }

      // Initialize or reset map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      mapContainerRef.current.style.width = '100%';
      mapContainerRef.current.style.height = '500px';

      const map = L.map(mapContainerRef.current, {
        center: [30, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Group sites by location to handle overlapping markers
      const locationGroups = {};
      sitesWithLocations.forEach(site => {
        if (site.guessedLocation) {
          const key = `${site.guessedLocation.lat.toFixed(2)},${site.guessedLocation.lng.toFixed(2)}`;
          if (!locationGroups[key]) {
            locationGroups[key] = {
              location: site.guessedLocation,
              sites: []
            };
          }
          locationGroups[key].sites.push(site);
        }
      });

      // Add markers for each location group
      Object.values(locationGroups).forEach((group, groupIndex) => {
        const { location, sites } = group;

        // Add slight offset for multiple sites at same location
        sites.forEach((site, siteIndex) => {
          const offset = siteIndex * 0.5;
          const angle = (siteIndex / sites.length) * 2 * Math.PI;
          const lat = location.lat + (offset * Math.cos(angle) * 0.1);
          const lng = location.lng + (offset * Math.sin(angle) * 0.1);

          const confidenceClass = `${location.confidence || 'low'}-confidence`;

          const icon = L.divIcon({
            className: `site-marker ${confidenceClass}`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map);

          const createdDate = new Date(site.created);
          const modifiedDate = new Date(site.modified);

          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong style="font-size: 14px; color: #2d3748;">${site.name}</strong>
              <br/>
              <span style="color: #718096; font-size: 12px;">${location.name}</span>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;"/>
              <div style="font-size: 11px; color: #4a5568;">
                <div><strong>Internal ID:</strong> ${site.internalId || 'N/A'}</div>
                <div><strong>Mgmt Address:</strong> ${site.mgmtAddress || 'N/A'}</div>
                <div><strong>Created:</strong> ${createdDate.toLocaleDateString()}</div>
                <div><strong>Modified:</strong> ${modifiedDate.toLocaleDateString()}</div>
                <div style="margin-top: 4px;">
                  <span style="background: ${location.confidence === 'high' ? '#c6f6d5' : location.confidence === 'medium' ? '#feebc8' : '#e2e8f0'};
                         padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                    ${location.confidence} confidence
                  </span>
                </div>
              </div>
            </div>
          `);

          markersRef.current.push(marker);
        });
      });

      // Fit bounds to show all markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
      }

      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode, sitesWithLocations]);

  if (hammerspaceSites.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (hammerspaceSites.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Failed to load Hammerspace sites</Typography>
          <Typography variant="body2">{hammerspaceSites.error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  if (hammerspaceSites.data) {
    const sortedData = sitesWithLocations;

    if (!sortedData || sortedData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">No Hammerspace sites found</Typography>
        </Box>
      );
    }

    // Calculate statistics
    const recentSites = sortedData.filter(site => {
      const daysSinceModification = Math.floor((Date.now() - new Date(site.modified)) / (1000 * 60 * 60 * 24));
      return daysSinceModification < 7;
    });

    const siteTypes = [...new Set(sortedData.map(site => site.type).filter(Boolean))];
    const averageAge = Math.floor(sortedData.reduce((sum, site) => {
      return sum + Math.floor((Date.now() - new Date(site.created)) / (1000 * 60 * 60 * 24));
    }, 0) / sortedData.length);

    // Location confidence stats
    const locationStats = {
      high: sortedData.filter(s => s.guessedLocation?.confidence === 'high').length,
      medium: sortedData.filter(s => s.guessedLocation?.confidence === 'medium').length,
      low: sortedData.filter(s => s.guessedLocation?.confidence === 'low').length
    };

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant='h4' color="primary" fontWeight="medium">
            {props.name || 'Hammerspace Sites'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="table" sx={{ textTransform: 'none', px: 2 }}>
                <ViewListIcon sx={{ mr: 1 }} />
                Table
              </ToggleButton>
              <ToggleButton value="map" sx={{ textTransform: 'none', px: 2 }}>
                <MapIcon sx={{ mr: 1 }} />
                Map
              </ToggleButton>
            </ToggleButtonGroup>
            <Chip
              label={`${sortedData.length} Sites`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>

        {/* Summary Statistics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {sortedData.length}
              </Typography>
              <Typography variant="body2">
                Total Sites
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {recentSites.length}
              </Typography>
              <Typography variant="body2">
                Recently Updated
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {siteTypes.length}
              </Typography>
              <Typography variant="body2">
                Site Types
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {averageAge}
              </Typography>
              <Typography variant="body2">
                Avg Age (days)
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Map View */}
        {viewMode === 'map' && (
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Site Locations
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip size="small" label={`${locationStats.high} High`} sx={{ bgcolor: '#c6f6d5', color: '#22543d' }} />
                <Chip size="small" label={`${locationStats.medium} Medium`} sx={{ bgcolor: '#feebc8', color: '#744210' }} />
                <Chip size="small" label={`${locationStats.low} Low`} sx={{ bgcolor: '#e2e8f0', color: '#4a5568' }} />
                <Typography variant="caption" sx={{ color: '#718096', alignSelf: 'center', ml: 1 }}>
                  confidence
                </Typography>
              </Box>
            </Box>
            <Box ref={mapContainerRef} sx={{ height: 500, width: '100%' }} />
          </Paper>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '40px' }}>
                    {/* Expand column */}
                  </TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" />
                      Name
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" />
                      Location
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                    Internal ID
                  </TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon fontSize="small" />
                      Created
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UpdateIcon fontSize="small" />
                      Modified
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((site) => {
                  const createdDate = new Date(site.created);
                  const modifiedDate = new Date(site.modified);
                  const daysSinceCreation = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
                  const daysSinceModification = Math.floor((Date.now() - modifiedDate) / (1000 * 60 * 60 * 24));
                  const siteKey = site.name || site.uoid?.uuid || site.internalId;
                  const isRecentlyUpdated = daysSinceModification < 7;
                  const location = site.guessedLocation;

                  return (
                    <React.Fragment key={siteKey}>
                      <TableRow
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'action.selected' },
                          borderLeft: isRecentlyUpdated ? '4px solid #4caf50' : '4px solid #2196f3',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggle(siteKey)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {expanded[siteKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {site.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {location && (
                            <Tooltip title={`Confidence: ${location.confidence}`}>
                              <Chip
                                icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                                label={location.name}
                                size="small"
                                sx={{
                                  bgcolor: location.confidence === 'high' ? '#c6f6d5' :
                                    location.confidence === 'medium' ? '#feebc8' : '#e2e8f0',
                                  color: location.confidence === 'high' ? '#22543d' :
                                    location.confidence === 'medium' ? '#744210' : '#4a5568',
                                  fontWeight: 500
                                }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant="outlined"
                            color="secondary"
                            size="small"
                            label={site.internalId || 'N/A'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={createdDate.toLocaleString()}>
                            <Box>
                              <Typography variant="body2">
                                {createdDate.toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {daysSinceCreation === 0 ? 'Today' :
                                  daysSinceCreation === 1 ? 'Yesterday' :
                                    `${daysSinceCreation} days ago`}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={modifiedDate.toLocaleString()}>
                            <Box>
                              <Typography variant="body2">
                                {modifiedDate.toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {daysSinceModification === 0 ? 'Today' :
                                  daysSinceModification === 1 ? 'Yesterday' :
                                    `${daysSinceModification} days ago`}
                              </Typography>
                              {isRecentlyUpdated && (
                                <Chip
                                  variant="filled"
                                  color="success"
                                  size="small"
                                  label="Recent"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>

                      {/* Collapsible Details Row */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={expanded[siteKey]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Data Address
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {site.dataAddress || 'N/A'}
                                  </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Management Address
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {site.mgmtAddress || 'N/A'}
                                  </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Site Type
                                  </Typography>
                                  <Typography variant="body2">
                                    {site.type || 'N/A'}
                                  </Typography>
                                </Grid>

                                {location && (
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      Guessed Location
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LocationOnIcon sx={{ fontSize: 18, color: '#667eea' }} />
                                      <Typography variant="body2">
                                        {location.name}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={location.confidence}
                                        sx={{
                                          bgcolor: location.confidence === 'high' ? '#c6f6d5' :
                                            location.confidence === 'medium' ? '#feebc8' : '#e2e8f0',
                                          fontSize: '0.7rem',
                                          height: 20
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                                    </Typography>
                                  </Grid>
                                )}

                                {site.uoid && (
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      UUID
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {site.uoid.uuid}
                                    </Typography>
                                  </Grid>
                                )}

                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Timestamps
                                  </Typography>
                                  <Typography variant="body2">
                                    Created: {createdDate.toLocaleString()}
                                  </Typography>
                                  <Typography variant="body2">
                                    Modified: {modifiedDate.toLocaleString()}
                                  </Typography>
                                </Grid>

                                {/* Raw Data */}
                                {Object.keys(site).length > 6 && (
                                  <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      Raw Data
                                    </Typography>
                                    <Box sx={{
                                      p: 1,
                                      bgcolor: 'white',
                                      borderRadius: 1,
                                      maxHeight: 200,
                                      overflow: 'auto',
                                      border: '1px solid',
                                      borderColor: 'grey.300'
                                    }}>
                                      <pre style={{
                                        margin: 0,
                                        fontSize: '0.75rem',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace'
                                      }}>
                                        {JSON.stringify(site, null, 2)}
                                      </pre>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    );
  }

  // Fallback
  return null;
}
