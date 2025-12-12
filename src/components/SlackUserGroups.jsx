import React, { useState, useMemo } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, InputAdornment, Chip, TableSortLabel,
  ToggleButton, ToggleButtonGroup, Card, CardContent,
  Grid, CardActions, Collapse, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, Tabs, Tab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import GridViewIcon from '@mui/icons-material/GridView';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import { useQuery } from '@tanstack/react-query';

export default function SlackUserGroups(props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [viewMode, setViewMode] = useState('table');
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [memberInfo, setMemberInfo] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [memberDialogTab, setMemberDialogTab] = useState(0);
  const [expandedMembers, setExpandedMembers] = useState({});

  // Fetch all Slack users for member lookup
  const { data: usersData = { items: [] } } = useQuery({
    queryKey: ['slackUsers'],
    queryFn: async () => {
      let allUsers = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 500;

      while (hasMore) {
        const response = await fetch(
          `https://laxcoresrv.buck.local:8000/slack_users?page=${currentPage}&size=${pageSize}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const pageData = await response.json();

        if (pageData.items && pageData.items.length > 0) {
          allUsers = [...allUsers, ...pageData.items];
        }

        hasMore = pageData.items && pageData.items.length === pageSize;
        currentPage++;

        if (currentPage > 100) break;
      }

      return { items: allUsers, total: allUsers.length };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Create user lookup map
  const userLookup = useMemo(() => {
    const lookup = {};
    if (usersData?.items) {
      usersData.items.forEach(user => {
        lookup[user.id] = user;
      });
    }
    return lookup;
  }, [usersData?.items]);

  // Fetch all user groups
  const {
    data: userGroupsData = { items: [], total: 0 },
    isLoading,
    error
  } = useQuery({
    queryKey: ['slackUserGroups'],
    queryFn: async () => {
      let allGroups = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 500;

      while (hasMore) {
        const response = await fetch(
          `https://laxcoresrv.buck.local:8000/slack_usergroups?page=${currentPage}&size=${pageSize}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const pageData = await response.json();

        if (pageData.items && pageData.items.length > 0) {
          allGroups = [...allGroups, ...pageData.items];
        }

        hasMore = pageData.items && pageData.items.length === pageSize;
        currentPage++;

        if (currentPage > 100) {
          console.warn('Reached maximum page limit (100 pages)');
          break;
        }
      }

      return { items: allGroups, total: allGroups.length };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Sorting handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Toggle card expansion
  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Fetch member info for a group
  const fetchMemberInfo = async (groupId) => {
    setSelectedGroupId(groupId);
    setMemberDialogTab(0);

    if (memberInfo[groupId]) {
      setMemberDialogOpen(true);
      return;
    }

    setLoadingMembers(prev => ({ ...prev, [groupId]: true }));
    setMemberDialogOpen(true);

    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/slack_members_of_group?id=${groupId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMemberInfo(prev => ({ ...prev, [groupId]: data }));
    } catch (error) {
      console.error('Error fetching member info:', error);
      setMemberInfo(prev => ({ ...prev, [groupId]: { error: error.message } }));
    } finally {
      setLoadingMembers(prev => ({ ...prev, [groupId]: false }));
    }
  };

  // Close member dialog
  const handleCloseMemberDialog = () => {
    setMemberDialogOpen(false);
  };

  // Get selected group name
  const getSelectedGroupName = () => {
    if (!selectedGroupId) return '';
    const group = userGroupsData?.items?.find(g => g.id === selectedGroupId);
    return group?.name || selectedGroupId;
  };

  // Filter and sort user groups
  const filteredAndSortedGroups = useMemo(() => {
    if (!userGroupsData?.items) return [];

    let filtered = [...userGroupsData.items];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(group => {
        const name = (group.name || '').toLowerCase();
        const description = (group.description || '').toLowerCase();
        const handle = (group.handle || '').toLowerCase();
        return name.includes(search) || description.includes(search) || handle.includes(search);
      });
    }

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch(orderBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'user_count':
          aValue = a.user_count || 0;
          bValue = b.user_count || 0;
          break;
        case 'date_create':
          aValue = a.date_create || 0;
          bValue = b.date_create || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [userGroupsData?.items, searchTerm, order, orderBy]);

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Slack User Groups'}
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
          {props.name || 'Slack User Groups'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {error.message || "Failed to fetch Slack user groups"}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Empty state
  const groups = userGroupsData.items || [];
  if (groups.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Slack User Groups'}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>No User Groups Found</Typography>
          <Typography color="text.secondary">
            No Slack user groups were returned from the API.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Render Table View
  const renderTableView = () => (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleRequestSort('name')}
                sx={{
                  color: 'primary.contrastText !important',
                  '&:hover': { color: 'primary.contrastText' },
                  '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                }}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Handle
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              <TableSortLabel
                active={orderBy === 'user_count'}
                direction={orderBy === 'user_count' ? order : 'asc'}
                onClick={() => handleRequestSort('user_count')}
                sx={{
                  color: 'primary.contrastText !important',
                  '&:hover': { color: 'primary.contrastText' },
                  '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                }}
              >
                Users
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              <TableSortLabel
                active={orderBy === 'date_create'}
                direction={orderBy === 'date_create' ? order : 'asc'}
                onClick={() => handleRequestSort('date_create')}
                sx={{
                  color: 'primary.contrastText !important',
                  '&:hover': { color: 'primary.contrastText' },
                  '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                }}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Description
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Actions
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Raw
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAndSortedGroups.map((group) => (
            <React.Fragment key={group.id}>
              <TableRow
                sx={{
                  '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {group.name || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={`@${group.handle}`} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{group.user_count || 0}</TableCell>
                <TableCell>{formatDate(group.date_create)}</TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="body2" noWrap title={group.description || ''}>
                    {group.description || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={loadingMembers[group.id] ? <CircularProgress size={14} /> : <PeopleIcon />}
                    onClick={() => fetchMemberInfo(group.id)}
                    disabled={loadingMembers[group.id]}
                  >
                    Members
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedRows(prev => ({
                      ...prev,
                      [group.id]: !prev[group.id]
                    }))}
                    sx={{
                      transform: expandedRows[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
              {expandedRows[group.id] && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse in={expandedRows[group.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CodeIcon fontSize="small" color="action" />
                          <Typography variant="caption" fontWeight="bold">
                            Raw Data
                          </Typography>
                        </Box>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 300,
                            m: 0
                          }}
                        >
                          {JSON.stringify(group, null, 2)}
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render Card View
  const renderCardView = () => (
    <Grid container spacing={2}>
      {filteredAndSortedGroups.map((group) => (
        <Grid key={group.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: '100%',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {group.name || 'Unknown'}
                </Typography>
              </Box>

              <Chip
                label={`@${group.handle}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {group.user_count || 0} users
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Created: {formatDate(group.date_create)}
              </Typography>

              {group.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                  title={group.description}
                >
                  {group.description}
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={loadingMembers[group.id] ? <CircularProgress size={14} /> : <PeopleIcon />}
                onClick={() => fetchMemberInfo(group.id)}
                disabled={loadingMembers[group.id]}
              >
                Members
              </Button>
              <IconButton
                size="small"
                onClick={() => toggleCardExpansion(group.id)}
                sx={{
                  transform: expandedCards[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </CardActions>
            <Collapse in={expandedCards[group.id]} timeout="auto" unmountOnExit>
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CodeIcon fontSize="small" color="action" />
                  <Typography variant="caption" fontWeight="bold">
                    Raw Data
                  </Typography>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    overflow: 'auto',
                    maxHeight: 300,
                    m: 0
                  }}
                >
                  {JSON.stringify(group, null, 2)}
                </Box>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Main UI
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4' color="primary" fontWeight="medium">
          {props.name || 'Slack User Groups'}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="table" aria-label="table view">
            <TableChartIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="cards" aria-label="card view">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography gutterBottom>
          Successfully loaded {groups.length} Slack user groups.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            label={`${groups.length} Total Groups`}
            color="primary"
            size="small"
          />
          <Chip
            label={`${groups.reduce((sum, g) => sum + (g.user_count || 0), 0)} Total Users`}
            color="secondary"
            size="small"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search by name, handle, or description..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
          />
          {searchTerm && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSearchTerm('')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear
            </Button>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Showing {filteredAndSortedGroups.length} user groups
        </Typography>
      </Paper>

      {viewMode === 'table' && renderTableView()}
      {viewMode === 'cards' && renderCardView()}

      {/* Member Info Dialog */}
      <Dialog
        open={memberDialogOpen}
        onClose={handleCloseMemberDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          Members of {getSelectedGroupName()}
        </DialogTitle>
        <DialogContent dividers>
          {loadingMembers[selectedGroupId] ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : memberInfo[selectedGroupId]?.error ? (
            <Typography color="error">
              Error: {memberInfo[selectedGroupId].error}
            </Typography>
          ) : memberInfo[selectedGroupId] ? (
            <>
              <Tabs
                value={memberDialogTab}
                onChange={(e, newValue) => setMemberDialogTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Members" />
                <Tab label="Raw Data" />
              </Tabs>

              {memberDialogTab === 0 && (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {Array.isArray(memberInfo[selectedGroupId]) ? (
                    memberInfo[selectedGroupId].map((memberId, idx) => {
                      // Get full user info from memoized lookup
                      const userId = typeof memberId === 'string' ? memberId : memberId.id || memberId;
                      const member = userLookup[userId] || { id: userId, name: userId };

                      return (
                        <Box key={userId || idx}>
                          <ListItem divider>
                            <ListItemAvatar>
                              <Avatar
                                src={member.profile?.image_72 || member.profile?.image_48}
                                alt={member.real_name || member.name}
                              >
                                {(member.real_name || member.name || '?')[0].toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {member.real_name || member.name || 'Unknown'}
                                  </Typography>
                                  {member.is_admin && (
                                    <Chip label="Admin" size="small" color="secondary" />
                                  )}
                                  {member.is_owner && (
                                    <Chip label="Owner" size="small" color="primary" />
                                  )}
                                  {member.is_bot && (
                                    <Chip label="Bot" size="small" color="info" />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    @{member.name} {member.profile?.email && `• ${member.profile.email}`}
                                  </Typography>
                                  {member.profile?.title && (
                                    <Typography variant="caption" color="text.secondary">
                                      {member.profile.title}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <IconButton
                              size="small"
                              onClick={() => setExpandedMembers(prev => ({
                                ...prev,
                                [userId || idx]: !prev[userId || idx]
                              }))}
                              sx={{
                                transform: expandedMembers[userId || idx] ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s'
                              }}
                            >
                              <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                          </ListItem>
                          <Collapse in={expandedMembers[userId || idx]} timeout="auto" unmountOnExit>
                            <Box sx={{ pl: 9, pr: 2, pb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CodeIcon fontSize="small" color="action" />
                                <Typography variant="caption" fontWeight="bold">
                                  Raw Data
                                </Typography>
                              </Box>
                              <Box
                                component="pre"
                                sx={{
                                  bgcolor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  fontSize: '0.7rem',
                                  overflow: 'auto',
                                  maxHeight: 200,
                                  m: 0
                                }}
                              >
                                {JSON.stringify(member, null, 2)}
                              </Box>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography color="text.secondary">
                      No member data available or unexpected format
                    </Typography>
                  )}
                </List>
              )}

              {memberDialogTab === 1 && (
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 400,
                    m: 0
                  }}
                >
                  {JSON.stringify(memberInfo[selectedGroupId], null, 2)}
                </Box>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemberDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
