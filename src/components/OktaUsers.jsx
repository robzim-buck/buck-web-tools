import React, { useState, useMemo } from 'react';
import { 
  Typography, Container, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, Tooltip, TextField, InputAdornment, Switch, FormControlLabel,
  Select, MenuItem, InputLabel, FormControl, Grid, Card, CardContent, Divider,
  Stack, LinearProgress, IconButton, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useOktaAuth } from '@okta/okta-react';
import { useApiGet, useProtectedApiGet } from '../hooks/useApi';

export default function OktaUsers(props) {
  const { authState } = useOktaAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithPhotos, setShowOnlyWithPhotos] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // Options: '' (all), 'ACTIVE', 'STAGED', etc.
  const [showOnlyFreelancers, setShowOnlyFreelancers] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  
  console.log("OktaUsers render - Auth state:", authState?.isAuthenticated);

  // Fetch Okta users with React Query
  const oktaUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch Google staff users with React Query
  const googleStaffUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Staff' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch Google freelance users with React Query
  const googleFreelanceUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Freelance' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onSuccess: (data) => {
        console.log("Google freelance users fetched successfully:", data.length);
      }
    },
    dependencies: ['freelance'] // Add to query key to differentiate from staff query
  });

  // Combine and process Google users data
  const googleUsers = useMemo(() => {
    if (googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading) {
      return [];
    }
    
    if (googleStaffUsersQuery.error || googleFreelanceUsersQuery.error) {
      console.error("Error fetching Google users");
      return [];
    }

    const staffData = googleStaffUsersQuery.data || [];
    const freelanceData = googleFreelanceUsersQuery.data || [];
    
    // Combine both sets of users
    const data = [...staffData, ...freelanceData];
    console.log("Combined Google users:", data.length);
    
    // Process Google user data to normalize thumbnail URLs
    const processedData = data.map(user => {
      // Check for thumbnail in various possible property names
      const thumbnailUrl = user?.thumbnailPhotoUrl || user?.thumbnail || user?.photo || user?.photoUrl;
      
      if (thumbnailUrl && !user.thumbnailPhotoUrl) {
        // Add standardized property name if found in an alternative property
        return { ...user, thumbnailPhotoUrl: thumbnailUrl };
      }
      
      return user;
    });
    
    // Count users with thumbnails
    const usersWithThumbnails = processedData.filter(user => user.thumbnailPhotoUrl).length;
    console.log(`Google users with thumbnails: ${usersWithThumbnails}`);
    
    return processedData;
  }, [googleStaffUsersQuery.data, googleFreelanceUsersQuery.data, 
      googleStaffUsersQuery.isLoading, googleFreelanceUsersQuery.isLoading,
      googleStaffUsersQuery.error, googleFreelanceUsersQuery.error]);
  
  // Create Google user lookup by email
  const googleUsersByEmail = useMemo(() => {
    if (!googleUsers.length) return {};
    
    const emailMap = {};
    
    googleUsers.forEach(user => {
      if (user?.primaryEmail) {
        emailMap[user.primaryEmail.toLowerCase()] = user;
        
        // Also store by username part only (before the @) for flexible matching
        const username = user.primaryEmail.split('@')[0].toLowerCase();
        if (username) {
          emailMap[username] = user;
        }
      }
    });
    
    console.log(`Created Google user map with ${Object.keys(emailMap).length} entries`);
    return emailMap;
  }, [googleUsers]);
  
  // Helper function to get Google user for an Okta user
  const getGoogleUserForOktaUser = (oktaUser) => {
    if (!oktaUser?.profile?.email) return null;
    
    const email = oktaUser.profile.email.toLowerCase();
    
    // Try exact email match first
    if (googleUsersByEmail[email]) {
      return googleUsersByEmail[email];
    }
    
    // Try username part only
    const username = email.split('@')[0].toLowerCase();
    if (username && googleUsersByEmail[username]) {
      return googleUsersByEmail[username];
    }
    
    return null;
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = (user) => {
    const firstName = user.profile?.firstName || '';
    const lastName = user.profile?.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    } else {
      return 'U';
    }
  };

  // Toggle expand state for a user
  const toggleUserExpansion = (userId) => {
    const newExpandedUsers = new Set(expandedUsers);
    if (newExpandedUsers.has(userId)) {
      newExpandedUsers.delete(userId);
    } else {
      newExpandedUsers.add(userId);
    }
    setExpandedUsers(newExpandedUsers);
  };

  // Determine loading state
  const isLoading = oktaUsersQuery.isLoading || 
                    googleStaffUsersQuery.isLoading || 
                    googleFreelanceUsersQuery.isLoading;

  // Determine error state
  const error = oktaUsersQuery.error ? 
                "Failed to fetch Okta users" : 
                (googleStaffUsersQuery.error && googleFreelanceUsersQuery.error) ? 
                "Failed to fetch Google users" : null;

  // Get the Okta users data
  const oktaUsers = oktaUsersQuery.data || [];

  if (isLoading) {
    return (
      <Box>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta Users'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta Users'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
        {props.name || 'Okta Users'}
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
      
      <Paper sx={{ p: 3, mb: 2, overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ mr: 1 }} />
          User Summary Dashboard
        </Typography>
        
        {oktaUsers.length === 0 ? (
          <Typography>No users found.</Typography>
        ) : (
          <>
            {/* Top summary cards */}
            <Grid container spacing={1.5} sx={{ mb: 2, mt: 0.5 }}>
              {/* Total Users card */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined" sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'white',
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 1.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Total Users
                      </Typography>
                      <PeopleIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ my: 0.5, fontWeight: 'bold' }}>
                      {oktaUsers.length}
                    </Typography>
                    <Typography variant="caption">
                      {googleUsers.length} connected to Google
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Active Users card */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined" sx={{ 
                  bgcolor: 'success.light', 
                  color: 'white',
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 1.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Active Users
                      </Typography>
                      <CheckCircleIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ my: 0.5, fontWeight: 'bold' }}>
                      {oktaUsers.filter(user => user.status === 'ACTIVE').length}
                    </Typography>
                    <Typography variant="caption">
                      {Math.round(oktaUsers.filter(user => user.status === 'ACTIVE').length / oktaUsers.length * 100)}% of total users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Users with Photos card */}
              <Grid item xs={12} md={3}>
                <Card 
                  variant="outlined"
                  onClick={() => setShowOnlyWithPhotos(!showOnlyWithPhotos)} 
                  sx={{ 
                    bgcolor: 'secondary.light', 
                    color: 'white',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                    border: showOnlyWithPhotos ? '2px solid white' : 'none'
                  }}
                >
                  <CardContent sx={{ p: 1.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Users with Photos
                      </Typography>
                      <PhotoCameraIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ my: 0.5, fontWeight: 'bold' }}>
                      {googleUsers.filter(u => u.thumbnailPhotoUrl).length}
                    </Typography>
                    <Typography variant="caption">
                      {Math.round(googleUsers.filter(u => u.thumbnailPhotoUrl).length / googleUsers.length * 100)}% of Google users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Freelancers card */}
              <Grid item xs={12} md={3}>
                <Card 
                  variant="outlined" 
                  onClick={() => setShowOnlyFreelancers(!showOnlyFreelancers)}
                  sx={{ 
                    bgcolor: 'error.light', 
                    color: 'white',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                    border: showOnlyFreelancers ? '2px solid white' : 'none'
                  }}
                >
                  <CardContent sx={{ p: 1.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Freelancers
                      </Typography>
                      <WorkIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ my: 0.5, fontWeight: 'bold' }}>
                      {googleUsers.filter(u => 
                        u.organizations && 
                        u.organizations[0]?.costCenter && 
                        u.organizations[0].costCenter.toLowerCase() === 'freelance'
                      ).length}
                    </Typography>
                    <Typography variant="caption">
                      Click to {showOnlyFreelancers ? 'hide' : 'show'} only freelancers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Status distribution graph */}
            <Box sx={{ mt: 2, mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <VerifiedUserIcon sx={{ mr: 0.75, fontSize: '1rem' }} />
                User Status Distribution
              </Typography>
              
              <Grid container spacing={1}>
                {['ACTIVE', 'STAGED', 'PROVISIONED', 'DEPROVISIONED', 'SUSPENDED', 'RECOVERY', 'PASSWORD_EXPIRED'].map(status => {
                  const count = oktaUsers.filter(user => user.status === status).length;
                  if (count > 0) {
                    const percentage = Math.round((count / oktaUsers.length) * 100);
                    let statusColor;
                    
                    switch(status) {
                      case 'ACTIVE': statusColor = 'success.main'; break;
                      case 'DEPROVISIONED': statusColor = 'error.main'; break;
                      case 'SUSPENDED': statusColor = 'warning.dark'; break;
                      case 'PASSWORD_EXPIRED': statusColor = 'warning.main'; break;
                      default: statusColor = 'info.main';
                    }
                    
                    return (
                      <Grid item xs={12} key={status}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 0.25,
                            cursor: 'pointer',
                            p: 0.25,
                            borderRadius: 1,
                            bgcolor: statusFilter === status ? 'rgba(0,0,0,0.05)' : 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' }
                          }}
                          onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        >
                          <Box sx={{ minWidth: 150, display: 'flex', alignItems: 'center' }}>
                            {status === 'ACTIVE' ? (
                              <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                            ) : (
                              <PauseCircleFilledIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                            )}
                            <Typography variant="caption" sx={{ fontWeight: statusFilter === status ? 'bold' : 'regular' }}>
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, mx: 1.5 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.08)', 
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: statusColor
                                }
                              }} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 45, textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                              {count} ({percentage}%)
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  }
                  return null;
                })}
              </Grid>
            </Box>
            
            {/* Action chips */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {/* Status filter chips */}
              {['ACTIVE', 'STAGED', 'PROVISIONED', 'DEPROVISIONED', 'SUSPENDED', 'RECOVERY', 'PASSWORD_EXPIRED'].map(status => {
                const count = oktaUsers.filter(user => user.status === status).length;
                if (count > 0) {
                  return (
                    <Chip 
                      key={status}
                      label={`${count} ${status.charAt(0) + status.slice(1).toLowerCase()}`}
                      color={status === 'ACTIVE' ? 'success' : 'default'}
                      variant={statusFilter === status ? 'filled' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                }
                return null;
              })}
              
              {/* Photo chip */}
              <Chip 
                icon={<PhotoCameraIcon />}
                label={`${googleUsers.filter(u => u.thumbnailPhotoUrl).length} Users with Photos`}
                color="secondary" 
                size="small"
                variant={showOnlyWithPhotos ? 'filled' : 'outlined'}
                onClick={() => setShowOnlyWithPhotos(!showOnlyWithPhotos)}
                sx={{ cursor: 'pointer' }}
              />
              
              {/* Freelancer chip */}
              <Chip 
                icon={<WorkIcon />}
                label={`${googleUsers.filter(u => 
                  u.organizations && 
                  u.organizations[0]?.costCenter && 
                  u.organizations[0].costCenter.toLowerCase() === 'freelance'
                ).length} Freelancers`}
                color="error" 
                size="small"
                variant={showOnlyFreelancers ? 'filled' : 'outlined'}
                onClick={() => setShowOnlyFreelancers(!showOnlyFreelancers)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </>
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
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: 'white',
                      color: 'black'
                    }
                  }
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="STAGED">Staged</MenuItem>
                <MenuItem value="PROVISIONED">Provisioned</MenuItem>
                <MenuItem value="DEPROVISIONED">Deprovisioned</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="RECOVERY">Recovery</MenuItem>
                <MenuItem value="PASSWORD_EXPIRED">Password Expired</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyWithPhotos}
                  onChange={(e) => setShowOnlyWithPhotos(e.target.checked)}
                  color="secondary"
                />
              }
              label="Show only users with photos"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyFreelancers}
                  onChange={(e) => setShowOnlyFreelancers(e.target.checked)}
                  color="error"
                />
              }
              label="Show only freelancers"
            />
          </Box>
        </Paper>
      )}
      
      {oktaUsers.length > 0 && (() => {
        // Apply filters
        let filteredUsers = [...oktaUsers];
        
        // Apply search filter
        if (searchTerm) {
          filteredUsers = filteredUsers.filter(user => {
            const searchableFields = [
              user.profile?.displayName,
              user.profile?.firstName,
              user.profile?.lastName,
              user.profile?.login,
              user.profile?.email
            ];
            
            return searchableFields.some(field => 
              field && field.toLowerCase().includes(searchTerm.toLowerCase())
            );
          });
        }
        
        // Apply status filter
        if (statusFilter) {
          filteredUsers = filteredUsers.filter(user => 
            user.status === statusFilter
          );
        }
        
        // Apply photo filter
        if (showOnlyWithPhotos) {
          filteredUsers = filteredUsers.filter(user => 
            getGoogleUserForOktaUser(user)?.thumbnailPhotoUrl
          );
        }
        
        // Apply freelancer filter
        if (showOnlyFreelancers) {
          filteredUsers = filteredUsers.filter(user => {
            const googleUser = getGoogleUserForOktaUser(user);
            return googleUser && googleUser.organizations && 
                  googleUser.organizations[0]?.costCenter && 
                  googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';
          });
        }
        
        return (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell width="60">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const googleUser = getGoogleUserForOktaUser(user);
                const isActive = user.status === 'ACTIVE';
                const userId = user.id || user.profile?.login;
                const isExpanded = expandedUsers.has(userId);
                
                return (
                  <React.Fragment key={userId}>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {googleUser?.thumbnailPhotoUrl ? (
                            <Tooltip title={
                              (googleUser.organizations && 
                               googleUser.organizations[0]?.costCenter && 
                               googleUser.organizations[0].costCenter.toLowerCase() === 'freelance') 
                                ? 'Freelancer - Google profile photo' 
                                : 'Google profile photo'
                            }>
                              <Avatar
                                src={googleUser.thumbnailPhotoUrl}
                                alt={getUserInitials(user)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: (googleUser.organizations &&
                                          googleUser.organizations[0]?.costCenter &&
                                          googleUser.organizations[0].costCenter.toLowerCase() === 'freelance')
                                    ? '2px solid #f50057'
                                    : '2px solid #8c9eff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  bgcolor: isActive ? 'primary.main' : 'text.disabled',
                                  color: 'white',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  '& img': {
                                    loading: 'lazy'
                                  }
                                }}
                                onError={() => {
                                  console.log("Image failed to load for:", user.profile?.email);
                                }}
                              >
                                {getUserInitials(user)}
                              </Avatar>
                            </Tooltip>
                          ) : (
                            <Avatar 
                              sx={{ 
                                bgcolor: isActive ? 'primary.main' : 'text.disabled',
                                color: 'white',
                                width: 32, 
                                height: 32,
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                border: '2px solid #8c9eff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              {getUserInitials(user)}
                            </Avatar>
                          )}
                          <Box>
                            {user.profile?.displayName || 
                              `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
                            {(googleUser && 
                             googleUser.organizations && 
                             googleUser.organizations[0]?.costCenter && 
                             googleUser.organizations[0].costCenter.toLowerCase() === 'freelance') && (
                              <Chip 
                                label="Freelance" 
                                size="small" 
                                color="error" 
                                variant="outlined"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.profile?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.status || 'Unknown'} 
                          color={isActive ? 'success' : 'default'} 
                          size="small"
                          variant={isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleUserExpansion(userId)}
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Raw User Data
                            </Typography>
                            <Box sx={{ 
                              bgcolor: 'grey.900', 
                              color: 'white', 
                              p: 2, 
                              borderRadius: 1, 
                              overflow: 'auto',
                              maxHeight: 400,
                              fontFamily: 'monospace',
                              fontSize: '0.875rem'
                            }}>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(user, null, 2)}
                              </pre>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length === oktaUsers.length ? (
                `Showing all ${oktaUsers.length} users`
              ) : (
                <>
                  Showing {filteredUsers.length} of {oktaUsers.length} users
                  {statusFilter && ` (filtered by status: ${statusFilter})`}
                  {searchTerm && ` (search: "${searchTerm}")`}
                  {showOnlyWithPhotos && ` (with photos only)`}
                  {showOnlyFreelancers && ` (freelancers only)`}
                </>
              )}
            </Typography>
          </Box>
        </TableContainer>
        );
      })()}
    </Box>
  );
}