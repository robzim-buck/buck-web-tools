import { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useProtectedApiGet } from '../hooks/useApi';
import {
  Typography, Box, Container, Grid,
  Card, CardContent, Chip, Divider,
  Paper, TextField, InputAdornment,
  Avatar, Tooltip, IconButton,
  Collapse, Button, CircularProgress, Alert, AlertTitle,
  Stack, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, ListItemAvatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, TableSortLabel
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
  Close as CloseIcon,
  Download as DownloadIcon,
  PersonRemove as PersonRemoveIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon
} from '@mui/icons-material';

export default function OktaGroups(props) {
  // State for search and expanded items
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [copiedText, setCopiedText] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [sortColumn, setSortColumn] = useState('name'); // Column to sort by
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

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

  // Handle column sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create group handlers
  const handleShowCreateGroup = () => {
    setShowCreateGroupDialog(true);
  };

  const handleCloseCreateGroup = () => {
    setShowCreateGroupDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name.');
      return;
    }

    if (!newGroupDescription.trim()) {
      alert('Please enter a group description.');
      return;
    }

    setCreatingGroup(true);

    try {
      // URL encode the name and description for path parameters
      const encodedName = encodeURIComponent(newGroupName.trim());
      const encodedDescription = encodeURIComponent(newGroupDescription.trim());

      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/create_group/${encodedName}/${encodedDescription}`, {
        method: 'POST',
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create group: ${response.status}`);
      }

      const result = await response.json();
      console.log('Create group API response:', result);

      // Check if group already exists
      if (result?.error && result.error.toLowerCase().includes('already exists')) {
        alert(`Group "${newGroupName}" already exists. Please choose a different name.`);
        return;
      }

      // Check if there's an error in the response
      if (result?.error || result?.message?.includes('error') || result?.status === 'error') {
        throw new Error(result.error || result.message || 'Create group operation failed');
      }

      // Check for success response formats
      if (result === 'success' ||
          result?.status === 'success' ||
          result?.message === 'success' ||
          result?.success === true ||
          (typeof result === 'object' && result.id)) { // Check for group object with ID
        alert(`Group "${newGroupName}" has been successfully created.`);
        handleCloseCreateGroup();
        // Refresh the page to show the new group
        window.location.reload();
      } else {
        console.warn('Unexpected response format:', result);
        throw new Error(`Unexpected response: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      if (error.message.includes('Failed to create group:')) {
        alert(`Failed to create group "${newGroupName}". Server responded with error: ${error.message}`);
      } else {
        alert(`Failed to create group "${newGroupName}". Error: ${error.message}`);
      }
    } finally {
      setCreatingGroup(false);
    }
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

  // Fetch Okta groups data - try different endpoint approaches
  const oktaGroups = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'groups', _att: 'type', _comparison: 'eq', _match: 'OKTA_GROUP' },
    queryConfig: {
      retry: 2,
      retryDelay: 1000,
    }
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

    // Sort groups based on current sort settings
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = a.profile?.name?.toLowerCase() || '';
          bValue = b.profile?.name?.toLowerCase() || '';
          break;
        case 'description':
          aValue = a.profile?.description?.toLowerCase() || '';
          bValue = b.profile?.description?.toLowerCase() || '';
          break;
        case 'created':
          aValue = a.created || '';
          bValue = b.created || '';
          break;
        case 'lastUpdated':
          aValue = a.lastUpdated || '';
          bValue = b.lastUpdated || '';
          break;
        default:
          aValue = a.profile?.name?.toLowerCase() || '';
          bValue = b.profile?.name?.toLowerCase() || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
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
  }, [oktaGroups.data, searchTerm, sortColumn, sortDirection]);

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

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newView) => newView && setViewMode(newView)}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value="card" aria-label="card view">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                  <TableRowsIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                color="primary"
                onClick={handleShowCreateGroup}
                startIcon={<GroupAddIcon />}
                size="small"
              >
                Create Group
              </Button>
              {viewMode === 'card' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleExpandAll}
                  startIcon={expandAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {expandAll ? 'Collapse All' : 'Expand All'}
                </Button>
              )}
            </Box>
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
          ) : viewMode === 'card' ? (
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
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === 'name'}
                        direction={sortColumn === 'name' ? sortDirection : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Group Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === 'description'}
                        direction={sortColumn === 'description' ? sortDirection : 'asc'}
                        onClick={() => handleSort('description')}
                      >
                        Description
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === 'created'}
                        direction={sortColumn === 'created' ? sortDirection : 'asc'}
                        onClick={() => handleSort('created')}
                      >
                        Created
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === 'lastUpdated'}
                        direction={sortColumn === 'lastUpdated' ? sortDirection : 'asc'}
                        onClick={() => handleSort('lastUpdated')}
                      >
                        Last Updated
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                            <GroupIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {group.profile?.name || 'Unnamed Group'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {group.profile?.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={formatDate(group.created)}
                          icon={<CalendarIcon fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(group.lastUpdated)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupExpand(group.id, e);
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy Group ID">
                            <IconButton
                              size="small"
                              onClick={(e) => copyToClipboard(group.id, e)}
                              color={copiedText === group.id ? "success" : "default"}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredGroups.length} of {oktaGroups.data.length} groups
              {searchTerm && ` • Search: "${searchTerm}"`}
            </Typography>
          </Box>

          {/* Create Group Dialog */}
          <Dialog
            open={showCreateGroupDialog}
            onClose={handleCloseCreateGroup}
            maxWidth="sm"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
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
                <GroupAddIcon color="primary" />
                <Typography variant="h6">
                  Create New Group
                </Typography>
              </Box>
              <IconButton onClick={handleCloseCreateGroup} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <TextField
                  fullWidth
                  label="Group Name"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  variant="outlined"
                  required
                  helperText="Group name should be unique and descriptive"
                />
                <TextField
                  fullWidth
                  label="Group Description"
                  placeholder="Enter group description..."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={3}
                  required
                  helperText="Provide a clear description of the group's purpose"
                />
              </Box>
            </DialogContent>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'white' }}>
              <Button
                variant="outlined"
                onClick={handleCloseCreateGroup}
                disabled={creatingGroup}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateGroup}
                disabled={creatingGroup || !newGroupName.trim() || !newGroupDescription.trim()}
                startIcon={creatingGroup ? <CircularProgress size={20} /> : <GroupAddIcon />}
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </Button>
            </Box>
          </Dialog>
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
  const [removingUsers, setRemovingUsers] = useState(new Set());
  const [showAddUsersDialog, setShowAddUsersDialog] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [addingUsers, setAddingUsers] = useState(new Set());

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

  // Fetch all Okta users for adding to group
  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['allOktaUsers'],
    queryFn: async () => {
      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/category/att/comparison/match?_category=users`, {
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      return response.json();
    },
    enabled: showAddUsersDialog,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
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

  const handleShowAddUsers = (groupId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedGroupId(groupId);
    setShowAddUsersDialog(true);
  };

  const handleCloseAddUsersDialog = () => {
    setShowAddUsersDialog(false);
    setSelectedGroupId(null);
    setUserSearchTerm('');
  };

  const handleExportCSV = async (groupId, groupName, event) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/get_group_members?groupid=${groupId}`, {
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch group members: ${response.status}`);
      }

      const members = await response.json();

      if (!Array.isArray(members) || members.length === 0) {
        alert('No members found in this group to export.');
        return;
      }

      // Create CSV content
      const headers = ['Display Name', 'Email', 'Login', 'Status', 'First Name', 'Last Name', 'User ID'];
      const csvContent = [
        headers.join(','),
        ...members.map(member => [
          `"${member.profile?.displayName || ''}"`,
          `"${member.profile?.email || ''}"`,
          `"${member.profile?.login || ''}"`,
          `"${member.status || ''}"`,
          `"${member.profile?.firstName || ''}"`,
          `"${member.profile?.lastName || ''}"`,
          `"${member.id || ''}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_members.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleRemoveUser = async (userId, userName, event) => {
    if (event) {
      event.stopPropagation();
    }

    const confirmed = window.confirm(`Are you sure you want to remove ${userName} from this group?`);
    if (!confirmed) return;

    setRemovingUsers(prev => new Set([...prev, userId]));

    try {
      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/remove_user_from_group?userid=${userId}&groupid=${selectedGroupId}`, {
        method: 'POST',
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove user: ${response.status}`);
      }

      const result = await response.json();

      if (result === 'success' || result?.status === 'success') {
        alert(`${userName} has been successfully removed from the group.`);
        // Refetch group members to update the list
        window.location.reload(); // Simple approach - could be optimized with query invalidation
      } else {
        throw new Error('Remove operation failed');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert(`Failed to remove ${userName} from the group. Please try again.`);
    } finally {
      setRemovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleAddUser = async (userId, userName, event) => {
    if (event) {
      event.stopPropagation();
    }

    const confirmed = window.confirm(`Are you sure you want to add ${userName} to this group?`);
    if (!confirmed) return;

    setAddingUsers(prev => new Set([...prev, userId]));

    try {
      const response = await fetch(`https://laxcoresrv.buck.local:8000/buckokta/add_user_to_group?userid=${userId}&groupid=${selectedGroupId}`, {
        method: 'POST',
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to add user: ${response.status}`);
      }

      const result = await response.json();

      if (result === 'success' || result?.status === 'success') {
        alert(`${userName} has been successfully added to the group.`);
        // Refetch group members to update the list
        window.location.reload(); // Simple approach - could be optimized with query invalidation
      } else {
        throw new Error('Add operation failed');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert(`Failed to add ${userName} to the group. Please try again.`);
    } finally {
      setAddingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
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
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={(e) => handleShowUsers(group.id, e)}
            >
              Show Users {memberCount !== undefined ? `(${memberCount})` : ''}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<PersonAddIcon />}
              onClick={(e) => handleShowAddUsers(group.id, e)}
            >
              Add Users
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={(e) => handleExportCSV(group.id, group.profile?.name || 'group', e)}
            >
              Export CSV
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
      sx={{
        '& .MuiDialog-paper': {
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
              <ListItem
                key={member.id || member.login}
                secondaryAction={
                  <Tooltip title={`Remove ${member.profile?.displayName || 'user'} from group`}>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleRemoveUser(
                        member.id,
                        member.profile?.displayName || member.profile?.firstName + ' ' + member.profile?.lastName || 'Unknown User',
                        e
                      )}
                      disabled={removingUsers.has(member.id)}
                      color="error"
                      size="small"
                    >
                      {removingUsers.has(member.id) ? (
                        <CircularProgress size={20} />
                      ) : (
                        <PersonRemoveIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                }
              >
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

    {/* Add Users Dialog */}
    <Dialog
      open={showAddUsersDialog}
      onClose={handleCloseAddUsersDialog}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
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
          <PersonAddIcon color="success" />
          <Typography variant="h6">
            Add Users to {group.profile?.name}
          </Typography>
        </Box>
        <IconButton onClick={handleCloseAddUsersDialog} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: 'white' }}>
        {/* Search box */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: userSearchTerm && (
                <InputAdornment position="end">
                  <Tooltip title="Clear search">
                    <IconButton size="small" onClick={() => setUserSearchTerm('')}>
                      <ClearAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {usersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : usersError ? (
          <Alert severity="error">
            <AlertTitle>Error Loading Users</AlertTitle>
            {usersError.message}
          </Alert>
        ) : allUsers && allUsers.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {allUsers
              .filter(user => {
                if (!userSearchTerm) return true;
                const searchLower = userSearchTerm.toLowerCase();
                const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
                return (
                  fullName.toLowerCase().includes(searchLower) ||
                  user.profile?.email?.toLowerCase().includes(searchLower) ||
                  user.profile?.login?.toLowerCase().includes(searchLower)
                );
              })
              .filter(user => {
                // Filter out users already in the group
                return !groupMembers?.some(member => member.id === user.id);
              })
              .map((user) => (
                <ListItem
                  key={user.id}
                  secondaryAction={
                    <Tooltip title={`Add ${user.profile?.firstName || 'user'} to group`}>
                      <IconButton
                        edge="end"
                        onClick={(e) => handleAddUser(
                          user.id,
                          `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.profile?.email || 'Unknown User',
                          e
                        )}
                        disabled={addingUsers.has(user.id)}
                        color="success"
                        size="small"
                      >
                        {addingUsers.has(user.id) ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PersonAddIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User'}
                        {user.status && (
                          <Chip
                            size="small"
                            label={user.status}
                            color={user.status === 'ACTIVE' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {user.profile?.email || 'No email'}
                        </Typography>
                        {user.profile?.login && user.profile?.login !== user.profile?.email && (
                          <Typography variant="caption" color="text.secondary">
                            Login: {user.profile?.login}
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
            No users available to add
          </Typography>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}