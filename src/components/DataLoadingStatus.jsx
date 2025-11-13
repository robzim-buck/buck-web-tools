import { Alert, Box, LinearProgress, Typography, Collapse, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useState, useEffect } from 'react';
import { useAppData } from '../contexts/AppDataProvider';

export default function DataLoadingStatus() {
  const { queries } = useAppData();
  const [showAlert, setShowAlert] = useState(true);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Define data sources to monitor
  const dataSources = [
    { key: 'googleStaff', label: 'Google Staff Users', query: queries.googleStaff },
    { key: 'googleFreelance', label: 'Google Freelance Users', query: queries.googleFreelance },
    { key: 'oktaUsers', label: 'Okta Users', query: queries.oktaUsers },
    { key: 'oktaGroups', label: 'Okta Groups', query: queries.oktaGroups },
    { key: 'ldapRawMachineInfo', label: 'LDAP Machines', query: queries.ldapRawMachineInfo },
    { key: 'ldapBasicMachineInfo', label: 'LDAP Machine Info', query: queries.ldapBasicMachineInfo },
    { key: 'assignments', label: 'Workstation Assignments', query: queries.assignments },
    { key: 'parsecUsers', label: 'Parsec Users', query: queries.parsecUsers },
    { key: 'parsecReport', label: 'Parsec Report', query: queries.parsecReport },
    { key: 'jamfMachineInfo', label: 'Jamf Computers', query: queries.jamfMachineInfo },
    { key: 'saltMachineInfo', label: 'Salt Machine Info', query: queries.saltMachineInfo },
    { key: 'saltPingInfo', label: 'Salt Ping Status', query: queries.saltPingInfo },
    { key: 'slackUsers', label: 'Slack Users', query: queries.slackUsers },
  ];

  // Calculate loading statistics
  const totalSources = dataSources.length;
  const loadedCount = dataSources.filter(source => !source.query.isLoading && !source.query.error).length;
  const errorCount = dataSources.filter(source => source.query.error).length;
  const loadingCount = dataSources.filter(source => source.query.isLoading).length;
  const isFullyLoaded = loadedCount === totalSources;
  const progress = (loadedCount / totalSources) * 100;

  // Auto-hide after all data is loaded
  useEffect(() => {
    if (isFullyLoaded && !hasShownOnce) {
      setHasShownOnce(true);
      // Auto-hide after 3 seconds when fully loaded
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullyLoaded, hasShownOnce]);

  // Reset when data starts loading again
  useEffect(() => {
    if (loadingCount > 0 && hasShownOnce) {
      setShowAlert(true);
    }
  }, [loadingCount, hasShownOnce]);

  return (
    <Collapse in={showAlert}>
      <Box sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: '450px',
        width: '100%'
      }}>
        <Alert
          severity={isFullyLoaded ? 'success' : errorCount > 0 ? 'warning' : 'info'}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {isFullyLoaded ? 'All Data Loaded!' : 'Loading Application Data...'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Progress: {loadedCount}/{totalSources}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: isFullyLoaded
                      ? 'linear-gradient(90deg, #43a047 0%, #66bb6a 100%)'
                      : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  }
                }}
              />
            </Box>

            <Box sx={{
              maxHeight: '250px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
              }
            }}>
              {dataSources.map((source) => (
                <Box
                  key={source.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    backgroundColor: source.query.isLoading
                      ? 'rgba(102, 126, 234, 0.08)'
                      : source.query.error
                      ? 'rgba(211, 47, 47, 0.08)'
                      : 'rgba(67, 160, 71, 0.08)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {source.query.isLoading ? (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(102, 126, 234, 0.3)',
                        borderTopColor: '#667eea',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                  ) : source.query.error ? (
                    <ErrorIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                  ) : (
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#43a047' }} />
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      fontWeight: source.query.isLoading ? 600 : 400,
                      color: source.query.error ? '#d32f2f' : 'inherit'
                    }}
                  >
                    {source.label}
                  </Typography>

                  {source.query.error && (
                    <Chip
                      label="Error"
                      size="small"
                      color="error"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}

                  {!source.query.isLoading && !source.query.error && source.query.data && (
                    <Chip
                      label={Array.isArray(source.query.data) ? `${source.query.data.length}` : 'Ready'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(67, 160, 71, 0.2)',
                        color: '#2e7d32',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>

            {errorCount > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                  {errorCount} data source{errorCount > 1 ? 's' : ''} failed to load. The application will continue with available data.
                </Typography>
              </Box>
            )}
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
}
