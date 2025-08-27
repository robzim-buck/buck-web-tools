import React, { useState, useMemo } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, TextField, InputAdornment, Typography, CircularProgress,
  Alert, Pagination, IconButton, Tooltip, Avatar, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Computer as ComputerIcon,
  Laptop as LaptopIcon,
  Storage as ServerIcon,
  Cloud as CloudIcon,
  Refresh as RefreshIcon,
  Circle as StatusIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';

export default function WorkstationsList({ 
  onSelectWorkstation, 
  selectedWorkstation,
  filters = {},
  maxHeight = 400
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch machines
  const machinesQuery = useProtectedApiGet('/buckldap_machineinfo', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Fetch assignments to determine availability
  const assignmentsQuery = useProtectedApiGet('/assignments/Assignments', {
    queryConfig: {
      staleTime: 30 * 1000
    }
  });

  // Helper function to determine workstation type from OS
  const getWorkstationTypeFromOS = (os) => {
    if (!os) return 'desktop';
    const osLower = os.toLowerCase();
    if (osLower.includes('server')) return 'server';
    if (osLower.includes('mac')) return 'laptop';
    if (osLower.includes('windows')) return 'desktop';
    return 'desktop';
  };

  // Process workstations
  const processedWorkstations = useMemo(() => {
    console.log('WorkstationsList - Raw machines data:', machinesQuery.data?.length);
    console.log('WorkstationsList - Raw assignments data:', assignmentsQuery.data?.length);
    
    if (!machinesQuery.data) return [];
    
    const assignments = assignmentsQuery.data || [];
    const assignedMachines = new Set(assignments.map(a => a.machine_name));

    const processed = machinesQuery.data
      .filter(machine => machine.name)
      .map(machine => ({
        id: machine.name,
        name: machine.name,
        operatingSystem: machine.operatingSystem || 'Unknown',
        operatingSystemVersion: machine.operatingSystemVersion || '',
        type: getWorkstationTypeFromOS(machine.operatingSystem),
        status: assignedMachines.has(machine.name) ? 'assigned' : 'available',
        assignedTo: assignments.find(a => a.machine_name === machine.name)?.email || null,
        lastSeen: machine.whenChanged || machine.whenCreated || new Date().toISOString(),
        distinguishedName: machine.distinguishedName
      }));
    
    console.log('WorkstationsList - Processed workstations:', processed.length, processed.slice(0, 3));
    return processed;
  }, [machinesQuery.data, assignmentsQuery.data]);

  // Filter and sort workstations
  const filteredWorkstations = useMemo(() => {
    let filtered = [...processedWorkstations];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(workstation =>
        workstation.name.toLowerCase().includes(search) ||
        workstation.operatingSystem.toLowerCase().includes(search) ||
        (workstation.assignedTo && workstation.assignedTo.toLowerCase().includes(search))
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(workstation => workstation.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(workstation => workstation.type === filters.type);
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortColumn) {
          case 'workstation':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'os':
            aValue = (a.operatingSystem || '').toLowerCase();
            bValue = (b.operatingSystem || '').toLowerCase();
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          case 'assigned':
            aValue = (a.assignedTo || '').toLowerCase();
            bValue = (b.assignedTo || '').toLowerCase();
            break;
          case 'lastSeen':
            aValue = new Date(a.lastSeen || 0).getTime();
            bValue = new Date(b.lastSeen || 0).getTime();
            break;
          default:
            return 0;
        }
        
        if (sortColumn === 'lastSeen') {
          // For dates, compare numeric values
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        } else {
          // For strings, compare alphabetically
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }

    return filtered;
  }, [processedWorkstations, searchTerm, filters, sortColumn, sortDirection]);

  // Paginate workstations
  const paginatedWorkstations = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredWorkstations.slice(start, start + rowsPerPage);
  }, [filteredWorkstations, page]);

  const totalPages = Math.ceil(filteredWorkstations.length / rowsPerPage);

  const handleWorkstationSelect = (workstation) => {
    if (onSelectWorkstation) {
      onSelectWorkstation(workstation);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setRowsPerPage(event.target.value);
    setPage(1); // Reset to first page when changing page size
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'laptop': return <LaptopIcon fontSize="small" />;
      case 'server': return <ServerIcon fontSize="small" />;
      case 'virtual': return <CloudIcon fontSize="small" />;
      default: return <ComputerIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'warning';
      case 'maintenance': return 'error';
      default: return 'default';
    }
  };

  const formatLastSeen = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (machinesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (machinesQuery.error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading workstations: {machinesQuery.error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with search */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search workstations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>Rows</InputLabel>
            <Select
              value={rowsPerPage}
              onChange={handlePageSizeChange}
              label="Rows"
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'white',
                    '& .MuiMenuItem-root': {
                      backgroundColor: 'white'
                    }
                  }
                }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          
          {totalPages > 1 && (
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Page</InputLabel>
              <Select
                value={page}
                onChange={(e) => setPage(e.target.value)}
                label="Page"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'white',
                      '& .MuiMenuItem-root': {
                        backgroundColor: 'white'
                      }
                    }
                  }
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => {
              machinesQuery.refetch();
              assignmentsQuery.refetch();
            }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {filteredWorkstations.length} workstations found {sortColumn && `(sorted by ${sortColumn} ${sortDirection})`}
        </Typography>
      </Box>

      {/* Workstations table */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: maxHeight - 120 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'white' }}>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('workstation')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Workstation
                    {getSortIcon('workstation')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('os')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Operating System
                    {getSortIcon('os')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('status')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Status
                    {getSortIcon('status')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('assigned')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Assigned To
                    {getSortIcon('assigned')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('lastSeen')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Last Seen
                    {getSortIcon('lastSeen')}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedWorkstations.map((workstation) => (
                <TableRow
                  key={workstation.id}
                  hover
                  onClick={() => handleWorkstationSelect(workstation)}
                  selected={selectedWorkstation?.name === workstation.name}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: 'secondary.main'
                        }}
                      >
                        {getTypeIcon(workstation.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {workstation.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {workstation.type}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {workstation.operatingSystem}
                    </Typography>
                    {workstation.operatingSystemVersion && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {workstation.operatingSystemVersion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workstation.status}
                      size="small"
                      color={getStatusColor(workstation.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {workstation.assignedTo ? (
                      <Typography variant="body2">
                        {workstation.assignedTo}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatLastSeen(workstation.lastSeen)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              {paginatedWorkstations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No workstations found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      {filteredWorkstations.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, filteredWorkstations.length)} of {filteredWorkstations.length}
          </Typography>
          
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              size="small"
              color="primary"
            />
          )}
        </Box>
      )}
    </Box>
  );
}