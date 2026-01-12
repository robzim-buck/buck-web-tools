import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Grid,
  Autocomplete,
  TextField
} from '@mui/material';
import { useAppData } from '../contexts/AppDataProvider';
import { useProtectedApiGet } from '../hooks/useApi';

// Tag options for workstations
const TAG_OPTIONS = ['Unassigned', 'Assigned', 'FAULTY'];

// Color mapping for tags
const getTagColor = (tag) => {
  switch (tag) {
    case 'Assigned':
      return '#4caf50'; // green
    case 'Unassigned':
      return '#ffc107'; // yellow/amber
    case 'FAULTY':
      return '#f44336'; // red
    default:
      return '#ffc107'; // default yellow
  }
};

// Get row background color based on tag
const getRowBackgroundColor = (tag) => {
  switch (tag) {
    case 'Assigned':
      return '#c8e6c9'; // light green
    case 'Unassigned':
      return '#fff9c4'; // light yellow
    case 'FAULTY':
      return '#ffcdd2'; // light red
    default:
      return '#fff9c4';
  }
};

export default function WorkstationAssignments({
  name = "Workstation Assignment Dashboard",
  // Props passed from parent (static data fetched at app load)
  oktaUsersQuery,
  saltMachineInfoQuery: saltMachineInfoQueryProp,
  ldapRawMachineInfoQuery
}) {
  const [selectedSite, setSelectedSite] = useState('AMS');
  const [workstationTags, setWorkstationTags] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Get requestData from context only for assignments (changes frequently)
  const { queries, requestData } = useAppData();

  // Request only assignments data - this changes frequently so fetch when component loads
  useEffect(() => {
    requestData(['assignments']);
  }, [requestData]);

  // Fetch Parsec machines for "Logged in" info
  const parsecMachinesQuery = useProtectedApiGet('/parsec/parsecinfo/category', {
    queryParams: { _category: 'machines' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Salt machine info query - use prop passed from parent
  const saltMachineInfoQuery = saltMachineInfoQueryProp;

  // LDAP machines query - use prop passed from parent
  const machinesQuery = ldapRawMachineInfoQuery;

  // Assignments query - fetch this internally since it changes frequently
  const assignmentsQuery = queries.assignments;

  // Okta users query - use prop passed from parent
  const usersQuery = oktaUsersQuery;

  // Available sites
  const sites = useMemo(() => {
    return ['AMS', 'LAX', 'NYC', 'SYD'];
  }, []);

  // Create lookup for salt data by machine name
  const saltDataByMachine = useMemo(() => {
    if (!saltMachineInfoQuery?.data) return {};

    const lookup = {};
    const saltData = saltMachineInfoQuery.data;

    if (typeof saltData === 'object') {
      Object.values(saltData).forEach(machineData => {
        if (machineData.localhost) {
          lookup[machineData.localhost.toLowerCase()] = machineData;
        }
      });
    }

    return lookup;
  }, [saltMachineInfoQuery?.data]);

  // Create lookup for Parsec logged-in users
  const parsecLoggedInByMachine = useMemo(() => {
    if (!parsecMachinesQuery?.data) return {};

    const lookup = {};

    if (Array.isArray(parsecMachinesQuery.data)) {
      parsecMachinesQuery.data.forEach(machine => {
        const hostName = (machine.host || machine.hostname || machine.name || '').toLowerCase();
        if (hostName) {
          // Get logged in user from guests or connected user
          const loggedInUser = machine.guests?.[0]?.email ||
                              machine.connected_user ||
                              machine.loggedInUser ||
                              null;
          lookup[hostName] = {
            loggedIn: loggedInUser,
            online: machine.machine_online || machine.online || false
          };
        }
      });
    }

    return lookup;
  }, [parsecMachinesQuery?.data]);

  // Create lookup for assignments by machine name
  const assignmentsByMachine = useMemo(() => {
    if (!assignmentsQuery?.data) return {};

    const lookup = {};

    if (Array.isArray(assignmentsQuery.data)) {
      assignmentsQuery.data
        .filter(a => !a.released) // Only active assignments
        .forEach(assignment => {
          const machineName = (assignment.machine_name || '').toLowerCase();
          if (machineName) {
            lookup[machineName] = assignment.email;
          }
        });
    }

    return lookup;
  }, [assignmentsQuery?.data]);

  // Initialize workstationTags from existing assignments when data loads
  useEffect(() => {
    if (!assignmentsQuery?.data || !Array.isArray(assignmentsQuery.data)) return;

    const initialTags = {};
    assignmentsQuery.data
      .filter(a => !a.released) // Only active assignments
      .forEach(assignment => {
        const machineName = assignment.machine_name;
        if (machineName) {
          // Use tag from database if available, otherwise default to 'Assigned'
          initialTags[machineName] = assignment.tag || 'Assigned';
        }
      });

    // Only update if we have tags to set
    if (Object.keys(initialTags).length > 0) {
      setWorkstationTags(prev => {
        // Merge with existing tags, database takes precedence for initial load
        return { ...initialTags, ...prev };
      });
    }
  }, [assignmentsQuery?.data]);

  // Process users list for assignment dropdown
  const usersList = useMemo(() => {
    if (!usersQuery?.data) return [];

    if (Array.isArray(usersQuery.data)) {
      return usersQuery.data
        .filter(user => user.profile?.email)
        .map(user => ({
          email: user.profile.email,
          label: `${user.profile.email}${user.profile.displayName ? ` (${user.profile.displayName})` : ''}`,
          displayName: user.profile.displayName
        }))
        .sort((a, b) => a.email.localeCompare(b.email));
    }

    return [];
  }, [usersQuery?.data]);

  // Helper to extract location from DN
  const extractLocationFromDN = (dn) => {
    if (!dn) return 'Unknown';

    const dnString = typeof dn === 'string' ? dn : String(dn);
    const ouMatches = dnString.match(/OU=([^,]+)/gi) || [];
    const ous = ouMatches.map(ou => ou.replace(/^OU=/i, ''));

    const locationCodes = ['AMS', 'LAX', 'NYC', 'SYD', 'LON', 'SF', 'CHI'];

    for (const ou of ous) {
      const ouUpper = ou.toUpperCase();
      for (const loc of locationCodes) {
        if (ouUpper.includes(loc)) {
          return loc;
        }
      }
    }

    return 'Unknown';
  };

  // Helper to extract machine name from DN
  const extractMachineNameFromDN = (dn) => {
    if (!dn) return null;
    const cnMatch = dn.match(/^CN=([^,]+)/i);
    return cnMatch ? cnMatch[1] : null;
  };

  // Process workstations data
  const workstations = useMemo(() => {
    if (!machinesQuery?.data) return [];

    let machinesArray = [];

    if (Array.isArray(machinesQuery.data)) {
      machinesArray = machinesQuery.data;
    } else if (typeof machinesQuery.data === 'object') {
      machinesArray = Object.values(machinesQuery.data);
    }

    return machinesArray
      .map(machine => {
        const machineName = machine.cn?.[0] ||
                           machine.cn ||
                           extractMachineNameFromDN(machine.dn) ||
                           machine.name ||
                           machine.hostname;

        if (!machineName) return null;

        const machineNameLower = machineName.toLowerCase();
        const saltData = saltDataByMachine[machineNameLower] || {};
        const parsecData = parsecLoggedInByMachine[machineNameLower] || {};
        const assignedUser = assignmentsByMachine[machineNameLower];
        const location = extractLocationFromDN(machine.distinguishedName || machine.dn);

        // Format GPU info from nvidia grain (array of GPU objects) or gpus field
        let gpuInfo = 'N/A';

        // First try nvidia grain
        if (saltData.nvidia && Array.isArray(saltData.nvidia) && saltData.nvidia.length > 0) {
          gpuInfo = saltData.nvidia.map(gpu => {
            if (typeof gpu === 'string') return gpu;
            if (typeof gpu === 'object' && gpu !== null) {
              return gpu.type || gpu.Type || gpu.name || gpu.product_name || '';
            }
            return '';
          }).filter(Boolean).join(', ') || 'N/A';
        }
        // Fallback to gpus field if nvidia didn't have data
        else if (saltData.gpus) {
          if (typeof saltData.gpus === 'string' && saltData.gpus !== 'N/A') {
            gpuInfo = saltData.gpus;
          } else if (Array.isArray(saltData.gpus) && saltData.gpus.length > 0) {
            gpuInfo = saltData.gpus.map(gpu => {
              if (typeof gpu === 'string') return gpu;
              if (typeof gpu === 'object' && gpu !== null) {
                return gpu.type || gpu.Type || gpu.name || gpu.model || '';
              }
              return '';
            }).filter(Boolean).join(', ') || 'N/A';
          } else if (typeof saltData.gpus === 'object' && saltData.gpus !== null) {
            // Handle object format
            const gpuValues = Object.values(saltData.gpus);
            if (gpuValues.length > 0) {
              gpuInfo = gpuValues.map(gpu => {
                if (typeof gpu === 'string') return gpu;
                if (typeof gpu === 'object' && gpu !== null) {
                  return gpu.type || gpu.Type || gpu.name || gpu.model || '';
                }
                return '';
              }).filter(Boolean).join(', ') || 'N/A';
            }
          }
        }
        // Also try gpu (singular) field
        else if (saltData.gpu) {
          if (typeof saltData.gpu === 'string') {
            gpuInfo = saltData.gpu;
          } else if (typeof saltData.gpu === 'object' && saltData.gpu !== null) {
            gpuInfo = saltData.gpu.type || saltData.gpu.name || saltData.gpu.model || JSON.stringify(saltData.gpu);
          }
        }

        // Format RAM info
        let ramInfo = 'N/A';
        if (saltData.mem_total) {
          const ramGB = Math.round(saltData.mem_total / 1024);
          ramInfo = `${ramGB}GB`;
        }

        // Format CPU info
        let cpuInfo = 'N/A';
        if (saltData.cpu_model) {
          cpuInfo = saltData.cpu_model;
        }

        // Determine tag based on assignment and stored tag
        const storedTag = workstationTags[machineName];
        let tag = storedTag || (assignedUser ? 'Assigned' : 'Unassigned');

        // If tag is FAULTY, keep it regardless of assignment
        if (storedTag === 'FAULTY') {
          tag = 'FAULTY';
        }

        return {
          name: machineName,
          cpu: cpuInfo,
          ram: ramInfo,
          gpu: gpuInfo,
          location: location,
          loggedIn: parsecData.loggedIn || 'NONE',
          assignedUser: assignedUser || null,
          tag: tag,
          isOnline: parsecData.online
        };
      })
      .filter(Boolean)
      .filter(ws => {
        // Filter by selected site
        if (selectedSite === 'ALL') return true;
        return ws.location === selectedSite || ws.name.toUpperCase().includes(`-${selectedSite}-`);
      })
      .sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        const aValue = a[sortColumn] || '';
        const bValue = b[sortColumn] || '';

        // Handle numeric sorting for RAM (e.g., "64GB" -> 64)
        if (sortColumn === 'ram') {
          const aNum = parseInt(aValue) || 0;
          const bNum = parseInt(bValue) || 0;
          return (aNum - bNum) * multiplier;
        }

        // String comparison for other columns
        return String(aValue).localeCompare(String(bValue)) * multiplier;
      });
  }, [machinesQuery?.data, saltDataByMachine, parsecLoggedInByMachine,
      assignmentsByMachine, selectedSite, workstationTags, sortColumn, sortDirection]);

  // Handle assignment change
  const handleAssignmentChange = async (machineName, newUserEmail) => {
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(newUserEmail)}/${encodeURIComponent(machineName)}/true`,
        {
          method: 'POST',
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setSnackbar({
        open: true,
        message: `Workstation ${machineName} assigned to ${newUserEmail}`,
        severity: 'success'
      });

      // Update tag to Assigned
      setWorkstationTags(prev => ({
        ...prev,
        [machineName]: 'Assigned'
      }));

      // Refetch assignments
      assignmentsQuery.refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to assign workstation: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle tag change
  const handleTagChange = async (machineName, newTag) => {
    // Get the current workstation to check if it has an assigned user
    const workstation = workstations.find(ws => ws.name === machineName);
    const currentTag = workstation?.tag;
    const assignedUser = workstation?.assignedUser;

    // If changing from Assigned to Unassigned and there's an assigned user, release the assignment
    if (currentTag === 'Assigned' && newTag === 'Unassigned' && assignedUser) {
      try {
        const response = await fetch(
          `https://laxcoresrv.buck.local:8000/assignments/release/${encodeURIComponent(assignedUser)}/${encodeURIComponent(machineName)}`,
          {
            method: 'PUT',
            headers: {
              'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setWorkstationTags(prev => ({
          ...prev,
          [machineName]: newTag
        }));

        setSnackbar({
          open: true,
          message: `Assignment released for ${machineName} (${assignedUser})`,
          severity: 'success'
        });

        // Refetch assignments to update the data
        assignmentsQuery.refetch();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Failed to release assignment: ${error.message}`,
          severity: 'error'
        });
      }
    } else {
      // For other tag changes (not releasing), just update the local state
      setWorkstationTags(prev => ({
        ...prev,
        [machineName]: newTag
      }));

      setSnackbar({
        open: true,
        message: `Tag updated to ${newTag} for ${machineName}`,
        severity: 'success'
      });
    }
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Loading state
  const isLoading = machinesQuery?.isLoading || saltMachineInfoQuery?.isLoading || assignmentsQuery?.isLoading;

  // Error state
  const error = machinesQuery?.error || saltMachineInfoQuery?.error || assignmentsQuery?.error;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 2
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/Buck Square Logo.png"
                alt="Buck Logo"
                sx={{ height: 50 }}
              />
              <Typography variant="h5" fontWeight="bold">
                {name}
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="site-select-label">Site</InputLabel>
              <Select
                labelId="site-select-label"
                value={selectedSite}
                label="Site"
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <MenuItem value="ALL">All Sites</MenuItem>
                {sites.map(site => (
                  <MenuItem key={site} value={site}>{site}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading data: {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Workstation Table */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'name'}
                    direction={sortColumn === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Workstation
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'cpu'}
                    direction={sortColumn === 'cpu' ? sortDirection : 'asc'}
                    onClick={() => handleSort('cpu')}
                  >
                    CPU
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'ram'}
                    direction={sortColumn === 'ram' ? sortDirection : 'asc'}
                    onClick={() => handleSort('ram')}
                  >
                    RAM
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'gpu'}
                    direction={sortColumn === 'gpu' ? sortDirection : 'asc'}
                    onClick={() => handleSort('gpu')}
                  >
                    GPU
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'location'}
                    direction={sortColumn === 'location' ? sortDirection : 'asc'}
                    onClick={() => handleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'loggedIn'}
                    direction={sortColumn === 'loggedIn' ? sortDirection : 'asc'}
                    onClick={() => handleSort('loggedIn')}
                  >
                    Logged in
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                  <TableSortLabel
                    active={sortColumn === 'assignedUser'}
                    direction={sortColumn === 'assignedUser' ? sortDirection : 'asc'}
                    onClick={() => handleSort('assignedUser')}
                  >
                    Assign
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'tag'}
                    direction={sortColumn === 'tag' ? sortDirection : 'asc'}
                    onClick={() => handleSort('tag')}
                  >
                    Tags
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workstations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No workstations found for {selectedSite}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                workstations.map((ws) => (
                  <TableRow
                    key={ws.name}
                    sx={{
                      backgroundColor: getRowBackgroundColor(ws.tag),
                      '&:hover': {
                        backgroundColor: getRowBackgroundColor(ws.tag),
                        opacity: 0.9
                      }
                    }}
                  >
                    {/* Workstation Name */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      <Chip
                        label={ws.name}
                        sx={{
                          backgroundColor: getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' ? '#333' : 'white',
                          fontWeight: 'bold',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>

                    {/* CPU */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontSize: '0.75rem' }}>
                      {ws.cpu}
                    </TableCell>

                    {/* RAM */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      <Chip
                        label={ws.ram}
                        size="small"
                        sx={{
                          backgroundColor: getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' ? '#333' : 'white',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>

                    {/* GPU */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      <Chip
                        label={ws.gpu}
                        size="small"
                        sx={{
                          backgroundColor: getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' ? '#333' : 'white',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>

                    {/* Location */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      <Chip
                        label={ws.location}
                        size="small"
                        sx={{
                          backgroundColor: getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' ? '#333' : 'white',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>

                    {/* Logged In */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      <Chip
                        label={ws.loggedIn || 'NONE'}
                        size="small"
                        sx={{
                          backgroundColor: ws.loggedIn && ws.loggedIn !== 'NONE' ? '#4caf50' : getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' && (!ws.loggedIn || ws.loggedIn === 'NONE') ? '#333' : 'white',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>

                    {/* Assign Dropdown */}
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', minWidth: 320 }}>
                      <Autocomplete
                        size="small"
                        options={usersList}
                        value={usersList.find(u => u.email === ws.assignedUser) || null}
                        getOptionLabel={(option) => option.email || ''}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            handleAssignmentChange(ws.name, newValue.email);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={ws.assignedUser || 'Unassigned'}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: getTagColor(ws.tag),
                                color: ws.tag === 'Unassigned' ? '#333' : 'white',
                                '& fieldset': { borderColor: 'transparent' },
                                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' }
                              }
                            }}
                          />
                        )}
                        sx={{ minWidth: 300 }}
                      />
                    </TableCell>

                    {/* Tags Dropdown */}
                    <TableCell sx={{ minWidth: 130 }}>
                      <Select
                        size="small"
                        value={ws.tag}
                        onChange={(e) => handleTagChange(ws.name, e.target.value)}
                        sx={{
                          backgroundColor: getTagColor(ws.tag),
                          color: ws.tag === 'Unassigned' ? '#333' : 'white',
                          width: '100%',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.2)' },
                          '& .MuiSvgIcon-root': {
                            color: ws.tag === 'Unassigned' ? '#333' : 'white'
                          }
                        }}
                      >
                        {TAG_OPTIONS.map(tag => (
                          <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
