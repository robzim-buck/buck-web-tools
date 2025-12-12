import React, { useState, useMemo, useEffect } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Button, TextField, InputAdornment, Snackbar, Chip, TableSortLabel,
  IconButton, Collapse, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppData } from '../contexts/AppDataProvider';

export default function WelcomeNewResident(props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleted, setShowDeleted] = useState(false);
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);
  const [showOnlyOwners, setShowOnlyOwners] = useState(false);
  const [showOnlyBots, setShowOnlyBots] = useState(false);
  const [hideDeleted, setHideDeleted] = useState(true);
  const [hideBots, setHideBots] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('real_name');
  const [customMessages, setCustomMessages] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Try to get data from context first
  let contextData = null;
  let contextLoading = false;
  let contextError = null;
  let requestData = null;

  try {
    const appData = useAppData();
    contextData = appData.data.slackUsers;
    contextLoading = appData.queries.slackUsers?.isLoading || false;
    contextError = appData.queries.slackUsers?.error || null;
    requestData = appData.requestData;
  } catch (e) {
    // Context not available, will fetch data directly
  }

  // Request the data this component needs
  useEffect(() => {
    if (requestData) {
      requestData('slackUsers');
    }
  }, [requestData]);

  // Use context data if available, otherwise fetch
  const shouldFetch = !contextData;

  // Fetch all Slack users with pagination (only if not available from context)
  const {
    data: fetchedData = { items: [] },
    isLoading: isFetching,
    error: fetchError
  } = useQuery({
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

        if (currentPage > 100) {
          console.warn('Reached maximum page limit (100 pages)');
          break;
        }
      }

      return { items: allUsers, total: allUsers.length };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: shouldFetch
  });

  // Fetch Okta users to get departments
  const {
    data: oktaUsersData = [],
    isLoading: isLoadingOktaUsers
  } = useQuery({
    queryKey: ['oktaUsersForDepartments'],
    queryFn: async () => {
      const response = await fetch(
        'https://laxcoresrv.buck.local:8000/buckokta/category/att/comparison/match?_category=users&_att=status&_comparison=eq&_match=ACTIVE',
        {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo',
            'Content-type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Extract unique departments from Okta users
  const departments = useMemo(() => {
    if (!oktaUsersData || !Array.isArray(oktaUsersData)) return [];

    const departmentSet = new Set();
    oktaUsersData.forEach(user => {
      if (user?.profile?.department) {
        departmentSet.add(user.profile.department);
      }
    });

    return Array.from(departmentSet).sort();
  }, [oktaUsersData]);

  // Use context data if available, otherwise use fetched data
  const slackUsersData = contextData || fetchedData;
  const isLoading = contextLoading || isFetching || isLoadingOktaUsers;
  const error = contextError || fetchError;

  // Mutation for sending welcome message (with optional department)
  const sendWelcomeMutation = useMutation({
    mutationFn: async ({ userId, department }) => {
      // Build the URL based on whether a department is selected
      let url;
      if (department) {
        // Use the department endpoint with buck_department query param
        url = `https://laxcoresrv.buck.local:8000/coda_post_slack_welcome_message_for_buck_department/${userId}/${encodeURIComponent(department)}?buck_department=${encodeURIComponent(department)}`;
      } else {
        // Use the department endpoint without the department param (empty department in path)
        url = `https://laxcoresrv.buck.local:8000/coda_post_slack_welcome_message_for_buck_department/${userId}/`;
      }

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to send welcome message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      const departmentInfo = variables.department ? ` (Department: ${variables.department})` : '';
      setSnackbar({
        open: true,
        message: `Welcome message sent successfully to user ${variables.userId}${departmentInfo}`,
        severity: 'success'
      });
    },
    onError: (error, variables) => {
      setSnackbar({
        open: true,
        message: `Failed to send welcome message: ${error.message}`,
        severity: 'error'
      });
    }
  });

  // Mutation for sending custom message
  const sendCustomMessageMutation = useMutation({
    mutationFn: async ({ userId, message }) => {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/post_slack_message?channel=${encodeURIComponent(userId)}&message=${encodeURIComponent(message)}`,
        {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      setSnackbar({
        open: true,
        message: `Message sent successfully to user ${variables.userId}`,
        severity: 'success'
      });
      setCustomMessages(prev => ({
        ...prev,
        [variables.userId]: ''
      }));
    },
    onError: (error, variables) => {
      setSnackbar({
        open: true,
        message: `Failed to send message: ${error.message}`,
        severity: 'error'
      });
    }
  });

  const handleSendWelcome = (user) => {
    sendWelcomeMutation.mutate({
      userId: user.id,
      department: selectedDepartment
    });
  };

  const handleSendCustomMessage = (user) => {
    const message = customMessages[user.id] || '';
    if (!message.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a message',
        severity: 'warning'
      });
      return;
    }
    sendCustomMessageMutation.mutate({ userId: user.id, message });
  };

  const handleMessageChange = (userId, message) => {
    setCustomMessages(prev => ({
      ...prev,
      [userId]: message
    }));
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  // Sorting handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Get sortable value for a user property
  const getSortValue = (user, property) => {
    switch(property) {
      case 'real_name':
        return (user.real_name || user.name || '').toLowerCase();
      case 'name':
        return (user.name || '').toLowerCase();
      case 'email':
        return (user.profile?.email || '').toLowerCase();
      case 'title':
        return (user.profile?.title || '').toLowerCase();
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

  // Get user initials for avatar
  const getUserInitials = (user) => {
    const name = user.real_name || user.name || '';
    if (!name) return 'SU';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    if (!slackUsersData?.items) return [];

    let filtered = [...slackUsersData.items];

    // Apply hide filters first
    if (hideDeleted) {
      filtered = filtered.filter(user => !user.deleted);
    }

    if (hideBots) {
      filtered = filtered.filter(user => !user.is_bot);
    }

    // Apply show-only filters
    if (showDeleted) {
      filtered = filtered.filter(user => user.deleted);
    }

    if (showOnlyAdmins) {
      filtered = filtered.filter(user => user.is_admin);
    }

    if (showOnlyOwners) {
      filtered = filtered.filter(user => user.is_owner);
    }

    if (showOnlyBots) {
      filtered = filtered.filter(user => user.is_bot);
    }

    // Apply search filter (only on name)
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const name = (user.real_name || '').toLowerCase();
        return name.includes(search);
      });
    }

    // Apply sorting and return
    return stableSort(filtered, getComparator(order, orderBy));
  }, [slackUsersData?.items, searchTerm, hideDeleted, hideBots, showDeleted, showOnlyAdmins, showOnlyOwners, showOnlyBots, order, orderBy]);

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            backgroundImage: 'url(/residence-logo.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#1976d2',
            borderRadius: 2,
            p: 4,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            minHeight: 150,
            width: '100%',
          }}
        >
          <Box
            component="img"
            src="/resldence-logo-square.png"
            alt="Residence Logo"
            sx={{
              width: 80,
              height: 80,
              mr: 3,
              borderRadius: 1,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          />
          <Typography
            variant='h4'
            fontWeight="medium"
            sx={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {props.name || 'Welcome New Resident'}
          </Typography>
        </Box>
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
        <Box
          sx={{
            backgroundImage: 'url(/residence-logo.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#1976d2',
            borderRadius: 2,
            p: 4,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            minHeight: 150,
            width: '100%',
          }}
        >
          <Box
            component="img"
            src="/resldence-logo-square.png"
            alt="Residence Logo"
            sx={{
              width: 80,
              height: 80,
              mr: 3,
              borderRadius: 1,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          />
          <Typography
            variant='h4'
            fontWeight="medium"
            sx={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {props.name || 'Welcome New Resident'}
          </Typography>
        </Box>
        <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>An error occurred</Typography>
          <Typography color="text.secondary">
            {error.message || "Failed to fetch Slack users"}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Empty state
  const users = slackUsersData.items || [];
  if (users.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            backgroundImage: 'url(/residence-logo.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#1976d2',
            borderRadius: 2,
            p: 4,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            minHeight: 150,
            width: '100%',
          }}
        >
          <Box
            component="img"
            src="/resldence-logo-square.png"
            alt="Residence Logo"
            sx={{
              width: 80,
              height: 80,
              mr: 3,
              borderRadius: 1,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          />
          <Typography
            variant='h4'
            fontWeight="medium"
            sx={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {props.name || 'Welcome New Resident'}
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>No Users Found</Typography>
          <Typography color="text.secondary">
            No Slack users were returned from the API.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Main UI
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          backgroundImage: 'url(/residence-logo.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#1976d2',
          borderRadius: 2,
          p: 4,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          minHeight: 150,
          width: '100%',
        }}
      >
        <Box
          component="img"
          src="/resldence-logo-square.png"
          alt="Residence Logo"
          sx={{
            width: 80,
            height: 80,
            mr: 3,
            borderRadius: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        />
        <Typography
          variant='h4'
          fontWeight="medium"
          sx={{
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {props.name || 'Welcome New Resident'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography gutterBottom>
          Successfully loaded {users.length} Slack users.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            label={`${users.filter(u => !u.deleted).length} Active Users`}
            color={hideDeleted ? 'primary' : 'default'}
            variant={hideDeleted ? 'filled' : 'outlined'}
            size="small"
            onClick={() => {
              setHideDeleted(!hideDeleted);
              setShowDeleted(false);
            }}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${users.filter(u => u.deleted).length} Deleted`}
            color={showDeleted ? 'error' : 'default'}
            variant={showDeleted ? 'filled' : 'outlined'}
            size="small"
            onClick={() => {
              setShowDeleted(!showDeleted);
              setHideDeleted(false);
            }}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${users.filter(u => u.is_admin).length} Admins`}
            color={showOnlyAdmins ? 'secondary' : 'default'}
            variant={showOnlyAdmins ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setShowOnlyAdmins(!showOnlyAdmins)}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${users.filter(u => u.is_owner).length} Owners`}
            color={showOnlyOwners ? 'secondary' : 'default'}
            variant={showOnlyOwners ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setShowOnlyOwners(!showOnlyOwners)}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${users.filter(u => !u.is_bot).length} Human Users`}
            color={hideBots ? 'primary' : 'default'}
            variant={hideBots ? 'filled' : 'outlined'}
            size="small"
            onClick={() => {
              setHideBots(!hideBots);
              setShowOnlyBots(false);
            }}
            sx={{ cursor: 'pointer' }}
          />

          <Chip
            label={`${users.filter(u => u.is_bot).length} Bots`}
            color={showOnlyBots ? 'info' : 'default'}
            variant={showOnlyBots ? 'filled' : 'outlined'}
            size="small"
            onClick={() => {
              setShowOnlyBots(!showOnlyBots);
              setHideBots(false);
            }}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name..."
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
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

          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel id="department-select-label">Department (Optional)</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="Department (Optional)"
              onChange={handleDepartmentChange}
            >
              <MenuItem value="">
                <em>No Department (Default Message)</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedDepartment && (
            <Chip
              label={`Department: ${selectedDepartment}`}
              color="primary"
              onDelete={() => setSelectedDepartment('')}
              size="small"
            />
          )}

          {searchTerm && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSearchTerm('')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear Search
            </Button>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Showing {filteredAndSortedUsers.length} users
          {selectedDepartment && ` | Welcome messages will include ${selectedDepartment} department info`}
        </Typography>
      </Paper>

      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" key={`table-${searchTerm}-${filteredAndSortedUsers.length}`}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'real_name'}
                  direction={orderBy === 'real_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('real_name')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText' },
                    '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                  }}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
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
                  Username
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleRequestSort('email')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText' },
                    '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                  }}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText' },
                    '& .MuiTableSortLabel-icon': { color: 'primary.contrastText !important' }
                  }}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                Type
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', minWidth: 400 }}>
                Actions
              </TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                Raw
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.map((user, index) => {
              const uniqueKey = `${user.id || 'no-id'}-${user.name || 'no-name'}-${user.profile?.email || 'no-email'}-${index}`;

              return (
                <React.Fragment key={uniqueKey}>
                <TableRow
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {(() => {
                      const imageUrl = user.profile?.image_72 ||
                                      user.profile?.image_48 ||
                                      user.profile?.image_192 ||
                                      user.profile?.image_512 ||
                                      user.profile?.image_original ||
                                      user.image_72 ||
                                      user.image_48;

                      return imageUrl ? (
                        <Avatar
                          src={imageUrl}
                          alt={user.real_name || user.name}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '2px solid',
                            borderColor: user.is_bot ? 'info.main' :
                                        user.is_owner ? 'secondary.main' :
                                        user.is_admin ? 'secondary.light' :
                                        'primary.main',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      ) : (
                        <Avatar
                          sx={{
                            bgcolor: user.is_bot ? 'info.main' :
                                     user.is_owner ? 'secondary.main' :
                                     user.is_admin ? 'secondary.light' :
                                     'primary.main',
                            color: 'white',
                            width: 40,
                            height: 40,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {getUserInitials(user)}
                        </Avatar>
                      );
                    })()}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.real_name || user.name || 'Unknown'}
                      </Typography>
                      {user.deleted && (
                        <Chip
                          label="Deleted"
                          size="small"
                          color="error"
                          sx={{ height: '16px', fontSize: '0.65rem', mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.name || 'N/A'}</TableCell>
                <TableCell>{user.profile?.email || 'N/A'}</TableCell>
                <TableCell>{user.profile?.title || 'N/A'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.deleted && (
                      <Chip label="Deleted" color="error" size="small" variant="filled" />
                    )}
                    {user.is_owner && (
                      <Chip label="Owner" color="secondary" size="small" variant="filled" />
                    )}
                    {user.is_admin && (
                      <Chip label="Admin" color="secondary" size="small" variant="outlined" />
                    )}
                    {user.is_bot && (
                      <Chip label="Bot" color="info" size="small" variant="outlined" />
                    )}
                    {!user.deleted && !user.is_owner && !user.is_admin && !user.is_bot && (
                      <Chip label="User" color="default" size="small" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => handleSendWelcome(user)}
                      disabled={sendWelcomeMutation.isPending || !user.id}
                      sx={{ textTransform: 'none', minWidth: 150 }}
                    >
                      {selectedDepartment ? `Welcome (${selectedDepartment})` : 'Send Welcome'}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Enter message..."
                        value={customMessages[user.id] || ''}
                        onChange={(e) => handleMessageChange(user.id, e.target.value)}
                        sx={{ flexGrow: 1, minWidth: 200 }}
                        disabled={sendCustomMessageMutation.isPending}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<SendIcon />}
                        onClick={() => handleSendCustomMessage(user)}
                        disabled={sendCustomMessageMutation.isPending || !user.id}
                        sx={{ textTransform: 'none', minWidth: 120 }}
                      >
                        Send Message
                      </Button>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedUsers(prev => ({
                      ...prev,
                      [user.id]: !prev[user.id]
                    }))}
                    sx={{
                      transform: expandedUsers[user.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
              {expandedUsers[user.id] && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse in={expandedUsers[user.id]} timeout="auto" unmountOnExit>
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
                          {JSON.stringify(user, null, 2)}
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
