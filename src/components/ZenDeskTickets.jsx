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
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton
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
  ExpandLess as ExpandLessIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  ViewList as ViewListIcon,
  TableView as TableViewIcon
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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
          <Typography variant="body1" sx={{ mt: 2, color: '#667eea', fontWeight: 600 }}>Loading Zendesk tickets...</Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error && !tickets) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          sx={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid #fca5a5'
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchTickets}
            >
              Try again
            </Button>
          }
        >
          <Typography variant="subtitle1">Something went wrong:</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Container>
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
      <Container maxWidth="xl" sx={{ py: 6, pb: 12, px: 6, position: 'relative', overflow: 'visible' }}>
        {/* Modern Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ConfirmationNumberIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {props.name || 'Zendesk Tickets'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Support ticket management and tracking
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  '& .MuiToggleButton-root': {
                    color: '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.1)'
                    }
                  }
                }}
              >
                <ToggleButton value="table" aria-label="table view">
                  <TableViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Table
                </ToggleButton>
                <ToggleButton value="card" aria-label="card view">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Card
                </ToggleButton>
              </ToggleButtonGroup>

              <IconButton
                onClick={fetchTickets}
                title="Refresh tickets"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'rotate(180deg)',
                    transition: 'all 0.5s'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>

              <FormControl
                sx={{
                  minWidth: 150,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: 2,
                  },
                  '& .MuiInputLabel-root': {
                    bgcolor: 'transparent',
                    px: 0.5
                  }
                }}
                size="small"
              >
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
        </Paper>

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderTop: '4px solid #667eea',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography
                  sx={{ color: '#718096', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}
                  gutterBottom
                >
                  Total Tickets
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                    {stats.total}
                  </Typography>
                  {stats.filtered !== stats.total && (
                    <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                      {stats.filtered} filtered
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderTop: '4px solid #764ba2',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(118, 75, 162, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography
                  sx={{ color: '#718096', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}
                  gutterBottom
                >
                  By Priority
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  {stats.urgent > 0 && (
                    <Chip
                      label={`${stats.urgent} Urgent`}
                      size="small"
                      sx={{
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {stats.high > 0 && (
                    <Chip
                      label={`${stats.high} High`}
                      size="small"
                      sx={{
                        bgcolor: '#fed7aa',
                        color: '#ea580c',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {stats.normal > 0 && (
                    <Chip
                      label={`${stats.normal} Normal`}
                      size="small"
                      sx={{
                        bgcolor: '#dbeafe',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {stats.low > 0 && (
                    <Chip
                      label={`${stats.low} Low`}
                      size="small"
                      sx={{
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography
                  sx={{ color: '#718096', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}
                  gutterBottom
                >
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
                          <SearchIcon fontSize="small" sx={{ color: '#667eea' }} />
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
                    sx={{
                      flexGrow: 1,
                      maxWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#764ba2',
                        },
                      },
                    }}
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
                    variant="contained"
                    size="small"
                    startIcon={<ClearAllIcon />}
                    onClick={clearAllFilters}
                    disabled={!subjectFilter && !priorityFilter && !dateString}
                    sx={{
                      background: !subjectFilter && !priorityFilter && !dateString
                        ? 'rgba(0, 0, 0, 0.12)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: !subjectFilter && !priorityFilter && !dateString
                          ? 'rgba(0, 0, 0, 0.12)'
                          : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      }
                    }}
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
            <LinearProgress
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            />
          </Box>
        )}

        {filteredData.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#718096', mb: 2 }}>
              No tickets match your filters
            </Typography>
            <Button
              variant="contained"
              onClick={clearAllFilters}
              startIcon={<ClearAllIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                }
              }}
            >
              Clear All Filters
            </Button>
          </Paper>
        ) : viewMode === 'card' ? (
          /* Card View */
          <Grid container spacing={3} sx={{ position: 'relative', overflow: 'visible' }}>
            {filteredData.map((ticket) => {
              const updatedDate = formatDate(ticket.updated_at);
              const fromName = ticket.via?.source?.from?.name || 'N/A';
              const fromEmail = ticket.via?.source?.from?.address || 'N/A';

              return (
                <Grid item xs={12} sm={6} md={4} key={ticket.id} sx={{ position: 'relative', overflow: 'visible' }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      borderTop: ticket.priority === 'urgent'
                        ? '3px solid #dc2626'
                        : ticket.priority === 'high'
                          ? '3px solid #ea580c'
                          : '3px solid #667eea',
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'scale(1.25) translateY(-12px)',
                        boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
                        zIndex: 1001,
                        '& .hover-details': {
                          opacity: 1,
                          visibility: 'visible'
                        }
                      },
                      '&:has(.hover-details:hover)': {
                        transform: 'scale(1.25) translateY(-12px)',
                        boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
                        zIndex: 1001,
                        '& .hover-details': {
                          opacity: 1,
                          visibility: 'visible'
                        }
                      }
                    }}
                  >
                    <Box sx={{ overflow: 'hidden', borderRadius: 2 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Priority and Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={ticket.priority || 'None'}
                          size="small"
                          color={getPriorityColor(ticket.priority)}
                          icon={ticket.priority === 'urgent' ? <PriorityHighIcon fontSize="small" /> : undefined}
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: '20px' }}
                        />
                        <Chip
                          label={ticket.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: '20px',
                            ...(ticket.status === 'new' && {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none'
                            }),
                            ...(ticket.status !== 'new' && {
                              bgcolor: '#f5f5f5',
                              color: '#718096',
                              border: '1px solid #e2e8f0'
                            })
                          }}
                        />
                      </Box>

                      {/* Subject */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: '#2d3748',
                          mb: 0.5,
                          fontSize: '0.95rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '2.6em'
                        }}
                      >
                        {ticket.subject}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#718096',
                          mb: 1,
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '2.6em'
                        }}
                      >
                        {ticket.description ? ticket.description.split('\n')[0] : 'No description'}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      {/* Compact Info Grid */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                        {/* From */}
                        <Box>
                          <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.25 }}>
                            From
                          </Typography>
                          <Tooltip title={fromEmail}>
                            <Typography variant="body2" sx={{ color: '#2d3748', fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fromName}
                            </Typography>
                          </Tooltip>
                        </Box>

                        {/* Last Updated */}
                        <Box>
                          <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.25 }}>
                            Updated
                          </Typography>
                          <Tooltip title={updatedDate.formatted}>
                            <Typography variant="body2" sx={{ color: '#2d3748', fontWeight: 600, fontSize: '0.8rem' }}>
                              {updatedDate.relative}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* ID */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'inline', mr: 0.5 }}>
                          ID:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 700, fontSize: '0.8rem', display: 'inline' }}>
                          #{ticket.id}
                        </Typography>
                      </Box>

                      {/* Toggle Raw JSON Button */}
                      <Button
                        fullWidth
                        size="small"
                        onClick={() => handleExpandClick(ticket.id)}
                        endIcon={expandedRows.has(ticket.id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        sx={{
                          py: 0.5,
                          fontSize: '0.75rem',
                          background: expandedRows.has(ticket.id)
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'transparent',
                          color: expandedRows.has(ticket.id) ? 'white' : '#667eea',
                          border: '1px solid',
                          borderColor: expandedRows.has(ticket.id) ? 'transparent' : '#667eea',
                          fontWeight: 600,
                          '&:hover': {
                            background: expandedRows.has(ticket.id)
                              ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                              : 'rgba(102, 126, 234, 0.1)',
                            borderColor: '#667eea'
                          }
                        }}
                      >
                        {expandedRows.has(ticket.id) ? 'Hide' : 'Show'} Raw JSON
                      </Button>

                      {/* Raw JSON Data - Collapsible */}
                      {expandedRows.has(ticket.id) && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.7rem', display: 'block', mb: 0.5 }}
                          >
                            Raw JSON Data
                          </Typography>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              backgroundColor: '#fafafa',
                              border: '1px solid #e2e8f0',
                              borderRadius: 1,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              overflowX: 'auto'
                            }}
                          >
                            <pre style={{
                              margin: 0,
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: '#2d3748',
                              lineHeight: 1.3
                            }}>
                              {JSON.stringify(ticket, null, 2)}
                            </pre>
                          </Paper>
                        </Box>
                      )}
                      </CardContent>
                    </Box>

                    {/* Hover Details Overlay */}
                    <Paper
                      className="hover-details"
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        top: '15%',
                        left: '15%',
                        width: '140%',
                        height: '140%',
                        p: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'all 0.3s ease',
                        zIndex: 1002,
                        pointerEvents: 'auto',
                        overflowY: 'auto',
                        cursor: 'default',
                        boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5)',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.5)',
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.9 }}>
                          Ticket Details
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7, fontStyle: 'italic' }}>
                          Move away to close
                        </Typography>
                      </Box>

                      {/* Full Subject */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                          Subject
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
                          {ticket.subject}
                        </Typography>
                      </Box>

                      {/* Full Description */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                          Description
                        </Typography>
                        <Box
                          sx={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            pr: 1,
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'rgba(255, 255, 255, 0.3)',
                              borderRadius: '3px',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.5)',
                              }
                            }
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              opacity: 0.95
                            }}
                          >
                            {ticket.description || 'No description available'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Grid Layout for Details */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                            From
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {fromName}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            {fromEmail}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                            Priority
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {ticket.priority || 'None'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Timestamps */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                            Created
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {ticket.created_at ? formatDate(ticket.created_at).relative : 'N/A'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, fontSize: '0.65rem', display: 'block' }}>
                            Updated
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {updatedDate.relative}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          /* Table View */
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Table size="medium">
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                  }}
                >
                  <TableCell width="5%" sx={{ fontWeight: 700, color: '#4a5568' }}></TableCell>
                  <TableCell width="28%" sx={{ fontWeight: 700, color: '#4a5568' }}>Subject</TableCell>
                  <TableCell width="15%" sx={{ fontWeight: 700, color: '#4a5568' }}>From</TableCell>
                  <TableCell width="10%" sx={{ fontWeight: 700, color: '#4a5568' }}>Priority</TableCell>
                  <TableCell width="15%" sx={{ fontWeight: 700, color: '#4a5568' }}>Last Updated</TableCell>
                  <TableCell width="10%" sx={{ fontWeight: 700, color: '#4a5568' }}>Status</TableCell>
                  <TableCell width="10%" sx={{ fontWeight: 700, color: '#4a5568' }}>ID</TableCell>
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
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          borderLeft: ticket.priority === 'urgent'
                            ? '4px solid #dc2626'
                            : ticket.priority === 'high'
                              ? '4px solid #ea580c'
                              : undefined,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(102, 126, 234, 0.04)',
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(ticket.id)}
                            aria-label="expand row"
                            sx={{
                              color: '#667eea',
                              '&:hover': {
                                bgcolor: 'rgba(102, 126, 234, 0.1)'
                              }
                            }}
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
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...(ticket.status === 'new' && {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none'
                            }),
                            ...(ticket.status !== 'new' && {
                              bgcolor: '#f5f5f5',
                              color: '#718096',
                              border: '1px solid #e2e8f0'
                            })
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">{ticket.id}</Typography>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, bgcolor: 'rgba(102, 126, 234, 0.02)' }}>
                          <Box sx={{ m: 3 }}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              sx={{ fontWeight: 700, color: '#667eea', mb: 2 }}
                            >
                              Raw JSON Data
                            </Typography>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 3,
                                backgroundColor: '#fafafa',
                                border: '1px solid #e2e8f0',
                                borderRadius: 2,
                                overflowX: 'auto'
                              }}
                            >
                              <pre style={{
                                margin: 0,
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                color: '#2d3748'
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
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
            Showing {filteredData.length} of {tickets.length} {status} tickets
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#667eea',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            }}
          />
        </Paper>
      </Container>
    );
  }

  // Default loading state
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} sx={{ color: '#667eea' }} />
      </Box>
    </Container>
  );
}