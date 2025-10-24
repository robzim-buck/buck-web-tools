import {
  Chip, Typography, Paper, Grid, Box, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Tooltip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, ToggleButton,
  ToggleButtonGroup, TextField, TableSortLabel
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { useAppData } from '../contexts/AppDataProvider';
import uuid from 'react-uuid';
import { useState, useMemo } from 'react';

export default function ParsecUsers({ name = "Parsec" }) {
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [userMachines, setUserMachines] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [sortColumn, setSortColumn] = useState('email'); // Column to sort by
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [filterText, setFilterText] = useState(''); // Filter text

  // Get user initials for avatar fallback
  const getUserInitials = (user) => {
    // Try to get initials from user name
    if (user?.name && typeof user.name === 'string' && user.name.trim()) {
      const nameParts = user.name.trim().split(/\s+/).filter(part => part.length > 0);
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0][0].toUpperCase();
      }
    }
    
    // Fallback to email if name is not available
    if (user?.email && typeof user.email === 'string' && user.email.trim()) {
      const emailUsername = user.email.split('@')[0];
      if (emailUsername.length >= 2) {
        return `${emailUsername[0]}${emailUsername[1]}`.toUpperCase();
      } else if (emailUsername.length === 1) {
        return emailUsername[0].toUpperCase();
      }
    }

    return 'PU'; // Parsec User - final fallback
  };

  // Get data from context
  const { data: appData, queries, isDataLoading } = useAppData();
  const parsecUsers = queries.parsecUsers;
  const googleUsersByEmail = appData.googleUsersByEmail || {};

  // Helper function to get Google user for a Parsec user
  const getGoogleUserForParsecUser = (parsecUser) => {
    if (!parsecUser?.email) {
      console.log('No email for Parsec user:', parsecUser);
      return null;
    }

    const email = parsecUser.email.toLowerCase();
    console.log('Looking for Google user for email:', email);

    // Try exact email match first
    if (googleUsersByEmail[email]) {
      const googleUser = googleUsersByEmail[email];
      console.log('Found Google user by exact email:', {
        email: googleUser.primaryEmail,
        hasPhoto: !!googleUser.thumbnailPhotoUrl,
        photoUrl: googleUser.thumbnailPhotoUrl
      });
      return googleUser;
    }

    // Try username part only
    const username = email.split('@')[0].toLowerCase();
    if (username && googleUsersByEmail[username]) {
      const googleUser = googleUsersByEmail[username];
      console.log('Found Google user by username:', {
        username,
        email: googleUser.primaryEmail,
        hasPhoto: !!googleUser.thumbnailPhotoUrl,
        photoUrl: googleUser.thumbnailPhotoUrl
      });
      return googleUser;
    }

    console.log('No Google user found for:', email, 'Available keys:', Object.keys(googleUsersByEmail).slice(0, 5));
    return null;
  };

  const fetchUserMachines = async (email) => {
    setLoading(true);
    setSelectedUserEmail(email);
    try {
      // Fetch all Parsec machines from the parsecreport endpoint
      const response = await fetch(`https://laxcoresrv.buck.local:8000/parsec/parsecreport`,
                {
                          headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                }},);
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      const allMachines = await response.json();
      
      // Find the user in parsecUsers data to get their name
      const parsecUser = parsecUsers.data?.find(user => user.email === email);
      
      // Filter machines that belong to this user
      // Match by email or by name (since Parsec machines store user name, not email)
      const userMachines = allMachines.filter(machine => {
        // Check if machine.email matches (if it exists)
        if (machine.email && machine.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        // Check if machine.name matches the parsec user's name
        if (parsecUser && machine.name && 
            machine.name.toLowerCase() === parsecUser.name.toLowerCase()) {
          return true;
        }
        return false;
      });
      
      setUserMachines(userMachines);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error fetching user machines:", error);
      alert(`Error fetching machines for ${email}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!parsecUsers.data) return [];

    // First, filter the data
    let filtered = parsecUsers.data;
    if (filterText) {
      const lowercaseFilter = filterText.toLowerCase();
      filtered = parsecUsers.data.filter((item) => {
        return (
          item.name?.toLowerCase().includes(lowercaseFilter) ||
          item.email?.toLowerCase().includes(lowercaseFilter) ||
          item.user_id?.toString().includes(lowercaseFilter) ||
          item.team_app_rule?.name?.toLowerCase().includes(lowercaseFilter) ||
          item.group_id?.toString().includes(lowercaseFilter)
        );
      });
    }

    // Then, sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'user_id':
          aValue = a.user_id || 0;
          bValue = b.user_id || 0;
          break;
        case 'rule':
          aValue = a.team_app_rule?.name?.toLowerCase() || '';
          bValue = b.team_app_rule?.name?.toLowerCase() || '';
          break;
        case 'group_id':
          aValue = a.group_id || 0;
          bValue = b.group_id || 0;
          break;
        case 'created_at':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
        case 'last_connected_at':
          aValue = a.last_connected_at || '';
          bValue = b.last_connected_at || '';
          break;
        default:
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [parsecUsers.data, filterText, sortColumn, sortDirection]);

  if (parsecUsers.isLoading) return <CircularProgress />;
  if (parsecUsers.error) return `An error has occurred: ${parsecUsers.error.message}`;

  if (parsecUsers.data) {
    const sortedData = filteredAndSortedData;
    
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3">{name} Users</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Filter"
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by name, email, ID..."
              sx={{ minWidth: 250 }}
            />
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
          </Box>
        </Box>

        {viewMode === 'card' ? (
          <Grid container spacing={2} columns={4}>
          {sortedData.map((item) => (
            <Grid item xs={1} key={uuid()}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  {(() => {
                    const googleUser = getGoogleUserForParsecUser(item);
                    const isFreelance = googleUser?.organizations &&
                                        googleUser.organizations[0]?.costCenter &&
                                        googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';

                    console.log(`Rendering avatar for ${item.email}:`, {
                      hasGoogleUser: !!googleUser,
                      hasThumbnailUrl: !!googleUser?.thumbnailPhotoUrl,
                      thumbnailUrl: googleUser?.thumbnailPhotoUrl,
                      isFreelance
                    });

                    if (googleUser?.thumbnailPhotoUrl) {
                      console.log(`Showing photo for ${item.email}:`, googleUser.thumbnailPhotoUrl);
                      return (
                        <Tooltip title={isFreelance ? "Freelancer - Google profile photo" : "Google profile photo"}>
                          <Avatar
                            src={googleUser.thumbnailPhotoUrl}
                            alt={getUserInitials(item)}
                            sx={{
                              width: 48,
                              height: 48,
                              border: isFreelance
                                ? '2px solid #f50057'  // Freelancer border
                                : '2px solid #8c9eff', // Staff border
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              '& img': {
                                loading: 'lazy'
                              }
                            }}
                            onError={() => {
                              console.log("Image failed to load for:", item.email, "URL:", googleUser.thumbnailPhotoUrl);
                            }}
                          >
                            {getUserInitials(item)}
                          </Avatar>
                        </Tooltip>
                      );
                    } else {
                      console.log(`No photo for ${item.email}, using initials:`, getUserInitials(item));
                      return (
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'primary.main',
                            color: 'white',
                            border: '2px solid #8c9eff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getUserInitials(item)}
                        </Avatar>
                      );
                    }
                  })()}

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {item.name}
                      {(() => {
                        const googleUser = getGoogleUserForParsecUser(item);
                        const isFreelance = googleUser?.organizations &&
                                          googleUser.organizations[0]?.costCenter &&
                                          googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';

                        if (isFreelance) {
                          return (
                            <Chip
                              label="Freelance"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {item.email} • UserID {item.user_id}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        variant="outlined"
                        color="success"
                        label={`Rule ${item.team_app_rule.name}`}
                        sx={{ mr: 1, mb: 1 }}
                        size="small"
                      />
                      <Chip
                        variant="outlined"
                        color="success"
                        label={`Group ID ${item.group_id}`}
                        sx={{ mb: 1 }}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Created: {item.created_at ? item.created_at.split('T')[0] : 'N/A'} •&nbsp;
                  Updated: {item.updated_at ? item.updated_at.split('T')[0] : 'N/A'} •&nbsp;
                  Last Connected: {item.last_connected_at ? item.last_connected_at.split('T')[0] : 'N/A'}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => fetchUserMachines(item.email)}
                  disabled={loading && selectedUserEmail === item.email}
                >
                  {loading && selectedUserEmail === item.email ? 'Loading...' : 'View Machines'}
                </Button>
              </Paper>
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
                      User
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'email'}
                      direction={sortColumn === 'email' ? sortDirection : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'user_id'}
                      direction={sortColumn === 'user_id' ? sortDirection : 'asc'}
                      onClick={() => handleSort('user_id')}
                    >
                      User ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'rule'}
                      direction={sortColumn === 'rule' ? sortDirection : 'asc'}
                      onClick={() => handleSort('rule')}
                    >
                      Rule
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'group_id'}
                      direction={sortColumn === 'group_id' ? sortDirection : 'asc'}
                      onClick={() => handleSort('group_id')}
                    >
                      Group ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'created_at'}
                      direction={sortColumn === 'created_at' ? sortDirection : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'last_connected_at'}
                      direction={sortColumn === 'last_connected_at' ? sortDirection : 'asc'}
                      onClick={() => handleSort('last_connected_at')}
                    >
                      Last Connected
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((item) => {
                  const googleUser = getGoogleUserForParsecUser(item);
                  const isFreelance = googleUser?.organizations &&
                                      googleUser.organizations[0]?.costCenter &&
                                      googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';

                  return (
                    <TableRow key={uuid()} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {googleUser?.thumbnailPhotoUrl ? (
                            <Tooltip title={isFreelance ? "Freelancer - Google profile photo" : "Google profile photo"}>
                              <Avatar
                                src={googleUser.thumbnailPhotoUrl}
                                alt={getUserInitials(item)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: isFreelance
                                    ? '2px solid #f50057'
                                    : '2px solid #8c9eff',
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  fontSize: '0.875rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {getUserInitials(item)}
                              </Avatar>
                            </Tooltip>
                          ) : (
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                                color: 'white',
                                border: '2px solid #8c9eff',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {getUserInitials(item)}
                            </Avatar>
                          )}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.name}
                            </Typography>
                            {isFreelance && (
                              <Chip
                                label="Freelance"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ height: 16, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.user_id}</TableCell>
                      <TableCell>
                        <Chip
                          variant="outlined"
                          color="success"
                          label={item.team_app_rule.name}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.group_id}</TableCell>
                      <TableCell>{item.created_at ? item.created_at.split('T')[0] : 'N/A'}</TableCell>
                      <TableCell>{item.last_connected_at ? item.last_connected_at.split('T')[0] : 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => fetchUserMachines(item.email)}
                          disabled={loading && selectedUserEmail === item.email}
                        >
                          {loading && selectedUserEmail === item.email ? 'Loading...' : 'View Machines'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { bgcolor: 'white' }
          }}
        >
          <DialogTitle sx={{ bgcolor: 'white' }}>
            Machines for {selectedUserEmail}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'white' }}>
            {userMachines.length > 0 ? (
              <Box>
                {userMachines.map((machine, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="h6">{machine.name || 'Unnamed User'}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Host: {machine.host || 'N/A'} 
                        </Typography>
                        <Typography variant="body2">
                          Email: {machine.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Guests Allowed: {machine.guests ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Status: <Chip size="small" color={machine.machine_online?.toLowerCase() === 'online' ? 'success' : 'error'} 
                                         label={machine.machine_online || 'Unknown'} />
                        </Typography>
                        <Typography variant="body2">
                          Created: {machine.created ? new Date(machine.created).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Last Connected: {machine.last_connected ? new Date(machine.last_connected).toLocaleString() : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body1">No machines found for this user</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white' }}>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
  
  return null;
}