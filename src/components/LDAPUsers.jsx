import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import {
  Typography, Box, Container, Grid,
  Card, CardContent, Chip, Divider,
  Paper, TextField, InputAdornment,
  IconButton, Avatar, Tooltip,
  Collapse, Button, CircularProgress, Alert, AlertTitle,
  Table, TableContainer, TableBody, TableCell, TableRow,
  MenuItem, Pagination, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  CalendarToday as CalendarIcon,
  FilterAlt as FilterIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ViewList as ViewListIcon,
  TableView as TableViewIcon
} from '@mui/icons-material';
import uuid from 'react-uuid';
import MUIDataTable from 'mui-datatables';




const setColor = (param) => {
    if ( param === 514 || param === 66050 || param === 546 ) {
        return 'error'
    }
    if (param !== 512 && param !== 66048) {
        return 'warning'
    }
    return 'success'
}


const setADLabel = (param) => {
    if (param === 546 ) {
        return 'Disabled by Okta'
    }
    if ( param === 512 || param === 66048 ) {
        return 'Active'
    }
    return 'Inactive'
}


export default function LDAPUsers(props) {
    // State for search, filtering, and expanded items
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUsers, setExpandedUsers] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [copiedText, setCopiedText] = useState('');
    const [filters, setFilters] = useState({
        accountStatus: '',
        lastLogin: ''
    });
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    
    // Toggle user expansion
    const toggleUserExpand = (userId) => {
        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };
    
    // Handle clearing the search filter
    const handleClearFilter = () => {
        setSearchTerm('');
    };
    
    // Handle resetting all filters
    const handleResetFilters = () => {
        setFilters({
            accountStatus: '',
            lastLogin: ''
        });
    };
    
    // Toggle expand all
    const toggleExpandAll = (users, expand) => {
        const newExpandedState = {};
        users.forEach(user => {
            newExpandedState[user.name] = expand;
        });
        setExpandedUsers(newExpandedState);
    };
    
    // Copy text to clipboard function
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedText(text);
                setTimeout(() => setCopiedText(''), 2000);
            })
            .catch(err => console.error('Failed to copy: ', err));
    };
    
    // Format date strings
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        
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
    
    const [adUsers] = useQueries({
        queries: [
            {
                queryKey: ["ldapUsers"],
                queryFn: async () => {
                    try {
                        const res = await fetch('https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=person',{
                                method: 'GET',
                                mode: 'cors',
                                  headers: {
                                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                              } 
                            } 
                        );
                        if (!res.ok) {
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        }
                        return res.json();
                    } catch (error) {
                        console.error("Error fetching LDAP users:", error);
                        throw error;
                    }
                },
                retry: 2,
                retryDelay: 1000
            }
        ]
    });
    // Loading state
    if (adUsers.isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                    {props.name || 'LDAP Users'}
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="body1" sx={{ mt: 3 }}>
                            Loading user data from LDAP...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This may take a moment as we gather information from Active Directory.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        );
    }
    
    // Error state
    if (adUsers.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                    {props.name || 'LDAP Users'}
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Error Loading Data</AlertTitle>
                    Failed to load LDAP user data. Please try refreshing the page.
                </Alert>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" color="error" gutterBottom>Error Details:</Typography>
                    <Typography variant="body2">
                        {adUsers.error.message || JSON.stringify(adUsers.error)}
                    </Typography>
                </Paper>
            </Container>
        );
    }
    
    // Data state
    if (adUsers.data) {
        // Sort data alphabetically by name
        const sortedData = adUsers.data.sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        // Apply search filter
        const filteredUsers = sortedData.filter(user => {
            if (!searchTerm) return true;
            
            return (
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.distinguishedName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
        
        // Apply additional filters
        const finalFilteredUsers = filteredUsers.filter(user => {
            const accountStatusFilter = !filters.accountStatus || 
                setADLabel(user.userAccountControl).toLowerCase() === filters.accountStatus.toLowerCase();
                
            // Basic last login filter (within 30 days, older than 30 days, never)
            let loginFilter = true;
            if (filters.lastLogin) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                const lastLogin = user.lastLogon ? new Date(user.lastLogon) : null;
                
                if (filters.lastLogin === 'recent' && (!lastLogin || lastLogin < thirtyDaysAgo)) {
                    loginFilter = false;
                } else if (filters.lastLogin === 'old' && (lastLogin && lastLogin >= thirtyDaysAgo)) {
                    loginFilter = false;
                } else if (filters.lastLogin === 'never' && lastLogin) {
                    loginFilter = false;
                }
            }
            
            return accountStatusFilter && loginFilter;
        });
        
        // Get unique status values for filters
        const accountStatusOptions = [...new Set(sortedData.map(user => setADLabel(user.userAccountControl)))];
        
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                        {props.name || 'LDAP Users'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        User information from Active Directory
                    </Typography>
                </Box>
                
                {/* Search and filter controls */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                        <TextField
                            placeholder="Search users..."
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
                                        <IconButton size="small" onClick={handleClearFilter}>
                                            <ClearAllIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            variant={filters.accountStatus === 'Active' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<LockOpenIcon />}
                            onClick={() => setFilters({ ...filters, accountStatus: filters.accountStatus === 'Active' ? '' : 'Active' })}
                            color={filters.accountStatus === 'Active' ? 'success' : 'inherit'}
                        >
                            Active
                        </Button>

                        <Button
                            variant={filters.accountStatus === 'Inactive' ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<LockIcon />}
                            onClick={() => setFilters({ ...filters, accountStatus: filters.accountStatus === 'Inactive' ? '' : 'Inactive' })}
                            color={filters.accountStatus === 'Inactive' ? 'error' : 'inherit'}
                        >
                            Inactive
                        </Button>

                        <IconButton
                            size="small"
                            color={showFilters ? "primary" : "default"}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ border: showFilters ? '1px solid' : 'none' }}
                        >
                            <FilterIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => newMode && setViewMode(newMode)}
                            size="small"
                        >
                            <ToggleButton value="card" aria-label="card view">
                                <ViewListIcon sx={{ mr: 0.5 }} fontSize="small" />
                                Card
                            </ToggleButton>
                            <ToggleButton value="table" aria-label="table view">
                                <TableViewIcon sx={{ mr: 0.5 }} fontSize="small" />
                                Table
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {viewMode === 'card' && (
                            <>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => toggleExpandAll(finalFilteredUsers, true)}
                                    startIcon={<ExpandMoreIcon />}
                                >
                                    Expand All
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => toggleExpandAll(finalFilteredUsers, false)}
                                    startIcon={<ExpandLessIcon />}
                                >
                                    Collapse All
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>
                
                {/* Filters */}
                <Collapse in={showFilters}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Filters</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Account Status"
                                    value={filters.accountStatus}
                                    onChange={(e) => setFilters({ ...filters, accountStatus: e.target.value })}
                                    sx={{
                                        bgcolor: 'white',
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white'
                                        }
                                    }}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    slotProps={{
                                        select: {
                                            displayEmpty: true,
                                            MenuProps: {
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: 'white',
                                                        '& .MuiMenuItem-root': {
                                                            bgcolor: 'white'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value=""><em>Any Status</em></MenuItem>
                                    {accountStatusOptions.map(status => (
                                        <MenuItem key={status} value={status}>{status}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Last Login"
                                    value={filters.lastLogin}
                                    onChange={(e) => setFilters({ ...filters, lastLogin: e.target.value })}
                                    sx={{
                                        bgcolor: 'white',
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white'
                                        }
                                    }}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    slotProps={{
                                        select: {
                                            displayEmpty: true,
                                            MenuProps: {
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: 'white',
                                                        '& .MuiMenuItem-root': {
                                                            bgcolor: 'white'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value=""><em>Any Time</em></MenuItem>
                                    <MenuItem value="recent">Within 30 days</MenuItem>
                                    <MenuItem value="old">Older than 30 days</MenuItem>
                                    <MenuItem value="never">Never logged in</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ClearAllIcon />}
                                    onClick={handleResetFilters}
                                >
                                    Clear Filters
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Collapse>
                
                {/* Results summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {finalFilteredUsers.length} of {sortedData.length} users
                    </Typography>
                    
                    {searchTerm && (
                        <Typography variant="body2" color="text.secondary">
                            Search: "{searchTerm}"
                        </Typography>
                    )}
                </Box>
                
                {/* User list */}
                {finalFilteredUsers.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No users match your search or filters
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setSearchTerm('');
                                handleResetFilters();
                            }}
                            startIcon={<ClearAllIcon />}
                            sx={{ mt: 2 }}
                        >
                            Clear All Filters
                        </Button>
                    </Paper>
                ) : viewMode === 'card' ? (
                    <>
                    <Grid container spacing={2}>
                        {finalFilteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(user => {
                            const isExpanded = expandedUsers[user.name] || false;
                            const accountStatus = setADLabel(user.userAccountControl);
                            const statusColor = setColor(user.userAccountControl);
                            const lastLoginDate = formatDate(user.lastLogon);
                            const createdDate = formatDate(user.whenCreated);
                            const expiresDate = formatDate(user.accountExpires);

                            return (
                                <Grid size={12} key={uuid()}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            {/* User header - always visible */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    gap: 2
                                                }}
                                                onClick={() => toggleUserExpand(user.name)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, minWidth: 0 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: statusColor === 'success' ? 'primary.main' :
                                                                     statusColor === 'error' ? 'error.main' : 'warning.main'
                                                        }}
                                                    >
                                                        {statusColor === 'error' ? <LockIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                                                    </Avatar>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="medium"
                                                        noWrap
                                                        title={user.name}
                                                        sx={{
                                                            minWidth: 150,
                                                            maxWidth: 250,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {user.name}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        color={statusColor}
                                                        label={accountStatus}
                                                        sx={{ height: 24 }}
                                                    />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarIcon fontSize="small" color="action" />
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            noWrap
                                                        >
                                                            {lastLoginDate}
                                                        </Typography>
                                                    </Box>
                                                    {user.description && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            noWrap
                                                            title={user.description}
                                                            sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                        >
                                                            {user.description}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleUserExpand(user.name);
                                                    }}
                                                >
                                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>
                                            
                                            {/* Expanded details */}
                                            <Collapse in={isExpanded}>
                                                <Divider sx={{ my: 1.5 }} />
                                                
                                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                                    Account Details
                                                </Typography>
                                                
                                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
                                                    <Table size="small">
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>
                                                                    Created
                                                                </TableCell>
                                                                <TableCell>{createdDate}</TableCell>
                                                            </TableRow>
                                                            
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'medium' }}>
                                                                    Expires
                                                                </TableCell>
                                                                <TableCell>{expiresDate}</TableCell>
                                                            </TableRow>
                                                            
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'medium' }}>
                                                                    Account Control
                                                                </TableCell>
                                                                <TableCell>{user.userAccountControl}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                
                                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                                    Distinguished Name
                                                </Typography>
                                                
                                                <Box sx={{ 
                                                    p: 1, 
                                                    backgroundColor: 'grey.100', 
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'monospace',
                                                    wordBreak: 'break-all',
                                                    position: 'relative'
                                                }}>
                                                    {user.distinguishedName}
                                                    
                                                    <IconButton 
                                                        size="small" 
                                                        sx={{ 
                                                            position: 'absolute', 
                                                            top: 0, 
                                                            right: 0,
                                                            opacity: 0.7,
                                                            '&:hover': { opacity: 1 } 
                                                        }}
                                                        onClick={() => copyToClipboard(user.distinguishedName)}
                                                        color={copiedText === user.distinguishedName ? "success" : "default"}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Collapse>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={Math.ceil(finalFilteredUsers.length / rowsPerPage)}
                            page={page}
                            onChange={(_, value) => setPage(value)}
                            color="primary"
                            size="large"
                        />
                    </Box>
                    </>
                ) : (
                    /* Table View with MUIDataTable */
                    <MUIDataTable
                        title=""
                        data={finalFilteredUsers}
                        columns={[
                            {
                                name: 'name',
                                label: 'User Name',
                                options: {
                                    filter: true,
                                    sort: true,
                                    customBodyRender: (value, tableMeta) => {
                                        const user = finalFilteredUsers[tableMeta.rowIndex];
                                        const accountStatus = setADLabel(user.userAccountControl);
                                        const statusColor = setColor(user.userAccountControl);
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: statusColor === 'success' ? 'primary.main' :
                                                                 statusColor === 'error' ? 'error.main' : 'warning.main'
                                                    }}
                                                >
                                                    {statusColor === 'error' ? <LockIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {value}
                                                </Typography>
                                            </Box>
                                        );
                                    }
                                }
                            },
                            {
                                name: 'userAccountControl',
                                label: 'Status',
                                options: {
                                    filter: true,
                                    sort: true,
                                    customBodyRender: (value) => {
                                        const accountStatus = setADLabel(value);
                                        const statusColor = setColor(value);
                                        return (
                                            <Chip
                                                size="small"
                                                color={statusColor}
                                                label={accountStatus}
                                                sx={{ height: 24 }}
                                            />
                                        );
                                    }
                                }
                            },
                            {
                                name: 'lastLogon',
                                label: 'Last Login',
                                options: {
                                    filter: true,
                                    sort: true,
                                    customBodyRender: (value) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(value)}
                                            </Typography>
                                        </Box>
                                    )
                                }
                            },
                            {
                                name: 'description',
                                label: 'Description',
                                options: {
                                    filter: true,
                                    sort: true,
                                    customBodyRender: (value) => (
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {value || '-'}
                                        </Typography>
                                    )
                                }
                            },
                            {
                                name: 'whenCreated',
                                label: 'Created',
                                options: {
                                    filter: false,
                                    sort: true,
                                    customBodyRender: (value) => (
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(value)}
                                        </Typography>
                                    )
                                }
                            },
                            {
                                name: 'distinguishedName',
                                label: 'Distinguished Name',
                                options: {
                                    filter: false,
                                    sort: false,
                                    display: false,
                                    customBodyRender: (value) => (
                                        <Box sx={{
                                            maxWidth: 400,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem'
                                        }}>
                                            {value}
                                        </Box>
                                    )
                                }
                            }
                        ]}
                        options={{
                            filterType: 'dropdown',
                            responsive: 'standard',
                            selectableRows: 'none',
                            download: true,
                            print: false,
                            viewColumns: true,
                            pagination: true,
                            rowsPerPage: 10,
                            rowsPerPageOptions: [5, 10, 25, 50, 100],
                            elevation: 0,
                            searchOpen: false,
                            searchPlaceholder: 'Search users...',
                            textLabels: {
                                body: {
                                    noMatch: 'No users match your search or filters',
                                }
                            }
                        }}
                    />
                )}
            </Container>
        );
    }
    
    // Fallback loading state
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        </Container>
    );

}

