import { useState } from 'react';
import { 
  Typography, Box, CircularProgress, Paper, Divider, Grid, Chip,
  Container, Card, CardContent, TextField, InputAdornment, 
  IconButton, Stack, Tabs, Tab, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, Collapse, Alert, AlertTitle,
  Button, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { useQuery } from "@tanstack/react-query";
import { useApiGet, useProtectedApiGet } from '../hooks/useApi';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterAlt as FilterIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const CompositeMachineInfo = () => {
  // State for search, filtering, and expanded items
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMachines, setExpandedMachines] = useState({});
  const [expandedRawData, setExpandedRawData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    os: '',
    make: '',
    model: '',
    user: ''
  });

  // Toggle machine expansion
  const toggleMachineExpand = (machineId) => {
    setExpandedMachines(prev => ({
      ...prev,
      [machineId]: !prev[machineId]
    }));
  };
  
  // Toggle raw data expansion
  const toggleRawDataExpand = (machineId) => {
    setExpandedRawData(prev => ({
      ...prev,
      [machineId]: !prev[machineId]
    }));
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle clearing the search filter
  const handleClearFilter = () => {
    setSearchTerm('');
  };
  
  // Handle resetting all filters
  const handleResetFilters = () => {
    setFilters({
      os: '',
      make: '',
      model: '',
      user: ''
    });
  };
  
  // Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
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

  // API Queries
  const parsecInfo = useQuery({
    queryKey: ['parsecinfo'],
    queryFn: async () => {
      try {
        const res = await fetch("https://laxcoresrv.buck.local:8000/parsecreport", {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching Parsec info:", error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 1000
  });

  const jamfComputersFromMongo = useQuery({
    queryKey: ['jamfcomputers'],
    queryFn: async () => {
      try {
        const res = await fetch("https://laxcoresrv.buck.local:8000/mongo/jamf_computers_from_mongo?count=999", {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching JAMF computers:", error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 1000
  });

  const machineInfoFromLDAP = useQuery({
    queryKey: ['ldapmachineinfo'],
    queryFn: async () => {
      try {
        const res = await fetch('https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=computer', {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching LDAP machine info:", error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 1000
  });





  // Loading state
  if (parsecInfo.isLoading || jamfComputersFromMongo.isLoading || machineInfoFromLDAP.isLoading ) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Composite Machine Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 3 }}>
              Loading machine data from multiple sources...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This may take a moment as we gather information from JAMF, Active Directory, Parsec.
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (parsecInfo.error || jamfComputersFromMongo.error || machineInfoFromLDAP.error ) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Composite Machine Information
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          One or more data sources failed to load. Please try refreshing the page.
        </Alert>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>Error Details:</Typography>
          
          {parsecInfo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>Parsec Data Error</AlertTitle>
              {parsecInfo.error.message || JSON.stringify(parsecInfo.error)}
            </Alert>
          )}
          
          {jamfComputersFromMongo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>JAMF Data Error</AlertTitle>
              {jamfComputersFromMongo.error.message || JSON.stringify(jamfComputersFromMongo.error)}
            </Alert>
          )}
          
          {machineInfoFromLDAP.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>LDAP Data Error</AlertTitle>
              {machineInfoFromLDAP.error.message || JSON.stringify(machineInfoFromLDAP.error)}
            </Alert>
          )}
          
        </Paper>
      </Container>
    );
  }


  // Data processing
  // Sort machines alphabetically
  const sortedMachineInfo = machineInfoFromLDAP.data.sort((a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  
  // Process data for filtering and display
  const processedMachines = sortedMachineInfo.map(machine => {
    // Find related data from other sources
    const jamfComputerInfo = jamfComputersFromMongo.data.find(
      item => item.general.name.toLowerCase() === machine.name.toLowerCase()
    );
    
    const parsecHostInfo = parsecInfo.data.find(
      item => item.host.toLowerCase() === machine.name.toLowerCase()
    );
    
    
    // Extract useful properties
    const hwMake = jamfComputerInfo?.hardware?.make || 'N/A';
    const hwModel = jamfComputerInfo?.hardware?.model || 'N/A';
    const osName = jamfComputerInfo?.operatingSystem?.name || 'N/A';
    const osVersion = jamfComputerInfo?.operatingSystem?.version || 'N/A';
    const osBuild = jamfComputerInfo?.operatingSystem?.build || 'N/A';
    const jamfUsername = jamfComputerInfo?.userAndLocation?.username || 'N/A';
    const localUserAccounts = jamfComputerInfo?.localUserAccounts ? 
      jamfComputerInfo.localUserAccounts.map(account => {
        const username = account.username || account.name || '';
        const fullName = account.fullName || '';
        if (username && fullName) {
          return `${username} (${fullName})`;
        } else if (username) {
          return username;
        } else if (fullName) {
          return fullName;
        }
        return '';
      }).filter(Boolean) : [];
    const lastLogonTimestamp = formatDate(machine.lastLogonTimestamp);
    const logonCount = machine.logonCount || 0;
    
    // Determine the current/last user from various sources
    let currentUser = 'N/A';
    let userSource = '';
    
    // Priority: Parsec (if online) > JAMF username > Local users
    if (parsecHostInfo?.machine_online && parsecHostInfo?.name) {
      currentUser = parsecHostInfo.name;
      userSource = 'Parsec (Active)';
    } else if (jamfUsername && jamfUsername !== 'N/A') {
      currentUser = jamfUsername;
      userSource = 'JAMF';
    } else if (localUserAccounts.length > 0) {
      // Use the first local user as a fallback
      currentUser = localUserAccounts[0];
      userSource = 'Local Account';
    }
    
    // Return combined data object
    return {
      id: machine.name, // Using machine name as unique ID
      name: machine.name,
      currentUser: currentUser,
      userSource: userSource,
      activeDirectory: {
        lastLogon: lastLogonTimestamp,
        logonCount: logonCount,
        operatingSystem: machine.operatingSystem || 'N/A'
      },
      jamf: {
        make: hwMake,
        model: hwModel,
        osName: osName,
        osVersion: osVersion,
        osBuild: osBuild,
        username: jamfUsername,
        localUsers: localUserAccounts
      },
      parsec: {
        username: parsecHostInfo?.name || 'N/A',
        online: parsecHostInfo?.machine_online ? 'Yes' : 'No',
        lastConnected: parsecHostInfo?.last_connected ? formatDate(parsecHostInfo.last_connected) : 'N/A',
        guests: parsecHostInfo?.guests ? 'Yes' : 'No'
      },
      // Raw data for debugging/detailed view
      rawData: {
        activeDirectory: machine,
        jamf: jamfComputerInfo || null,
        parsec: parsecHostInfo || null
      }
    };
  });
  
  // Apply search filter
  const filteredMachines = processedMachines.filter(machine => {
    if (!searchTerm) return true;
    
    return (
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.currentUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.activeDirectory.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.jamf.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.jamf.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.parsec.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Apply additional filters
  const finalFilteredMachines = filteredMachines.filter(machine => {
    const passedOsFilter = !filters.os || machine.activeDirectory.operatingSystem.toLowerCase().includes(filters.os.toLowerCase());
    const passedMakeFilter = !filters.make || machine.jamf.make.toLowerCase().includes(filters.make.toLowerCase());
    const passedModelFilter = !filters.model || machine.jamf.model.toLowerCase().includes(filters.model.toLowerCase());
    const passedUserFilter = !filters.user || machine.currentUser.toLowerCase().includes(filters.user.toLowerCase());
    
    return passedOsFilter && passedMakeFilter && passedModelFilter && passedUserFilter;
  });
  
  // Extract unique values for filters
  const uniqueOsValues = [...new Set(processedMachines.map(m => m.activeDirectory.operatingSystem).filter(Boolean))];
  const uniqueMakeValues = [...new Set(processedMachines.map(m => m.jamf.make).filter(Boolean))];
  const uniqueModelValues = [...new Set(processedMachines.map(m => m.jamf.model).filter(Boolean))];
  const uniqueUserValues = [...new Set(processedMachines.map(m => m.currentUser).filter(u => u && u !== 'N/A'))];
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Composite Machine Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consolidated view of machine data from Active Directory, JAMF and Parsec
        </Typography>
      </Box>
      
      {/* Tabs & Search */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab label="All Sources" />
          <Tab label="Active Directory" />
          <Tab label="JAMF" />
          <Tab label="Parsec" />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
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
          
          <IconButton 
            size="small" 
            color={showFilters ? "primary" : "default"}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ border: showFilters ? '1px solid' : 'none' }}
          >
            <FilterIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Filters */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Filters</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Operating System"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                value={filters.os}
                onChange={(e) => setFilters({ ...filters, os: e.target.value })}
              >
                <option value="">Any OS</option>
                {uniqueOsValues.map(os => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Make"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                value={filters.make}
                onChange={(e) => setFilters({ ...filters, make: e.target.value })}
              >
                <option value="">Any Make</option>
                {uniqueMakeValues.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Model"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              >
                <option value="">Any Model</option>
                {uniqueModelValues.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="User"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              >
                <option value="">Any User</option>
                {uniqueUserValues.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<ClearAllIcon />}
                onClick={handleResetFilters}
              >
                Clear All Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
      
      {/* Results summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {finalFilteredMachines.length} of {processedMachines.length} machines
        </Typography>
        
        {searchTerm && (
          <Typography variant="body2" color="text.secondary">
            Search: "{searchTerm}"
          </Typography>
        )}
      </Box>
      
      {/* Machine list */}
      {finalFilteredMachines.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No machines match your search or filters
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
      ) : (
        <Grid container spacing={2}>
          {finalFilteredMachines.map(machine => {
            const isExpanded = expandedMachines[machine.id] || false;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={machine.id}>
                <Card 
                  variant="outlined" 
                  sx={{ height: '100%' }}
                >
                {/* Machine header - always visible */}
                <CardContent 
                  sx={{ 
                    p: 2, 
                    '&:last-child': { pb: 2 },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleMachineExpand(machine.id)}
                >
                  <Grid container spacing={1} alignItems="flex-start">
                    {/* Machine name and expand button */}
                    <Grid item xs={10}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {machine.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'right' }}>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Grid>
                    
                    {/* Current User - prominently displayed */}
                    {machine.currentUser !== 'N/A' && (
                      <Grid item xs={12}>
                        <Chip 
                          size="small" 
                          label={`User: ${machine.currentUser} (${machine.userSource})`}
                          variant="filled"
                          color={machine.userSource === 'Parsec (Active)' ? 'success' : 'primary'}
                          sx={{ mb: 1, width: '100%', fontWeight: 'medium' }}
                        />
                      </Grid>
                    )}
                    
                    {/* Last logon and logon count chips */}
                    <Grid item xs={12} sm={6}>
                      <Chip 
                        size="small" 
                        label={`Last Logon: ${machine.activeDirectory.lastLogon}`}
                        variant="outlined"
                        color="info"
                        sx={{ mb: 1, width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Chip 
                        size="small" 
                        label={`Logon Count: ${machine.activeDirectory.logonCount}`}
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 1, width: '100%' }}
                      />
                    </Grid>
                    
                    {/* Hardware and OS chips */}
                    <Grid item xs={12} sm={6}>
                      <Chip 
                        size="small" 
                        label={machine.jamf.make} 
                        variant="outlined"
                        sx={{ mb: 1, width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Chip 
                        size="small" 
                        label={machine.activeDirectory.operatingSystem} 
                        variant="outlined"
                        sx={{ mb: 1, width: '100%' }}
                      />
                    </Grid>
                    
                    {/* User information chips */}
                    {machine.jamf.username !== 'N/A' && (
                      <Grid item xs={12} sm={6}>
                        <Chip 
                          size="small" 
                          label={`JAMF: ${machine.jamf.username}`} 
                          variant="outlined"
                          color="info"
                          sx={{ mb: 1, width: '100%' }}
                        />
                      </Grid>
                    )}
                    {machine.parsec.username !== 'N/A' && (
                      <Grid item xs={12} sm={6}>
                        <Chip 
                          size="small" 
                          label={`Parsec: ${machine.parsec.username}`} 
                          variant="outlined"
                          color={machine.parsec.online === 'Yes' ? 'success' : 'default'}
                          sx={{ mb: 1, width: '100%' }}
                        />
                      </Grid>
                    )}
                    
                    {/* Local users */}
                    {machine.jamf.localUsers.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                          Local Users:
                        </Typography>
                        <Box sx={{ ml: 1, mt: 0.5 }}>
                          {machine.jamf.localUsers.map((user, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              • {user}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                
                {/* Expanded details section */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <CardContent sx={{ p: 2, pt: 0 }}>
                    <Grid container spacing={2}>
                      {/* Active Directory Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Active Directory Information
                          </Typography>
                          {machine.rawData.activeDirectory ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>
                                      Last Logon
                                    </TableCell>
                                    <TableCell>{machine.activeDirectory.lastLogon}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Logon Count
                                    </TableCell>
                                    <TableCell>{machine.activeDirectory.logonCount}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Operating System
                                    </TableCell>
                                    <TableCell>{machine.activeDirectory.operatingSystem}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No Active Directory data found for this machine
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* JAMF Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            JAMF Information
                          </Typography>
                          {machine.rawData.jamf ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>
                                      Make
                                    </TableCell>
                                    <TableCell>{machine.jamf.make}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Model
                                    </TableCell>
                                    <TableCell>{machine.jamf.model}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      OS Name
                                    </TableCell>
                                    <TableCell>{machine.jamf.osName}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      OS Version
                                    </TableCell>
                                    <TableCell>{machine.jamf.osVersion}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      OS Build
                                    </TableCell>
                                    <TableCell>{machine.jamf.osBuild}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No JAMF data found for this machine
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      </Grid>
                      
                      
                      {/* Parsec Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Parsec Information
                          </Typography>
                          {machine.rawData.parsec ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>
                                      Username
                                    </TableCell>
                                    <TableCell>{machine.parsec.username}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Online Status
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        size="small" 
                                        label={machine.parsec.online} 
                                        color={machine.parsec.online === 'Yes' ? 'success' : 'default'}
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Last Connected
                                    </TableCell>
                                    <TableCell>{machine.parsec.lastConnected}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Has Guests
                                    </TableCell>
                                    <TableCell>{machine.parsec.guests}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No Parsec data found for this machine
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* Raw Data Section */}
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CodeIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRawDataExpand(machine.id);
                            }}
                            sx={{ mb: 2 }}
                          >
                            {expandedRawData[machine.id] ? 'Hide Raw Data' : 'Show Raw Data'}
                          </Button>
                          
                          <Collapse in={expandedRawData[machine.id]}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                Raw Data from All Sources
                              </Typography>
                              
                              <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Active Directory Data
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Box component="pre" sx={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    bgcolor: 'white',
                                    p: 1,
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                  }}>
                                    {JSON.stringify(machine.rawData.activeDirectory, null, 2)}
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                              
                              <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="body2" fontWeight="medium">
                                    JAMF Data {machine.rawData.jamf ? '' : '(No data found)'}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Box component="pre" sx={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    bgcolor: 'white',
                                    p: 1,
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                  }}>
                                    {machine.rawData.jamf 
                                      ? JSON.stringify(machine.rawData.jamf, null, 2)
                                      : 'No JAMF data found for this machine'
                                    }
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                              
                              <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Parsec Data {machine.rawData.parsec ? '' : '(No data found)'}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Box component="pre" sx={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    bgcolor: 'white',
                                    p: 1,
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                  }}>
                                    {machine.rawData.parsec 
                                      ? JSON.stringify(machine.rawData.parsec, null, 2)
                                      : 'No Parsec data found for this machine'
                                    }
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                            </Paper>
                          </Collapse>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Collapse>
              </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
  }
  // }

export default CompositeMachineInfo;
