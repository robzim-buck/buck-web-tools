import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid, Chip, Box, Divider, List, ListItem, ListItemText, Paper, Typography,
  Container, TextField, InputAdornment, Card, CardContent, Avatar,
  CircularProgress, Alert, AlertTitle, Tab, Tabs, IconButton, Tooltip,
  Badge, TablePagination, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  PictureAsPdf as AdobeIcon,
  PersonOutline as PersonIcon,
  Business as BusinessIcon,
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon,
  FilterList as FilterIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useQueries } from "@tanstack/react-query";
import { useAppData } from '../contexts/AppDataProvider';

export default function AdobeUsers() {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Fetch Adobe data directly (not pre-fetched)
  const [adobeUsers] = useQueries({
    queries: [
      {
        queryKey: ["adobeUsers"],
        queryFn: () => fetch("https://laxcoresrv.buck.local:8000/adobe_users")
          .then((res) => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    ]
  });

  // Get Google users from context for cross-referencing
  const { data: appData, isDataLoading, requestData } = useAppData();

  // Request the data this component needs
  useEffect(() => {
    requestData(['googleStaff', 'googleFreelance']);
  }, [requestData]);

  const googleUsersByEmail = appData.googleUsersByEmail || {};

  // Helper function to get Google user for an Adobe user
  const getGoogleUserForAdobeUser = (adobeUser) => {
    if (!adobeUser?.email && !adobeUser?.username) return null;

    const email = adobeUser.email?.toLowerCase() || adobeUser.username?.toLowerCase();
    if (!email) return null;

    // Try exact email match first
    if (googleUsersByEmail[email]) {
      console.log(`Found Google user for Adobe user ${email}:`, googleUsersByEmail[email].primaryEmail);
      return googleUsersByEmail[email];
    }

    // Try username part only
    const username = email.split('@')[0].toLowerCase();
    if (username && googleUsersByEmail[username]) {
      console.log(`Found Google user by username ${username} for Adobe user ${email}:`, googleUsersByEmail[username].primaryEmail);
      return googleUsersByEmail[username];
    }

    return null;
  };

  // Extract unique groups from all users
  const allGroups = useMemo(() => {
    if (!adobeUsers.data) return [];

    const groupsSet = new Set();
    adobeUsers.data.forEach(user => {
      if (user.groups && Array.isArray(user.groups)) {
        user.groups.forEach(group => groupsSet.add(group));
      }
    });

    return Array.from(groupsSet).sort();
  }, [adobeUsers.data]);

  // Process and filter data
  const {
    sortedData,
    activeUsers,
    inactiveUsers,
    adobeIdUsers,
    federatedIdUsers,
    filteredUsers,
    businessAccounts,
    regularAccounts,
    orgSpecific,
    notOrgSpecific
  } = useMemo(() => {
    if (!adobeUsers.data) {
      return {
        sortedData: [],
        activeUsers: [],
        inactiveUsers: [],
        adobeIdUsers: [],
        federatedIdUsers: [],
        filteredUsers: [],
        businessAccounts: [],
        regularAccounts: [],
        orgSpecific: [],
        notOrgSpecific: []
      };
    }
    
    // Sort by email
    const sorted = [...adobeUsers.data].sort((a, b) => 
      a.email?.localeCompare(b.email) || a.username?.localeCompare(b.username)
    );
    
    // Filter by status and type
    const active = sorted.filter(user => user.status === 'active');
    const inactive = sorted.filter(user => user.status !== 'active');
    const adobeId = sorted.filter(user => user.type === 'adobeID');
    const federatedId = sorted.filter(user => user.type === 'federatedID');
    const business = sorted.filter(user => user.businessAccount);
    const regular = sorted.filter(user => !user.businessAccount);
    const orgSpec = sorted.filter(user => user.orgSpecific);
    const notOrgSpec = sorted.filter(user => !user.orgSpecific);
    
    // Apply search filter
    let filtered = sorted;
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = sorted.filter(user =>
        (user.firstname?.toLowerCase().includes(lowerCaseSearch)) ||
        (user.lastname?.toLowerCase().includes(lowerCaseSearch)) ||
        (user.email?.toLowerCase().includes(lowerCaseSearch)) ||
        (user.username?.toLowerCase().includes(lowerCaseSearch)) ||
        (user.domain?.toLowerCase().includes(lowerCaseSearch))
      );
    }

    // Apply group filter
    if (selectedGroup) {
      filtered = filtered.filter(user =>
        user.groups && user.groups.includes(selectedGroup)
      );
    }
    
    return {
      sortedData: sorted,
      activeUsers: active,
      inactiveUsers: inactive,
      adobeIdUsers: adobeId,
      federatedIdUsers: federatedId,
      filteredUsers: filtered,
      businessAccounts: business,
      regularAccounts: regular,
      orgSpecific: orgSpec,
      notOrgSpecific: notOrgSpec
    };
  }, [adobeUsers.data, searchTerm, selectedGroup]);
  
  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0); // Reset to first page when changing tabs
  };
  
  // Get the list to display based on active tab
  const getDisplayList = () => {
    switch (activeTab) {
      case 0: // All
        return filteredUsers;
      case 1: // Active
        return searchTerm ? filteredUsers.filter(user => user.status === 'active') : activeUsers;
      case 2: // Inactive
        return searchTerm ? filteredUsers.filter(user => user.status !== 'active') : inactiveUsers;
      case 3: // Adobe ID
        return searchTerm ? filteredUsers.filter(user => user.type === 'adobeID') : adobeIdUsers;
      case 4: // Federated ID
        return searchTerm ? filteredUsers.filter(user => user.type === 'federatedID') : federatedIdUsers;
      default:
        return filteredUsers;
    }
  };
  
  // Get current page items
  const currentPageItems = useMemo(() => {
    try {
      const displayList = getDisplayList() || [];
      return displayList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    } catch (error) {
      console.error("Error computing current page items:", error);
      return [];
    }
  }, [page, rowsPerPage, activeTab, filteredUsers]);
  
  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search changes
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Loading state
  const isLoadingComplete = adobeUsers.isLoading || isDataLoading('googleUsers');

  if (isLoadingComplete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Adobe Users
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (adobeUsers.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Adobe Users
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          {adobeUsers.error.message || "An unknown error occurred"}
        </Alert>
      </Container>
    );
  }
  
  // Render main component
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Adobe Users
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge badgeContent={activeUsers.length} color="success" sx={{ mr: 1 }} max={9999}>
                    <ActiveIcon color="success" />
                  </Badge>
                  <Typography variant="h6" color="success.main">Active Users</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((activeUsers.length / sortedData.length) * 100)}% of total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge badgeContent={federatedIdUsers.length} color="primary" sx={{ mr: 1 }} max={9999}>
                    <PersonIcon color="primary" />
                  </Badge>
                  <Typography variant="h6" color="primary.main">Federated ID</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((federatedIdUsers.length / sortedData.length) * 100)}% of total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge badgeContent={adobeIdUsers.length} color="warning" sx={{ mr: 1 }} max={9999}>
                    <PersonIcon color="warning" />
                  </Badge>
                  <Typography variant="h6" color="warning.main">Adobe ID</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((adobeIdUsers.length / sortedData.length) * 100)}% of total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge badgeContent={businessAccounts.length} color="info" sx={{ mr: 1 }} max={9999}>
                    <BusinessIcon color="info" />
                  </Badge>
                  <Typography variant="h6" color="info.main">Business Accounts</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((businessAccounts.length / sortedData.length) * 100)}% of total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Search and Filter Bar */}
        <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="group-filter-label">Filter by Group</InputLabel>
            <Select
              labelId="group-filter-label"
              id="group-filter"
              value={selectedGroup}
              label="Filter by Group"
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">
                <em>All Groups</em>
              </MenuItem>
              {allGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Filter Results">
            <Badge
              color="primary"
              variant="dot"
              invisible={activeTab === 0 && !searchTerm && !selectedGroup}
              max={9999}
            >
              <FilterIcon color="action" />
            </Badge>
          </Tooltip>

          {(searchTerm || selectedGroup) && (
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} matches found
            </Typography>
          )}
        </Box>
        
        {/* Tabs for filtering */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`All (${filteredUsers.length})`} 
            id="tab-0"
          />
          <Tab 
            label={`Active (${searchTerm ? filteredUsers.filter(u => u.status === 'active').length : activeUsers.length})`} 
            id="tab-1"
          />
          <Tab 
            label={`Inactive (${searchTerm ? filteredUsers.filter(u => u.status !== 'active').length : inactiveUsers.length})`} 
            id="tab-2"
          />
          <Tab 
            label={`Adobe ID (${searchTerm ? filteredUsers.filter(u => u.type === 'adobeID').length : adobeIdUsers.length})`} 
            id="tab-3"
          />
          <Tab 
            label={`Federated ID (${searchTerm ? filteredUsers.filter(u => u.type === 'federatedID').length : federatedIdUsers.length})`} 
            id="tab-4"
          />
        </Tabs>
      </Box>
      
      {/* User List */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        {currentPageItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No users match your search criteria
            </Typography>
            {searchTerm && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search term or clearing filters
              </Typography>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {currentPageItems.map((user, index) => (
              <UserListItem 
                key={`user-${user.email || user.username}-${index}`} 
                user={user}
                isLast={index === currentPageItems.length - 1}
                googleUser={getGoogleUserForAdobeUser(user)}
              />
            ))}
          </List>
        )}
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={(() => {
            try {
              const list = getDisplayList();
              return list ? list.length : 0;
            } catch (error) {
              console.error("Error getting display list length:", error);
              return 0;
            }
          })()}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Container>
  );
}

// Separate component for user list items
function UserListItem({ user, isLast, googleUser }) {
  const [expanded, setExpanded] = useState(false);
  const [rawDataOpen, setRawDataOpen] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleRawDataOpen = (e) => {
    e.stopPropagation();
    setRawDataOpen(true);
  };

  const handleRawDataClose = () => {
    setRawDataOpen(false);
  };
  
  // Generate user avatar with initials
  const getUserInitials = () => {
    const first = user.firstname ? user.firstname[0] : '';
    const last = user.lastname ? user.lastname[0] : '';
    return (first + last).toUpperCase() || '??';
  };
  
  // Determine avatar color based on user type
  const getAvatarColor = () => {
    if (user.status !== 'active') return '#757575';  // Gray for inactive
    if (user.type === 'adobeID') return '#ff9800';    // Orange for Adobe ID
    return '#1976d2';  // Blue for federated ID
  };
  
  return (
    <>
      <ListItem 
        button 
        onClick={toggleExpanded}
        sx={{ 
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': { bgcolor: 'action.hover' },
          py: 1.5
        }}
      >
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
          {(() => {
            try {
              const isFreelance = googleUser?.organizations &&
                                googleUser.organizations[0]?.costCenter &&
                                googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';

              if (googleUser?.thumbnailPhotoUrl) {
                return (
                  <Tooltip title={isFreelance ? "Freelancer - Google profile photo" : "Google profile photo"}>
                    <Avatar
                      src={googleUser.thumbnailPhotoUrl}
                      alt={getUserInitials()}
                      onError={() => {
                        console.log("Image failed to load for:", user.email || user.username);
                      }}
                      sx={{
                        mr: 2,
                        width: 40,
                        height: 40,
                        border: isFreelance
                          ? '2px solid #f50057'  // Freelancer border
                          : '2px solid #8c9eff', // Staff border
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        bgcolor: getAvatarColor(),
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        '& img': {
                          loading: 'lazy'
                        }
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                  </Tooltip>
                );
              }
            } catch (error) {
              console.error("Error rendering avatar:", error);
            }
            
            // Default avatar if no Google photo or error
            return (
              <Avatar
                sx={{
                  bgcolor: getAvatarColor(),
                  color: 'white',
                  mr: 2,
                  width: 40,
                  height: 40,
                  border: '2px solid #8c9eff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {getUserInitials()}
              </Avatar>
            );
          })()}
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {`${user.firstname || ''} ${user.lastname || ''}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email || user.username}
                </Typography>
                {(() => {
                  try {
                    const isFreelance = googleUser?.organizations &&
                                      googleUser.organizations[0]?.costCenter &&
                                      googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';

                    if (isFreelance) {
                      return (
                        <Chip
                          label="Freelance"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      );
                    }
                    return null;
                  } catch (error) {
                    console.error("Error rendering freelance chip:", error);
                    return null;
                  }
                })()}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  size="small"
                  color={user.status === 'active' ? 'success' : 'default'}
                  label={user.status === 'active' ? 'Active' : 'Inactive'}
                  variant={user.status === 'active' ? 'filled' : 'outlined'}
                />
                <Chip
                  size="small"
                  color={user.type === 'adobeID' ? 'warning' : 'primary'}
                  label={user.type}
                  variant="outlined"
                />
                <Tooltip title="View Raw Data">
                  <IconButton
                    size="small"
                    onClick={handleRawDataOpen}
                    sx={{ ml: 0.5 }}
                  >
                    <CodeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Groups section - always visible */}
            {user.groups && user.groups.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Groups ({user.groups.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {user.groups.map((group, idx) => (
                    <Chip
                      key={`${group}-${idx}`}
                      size="small"
                      label={group}
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {expanded && (
              <>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={user.domain || 'N/A'}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={user.businessAccount ? 'info' : 'default'}
                    label={user.businessAccount ? 'Business Account' : 'Regular Account'}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={user.orgSpecific ? 'secondary' : 'default'}
                    label={user.orgSpecific ? 'Org Specific' : 'Not Org Specific'}
                  />

                  {user.country && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Country: ${user.country}`}
                    />
                  )}
                </Box>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Adobe ID:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.id || user.userId || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Username:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.username || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Admin:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.admin === true ? 'Yes' : user.admin === false ? 'No' : 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Account Type:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.type || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Created:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.createdDate ? new Date(user.createdDate).toLocaleDateString() :
                         user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Last Login:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() :
                         user.lastAccessed ? new Date(user.lastAccessed).toLocaleDateString() : 'Never'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Domain:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.domain || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" component="span">
                        Product Profiles:
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {user.productProfiles ? user.productProfiles.join(', ') :
                         user.productAccess ? user.productAccess.join(', ') : 'None'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {(() => {
                  try {
                    if (googleUser) return (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Google Account Details
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" component="span">
                            Primary Email:
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            {(() => {
                              try {
                                return googleUser?.primaryEmail || 'N/A';
                              } catch (error) {
                                return 'N/A';
                              }
                            })()}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" component="span">
                            Full Name:
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            {(() => {
                              try {
                                return googleUser?.name?.fullName || 'N/A';
                              } catch (error) {
                                return 'N/A';
                              }
                            })()}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" component="span">
                            Department:
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            {(() => {
                              try {
                                return googleUser?.organizations?.[0]?.department || 'N/A';
                              } catch (error) {
                                return 'N/A';
                              }
                            })()}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" component="span">
                            Title:
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            {(() => {
                              try {
                                return googleUser?.organizations?.[0]?.title || 'N/A';
                              } catch (error) {
                                return 'N/A';
                              }
                            })()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                    );
                    return null;
                  } catch (error) {
                    return null;
                  }
                })()}
              </>
            )}
          </Box>
        </Box>
      </ListItem>
      
      {!isLast && <Divider component="li" />}

      {/* Raw Data Dialog */}
      <Dialog
        open={rawDataOpen}
        onClose={handleRawDataClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Raw User Data - {user.firstname} {user.lastname}
        </DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.85rem',
              maxHeight: '60vh'
            }}
          >
            {JSON.stringify(user, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRawDataClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}