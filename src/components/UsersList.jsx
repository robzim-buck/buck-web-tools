import React, { useState, useMemo } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Avatar, TextField, InputAdornment, Typography,
  CircularProgress, Alert, Pagination, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';

export default function UsersList({ 
  onSelectUser, 
  selectedUser,
  filters = {},
  maxHeight = 400
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch users
  const usersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Process and filter users
  const processedUsers = useMemo(() => {
    console.log('UsersList - Raw users data:', usersQuery.data);
    if (!usersQuery.data) return [];
    
    // First, let's see what statuses we have in the raw data
    const allStatuses = usersQuery.data
      .filter(user => user.profile?.email)
      .map(user => user.status)
      .filter(Boolean);
    
    const statusCounts = allStatuses.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('UsersList - All user status counts:', statusCounts);
    console.log('UsersList - Sample statuses:', allStatuses.slice(0, 20));
    
    const processed = usersQuery.data
      .filter(user => {
        // Only users with email in profile
        if (!user.profile?.email) return false;
        
        // Include users with relevant statuses for workstation assignment
        const status = user.status || 'ACTIVE';
        
        // Include ACTIVE, PASSWORD_EXPIRED, and RECOVERY users
        // Exclude SUSPENDED users as they shouldn't get workstation assignments
        const isIncluded = ['ACTIVE', 'PASSWORD_EXPIRED', 'RECOVERY'].includes(status);
        
        if (!isIncluded) {
          console.log(`UsersList - Filtering out user with status: "${status}" for ${user.profile.email}`);
        }
        
        return isIncluded;
      })
      .map(user => ({
        id: user.id || user.profile.email,
        email: user.profile.email,
        displayName: user.profile.displayName || `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user.profile.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        department: user.profile.department || 'Unknown',
        status: user.status || 'ACTIVE',
        location: user.profile.city || user.profile.office || 'Unknown'
      }));
    
    console.log('UsersList - Processed users:', processed.length, processed.slice(0, 3));
    console.log('UsersList - Final user statuses:', processed.map(u => u.status).slice(0, 10));
    return processed;
  }, [usersQuery.data]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = [...processedUsers];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(search) ||
        user.displayName.toLowerCase().includes(search) ||
        user.department.toLowerCase().includes(search)
      );
    }

    // Apply additional filters if provided
    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department);
    }
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter(user => user.location === filters.location);
    }

    // Apply sorting
    if (sortColumn) {
      const originalFirst = filtered[0]?.email;
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortColumn) {
          case 'user':
            aValue = (a.displayName || '').toLowerCase();
            bValue = (b.displayName || '').toLowerCase();
            break;
          case 'email':
            aValue = (a.email || '').toLowerCase();
            bValue = (b.email || '').toLowerCase();
            break;
          case 'department':
            aValue = (a.department || '').toLowerCase();
            bValue = (b.department || '').toLowerCase();
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      console.log('Sort applied:', sortColumn, sortDirection, 'First was:', originalFirst, 'Now:', filtered[0]?.email);
    }

    return filtered;
  }, [processedUsers, searchTerm, filters, sortColumn, sortDirection]);

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const handleUserSelect = (user) => {
    if (onSelectUser) {
      onSelectUser(user);
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

  const getUserInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'DEPROVISIONED': return 'error';
      default: return 'default';
    }
  };

  if (usersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (usersQuery.error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading users: {usersQuery.error.message}
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
            placeholder="Search users..."
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
            <IconButton size="small" onClick={() => usersQuery.refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {filteredUsers.length} users found {sortColumn && `(sorted by ${sortColumn} ${sortDirection})`}
        </Typography>
      </Box>

      {/* Users table */}
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
                  onClick={() => handleSort('user')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    User
                    {getSortIcon('user')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('email')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Email
                    {getSortIcon('email')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    backgroundColor: 'white', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                  onClick={() => handleSort('department')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Department
                    {getSortIcon('department')}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => handleUserSelect(user)}
                  selected={selectedUser?.email === user.email}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          fontSize: '0.875rem',
                          bgcolor: 'primary.main'
                        }}
                      >
                        {getUserInitials(user)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.location}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.department}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={getStatusColor(user.status)}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}
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