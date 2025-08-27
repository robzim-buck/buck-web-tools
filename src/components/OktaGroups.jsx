import { useState, useMemo } from 'react';
import { useQueries, useQuery } from "@tanstack/react-query";
import { 
  Typography, Box, Container, Grid, 
  Card, CardContent, Chip, Divider,
  Paper, TextField, InputAdornment,
  Avatar, Tooltip, IconButton,
  Collapse, Button, CircularProgress, Alert, AlertTitle,
  Stack, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, ListItemAvatar
} from '@mui/material';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  ContentCopy as ContentCopyIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export default function OktaGroups(props) {
  // State for search and expanded items
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [copiedText, setCopiedText] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  
  // Toggle group expansion
  const toggleGroupExpand = (groupId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Toggle expand all groups
  const toggleExpandAll = () => {
    if (expandAll) {
      // Collapse all
      setExpandedGroups({});
    } else {
      // Expand all
      const newState = {};
      oktaGroups.data?.forEach(group => {
        newState[group.id] = true;
      });
      setExpandedGroups(newState);
    }
    setExpandAll(!expandAll);
  };
  
  // Function to handle clearing the search filter
  const handleClearFilter = () => {
    setSearchTerm('');
  };
  
  // Copy text to clipboard function
  const copyToClipboard = (text, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(text);
        setTimeout(() => setCopiedText(''), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };
  
  // Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString.split('T')[0] || 'Invalid date';
    }
  };

  // Fetch Okta groups data
  const [oktaGroups] = useQueries({
    queries: [
      {
        queryKey: ["oktagroups"],
        queryFn: async () => {
          try {
            const res = await fetch('https://laxcoresrv.buck.local:8000/buckokta/category/att/comparison/match?_category=groups', {
              headers: {
                'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
              }
            });
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          } catch (error) {
            console.error("Error fetching groups:", error);
            throw error;
          }
        },
        retry: 2,
        retryDelay: 1000,
      }
    ]
  });

  // Process group data with useMemo for better performance
  const { filteredGroups, groupCategories } = useMemo(() => {
    if (!oktaGroups.data || !Array.isArray(oktaGroups.data)) {
      return { filteredGroups: [], groupCategories: {} };
    }

    // Apply search filter
    let filtered = oktaGroups.data;
    
    if (searchTerm) {
      filtered = filtered.filter(group => {
        const searchableFields = [
          group.profile?.name,
          group.profile?.description,
          group.id
        ];
        
        return searchableFields.some(field => 
          field && field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Sort groups alphabetically by name
    filtered.sort((a, b) => {
      const nameA = a.profile?.name?.toLowerCase() || '';
      const nameB = b.profile?.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    // Categorize groups by prefix (get first word before space or dash)
    const categories = {};
    filtered.forEach(group => {
      const name = group.profile?.name || '';
      let category = 'Other';
      
      if (name) {
        // Try to extract category from name
        const match = name.match(/^([^-\s]+)/);
        if (match && match[1]) {
          category = match[1];
        }
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(group);
    });

    return { 
      filteredGroups: filtered,
      groupCategories: categories
    };
  }, [oktaGroups.data, searchTerm]);

  // Extract unique categories and sort them
  const uniqueCategories = useMemo(() => {
    return Object.keys(groupCategories).sort();
  }, [groupCategories]);

  // Loading state
  if (oktaGroups.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta Groups'}
        </Typography>
        
        {/* Loading skeleton */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading group data...</Typography>
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (oktaGroups.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Okta Groups'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {oktaGroups.error.message || JSON.stringify(oktaGroups.error)}
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  // Data state
  if (oktaGroups.data) {
    // Not found state
    if (oktaGroups.data.detail === "Not Found") {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
            {props.name || 'Okta Groups'}
          </Typography>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">No group data found</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              The API returned a "Not Found" response.
            </Typography>
          </Paper>
        </Container>
      );
    }
    
    // No data or empty array state
    if (!oktaGroups.data || !Array.isArray(oktaGroups.data) || oktaGroups.data.length === 0) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
            {props.name || 'Okta Groups'}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>No Groups Found</AlertTitle>
            No group data is available. The API returned an empty response.
          </Alert>
        </Container>
      );
    }

    try {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant='h4' color="primary" fontWeight="medium">
              {props.name || 'Okta Groups'}
              <Typography component="span" variant="subtitle1" sx={{ ml: 2, color: 'text.secondary' }}>
                {filteredGroups.length} Groups
              </Typography>
            </Typography>
            
            <Button 
              variant="outlined" 
              size="small"
              onClick={toggleExpandAll}
              startIcon={expandAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </Button>
          </Box>
          
          {/* Search and filter section */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, maxWidth: 400 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <Tooltip title="Clear search">
                        <IconButton size="small" onClick={handleClearFilter}>
                          <ClearAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {uniqueCategories.slice(0, 5).map(category => (
                  <Chip
                    key={category}
                    size="small"
                    label={`${category} (${groupCategories[category]?.length || 0})`}
                    onClick={() => setSearchTerm(category)}
                    color={searchTerm === category ? 'primary' : 'default'}
                    variant={searchTerm === category ? 'filled' : 'outlined'}
                  />
                ))}
                
                {uniqueCategories.length > 5 && (
                  <Tooltip title="More categories available">
                    <Chip
                      size="small"
                      label={`+${uniqueCategories.length - 5} more`}
                      icon={<InfoIcon fontSize="small" />}
                      variant="outlined"
                    />
                  </Tooltip>
                )}
              </Box>
            </Stack>
          </Paper>
          
          {/* Groups List */}
          {filteredGroups.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>No groups match your search</Typography>
              <Button 
                variant="outlined" 
                onClick={handleClearFilter}
                startIcon={<ClearAllIcon />}
                sx={{ mt: 2 }}
              >
                Clear Search
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {/* Render by categories if not searching */}
              {!searchTerm && uniqueCategories.map(category => (
                <Grid size={12} key={category}>
                  <Typography 
                    variant="h6" 
                    color="primary"
                    sx={{ 
                      mb: 1, 
                      mt: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}
                  >
                    {category}
                    <Chip 
                      size="small" 
                      label={groupCategories[category]?.length || 0} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Typography>
                  
                  {groupCategories[category]?.map((group) => (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      isExpanded={expandedGroups[group.id] || false}
                      toggleGroupExpand={toggleGroupExpand}
                      copyToClipboard={copyToClipboard}
                      copiedText={copiedText}
                      formatDate={formatDate}
                    />
                  ))}
                </Grid>
              ))}
              
              {/* Flat list when searching */}
              {searchTerm && filteredGroups.map((group) => (
                <Grid size={12} key={group.id}>
                  <GroupCard 
                    group={group} 
                    isExpanded={expandedGroups[group.id] || false}
                    toggleGroupExpand={toggleGroupExpand}
                    copyToClipboard={copyToClipboard}
                    copiedText={copiedText}
                    formatDate={formatDate}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredGroups.length} of {oktaGroups.data.length} groups
              {searchTerm && ` • Search: "${searchTerm}"`}
            </Typography>
          </Box>
        </Container>
      );
    } catch (error) {
      console.error("Error rendering groups:", error);
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
            {props.name || 'Okta Groups'}
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error Processing Data</AlertTitle>
            There was an error processing the group data. Please try refreshing the page.
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Error details: {error.message}
            </Typography>
          </Alert>
        </Container>
      );
    }
  }
}

// Separated GroupCard component for better organization
function GroupCard({ group, isExpanded, toggleGroupExpand, copyToClipboard, copiedText, formatDate }) {
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch member count for this group only when expanded
  const { data: memberCount } = useQuery({
    queryKey: ['groupMemberCount', group.id],
    queryFn: async () => {
      try {
        const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/get_group_members?groupid=${group.id}`, {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });
        
        if (!response.ok) {
          return 0;
        }
        
        const members = await response.json();
        return Array.isArray(members) ? members.length : 0;
      } catch (error) {
        console.error(`Error fetching member count for group ${group.id}:`, error);
        return 0;
      }
    },
    enabled: isExpanded, // Only fetch when card is expanded
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  // Fetch group members when dialog is opened
  const { data: groupMembers, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['groupMembers', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      
      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/get_group_members?groupid=${selectedGroupId}`, {
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch group members: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!selectedGroupId && showUsersDialog,
    retry: 2,
    retryDelay: 1000
  });

  const handleShowUsers = (groupId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedGroupId(groupId);
    setShowUsersDialog(true);
  };

  const handleCloseUsersDialog = () => {
    setShowUsersDialog(false);
    setSelectedGroupId(null);
  };

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent sx={{ p: 2 }}>
        {/* Group summary - always visible */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={(e) => toggleGroupExpand(group.id, e)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: isExpanded ? 'primary.main' : 'primary.light',
              transition: 'background-color 0.3s ease'
            }}>
              <GroupIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {group.profile?.name || 'Unnamed Group'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                {group.profile?.description || 'No description'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`Created: ${formatDate(group.created)}`}>
              <Chip 
                size="small"
                variant="outlined"
                label={formatDate(group.created)}
                icon={<CalendarIcon fontSize="small" />}
              />
            </Tooltip>
            <IconButton 
              size="small"
              onClick={(e) => toggleGroupExpand(group.id, e)}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {/* Expandable details */}
        <Collapse in={isExpanded}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Basic Information
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Group ID</Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {group.id}
                    <Tooltip title={copiedText === group.id ? "Copied!" : "Copy to clipboard"}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => copyToClipboard(group.id, e)}
                        color={copiedText === group.id ? "success" : "default"}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Type</Typography>
                  <Chip
                    size="small"
                    label={group.type || 'OKTA_GROUP'}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Name</Typography>
                  <Typography variant="body2" sx={{ maxWidth: '250px', textAlign: 'right' }}>
                    {group.profile?.name || 'N/A'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" fontWeight="medium">Description</Typography>
                  <Typography variant="body2" sx={{ maxWidth: '250px', textAlign: 'right' }}>
                    {group.profile?.description || 'No description provided'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Timestamps
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Created</Typography>
                  <Chip 
                    size="small" 
                    variant="outlined" 
                    label={formatDate(group.created)}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Last Updated</Typography>
                  <Chip 
                    size="small" 
                    variant="outlined" 
                    label={formatDate(group.lastUpdated)}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="medium">Membership Updated</Typography>
                  <Chip 
                    size="small" 
                    variant="outlined" 
                    label={formatDate(group.lastMembershipUpdated)}
                  />
                </Box>
                
                {/* Additional metadata if available */}
                {group._app_count > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Statistics
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="medium">Connected Apps</Typography>
                      <Chip 
                        size="small" 
                        color="success"
                        label={group._app_count || 0}
                      />
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Show Users Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={(e) => handleShowUsers(group.id, e)}
            >
              Show Users {memberCount !== undefined ? `(${memberCount})` : ''}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>

    {/* Users Dialog */}
    <Dialog 
      open={showUsersDialog} 
      onClose={handleCloseUsersDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h6">
            {group.profile?.name} - Members
          </Typography>
        </Box>
        <IconButton onClick={handleCloseUsersDialog} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: 'white' }}>
        {membersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : membersError ? (
          <Alert severity="error">
            <AlertTitle>Error Loading Members</AlertTitle>
            {membersError.message}
          </Alert>
        ) : groupMembers && groupMembers.length > 0 ? (
          <List>
            {groupMembers.map((member) => (
              <ListItem key={member.id || member.login}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {member.profile?.displayName || member.profile?.firstName + ' ' + member.profile?.lastName || 'Unknown User'}
                      {member.status && (
                        <Chip 
                          size="small" 
                          label={member.status} 
                          color={member.status === 'ACTIVE' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {member.profile?.email || 'No email'}
                      </Typography>
                      {member.profile?.login && member.profile?.login !== member.profile?.email && (
                        <Typography variant="caption" color="text.secondary">
                          Login: {member.profile?.login}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No members found in this group
          </Typography>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}