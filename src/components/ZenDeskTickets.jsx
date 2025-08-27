import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { 
  Typography, Box, Container, Grid, 
  Card, CardContent, Chip, Divider, Alert, 
  Paper, TextField, InputAdornment, Tooltip,
  Select, MenuItem, FormControl, InputLabel,
  Button, IconButton, Stack, Badge,
  Tab, Tabs, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterAltIcon,
  ClearAll as ClearAllIcon,
  PriorityHigh as PriorityHighIcon,
  Label as LabelIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CircularProgress from '@mui/material/CircularProgress';
import uuid from 'react-uuid';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

// Error Boundary Component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box role="alert" sx={{ p: 3 }}>
      <Alert 
        severity="error" 
        variant="filled"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={resetErrorBoundary}
          >
            Try again
          </Button>
        }
      >
        <Typography variant="subtitle1">Something went wrong:</Typography>
        <Typography variant="body2">{error.message}</Typography>
      </Alert>
    </Box>
  );
}

export default function ZenDeskTickets(props) {
  // States for data and filters
  const [tickets, setTickets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('new');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateValue, setDateValue] = useState(null);
  const [dateString, setDateString] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch tickets data
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://laxcoresrv.buck.local:8000/zendesk_query?querystring=type%3Aticket%20status%3A${status}`
      );
      setTickets(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
      console.error('Error fetching Zendesk tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on status change
  useEffect(() => {
    fetchTickets();
  }, [status]);

  // Clear filters functions
  const clearSubjectFilter = () => setSubjectFilter('');
  const clearPriorityFilter = () => setPriorityFilter('');
  const clearDateFilter = () => {
    setDateString('');
    setDateValue(null);
  };
  const clearAllFilters = () => {
    clearSubjectFilter();
    clearPriorityFilter();
    clearDateFilter();
  };

  // Handle date change
  const handleDateChange = (newValue) => {
    if (!newValue) {
      clearDateFilter();
      return;
    }
    setDateValue(newValue);
    setDateString(newValue.format('YYYY-MM-DD'));
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Format date to relative time
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return {
      relative: date.fromNow(),
      formatted: date.format('MMM D, YYYY h:mm A')
    };
  };

  // Handle row expansion toggle
  const handleExpandClick = (ticketId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedRows(newExpanded);
  };

  // Loading state
  if (loading && !tickets) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading Zendesk tickets...</Typography>
      </Box>
    );
  }

  // Error state
  if (error && !tickets) {
    return (
      <ErrorFallback 
        error={{ message: error }} 
        resetErrorBoundary={fetchTickets} 
      />
    );
  }

  // Process data when tickets are loaded
  if (tickets) {
    // Apply filters
    let filteredData = tickets;

    if (subjectFilter) {
      filteredData = filteredData.filter(ticket => 
        ticket.subject.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    if (priorityFilter) {
      filteredData = filteredData.filter(ticket => 
        ticket.priority === priorityFilter
      );
    }

    if (dateString) {
      filteredData = filteredData.filter(ticket => 
        ticket.updated_at.includes(dateString)
      );
    }

    // Get array of unique priorities for filter dropdown
    const priorities = [...new Set(tickets.map(ticket => ticket.priority))].filter(Boolean);

    // Stats for the current view
    const stats = {
      total: tickets.length,
      filtered: filteredData.length,
      urgent: filteredData.filter(t => t.priority === 'urgent').length,
      high: filteredData.filter(t => t.priority === 'high').length,
      normal: filteredData.filter(t => t.priority === 'normal').length,
      low: filteredData.filter(t => t.priority === 'low').length
    };

    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant='h4' color="primary" fontWeight="medium">
            {props.name || 'Zendesk Tickets'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              color="primary" 
              onClick={fetchTickets} 
              title="Refresh tickets"
            >
              <RefreshIcon />
            </IconButton>
            
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: 'white',
                      color: 'black'
                    }
                  }
                }}
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Total Tickets
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.filtered !== stats.total && `${stats.filtered} filtered`}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  By Priority
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {stats.urgent > 0 && (
                    <Chip 
                      label={`${stats.urgent} Urgent`}
                      size="small"
                      color="error"
                      variant="filled"
                    />
                  )}
                  {stats.high > 0 && (
                    <Chip 
                      label={`${stats.high} High`}
                      size="small"
                      color="warning"
                      variant="filled"
                    />
                  )}
                  {stats.normal > 0 && (
                    <Chip 
                      label={`${stats.normal} Normal`}
                      size="small"
                      color="info"
                      variant="filled"
                    />
                  )}
                  {stats.low > 0 && (
                    <Chip 
                      label={`${stats.low} Low`}
                      size="small"
                      color="success"
                      variant="filled"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Filters
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                  <TextField
                    placeholder="Filter by subject..."
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: subjectFilter && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={clearSubjectFilter}>
                            <ClearAllIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ flexGrow: 1, maxWidth: 250 }}
                  />
                  
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel id="priority-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>Priority</InputLabel>
                    <Select
                      labelId="priority-filter-label"
                      id="priority-filter"
                      value={priorityFilter}
                      label="Priority"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      displayEmpty
                      sx={{ 
                        backgroundColor: 'white',
                        '& .MuiSelect-select': {
                          backgroundColor: 'white'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            backgroundColor: 'white',
                            color: 'black'
                          }
                        }
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {priorities.map(priority => (
                        <MenuItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Updated on"
                      value={dateValue}
                      onChange={handleDateChange}
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ maxWidth: 150 }}
                    />
                  </LocalizationProvider>
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<ClearAllIcon />}
                    onClick={clearAllFilters}
                    disabled={!subjectFilter && !priorityFilter && !dateString}
                  >
                    Clear All
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tickets List */}
        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        
        {filteredData.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>No tickets match your filters</Typography>
            <Button 
              variant="outlined" 
              onClick={clearAllFilters}
              startIcon={<ClearAllIcon />}
              sx={{ mt: 2 }}
            >
              Clear All Filters
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell width="5%"></TableCell>
                  <TableCell width="28%">Subject</TableCell>
                  <TableCell width="15%">From</TableCell>
                  <TableCell width="10%">Priority</TableCell>
                  <TableCell width="15%">Last Updated</TableCell>
                  <TableCell width="10%">Status</TableCell>
                  <TableCell width="10%">ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((ticket) => {
                  const updatedDate = formatDate(ticket.updated_at);
                  const fromName = ticket.via?.source?.from?.name || 'N/A';
                  const fromEmail = ticket.via?.source?.from?.address || 'N/A';
                  const isExpanded = expandedRows.has(ticket.id);
                  
                  return (
                    <>
                      <TableRow 
                        key={uuid()}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          borderLeft: ticket.priority === 'urgent' 
                            ? '3px solid #f44336' 
                            : ticket.priority === 'high'
                              ? '3px solid #ff9800'
                              : undefined
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(ticket.id)}
                            aria-label="expand row"
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                        <Typography variant="body2" fontWeight="medium">{ticket.subject}</Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: '100%'
                          }}
                        >
                          {ticket.description ? ticket.description.split('\n')[0] : 'No description'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title={fromEmail}>
                          <Box>
                            <Typography variant="body2">{fromName}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{fromEmail}</Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={ticket.priority || 'None'} 
                          size="small"
                          color={getPriorityColor(ticket.priority)}
                          variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'filled' : 'outlined'}
                          icon={ticket.priority === 'urgent' ? <PriorityHighIcon fontSize="small" /> : undefined}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title={updatedDate.formatted}>
                          <Typography variant="body2">{updatedDate.relative}</Typography>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={ticket.status} 
                          size="small"
                          variant="outlined"
                          color={ticket.status === 'new' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">{ticket.id}</Typography>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Box sx={{ m: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Raw JSON Data
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                backgroundColor: '#f5f5f5',
                                overflowX: 'auto'
                              }}
                            >
                              <pre style={{ 
                                margin: 0, 
                                fontFamily: 'monospace', 
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                                {JSON.stringify(ticket, null, 2)}
                              </pre>
                            </Paper>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {filteredData.length} of {tickets.length} {status} tickets
          </Typography>
        </Box>
      </Container>
    );
  }

  // Default loading state
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}