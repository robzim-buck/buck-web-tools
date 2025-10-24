import React, { useMemo, useState } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Link as MuiLink,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  Link as LinkIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const GlobalCapabilities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [orderBy, setOrderBy] = useState('Date');
  const [order, setOrder] = useState('desc');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState([]);
  const [selectedEPs, setSelectedEPs] = useState([]);
  const [selectedGCDs, setSelectedGCDs] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  const { data: capabilitiesData, isLoading, error } = useProtectedApiGet('/coda/global_capabilities', {
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  });

  // Extract all unique statuses from the data
  const allStatuses = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];
    const statusSet = new Set();
    capabilitiesData.forEach(item => {
      if (item.Status) statusSet.add(item.Status.trim());
    });
    return Array.from(statusSet).sort();
  }, [capabilitiesData]);

  // Extract all unique clients from the data
  const allClients = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];
    const clientSet = new Set();
    capabilitiesData.forEach(item => {
      if (item.Client) clientSet.add(item.Client.trim());
    });
    return Array.from(clientSet).sort();
  }, [capabilitiesData]);

  // Extract all unique business units from the data
  const allBusinessUnits = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];
    const businessUnitSet = new Set();
    capabilitiesData.forEach(item => {
      if (item['Business Unit']) businessUnitSet.add(item['Business Unit'].trim());
    });
    return Array.from(businessUnitSet).sort();
  }, [capabilitiesData]);

  // Extract all unique EPs from the data
  const allEPs = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];
    const epSet = new Set();
    capabilitiesData.forEach(item => {
      if (item.EP) epSet.add(item.EP.trim());
    });
    return Array.from(epSet).sort();
  }, [capabilitiesData]);

  // Extract all unique GCDs from the data (split on comma)
  const allGCDs = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];
    const gcdSet = new Set();
    capabilitiesData.forEach(item => {
      if (item.GCD) {
        // Split on comma and trim whitespace
        const gcds = item.GCD.split(',').map(gcd => gcd.trim());
        gcds.forEach(gcd => {
          if (gcd) gcdSet.add(gcd);
        });
      }
    });
    return Array.from(gcdSet).sort();
  }, [capabilitiesData]);

  const filteredCapabilities = useMemo(() => {
    if (!capabilitiesData || !Array.isArray(capabilitiesData)) return [];

    let filtered = capabilitiesData;

    // Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.Status) return false;
        return selectedStatuses.includes(item.Status.trim());
      });
    }

    // Filter by selected clients
    if (selectedClients.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.Client) return false;
        return selectedClients.includes(item.Client.trim());
      });
    }

    // Filter by selected business units
    if (selectedBusinessUnits.length > 0) {
      filtered = filtered.filter(item => {
        if (!item['Business Unit']) return false;
        return selectedBusinessUnits.includes(item['Business Unit'].trim());
      });
    }

    // Filter by selected EPs
    if (selectedEPs.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.EP) return false;
        return selectedEPs.includes(item.EP.trim());
      });
    }

    // Filter by selected GCDs
    if (selectedGCDs.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.GCD) return false;
        // Split the item's GCDs and check if any match the selected ones
        const itemGCDs = item.GCD.split(',').map(gcd => gcd.trim());
        return itemGCDs.some(gcd => selectedGCDs.includes(gcd));
      });
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.Client?.toLowerCase().includes(lowerSearchTerm) ||
        item.Status?.toLowerCase().includes(lowerSearchTerm) ||
        item.EP?.toLowerCase().includes(lowerSearchTerm) ||
        item.GCD?.toLowerCase().includes(lowerSearchTerm) ||
        item['Business Unit']?.toLowerCase().includes(lowerSearchTerm) ||
        item.Notes?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[orderBy] || '';
      let bValue = b[orderBy] || '';

      // Handle date sorting
      if (orderBy === 'Date') {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [capabilitiesData, searchTerm, orderBy, order, selectedStatuses, selectedClients, selectedBusinessUnits, selectedEPs, selectedGCDs]);

  const groupedCapabilities = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Capabilities': filteredCapabilities };
    }

    const groups = {};
    filteredCapabilities.forEach(item => {
      const groupKey = item[groupBy] || 'Unknown';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    // Sort groups alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredCapabilities, groupBy]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading capabilities: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Global Capabilities
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View and manage capabilities presentations across all clients
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by client, status, EP, GCD, business unit, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              multiple
              value={selectedStatuses}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedStatuses([]);
                } else {
                  setSelectedStatuses(value);
                }
              }}
              input={<OutlinedInput label="Filter by Status" />}
              renderValue={(selected) => selected.length === 0 ? 'All Statuses' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
                  <ListItemText primary={status} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Client</InputLabel>
            <Select
              multiple
              value={selectedClients}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedClients([]);
                } else {
                  setSelectedClients(value);
                }
              }}
              input={<OutlinedInput label="Filter by Client" />}
              renderValue={(selected) => selected.length === 0 ? 'All Clients' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allClients.map((client) => (
                <MenuItem key={client} value={client}>
                  <Checkbox checked={selectedClients.indexOf(client) > -1} />
                  <ListItemText primary={client} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Business Unit</InputLabel>
            <Select
              multiple
              value={selectedBusinessUnits}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedBusinessUnits([]);
                } else {
                  setSelectedBusinessUnits(value);
                }
              }}
              input={<OutlinedInput label="Filter by Business Unit" />}
              renderValue={(selected) => selected.length === 0 ? 'All Business Units' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allBusinessUnits.map((businessUnit) => (
                <MenuItem key={businessUnit} value={businessUnit}>
                  <Checkbox checked={selectedBusinessUnits.indexOf(businessUnit) > -1} />
                  <ListItemText primary={businessUnit} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter by EP</InputLabel>
            <Select
              multiple
              value={selectedEPs}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedEPs([]);
                } else {
                  setSelectedEPs(value);
                }
              }}
              input={<OutlinedInput label="Filter by EP" />}
              renderValue={(selected) => selected.length === 0 ? 'All EPs' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allEPs.map((ep) => (
                <MenuItem key={ep} value={ep}>
                  <Checkbox checked={selectedEPs.indexOf(ep) > -1} />
                  <ListItemText primary={ep} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter by GCD</InputLabel>
            <Select
              multiple
              value={selectedGCDs}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedGCDs([]);
                } else {
                  setSelectedGCDs(value);
                }
              }}
              input={<OutlinedInput label="Filter by GCD" />}
              renderValue={(selected) => selected.length === 0 ? 'All GCDs' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allGCDs.map((gcd) => (
                <MenuItem key={gcd} value={gcd}>
                  <Checkbox checked={selectedGCDs.indexOf(gcd) > -1} />
                  <ListItemText primary={gcd} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={groupBy}
              label="Group By"
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="Status">Status</MenuItem>
              <MenuItem value="Client">Client</MenuItem>
              <MenuItem value="Business Unit">Business Unit</MenuItem>
              <MenuItem value="EP">EP</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="cards" aria-label="card view">
              <ViewModuleIcon sx={{ mr: 1 }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <TableRowsIcon sx={{ mr: 1 }} />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Found {filteredCapabilities.length} capabilit{filteredCapabilities.length !== 1 ? 'ies' : 'y'}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
                size="small"
              />
            }
            label="Show Notes"
          />
        </Box>
      </Paper>

      {viewMode === 'table' ? (
        Object.entries(groupedCapabilities).map(([groupName, items]) => (
          <Box key={groupName} sx={{ mb: 3 }}>
            {groupBy !== 'none' && (
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {groupName} ({items.length})
              </Typography>
            )}
            <TableContainer component={Paper} elevation={3}>
              <Table sx={{ minWidth: 650 }} aria-label="capabilities table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Client'}
                        direction={orderBy === 'Client' ? order : 'asc'}
                        onClick={() => handleRequestSort('Client')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Client</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Status'}
                        direction={orderBy === 'Status' ? order : 'asc'}
                        onClick={() => handleRequestSort('Status')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Status</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Date'}
                        direction={orderBy === 'Date' ? order : 'asc'}
                        onClick={() => handleRequestSort('Date')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Date</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Business Unit'}
                        direction={orderBy === 'Business Unit' ? order : 'asc'}
                        onClick={() => handleRequestSort('Business Unit')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Business Unit</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'EP'}
                        direction={orderBy === 'EP' ? order : 'asc'}
                        onClick={() => handleRequestSort('EP')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>EP</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'GCD'}
                        direction={orderBy === 'GCD' ? order : 'asc'}
                        onClick={() => handleRequestSort('GCD')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>GCD</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Link</Typography>
                    </TableCell>
                    {showNotes && (
                      <TableCell sx={{ color: 'white' }}>
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Notes</Typography>
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={`${item.rowname}-${index}`}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                        '&:hover': { backgroundColor: 'action.selected' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{item.Client || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.Status || 'Unknown'}
                          color={getStatusColor(item.Status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.Date)}</TableCell>
                      <TableCell>{item['Business Unit'] || 'N/A'}</TableCell>
                      <TableCell>{item.EP || 'N/A'}</TableCell>
                      <TableCell>{item.GCD || 'N/A'}</TableCell>
                      <TableCell>
                        {item.Link ? (
                          <MuiLink href={item.Link} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinkIcon fontSize="small" />
                            View
                          </MuiLink>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      {showNotes && (
                        <TableCell>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                            {item.Notes || 'N/A'}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      ) : (
        Object.entries(groupedCapabilities).map(([groupName, items]) => (
          <Box key={groupName} sx={{ mb: 4 }}>
            {groupBy !== 'none' && (
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {groupName} ({items.length})
              </Typography>
            )}
            <Grid container spacing={3}>
              {items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${item.rowname}-${index}`}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Header */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {item.Client || 'Unknown Client'}
                        </Typography>
                        <Chip
                          label={item.Status || 'Unknown'}
                          color={getStatusColor(item.Status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(item.Date)}
                          </Typography>
                        </Box>

                        {/* Business Unit */}
                        {item['Business Unit'] && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {item['Business Unit']}
                            </Typography>
                          </Box>
                        )}

                        {/* EP */}
                        {item.EP && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              EP: {item.EP}
                            </Typography>
                          </Box>
                        )}

                        {/* GCD */}
                        {item.GCD && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              GCD: {item.GCD}
                            </Typography>
                          </Box>
                        )}

                        {/* Link */}
                        {item.Link && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <MuiLink href={item.Link} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LinkIcon fontSize="small" />
                              View Presentation
                            </MuiLink>
                          </Box>
                        )}

                        {/* Notes */}
                        {showNotes && item.Notes && (
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <DescriptionIcon fontSize="small" color="action" />
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }} color="text.secondary">
                                Notes:
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', pl: 4 }}>
                              {item.Notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {filteredCapabilities.length === 0 && !isLoading && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No capabilities found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default GlobalCapabilities;
