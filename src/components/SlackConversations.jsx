import React, { useState, useMemo } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, InputAdornment, Chip, TableSortLabel,
  TablePagination, ToggleButton, ToggleButtonGroup, Card, CardContent,
  Grid, CardActions, Collapse, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, List, ListItem, ListItemAvatar, ListItemText, Tabs, Tab,
  Switch, FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import GridViewIcon from '@mui/icons-material/GridView';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import ArchiveIcon from '@mui/icons-material/Archive';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import { useQuery } from '@tanstack/react-query';
import MUIDataTable from 'mui-datatables';

export default function SlackConversations(props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [viewMode, setViewMode] = useState('table');
  const [expandedCards, setExpandedCards] = useState({});
  const [memberInfo, setMemberInfo] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [memberDialogTab, setMemberDialogTab] = useState(0);
  const [expandedMembers, setExpandedMembers] = useState({});

  // Filter states
  const [showChannels, setShowChannels] = useState(true);
  const [showPrivate, setShowPrivate] = useState(true);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Fetch all Slack users for creator lookup
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
        lookup[user.id] = user.real_name || user.name || user.id;
      });
    }
    return lookup;
  }, [usersData?.items]);

  // Fetch all conversations
  const {
    data: conversationsData = { items: [], total: 0 },
    isLoading,
    error
  } = useQuery({
    queryKey: ['slackConversations'],
    queryFn: async () => {
      let allConversations = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 500;

      while (hasMore) {
        const response = await fetch(
          `https://laxcoresrv.buck.local:8000/slack_conversations?page=${currentPage}&size=${pageSize}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const pageData = await response.json();

        if (pageData.items && pageData.items.length > 0) {
          allConversations = [...allConversations, ...pageData.items];
        }

        hasMore = pageData.items && pageData.items.length === pageSize;
        currentPage++;

        if (currentPage > 100) {
          console.warn('Reached maximum page limit (100 pages)');
          break;
        }
      }

      return { items: allConversations, total: allConversations.length };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Get creator name from lookup
  const getCreatorName = (creatorId) => {
    if (!creatorId) return 'N/A';
    return userLookup[creatorId] || creatorId;
  };

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

  // Get sortable value for a conversation property
  const getSortValue = (conversation, property) => {
    switch(property) {
      case 'name':
        return (conversation.name || '').toLowerCase();
      case 'num_members':
        return conversation.num_members || 0;
      case 'created':
        return conversation.created || 0;
      default:
        return '';
    }
  };

  // Sorting utilities
  function descendingComparator(a, b, orderBy) {
    const aValue = getSortValue(a, orderBy);
    const bValue = getSortValue(b, orderBy);

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
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    if (!conversationsData?.items) return [];

    let filtered = [...conversationsData.items];

    // Apply type filters
    if (!showChannels) {
      filtered = filtered.filter(conv => !conv.is_channel || conv.is_private);
    }

    if (!showPrivate) {
      filtered = filtered.filter(conv => !conv.is_private);
    }

    // Filter by active status
    if (showOnlyActive) {
      filtered = filtered.filter(conv => !conv.is_archived);
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(conv => {
        const name = (conv.name || '').toLowerCase();
        const purpose = (conv.purpose?.value || '').toLowerCase();
        const topic = (conv.topic?.value || '').toLowerCase();
        return name.includes(search) || purpose.includes(search) || topic.includes(search);
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
        case 'num_members':
          aValue = a.num_members || 0;
          bValue = b.num_members || 0;
          break;
        case 'created':
          aValue = a.created || 0;
          bValue = b.created || 0;
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
  }, [conversationsData?.items, searchTerm, showChannels, showPrivate, showOnlyActive, order, orderBy]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current page data
  const paginatedConversations = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedConversations.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedConversations, page, rowsPerPage]);

  // MUI DataTable columns
  const dataTableColumns = [
    {
      name: 'name',
      label: 'Name',
      options: {
        customBodyRender: (value) => `#${value || 'Unknown'}`
      }
    },
    {
      name: 'type',
      label: 'Type',
      options: {
        customBodyRender: (value, tableMeta) => {
          const conv = filteredAndSortedConversations[tableMeta.rowIndex];
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {conv.is_private ? (
                <Chip label="Private" color="secondary" size="small" />
              ) : conv.is_channel ? (
                <Chip label="Channel" color="primary" size="small" variant="outlined" />
              ) : (
                <Chip label="Group" size="small" variant="outlined" />
              )}
              {conv.is_archived && (
                <Chip label="Archived" color="warning" size="small" variant="outlined" />
              )}
            </Box>
          );
        }
      }
    },
    {
      name: 'num_members',
      label: 'Members',
      options: {
        customBodyRender: (value) => value || 0
      }
    },
    {
      name: 'created',
      label: 'Created',
      options: {
        customBodyRender: (value) => formatDate(value)
      }
    },
    {
      name: 'purpose',
      label: 'Purpose',
      options: {
        customBodyRender: (value) => value?.value || 'N/A'
      }
    },
    {
      name: 'topic',
      label: 'Topic',
      options: {
        customBodyRender: (value) => value?.value || 'N/A'
      }
    }
  ];

  // MUI DataTable options
  const dataTableOptions = {
    filterType: 'multiselect',
    responsive: 'standard',
    selectableRows: 'none',
    rowsPerPage: 50,
    rowsPerPageOptions: [25, 50, 100, 250],
    print: false,
    download: true,
    viewColumns: true,
    search: false,
    elevation: 1
  };

  // Get type info for card
  const getTypeInfo = (conv) => {
    if (conv.is_private) return { label: 'Private', color: 'secondary', icon: <LockIcon fontSize="small" /> };
    if (conv.is_channel) return { label: 'Channel', color: 'primary', icon: <PublicIcon fontSize="small" /> };
    return { label: 'Group', color: 'default', icon: <PeopleIcon fontSize="small" /> };
  };

  // Toggle card expansion
  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Fetch member info for a channel
  const fetchMemberInfo = async (channelId) => {
    setSelectedChannelId(channelId);
    setMemberDialogTab(0);

    if (memberInfo[channelId]) {
      setMemberDialogOpen(true);
      return;
    }

    setLoadingMembers(prev => ({ ...prev, [channelId]: true }));
    setMemberDialogOpen(true);

    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/slack_member_info_for_channel?id=${channelId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMemberInfo(prev => ({ ...prev, [channelId]: data }));
    } catch (error) {
      console.error('Error fetching member info:', error);
      setMemberInfo(prev => ({ ...prev, [channelId]: { error: error.message } }));
    } finally {
      setLoadingMembers(prev => ({ ...prev, [channelId]: false }));
    }
  };

  // Close member dialog
  const handleCloseMemberDialog = () => {
    setMemberDialogOpen(false);
  };

  // Get selected channel name
  const getSelectedChannelName = () => {
    if (!selectedChannelId) return '';
    const channel = conversationsData?.items?.find(c => c.id === selectedChannelId);
    return channel?.name || selectedChannelId;
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Slack Conversations'}
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
          {props.name || 'Slack Conversations'}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {error.message || "Failed to fetch Slack conversations"}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Empty state
  const conversations = conversationsData.items || [];
  if (conversations.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Slack Conversations'}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>No Conversations Found</Typography>
          <Typography color="text.secondary">
            No Slack conversations were returned from the API.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Render Table View
  const renderTableView = () => (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', maxHeight: 'calc(100vh - 450px)' }}>
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
              Type
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              <TableSortLabel
                active={orderBy === 'num_members'}
                direction={orderBy === 'num_members' ? order : 'asc'}
                onClick={() => handleRequestSort('num_members')}
                sx={{
                  color: 'primary.contrastText !important',
                  '&:hover': { color: 'primary.contrastText' },
                  '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                }}
              >
                Members
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              <TableSortLabel
                active={orderBy === 'created'}
                direction={orderBy === 'created' ? order : 'asc'}
                onClick={() => handleRequestSort('created')}
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
              Creator
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Purpose
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Topic
            </TableCell>
            <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAndSortedConversations.map((conversation) => (
            <TableRow
              key={conversation.id}
              sx={{
                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  #{conversation.name || 'Unknown'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {conversation.is_private ? (
                    <Chip label="Private" color="secondary" size="small" variant="filled" />
                  ) : conversation.is_channel ? (
                    <Chip label="Channel" color="primary" size="small" variant="outlined" />
                  ) : (
                    <Chip label="Group" size="small" variant="outlined" />
                  )}
                  {conversation.is_archived && (
                    <Chip label="Archived" color="warning" size="small" variant="outlined" />
                  )}
                </Box>
              </TableCell>
              <TableCell>{conversation.num_members || 0}</TableCell>
              <TableCell>{formatDate(conversation.created)}</TableCell>
              <TableCell>
                <Typography variant="body2" noWrap title={getCreatorName(conversation.creator)}>
                  {getCreatorName(conversation.creator)}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 300 }}>
                <Typography variant="body2" noWrap title={conversation.purpose?.value || ''}>
                  {conversation.purpose?.value || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Typography variant="body2" noWrap title={conversation.topic?.value || ''}>
                  {conversation.topic?.value || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={loadingMembers[conversation.id] ? <CircularProgress size={14} /> : <PeopleIcon />}
                  onClick={() => fetchMemberInfo(conversation.id)}
                  disabled={loadingMembers[conversation.id]}
                >
                  Members
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render DataTable View
  const renderDataTableView = () => (
    <MUIDataTable
      title=""
      data={filteredAndSortedConversations}
      columns={dataTableColumns}
      options={dataTableOptions}
    />
  );

  // Render Card View
  const renderCardView = () => (
    <>
      <Grid container spacing={2}>
        {paginatedConversations.map((conversation, index) => {
          const typeInfo = getTypeInfo(conversation);
          return (
            <Grid key={conversation.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                      #{conversation.name || 'Unknown'}
                    </Typography>
                    {conversation.is_archived && (
                      <ArchiveIcon color="warning" fontSize="small" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    <Chip
                      icon={typeInfo.icon}
                      label={typeInfo.label}
                      color={typeInfo.color}
                      size="small"
                      variant={conversation.is_private ? 'filled' : 'outlined'}
                    />
                    {conversation.is_general && (
                      <Chip label="General" color="success" size="small" variant="outlined" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {conversation.num_members || 0} members
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {formatDate(conversation.created)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Creator: {getCreatorName(conversation.creator)}
                  </Typography>

                  {conversation.purpose?.value && (
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
                      title={conversation.purpose.value}
                    >
                      {conversation.purpose.value}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={loadingMembers[conversation.id] ? <CircularProgress size={14} /> : <PeopleIcon />}
                    onClick={() => fetchMemberInfo(conversation.id)}
                    disabled={loadingMembers[conversation.id]}
                  >
                    Members
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => toggleCardExpansion(conversation.id)}
                    sx={{
                      transform: expandedCards[conversation.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </CardActions>
                <Collapse in={expandedCards[conversation.id]} timeout="auto" unmountOnExit>
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
                      {JSON.stringify(conversation, null, 2)}
                    </Box>
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[12, 24, 48, 96]}
          component="div"
          count={filteredAndSortedConversations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </>
  );

  // Main UI
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4' color="primary" fontWeight="medium">
          {props.name || 'Slack Conversations'}
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
          <ToggleButton value="datatable" aria-label="datatable view">
            <ViewModuleIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="cards" aria-label="card view">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography gutterBottom>
          Successfully loaded {conversations.length} Slack conversations.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
          <Chip
            label={`${conversations.filter(c => c.is_channel && !c.is_private).length} Public Channels`}
            color={showChannels ? 'primary' : 'default'}
            variant={showChannels ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setShowChannels(!showChannels)}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${conversations.filter(c => c.is_private).length} Private`}
            color={showPrivate ? 'secondary' : 'default'}
            variant={showPrivate ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setShowPrivate(!showPrivate)}
            sx={{ cursor: 'pointer' }}
          />

          <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2, ml: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {showOnlyActive ? 'Active Only' : 'All Groups'}
                  </Typography>
                  <Chip
                    label={showOnlyActive
                      ? `${conversations.filter(c => !c.is_archived).length} Active`
                      : `${conversations.length} Total`}
                    size="small"
                    color={showOnlyActive ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              }
            />
          </Box>
        </Box>
      </Paper>

      {viewMode !== 'datatable' && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, purpose, or topic..."
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
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
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Clear
              </Button>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Showing {filteredAndSortedConversations.length} conversations
          </Typography>
        </Paper>
      )}

      {viewMode === 'table' && renderTableView()}
      {viewMode === 'datatable' && renderDataTableView()}
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
          Members of #{getSelectedChannelName()}
        </DialogTitle>
        <DialogContent dividers>
          {loadingMembers[selectedChannelId] ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : memberInfo[selectedChannelId]?.error ? (
            <Typography color="error">
              Error: {memberInfo[selectedChannelId].error}
            </Typography>
          ) : memberInfo[selectedChannelId] ? (
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
                  {Array.isArray(memberInfo[selectedChannelId]) ? (
                    memberInfo[selectedChannelId].map((member, idx) => (
                      <Box key={member.id || idx}>
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
                              [member.id || idx]: !prev[member.id || idx]
                            }))}
                            sx={{
                              transform: expandedMembers[member.id || idx] ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                        <Collapse in={expandedMembers[member.id || idx]} timeout="auto" unmountOnExit>
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
                    ))
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
                  {JSON.stringify(memberInfo[selectedChannelId], null, 2)}
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
