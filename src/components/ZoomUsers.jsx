import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, TextField, InputAdornment, FormControl, 
  Select, MenuItem, InputLabel, TableSortLabel, FormControlLabel, Switch,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useOktaAuth } from '@okta/okta-react';
import { useQuery } from '@tanstack/react-query';
// Add global style to fix webkit-text-size-adjust error
import { Global, css } from '@emotion/react';

const globalStyles = css`
  html {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
`;

export default function ZoomUsers(props) {
  // Always declare all hooks at the top level
  const { authState } = useOktaAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithPhotos, setShowOnlyWithPhotos] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState(''); // Options: '' (all), 'Basic', 'Licensed', 'On-Prem'
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('email');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  console.log("ZoomUsers render - Auth state:", authState?.isAuthenticated);

  // Debugging useEffect - included at top level
  useEffect(() => {
    console.log("ZoomUsers component mounted");
    return () => {
      console.log("ZoomUsers component unmounted");
    };
  }, []);

  // Fetch Zoom users with React Query
  const {
    data: zoomUsersData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['zoomUsers'],
    queryFn: async () => {
      try {
        const response = await fetch('https://laxcoresrv.buck.local:8000/zoomusers');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching Zoom users:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    onSuccess: (data) => {
      console.log("Zoom users fetched successfully:", data.length);
      if (data.length > 0) {
        console.log("Sample Zoom user:", data[0]);
      }
    }
  });

  // Get user initials for avatar fallback
  const getUserInitials = (user) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    // Try name fields first
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    }
    
    // Fallback to email if name fields are empty
    if (user.email && typeof user.email === 'string' && user.email.trim()) {
      const emailUsername = user.email.split('@')[0];
      if (emailUsername.length >= 2) {
        return `${emailUsername[0]}${emailUsername[1]}`.toUpperCase();
      } else if (emailUsername.length === 1) {
        return emailUsername[0].toUpperCase();
      }
    }
    
    // Final fallback
    return 'ZU'; // Zoom User
  };

  // Extract unique user types - call useMemo regardless of loading/error state
  const userTypes = useMemo(() => {
    if (!zoomUsersData || zoomUsersData.length === 0) return [];
    
    try {
      const types = [...new Set(
        zoomUsersData
          .filter(user => user.type)
          .map(user => user.type)
      )];
      
      return types.map(type => ({
        id: type,
        name: getTypeDisplay(type)
      }));
    } catch (error) {
      console.error("Error processing user types:", error);
      return [];
    }
  }, [zoomUsersData]);

  // Get user type display name
  const getTypeDisplay = (type) => {
    const typeMap = {
      1: 'Basic',
      2: 'Licensed',
      3: 'On-Prem'
    };
    return typeMap[type] || 'Unknown';
  };

  // Sorting functions
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    console.log(`Sorting by ${property} in ${newOrder} order (previous: ${orderBy} in ${order} order)`);
    
    setOrderBy(property);
    setOrder(newOrder);
  };

  // Function to get comparable value for sorting
  const getSortValue = (user, property) => {
    switch(property) {
      case 'name':
        return (user.display_name || `${user.first_name || ''} ${user.last_name || ''}`).toLowerCase();
      case 'email':
        return (user.email || '').toLowerCase();
      case 'type':
        return user.type || 0;
      case 'department':
        return (user.dept || '').toLowerCase();
      case 'status':
        return (user.status || '').toLowerCase();
      default:
        return user[property] || '';
    }
  };

  // Sorting utilities - defined outside of render paths
  function descendingComparator(a, b, orderBy) {
    const aValue = getSortValue(a, orderBy);
    const bValue = getSortValue(b, orderBy);
    
    // Handle null or undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  
  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }
  
  function stableSort(array, comparator) {
    try {
      const stabilizedThis = array.map((el, index) => [el, index]);
      stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
      });
      return stabilizedThis.map((el) => el[0]);
    } catch (error) {
      console.error("Error in stableSort:", error);
      return array; // Return unsorted array on error
    }
  }

  // Call useMemo for filtered and sorted data regardless of loading/error state
  const filteredAndSortedUsers = useMemo(() => {
    if (!zoomUsersData || zoomUsersData.length === 0) return [];
    
    try {
      // Apply filters
      let filtered = [...zoomUsersData];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(user => {
          const searchableFields = [
            user.first_name,
            user.last_name,
            user.email,
            user.display_name,
            user.dept
          ];
          
          return searchableFields.some(field => 
            field && String(field).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }
      
      // Apply user type filter
      if (userTypeFilter) {
        filtered = filtered.filter(user => 
          user.type === userTypeFilter
        );
      }
      
      // Apply photo filter
      if (showOnlyWithPhotos) {
        filtered = filtered.filter(user => 
          user.pic_url
        );
      }
      
      // Check for duplicate IDs and log warnings
      const idMap = new Map();
      filtered.forEach(user => {
        if (user.id) {
          if (idMap.has(user.id)) {
            console.warn(`Duplicate Zoom user ID found: ${user.id}`, {
              user1: idMap.get(user.id),
              user2: user
            });
          } else {
            idMap.set(user.id, user);
          }
        }
      });
      
      // Sort the filtered users
      return stableSort(filtered, getComparator(order, orderBy));
    } catch (error) {
      console.error("Error filtering/sorting users:", error);
      return [];
    }
  }, [zoomUsersData, searchTerm, userTypeFilter, showOnlyWithPhotos, order, orderBy]);

  // Also memoize just filtered users for count display
  const filteredUsers = useMemo(() => {
    if (!zoomUsersData || zoomUsersData.length === 0) return [];
    
    try {
      let filtered = [...zoomUsersData];
      
      if (searchTerm) {
        filtered = filtered.filter(user => {
          const searchableFields = [
            user.first_name,
            user.last_name,
            user.email,
            user.display_name,
            user.dept
          ];
          
          return searchableFields.some(field => 
            field && String(field).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }
      
      if (userTypeFilter) {
        filtered = filtered.filter(user => 
          user.type === userTypeFilter
        );
      }
      
      if (showOnlyWithPhotos) {
        filtered = filtered.filter(user => 
          user.pic_url
        );
      }
      
      return filtered;
    } catch (error) {
      console.error("Error filtering users:", error);
      return [];
    }
  }, [zoomUsersData, searchTerm, userTypeFilter, showOnlyWithPhotos]);

  // Handler functions for details dialog
  const handleShowDetails = (user) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedUser(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Zoom Users'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Zoom Users'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {error.message || "Failed to fetch Zoom users"}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Empty state
  if (!zoomUsersData || zoomUsersData.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Zoom Users'}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>No Users Found</Typography>
          <Typography color="text.secondary">
            No Zoom users were returned from the API.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Main UI
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Global styles={globalStyles} />
      <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
        {props.name || 'Zoom Users'}
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
          Successfully loaded {zoomUsersData.length} Zoom users.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {/* User type chips */}
          {userTypes.map(type => {
            const count = zoomUsersData.filter(user => user.type === type.id).length;
            if (count > 0) {
              return (
                <Chip 
                  key={type.id}
                  label={`${count} ${type.name}`}
                  color={type.id === 2 ? 'primary' : 'default'} // Licensed users highlighted
                  variant={userTypeFilter === type.id ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => setUserTypeFilter(userTypeFilter === type.id ? '' : type.id)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            }
            return null;
          })}
          
          {/* Photo chip */}
          <Chip 
            label={`${zoomUsersData.filter(u => u.pic_url).length} Users with Photos`}
            color="secondary" 
            size="small"
            variant={showOnlyWithPhotos ? 'filled' : 'outlined'}
            onClick={() => setShowOnlyWithPhotos(!showOnlyWithPhotos)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Paper>
      
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
            <InputLabel id="user-type-filter-label">User Type</InputLabel>
            <Select
              labelId="user-type-filter-label"
              id="user-type-filter"
              value={userTypeFilter}
              label="User Type"
              onChange={(e) => setUserTypeFilter(e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: 'white',
                    color: 'black'
                  }
                }
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {userTypes.map(type => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
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
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table size="small" key={`${orderBy}-${order}`}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Name {orderBy === 'name' ? (order === 'asc' ? '↑' : '↓') : ''}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleRequestSort('email')}
                >
                  Email {orderBy === 'email' ? (order === 'asc' ? '↑' : '↓') : ''}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'department'}
                  direction={orderBy === 'department' ? order : 'asc'}
                  onClick={() => handleRequestSort('department')}
                >
                  Department {orderBy === 'department' ? (order === 'asc' ? '↑' : '↓') : ''}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleRequestSort('type')}
                >
                  Type {orderBy === 'type' ? (order === 'asc' ? '↑' : '↓') : ''}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status {orderBy === 'status' ? (order === 'asc' ? '↑' : '↓') : ''}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.map((user, index) => {
              const userType = getTypeDisplay(user.type);
              const isLicensed = user.type === 2;
              const isActive = user.status === 'active';
              
              // Create a guaranteed unique key with array index
              const uniqueKey = `zoom-user-${index}`;
              
              return (
                <TableRow key={uniqueKey}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.pic_url ? (
                        <Avatar
                          src={user.pic_url}
                          alt={getUserInitials(user)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: isLicensed
                              ? '2px solid #2D8CFF' // Zoom blue
                              : '2px solid #8c9eff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            bgcolor: isLicensed ? '#2D8CFF' : 'primary.main',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            '& img': {
                              loading: 'lazy'
                            }
                          }}
                          onError={() => {
                            console.log("Image failed to load for:", user.email);
                          }}
                        >
                          {getUserInitials(user)}
                        </Avatar>
                      ) : (
                        <Avatar
                          sx={{
                            bgcolor: isLicensed ? '#2D8CFF' : 'primary.main',
                            color: 'white',
                            width: 32,
                            height: 32,
                            border: isLicensed
                              ? '2px solid #2D8CFF'
                              : '2px solid #8c9eff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getUserInitials(user)}
                        </Avatar>
                      )}
                      <Box>
                        {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`}
                        {user.pmi && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            PMI: {user.pmi}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.dept || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={userType} 
                      color={isLicensed ? 'primary' : 'default'} 
                      size="small"
                      variant={isLicensed ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status || 'Unknown'} 
                      color={isActive ? 'success' : 'default'} 
                      size="small"
                      variant={isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<InfoOutlinedIcon />}
                      onClick={() => handleShowDetails(user)}
                      sx={{ textTransform: 'none' }}
                    >
                      Show Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredUsers.length === zoomUsersData.length ? (
              `Showing all ${zoomUsersData.length} users`
            ) : (
              <>
                Showing {filteredUsers.length} of {zoomUsersData.length} users
                {userTypeFilter && ` (filtered by type: ${getTypeDisplay(userTypeFilter)})`}
                {searchTerm && ` (search: "${searchTerm}")`}
                {showOnlyWithPhotos && ` (with photos only)`}
              </>
            )}
          </Typography>
        </Box>
      </TableContainer>
      
      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '60vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              User Details: {selectedUser?.display_name || selectedUser?.email || 'Unknown User'}
            </Typography>
            <IconButton onClick={handleCloseDetails} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Paper
            sx={{
              p: 2,
              bgcolor: '#f5f5f5',
              fontFamily: 'monospace',
              fontSize: '14px',
              overflow: 'auto',
              maxHeight: '70vh'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {selectedUser ? JSON.stringify(selectedUser, null, 2) : '{}'}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}