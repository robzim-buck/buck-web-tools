import { useState, useEffect } from 'react';
import {
  Typography, Box, CircularProgress, Paper, Divider, Grid, Chip,
  Container, Card, CardContent, TextField, InputAdornment,
  IconButton, Stack, Tabs, Tab, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, Collapse, Alert, AlertTitle,
  Button, Accordion, AccordionSummary, AccordionDetails, Pagination,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { useAppData } from '../contexts/AppDataProvider';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterAlt as FilterIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const CompositeMachineInfo = ({
  showOnlyAllSources = false,
  dense = false,
  parsecInfoData = null,
  jamfComputersData = null,
  machineInfoFromLDAPData = null,
  saltMachineInfoData = null,
  saltPingInfoData = null,
  isLoading: externalIsLoading = false,
  hasError: externalHasError = false
}) => {
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
    user: '',
    pendingReboot: '',
    powerState: '',
    hasGpu: ''
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      user: '',
      pendingReboot: '',
      powerState: '',
      hasGpu: ''
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

  // Extract department, location, and server type from AD DN
  const extractDepartmentAndLocation = (distinguishedName) => {
    if (!distinguishedName || typeof distinguishedName !== 'string') {
      return { department: 'N/A', location: 'N/A', isLinuxServer: false };
    }

    let department = 'N/A';
    let location = 'N/A';
    let isLinuxServer = false;

    // Split DN into components
    const dnComponents = distinguishedName.split(',').map(comp => comp.trim());

    // Check for Linux server indication
    const fullDN = distinguishedName.toLowerCase();
    if (fullDN.includes('linux')) {
      isLinuxServer = true;
    }

    // Look for organizational units (OU) that might contain department/location info
    for (const component of dnComponents) {
      if (component.toLowerCase().startsWith('ou=')) {
        const ouValue = component.substring(3).trim();

        // Common department patterns
        if (ouValue.toLowerCase().includes('dept') ||
            ouValue.toLowerCase().includes('department') ||
            ouValue.toLowerCase().includes('it') ||
            ouValue.toLowerCase().includes('finance') ||
            ouValue.toLowerCase().includes('hr') ||
            ouValue.toLowerCase().includes('marketing') ||
            ouValue.toLowerCase().includes('sales') ||
            ouValue.toLowerCase().includes('engineering') ||
            ouValue.toLowerCase().includes('operations') ||
            ouValue.toLowerCase().includes('admin')) {
          if (department === 'N/A') {
            department = ouValue;
          }
        }

        // Common location patterns
        if (ouValue.toLowerCase().includes('location') ||
            ouValue.toLowerCase().includes('site') ||
            ouValue.toLowerCase().includes('office') ||
            ouValue.toLowerCase().includes('building') ||
            ouValue.toLowerCase().includes('floor') ||
            ouValue.toLowerCase().includes('room') ||
            ouValue.toLowerCase().includes('lax') ||
            ouValue.toLowerCase().includes('nyc') ||
            ouValue.toLowerCase().includes('la') ||
            ouValue.toLowerCase().includes('new york') ||
            ouValue.toLowerCase().includes('los angeles')) {
          if (location === 'N/A') {
            location = ouValue;
          }
        }

        // If we haven't found specific dept/location, use general OU info
        if (department === 'N/A' && !ouValue.toLowerCase().includes('computer') &&
            !ouValue.toLowerCase().includes('machine') && !ouValue.toLowerCase().includes('workstation')) {
          department = ouValue;
        }
      }
    }

    return { department, location, isLinuxServer };
  };

  // Extract deployment location from machine name
  const extractDeployedAt = (machineName) => {
    if (!machineName) return 'N/A';

    const nameUpper = machineName.toUpperCase();
    if (nameUpper.endsWith('DC')) {
      return 'Data Center';
    } else if (nameUpper.endsWith('HQ')) {
      return 'HeadQuarters';
    }

    return 'N/A';
  };

  // Get data from context (pre-fetched) or use props if provided
  const { queries } = useAppData();

  const usePropData = parsecInfoData && jamfComputersData && machineInfoFromLDAPData && saltMachineInfoData && saltPingInfoData;

  // Use pre-fetched data from context if props not provided
  const parsecInfo = usePropData ? { data: parsecInfoData, isLoading: externalIsLoading, error: null } : queries.parsecReport;
  const jamfComputersFromMongo = usePropData ? { data: jamfComputersData, isLoading: externalIsLoading, error: null } : queries.jamfMachineInfo;
  const machineInfoFromLDAP = usePropData ? { data: machineInfoFromLDAPData, isLoading: externalIsLoading, error: null } : queries.ldapMachineInfo;
  const saltMachineInfo = usePropData ? { data: saltMachineInfoData, isLoading: externalIsLoading, error: null } : queries.saltMachineInfo;
  const saltPingInfo = usePropData ? { data: saltPingInfoData, isLoading: externalIsLoading, error: null } : queries.saltPingInfo;





  // Use external loading/error states if provided, otherwise use internal query states
  const isLoading = usePropData
    ? externalIsLoading
    : (parsecInfo.isLoading || jamfComputersFromMongo.isLoading || machineInfoFromLDAP.isLoading || saltMachineInfo.isLoading || saltPingInfo.isLoading);

  const hasError = usePropData
    ? externalHasError
    : (parsecInfo.error || jamfComputersFromMongo.error || machineInfoFromLDAP.error || saltMachineInfo.error || saltPingInfo.error);

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1, px: 2 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Machine Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 3, mb: 3, fontWeight: 500 }}>
              Loading machine data from multiple sources...
            </Typography>

            {/* Individual Data Source Progress */}
            <Box sx={{ width: '100%', maxWidth: 600 }}>
              <Grid container spacing={2}>
                {/* Parsec Data */}
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {usePropData ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    ) : parsecInfo.isLoading ? (
                      <CircularProgress size={20} thickness={5} />
                    ) : parsecInfo.error ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✕</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Parsec
                    </Typography>
                  </Box>
                </Grid>

                {/* JAMF Data */}
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {usePropData ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    ) : jamfComputersFromMongo.isLoading ? (
                      <CircularProgress size={20} thickness={5} />
                    ) : jamfComputersFromMongo.error ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✕</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      JAMF
                    </Typography>
                  </Box>
                </Grid>

                {/* LDAP/Active Directory Data */}
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {usePropData ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    ) : machineInfoFromLDAP.isLoading ? (
                      <CircularProgress size={20} thickness={5} />
                    ) : machineInfoFromLDAP.error ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✕</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Active Directory
                    </Typography>
                  </Box>
                </Grid>

                {/* Salt Machine Info */}
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {usePropData ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    ) : saltMachineInfo.isLoading ? (
                      <CircularProgress size={20} thickness={5} />
                    ) : saltMachineInfo.error ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✕</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Salt Machine Info
                    </Typography>
                  </Box>
                </Grid>

                {/* Salt Ping Info */}
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {usePropData ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    ) : saltPingInfo.isLoading ? (
                      <CircularProgress size={20} thickness={5} />
                    ) : saltPingInfo.error ? (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✕</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem' }}>✓</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Salt Ping Status
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Container maxWidth="xl" sx={{ py: 1, px: 2 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Machine Information
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          One or more data sources failed to load. Please try refreshing the page.
        </Alert>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>Error Details:</Typography>
          
          {!usePropData && parsecInfo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>Parsec Data Error</AlertTitle>
              {parsecInfo.error.message || JSON.stringify(parsecInfo.error)}
            </Alert>
          )}

          {!usePropData && jamfComputersFromMongo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>JAMF Data Error</AlertTitle>
              {jamfComputersFromMongo.error.message || JSON.stringify(jamfComputersFromMongo.error)}
            </Alert>
          )}

          {!usePropData && machineInfoFromLDAP.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>LDAP Data Error</AlertTitle>
              {machineInfoFromLDAP.error.message || JSON.stringify(machineInfoFromLDAP.error)}
            </Alert>
          )}

          {!usePropData && saltMachineInfo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>Salt Data Error</AlertTitle>
              {saltMachineInfo.error.message || JSON.stringify(saltMachineInfo.error)}
            </Alert>
          )}

          {!usePropData && saltPingInfo.error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>Salt Ping Error</AlertTitle>
              {saltPingInfo.error.message || JSON.stringify(saltPingInfo.error)}
            </Alert>
          )}

          {usePropData && externalHasError && (
            <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
              <AlertTitle>Data Loading Error</AlertTitle>
              Error loading machine data from parent component
            </Alert>
          )}

        </Paper>
      </Container>
    );
  }


  // Get the actual data to use - props if provided, otherwise query results
  const actualParsecData = usePropData ? parsecInfoData : parsecInfo.data;
  const actualJamfData = usePropData ? jamfComputersData : jamfComputersFromMongo.data;
  const actualMachineInfoData = usePropData ? machineInfoFromLDAPData : machineInfoFromLDAP.data;
  const actualSaltMachineData = usePropData ? saltMachineInfoData : saltMachineInfo.data;
  const actualSaltPingData = usePropData ? saltPingInfoData : saltPingInfo.data;

  // Data processing
  // Sort machines alphabetically
  const sortedMachineInfo = actualMachineInfoData ? actualMachineInfoData.sort((a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }) : [];

  // Debug data availability
  console.log('Data Debug:', {
    actualMachineInfoDataLength: actualMachineInfoData?.length || 0,
    actualJamfDataLength: actualJamfData?.length || 0,
    actualParsecDataLength: actualParsecData?.length || 0,
    actualSaltMachineDataKeys: actualSaltMachineData ? Object.keys(actualSaltMachineData).length : 0,
    actualSaltPingDataLength: actualSaltPingData ? (Array.isArray(actualSaltPingData) ? actualSaltPingData.length : Object.keys(actualSaltPingData).length) : 0
  });

  // Calculate power level based on CPUs and GPUs
  const calculatePowerLevel = (numCpus, numGpus) => {
    let cpus = 0;
    let gpus = 0;

    // Parse CPU count
    if (numCpus && numCpus !== 'N/A') {
      cpus = parseInt(numCpus, 10) || 0;
    }

    // Parse GPU count - handle various formats
    if (numGpus && numGpus !== 'N/A') {
      if (typeof numGpus === 'string') {
        // Count GPUs in string format like "GPU1, GPU2" or parse numbers
        const gpuMatches = numGpus.match(/\d+/g);
        if (gpuMatches) {
          gpus = gpuMatches.length;
        } else if (numGpus.toLowerCase().includes('gpu')) {
          gpus = (numGpus.match(/gpu/gi) || []).length;
        }
      } else if (typeof numGpus === 'number') {
        gpus = numGpus;
      } else if (Array.isArray(numGpus)) {
        gpus = numGpus.length;
      }
    }

    // Calculate power level (1-5 scale)
    const totalProcessors = cpus + (gpus * 2); // Weight GPUs more heavily
    if (totalProcessors <= 2) return 1;
    if (totalProcessors <= 4) return 2;
    if (totalProcessors <= 8) return 3;
    if (totalProcessors <= 16) return 4;
    return 5;
  };

  // Determine machine type based on name
  const getMachineType = (machineName) => {
    const name = machineName.toLowerCase();
    if (name.includes('2d')) return '2D';
    if (name.includes('3d')) return '3D';
    return 'Standard';
  };

  // Process data for filtering and display
  const processedMachines = sortedMachineInfo.map(machine => {
    // Find related data from other sources
    const jamfComputerInfo = actualJamfData ? actualJamfData.find(
      item => item.general && item.general.name && item.general.name.toLowerCase() === machine.name.toLowerCase()
    ) : null;

    const parsecHostInfo = actualParsecData ? actualParsecData.find(
      item => item.host && item.host.toLowerCase() === machine.name.toLowerCase()
    ) : null;

    // Log when we're processing CONCEPT05-LAXHQ
    if (machine.name.toLowerCase() === 'concept05-laxhq') {
      console.log(`[DEBUG] Processing machine: ${machine.name}`);
      console.log(`[DEBUG] actualSaltMachineData exists:`, !!actualSaltMachineData);
      if (actualSaltMachineData) {
        console.log(`[DEBUG] Salt data keys:`, Object.keys(actualSaltMachineData));
        console.log(`[DEBUG] Looking for localhost matching:`, machine.name.toLowerCase());
      }
    }

    const saltMachineData = actualSaltMachineData ?
      Object.values(actualSaltMachineData).find(saltData => {
        const match = saltData.localhost && saltData.localhost.toLowerCase() === machine.name.toLowerCase();
        if (machine.name.toLowerCase() === 'concept05-laxhq') {
          console.log(`[DEBUG] Checking salt entry:`, {
            saltDataLocalhost: saltData.localhost,
            match,
            hasProductname: 'productname' in saltData,
            productname: saltData.productname,
            motherboard: saltData.motherboard
          });
        }
        return match;
      }) : null;

    // Log result for CONCEPT05-LAXHQ
    if (machine.name.toLowerCase() === 'concept05-laxhq') {
      console.log(`[DEBUG] Salt data found for ${machine.name}:`, !!saltMachineData);
      if (saltMachineData) {
        console.log(`[DEBUG] Salt data:`, saltMachineData);
      }
    }

    // Find salt ping data for this machine
    // Salt ping data comes as an array of {host: "hostname", up: "true"|"false"}
    let saltPingData = null;
    if (actualSaltPingData && Array.isArray(actualSaltPingData)) {
      const pingResult = actualSaltPingData.find(item =>
        item.host && (
          item.host.toLowerCase() === machine.name.toLowerCase() ||
          item.host.toLowerCase() === `${machine.name.toLowerCase()}.buck.local`
        )
      );
      saltPingData = pingResult ? (pingResult.up === "true") : null;
    } else if (actualSaltPingData && typeof actualSaltPingData === 'object') {
      // Handle object format (key-value pairs)
      saltPingData = actualSaltPingData[machine.name.toLowerCase()] || actualSaltPingData[machine.name];
    }

    // Calculate power level and machine type
    const numCpus = saltMachineData?.num_cpus;
    const numGpus = saltMachineData?.gpus;
    const powerLevel = calculatePowerLevel(numCpus, numGpus);
    const machineType = getMachineType(machine.name);

    // Extract department, location, and server type from DN
    const { department, location, isLinuxServer } = extractDepartmentAndLocation(machine.distinguishedName);

    // Extract deployment location from machine name
    const deployedAt = extractDeployedAt(machine.name);

    // Extract useful properties with safe string conversion
    const hwMake = typeof jamfComputerInfo?.hardware?.make === 'object'
      ? JSON.stringify(jamfComputerInfo.hardware.make)
      : (jamfComputerInfo?.hardware?.make || 'N/A');
    const hwModel = typeof jamfComputerInfo?.hardware?.model === 'object'
      ? JSON.stringify(jamfComputerInfo.hardware.model)
      : (jamfComputerInfo?.hardware?.model || 'N/A');
    const hwProductName = typeof jamfComputerInfo?.hardware?.productName === 'object'
      ? JSON.stringify(jamfComputerInfo.hardware.productName)
      : (jamfComputerInfo?.hardware?.productName || 'N/A');
    const osName = typeof jamfComputerInfo?.operatingSystem?.name === 'object'
      ? JSON.stringify(jamfComputerInfo.operatingSystem.name)
      : (jamfComputerInfo?.operatingSystem?.name || 'N/A');
    const osVersion = typeof jamfComputerInfo?.operatingSystem?.version === 'object'
      ? JSON.stringify(jamfComputerInfo.operatingSystem.version)
      : (jamfComputerInfo?.operatingSystem?.version || 'N/A');
    const osBuild = typeof jamfComputerInfo?.operatingSystem?.build === 'object'
      ? JSON.stringify(jamfComputerInfo.operatingSystem.build)
      : (jamfComputerInfo?.operatingSystem?.build || 'N/A');
    const jamfUsername = typeof jamfComputerInfo?.userAndLocation?.username === 'object'
      ? JSON.stringify(jamfComputerInfo.userAndLocation.username)
      : (jamfComputerInfo?.userAndLocation?.username || 'N/A');
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
      currentUser = typeof parsecHostInfo.name === 'object' ? JSON.stringify(parsecHostInfo.name) : parsecHostInfo.name;
      userSource = 'Parsec (Active)';
    } else if (jamfUsername && jamfUsername !== 'N/A') {
      currentUser = jamfUsername; // Already converted to string above
      userSource = 'JAMF';
    } else if (localUserAccounts.length > 0) {
      // Use the first local user as a fallback
      currentUser = localUserAccounts[0];
      userSource = 'Local Account';
    }
    
    // Determine operating system - prioritize Salt data, then Active Directory
    const operatingSystem = saltMachineData?.osfullname || saltMachineData?.os || machine.operatingSystem || 'N/A';

    // Return combined data object
    return {
      id: machine.name, // Using machine name as unique ID
      name: machine.name,
      operatingSystem: operatingSystem,
      upDownStatus: saltPingData === true ? 'Up' : saltPingData === false ? 'Down' : 'Unknown',
      machineType: machineType,
      powerLevel: powerLevel,
      currentUser: currentUser,
      userSource: userSource,
      activeDirectory: {
        lastLogon: lastLogonTimestamp,
        logonCount: logonCount,
        operatingSystem: machine.operatingSystem || 'N/A',
        department: department,
        location: location,
        deployedAt: deployedAt,
        isLinuxServer: isLinuxServer,
        distinguishedName: machine.distinguishedName || 'N/A'
      },
      jamf: {
        make: hwMake,
        model: hwModel,
        productName: hwProductName,
        osName: osName,
        osVersion: osVersion,
        osBuild: osBuild,
        username: jamfUsername,
        localUsers: localUserAccounts
      },
      parsec: {
        username: typeof parsecHostInfo?.name === 'object' ? JSON.stringify(parsecHostInfo.name) : (parsecHostInfo?.name || 'N/A'),
        online: parsecHostInfo?.machine_online ? 'Yes' : 'No',
        lastConnected: parsecHostInfo?.last_connected ? formatDate(parsecHostInfo.last_connected) : 'N/A',
        guests: parsecHostInfo?.guests ? 'Yes' : 'No'
      },
      salt: {
        id: typeof saltMachineData?.id === 'object' ? JSON.stringify(saltMachineData.id) : (saltMachineData?.id || 'N/A'),
        osVersion: typeof (saltMachineData?.osfullname || saltMachineData?.os) === 'object'
          ? JSON.stringify(saltMachineData?.osfullname || saltMachineData?.os)
          : (saltMachineData?.osfullname || saltMachineData?.os || 'N/A'),
        osArch: typeof saltMachineData?.osarch === 'object' ? JSON.stringify(saltMachineData.osarch) : (saltMachineData?.osarch || 'N/A'),
        cpuModel: typeof saltMachineData?.cpu_model === 'object' ? JSON.stringify(saltMachineData.cpu_model) : (saltMachineData?.cpu_model || 'N/A'),
        totalMemory: typeof saltMachineData?.mem_total === 'object' ? JSON.stringify(saltMachineData.mem_total) : (saltMachineData?.mem_total || 'N/A'),
        kernel: typeof saltMachineData?.kernel === 'object' ? JSON.stringify(saltMachineData.kernel) : (saltMachineData?.kernel || 'N/A'),
        kernelRelease: typeof saltMachineData?.kernelrelease === 'object' ? JSON.stringify(saltMachineData.kernelrelease) : (saltMachineData?.kernelrelease || 'N/A'),
        uptime: typeof saltMachineData?.uptime === 'object' ? JSON.stringify(saltMachineData.uptime) : (saltMachineData?.uptime || 'N/A'),
        fqdns: saltMachineData?.fqdns
          ? (Array.isArray(saltMachineData.fqdns) ? saltMachineData.fqdns.join(', ') : JSON.stringify(saltMachineData.fqdns))
          : 'N/A',
        ipAddresses: typeof (saltMachineData?.ip4_interfaces || saltMachineData?.ipv4) === 'object'
          ? JSON.stringify(saltMachineData?.ip4_interfaces || saltMachineData?.ipv4)
          : (saltMachineData?.ip4_interfaces || saltMachineData?.ipv4 || 'N/A'),
        ipInterfaces: typeof saltMachineData?.ip_interfaces === 'object' ? JSON.stringify(saltMachineData.ip_interfaces) : (saltMachineData?.ip_interfaces || 'N/A'),
        numCpus: typeof saltMachineData?.num_cpus === 'object' ? JSON.stringify(saltMachineData.num_cpus) : (saltMachineData?.num_cpus || 'N/A'),
        gpus: typeof saltMachineData?.gpus === 'object' ? JSON.stringify(saltMachineData.gpus) : (saltMachineData?.gpus || 'N/A'),
        hwaddrInterfaces: typeof saltMachineData?.hwaddr_interfaces === 'object' ? JSON.stringify(saltMachineData.hwaddr_interfaces) : (saltMachineData?.hwaddr_interfaces || 'N/A'),
        processorType: typeof saltMachineData?.cpu_model === 'object' ? JSON.stringify(saltMachineData.cpu_model) : (saltMachineData?.cpu_model || 'N/A'),
        cpuModelDetailed: typeof saltMachineData?.cpu_model === 'object' ? JSON.stringify(saltMachineData.cpu_model) : (saltMachineData?.cpu_model || 'N/A'),
        motherboard: typeof saltMachineData?.motherboard === 'object' ? JSON.stringify(saltMachineData.motherboard) : (saltMachineData?.motherboard || 'N/A'),
        productName: (() => {
          // Check root productname field
          console.log(`[${machine.name}] Salt productname:`, saltMachineData?.productname);
          if (saltMachineData?.productname === null) {
            return 'null';
          } else if (saltMachineData?.productname !== undefined && saltMachineData?.productname !== 'undefined') {
            const value = typeof saltMachineData.productname === 'object'
              ? JSON.stringify(saltMachineData.productname)
              : saltMachineData.productname;
            return value;
          }
          return 'N/A';
        })(),
        motherboardProductName: (() => {
          try {
            const mbData = saltMachineData?.motherboard;
            console.log(`[${machine.name}] Salt motherboard data:`, mbData);
            if (!mbData) return 'N/A';
            const parsed = typeof mbData === 'string' ? JSON.parse(mbData) : mbData;
            console.log(`[${machine.name}] Salt motherboard.productname:`, parsed?.productname);
            if (parsed?.productname === null) return 'null';
            if (parsed?.productname === 'undefined' || parsed?.productname === undefined) return 'N/A';
            return parsed?.productname;
          } catch (e) {
            console.error(`[${machine.name}] Error parsing motherboard data:`, e);
            return 'N/A';
          }
        })(),
        ssds: saltMachineData?.ssds
          ? (Array.isArray(saltMachineData.ssds) ? saltMachineData.ssds : JSON.stringify(saltMachineData.ssds))
          : [],
        pendingReboot: typeof saltMachineData?.pending_reboot === 'object' ? JSON.stringify(saltMachineData.pending_reboot) : (saltMachineData?.pending_reboot || ''),
        siteCode: typeof saltMachineData?.site_code === 'object' ? JSON.stringify(saltMachineData.site_code) : (saltMachineData?.site_code || 'N/A'),
        pingStatus: saltPingData === true ? 'Up' : saltPingData === false ? 'Down' : 'Unknown',
        cdrive: saltMachineData?.cdrive !== undefined ? saltMachineData.cdrive : 'N/A',
        ddrive: saltMachineData?.ddrive !== undefined ? saltMachineData.ddrive : 'N/A',
        nvidia: saltMachineData?.nvidia
          ? (Array.isArray(saltMachineData.nvidia) ? saltMachineData.nvidia : [saltMachineData.nvidia])
          : [],
        loggedon: saltMachineData?.loggedon
          ? (Array.isArray(saltMachineData.loggedon) ? saltMachineData.loggedon : [saltMachineData.loggedon])
          : []
      },
      // Raw data for debugging/detailed view
      rawData: {
        activeDirectory: machine,
        jamf: jamfComputerInfo || null,
        parsec: parsecHostInfo || null,
        salt: saltMachineData || null
      }
    };
  });
  
  // Apply search filter
  const filteredMachines = processedMachines.filter(machine => {
    if (!searchTerm) return true;

    return (
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.upDownStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.machineType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.powerLevel.toString().includes(searchTerm.toLowerCase()) ||
      machine.currentUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.activeDirectory.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.activeDirectory.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.activeDirectory.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.activeDirectory.deployedAt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.activeDirectory.isLinuxServer && searchTerm.toLowerCase().includes('linux')) ||
      (machine.activeDirectory.isLinuxServer && searchTerm.toLowerCase().includes('server')) ||
      machine.jamf.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.jamf.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.parsec.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.salt.cpuModelDetailed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.salt.motherboard.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Apply additional filters
  const finalFilteredMachines = filteredMachines.filter(machine => {
    const passedOsFilter = !filters.os || machine.operatingSystem.toLowerCase().includes(filters.os.toLowerCase());
    const passedMakeFilter = !filters.make || machine.jamf.make.toLowerCase().includes(filters.make.toLowerCase());
    const passedModelFilter = !filters.model || machine.jamf.model.toLowerCase().includes(filters.model.toLowerCase());
    const passedUserFilter = !filters.user || machine.currentUser.toLowerCase().includes(filters.user.toLowerCase());

    // Pending reboot filter
    const passedPendingRebootFilter = !filters.pendingReboot ||
      (filters.pendingReboot === 'yes' && machine.salt.pendingReboot) ||
      (filters.pendingReboot === 'no' && !machine.salt.pendingReboot);

    // Power state filter
    const passedPowerStateFilter = !filters.powerState ||
      (filters.powerState === 'up' && machine.upDownStatus === 'Up') ||
      (filters.powerState === 'down' && machine.upDownStatus === 'Down') ||
      (filters.powerState === 'unknown' && machine.upDownStatus === 'Unknown');

    // GPU filter
    const passedGpuFilter = !filters.hasGpu || (() => {
      if (filters.hasGpu === 'yes') {
        if (machine.salt.gpus === 'N/A') return false;
        try {
          const gpuData = typeof machine.salt.gpus === 'string' ? JSON.parse(machine.salt.gpus) : machine.salt.gpus;
          if (Array.isArray(gpuData)) {
            return gpuData.length > 0;
          } else if (typeof gpuData === 'object' && gpuData !== null) {
            return Object.keys(gpuData).length > 0;
          }
          return false;
        } catch (e) {
          return false;
        }
      } else if (filters.hasGpu === 'no') {
        if (machine.salt.gpus === 'N/A') return true;
        try {
          const gpuData = typeof machine.salt.gpus === 'string' ? JSON.parse(machine.salt.gpus) : machine.salt.gpus;
          if (Array.isArray(gpuData)) {
            return gpuData.length === 0;
          } else if (typeof gpuData === 'object' && gpuData !== null) {
            return Object.keys(gpuData).length === 0;
          }
          return true;
        } catch (e) {
          return true;
        }
      }
      return true;
    })();

    return passedOsFilter && passedMakeFilter && passedModelFilter && passedUserFilter &&
           passedPendingRebootFilter && passedPowerStateFilter && passedGpuFilter;
  });

  // Debug filtering
  console.log('Filtering Debug:', {
    processedMachinesLength: processedMachines.length,
    filteredMachinesLength: filteredMachines.length,
    finalFilteredMachinesLength: finalFilteredMachines.length,
    searchTerm,
    filters
  });
  
  // Pagination logic
  const totalMachines = finalFilteredMachines.length;
  const totalPages = Math.ceil(totalMachines / rowsPerPage);

  // Debug logging for pagination
  console.log('Pagination Debug:', {
    page,
    totalMachines,
    rowsPerPage,
    totalPages,
    finalFilteredMachinesLength: finalFilteredMachines.length
  });

  // Clamp currentPage to valid range without changing state
  const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedMachines = finalFilteredMachines.slice(startIndex, endIndex);

  console.log('Pagination Slice:', {
    currentPage,
    startIndex,
    endIndex,
    paginatedMachinesLength: paginatedMachines.length,
    sliceFromTotal: `${startIndex}-${endIndex} of ${totalMachines}`
  });


  // Reset page when filters change
  const handleFiltersReset = () => {
    setFilters({
      os: '',
      make: '',
      model: '',
      user: '',
      pendingReboot: '',
      powerState: '',
      hasGpu: ''
    });
    setPage(1);
  };

  // Handle pagination changes
  const handlePageChange = (event, newPage) => {
    console.log(`Page change requested: ${page} -> ${newPage}, totalPages: ${totalPages}`);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    } else {
      console.warn(`Invalid page ${newPage}, totalPages is ${totalPages}`);
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(event.target.value);
    setPage(1); // Reset to first page when changing rows per page
  };

  // Extract unique values for filters
  const uniqueOsValues = [...new Set(processedMachines.map(m => m.operatingSystem).filter(Boolean))];
  const uniqueMakeValues = [...new Set(processedMachines.map(m => m.jamf.make).filter(Boolean))];
  const uniqueModelValues = [...new Set(processedMachines.map(m => m.jamf.model).filter(Boolean))];
  const uniqueUserValues = [...new Set(processedMachines.map(m => m.currentUser).filter(u => u && u !== 'N/A'))];
  
  return (
    <Container maxWidth="xl" sx={{ py: dense ? 0.5 : 1, px: dense ? 1 : 2 }}>
      {/* Header */}
      <Box sx={{ mb: dense ? 2 : 4 }}>
        <Typography variant={dense ? "h5" : "h4"} color="primary" fontWeight="medium" gutterBottom>
          Machine Information
        </Typography>
        {!dense && (
          <Typography variant="body1" color="text.secondary">
            Consolidated view of machine data from Active Directory, JAMF, Parsec, and Salt
          </Typography>
        )}
      </Box>
      
      {/* Search */}
      <Box sx={{ mb: dense ? 2 : 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
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
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" gutterBottom>Filters</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Operating System"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                value={filters.os}
                onChange={(e) => setFilters({ ...filters, os: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
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
                InputLabelProps={{ shrink: true }}
                value={filters.make}
                onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
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
                InputLabelProps={{ shrink: true }}
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
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
                InputLabelProps={{ shrink: true }}
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
              >
                <option value="">Any User</option>
                {uniqueUserValues.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Power State"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                value={filters.powerState}
                onChange={(e) => setFilters({ ...filters, powerState: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
              >
                <option value="">Any State</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="unknown">Unknown</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Pending Reboot"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                value={filters.pendingReboot}
                onChange={(e) => setFilters({ ...filters, pendingReboot: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
              >
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Has GPU"
                size="small"
                fullWidth
                select
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                value={filters.hasGpu}
                onChange={(e) => setFilters({ ...filters, hasGpu: e.target.value })}
                sx={{ bgcolor: 'background.paper' }}
              >
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleFiltersReset}
              >
                Clear All Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
      
      {/* Results summary and pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(startIndex + 1, totalMachines)}-{Math.min(endIndex, totalMachines)} of {totalMachines} machines
            {totalMachines !== processedMachines.length && ` (filtered from ${processedMachines.length})`}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rows per page</InputLabel>
            <Select
              value={rowsPerPage}
              label="Rows per page"
              onChange={handleRowsPerPageChange}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>

          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={dense ? "small" : "medium"}
              showFirstButton
              showLastButton
            />
          )}
        </Box>
        
        {searchTerm && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Search: "{searchTerm}"
            </Typography>
          </Box>
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
              handleFiltersReset();
            }}
            startIcon={<ClearAllIcon />}
            sx={{ mt: 2 }}
          >
            Clear All Filters
          </Button>
        </Paper>
      ) : (
        <Box sx={{ maxHeight: dense ? '600px' : '800px', overflow: 'auto' }}>
          <Grid container spacing={0.5}>
            {paginatedMachines.map(machine => {
            const isExpanded = expandedMachines[machine.id] || false;
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={machine.id}>
                <Card
                  variant="outlined"
                  sx={{ height: '100%', m: 0.5 }}
                >
                {/* Machine header - simplified view */}
                <CardContent
                  sx={{
                    p: dense ? 0.75 : 1.5,
                    '&:last-child': { pb: dense ? 0.75 : 1.5 },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleMachineExpand(machine.id)}
                >
                  <Grid container spacing={0.25} alignItems="flex-start">
                    {/* Machine name and expand button */}
                    <Grid item xs={10}>
                      <Typography variant={dense ? "body1" : "subtitle1"} fontWeight="medium" gutterBottom={!dense}>
                        {machine.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'right' }}>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Grid>

                    {/* Hardware Information Layout - 8 Column Grid (or 4 column when dense) */}
                    <Box sx={{ mt: 0.5, mb: 1, width: '100%' }}>
                      <Grid container spacing={0.5} sx={{ width: '100%', m: 0 }}>
                        {/* Column 1 - System Info */}
                        <Grid size={dense ? 3 : 1.5} sx={{ pr: 0.5 }}>
                          {/* CPU */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              CPU
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {machine.salt.numCpus !== 'N/A' ? `${machine.salt.numCpus} CPU(s)` : 'N/A'}
                            </Typography>
                          </Box>

                          {/* Memory */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Memory
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {machine.salt.totalMemory !== 'N/A' ? `${Math.round(machine.salt.totalMemory / 1024)} GB` : 'N/A'}
                            </Typography>
                          </Box>

                          {/* Operating System */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              OS
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {machine.operatingSystem.length > 15 ? `${machine.operatingSystem.substring(0, 15)}...` : machine.operatingSystem}
                            </Typography>
                          </Box>

                          {/* SSDs */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              SSDs
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {Array.isArray(machine.salt.ssds) && machine.salt.ssds.length > 0
                                ? `${machine.salt.ssds.length} drive(s)`
                                : 'Unknown'}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Column 2 - Status Info */}
                        <Grid size={dense ? 3 : 1.5} sx={{ pr: 0.5 }}>
                          {/* Power Status */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Power
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: machine.upDownStatus === 'Up' ? '#4caf50' : machine.upDownStatus === 'Down' ? '#f44336' : '#757575'
                              }} />
                              <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                {machine.upDownStatus === 'Up' ? 'On' : machine.upDownStatus === 'Down' ? 'Off' : 'Unknown'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Machine Type */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Type
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {machine.machineType}
                            </Typography>
                          </Box>

                          {/* Performance Rating */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Performance
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{
                                fontSize: dense ? '0.65rem' : '0.7rem',
                                fontWeight: 600,
                                color: machine.powerLevel >= 4 ? '#4caf50' : machine.powerLevel >= 3 ? '#ff9800' : '#757575'
                              }}>
                                {machine.powerLevel}/5
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.2 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Box
                                    key={star}
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      bgcolor: star <= machine.powerLevel ? '#ff9800' : '#e0e0e0',
                                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>

                          {/* Pending Reboot */}
                          {machine.salt.pendingReboot && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                                Reboot
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: '#ff9800'
                                }} />
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2, color: '#ff9800' }}>
                                  Pending
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Grid>

                        {/* Column 3 - User & Hardware */}
                        <Grid size={dense ? 3 : 1.5} sx={{ pr: 0.5 }}>
                          {/* Current User */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              User
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {machine.currentUser !== 'N/A'
                                ? (machine.currentUser.length > 12 ? `${machine.currentUser.substring(0, 12)}...` : machine.currentUser)
                                : 'N/A'
                              }
                            </Typography>
                          </Box>

                          {/* GPU Information */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              GPU
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {(() => {
                                if (machine.salt.gpus === 'N/A') return 'Unknown';
                                try {
                                  const gpuData = typeof machine.salt.gpus === 'string' ? JSON.parse(machine.salt.gpus) : machine.salt.gpus;
                                  if (Array.isArray(gpuData)) {
                                    return gpuData.length > 0 ? `${gpuData.length} GPU(s)` : 'None';
                                  } else if (typeof gpuData === 'object' && gpuData !== null) {
                                    const count = Object.keys(gpuData).length;
                                    return count > 0 ? `${count} GPU(s)` : 'None';
                                  }
                                  return machine.salt.gpus;
                                } catch (e) {
                                  return machine.salt.gpus;
                                }
                              })()}
                            </Typography>
                          </Box>

                          {/* Hardware Make/Model */}
                          {(machine.jamf.make !== 'N/A' || machine.jamf.model !== 'N/A') && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                                Hardware
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                {(() => {
                                  const hw = machine.jamf.make !== 'N/A' && machine.jamf.model !== 'N/A'
                                    ? `${machine.jamf.make} ${machine.jamf.model}`
                                    : machine.jamf.make !== 'N/A' ? machine.jamf.make : machine.jamf.model;
                                  return hw.length > 15 ? `${hw.substring(0, 15)}...` : hw;
                                })()}
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        {/* Column 4 - Network & Services */}
                        <Grid size={dense ? 3 : 1.5} sx={{ pr: 0.5 }}>
                          {/* Parsec Status */}
                          {machine.parsec.online !== 'No' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                              <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                                Parsec
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: machine.parsec.online === 'Yes' ? '#4caf50' : '#757575'
                                }} />
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                  {machine.parsec.online === 'Yes' ? 'Online' : 'Offline'}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Uptime */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Uptime
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {(() => {
                                if (machine.salt.uptime === 'N/A') return 'Unknown';
                                try {
                                  const uptimeData = typeof machine.salt.uptime === 'string' ? JSON.parse(machine.salt.uptime) : machine.salt.uptime;
                                  if (typeof uptimeData === 'object' && uptimeData.days !== undefined) {
                                    return `${uptimeData.days}d ${uptimeData.hours || 0}h`;
                                  } else if (typeof uptimeData === 'number') {
                                    const days = Math.floor(uptimeData / (24 * 60 * 60));
                                    const hours = Math.floor((uptimeData % (24 * 60 * 60)) / (60 * 60));
                                    return `${days}d ${hours}h`;
                                  }
                                  return machine.salt.uptime;
                                } catch (e) {
                                  return machine.salt.uptime;
                                }
                              })()}
                            </Typography>
                          </Box>

                          {/* Network Interfaces Count */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.6rem' : '0.65rem', lineHeight: 1.2 }}>
                              Network
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                              {(() => {
                                if (machine.salt.ipInterfaces === 'N/A') return 'Unknown';
                                try {
                                  const ipInterfaceData = typeof machine.salt.ipInterfaces === 'string' ? JSON.parse(machine.salt.ipInterfaces) : machine.salt.ipInterfaces;
                                  let interfaceCount = 0;
                                  if (typeof ipInterfaceData === 'object' && ipInterfaceData !== null) {
                                    Object.keys(ipInterfaceData).forEach(interfaceName => {
                                      if (interfaceName.toLowerCase() !== 'lo' && !interfaceName.toLowerCase().includes('loopback')) {
                                        interfaceCount++;
                                      }
                                    });
                                  }
                                  return interfaceCount > 0 ? `${interfaceCount} Interface${interfaceCount > 1 ? 's' : ''}` : 'None';
                                } catch (e) {
                                  return 'Unknown';
                                }
                              })()}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Column 5 - Hardware Details */}
                        {!dense && (
                        <Grid size={1.5} sx={{ pr: 0.5 }}>
                          <Box>
                            <Typography variant="subtitle2" color="primary" sx={{ fontSize: dense ? '0.7rem' : '0.75rem', mb: 0.5 }}>
                              Hardware Details
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                  CPU
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                  {machine.salt.cpuModelDetailed !== 'N/A'
                                    ? (machine.salt.cpuModelDetailed.length > 25
                                      ? `${machine.salt.cpuModelDetailed.substring(0, 25)}...`
                                      : machine.salt.cpuModelDetailed)
                                    : 'Unknown'}
                                </Typography>
                              </Box>
                              {machine.salt.productName && machine.salt.productName !== 'N/A' && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Product Name
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                    {machine.salt.productName.length > 25 ? `${machine.salt.productName.substring(0, 25)}...` : machine.salt.productName}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                  Motherboard
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                  {machine.salt.motherboardProductName && machine.salt.motherboardProductName !== 'N/A'
                                    ? (machine.salt.motherboardProductName.length > 25 ? `${machine.salt.motherboardProductName.substring(0, 25)}...` : machine.salt.motherboardProductName)
                                    : 'Unknown'}
                                </Typography>
                              </Box>
                              {machine.salt.cdrive !== 'N/A' && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    C: Drive
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2, color: machine.salt.cdrive ? '#2e7d32' : '#666' }}>
                                    {machine.salt.cdrive ? 'Yes' : 'No'}
                                  </Typography>
                                </Box>
                              )}
                              {machine.salt.ddrive !== 'N/A' && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    D: Drive
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2, color: machine.salt.ddrive ? '#2e7d32' : '#666' }}>
                                    {machine.salt.ddrive ? 'Yes' : 'No'}
                                  </Typography>
                                </Box>
                              )}
                              {machine.salt.nvidia && machine.salt.nvidia.length > 0 && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    NVIDIA GPU
                                  </Typography>
                                  {machine.salt.nvidia.map((gpu, index) => (
                                    <Typography key={index} variant="body2" sx={{ fontSize: dense ? '0.55rem' : '0.6rem', fontWeight: 500, lineHeight: 1.2, ml: 0.5 }}>
                                      • {typeof gpu === 'object' ? `${gpu.type || 'GPU'}${gpu.slot ? ` (Slot ${gpu.slot})` : ''}${gpu.firmware ? ` - FW: ${gpu.firmware}` : ''}` : gpu}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {machine.salt.loggedon && machine.salt.loggedon.length > 0 && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Logged On
                                  </Typography>
                                  {machine.salt.loggedon.map((entry, index) => (
                                    <Typography key={index} variant="body2" sx={{ fontSize: dense ? '0.55rem' : '0.6rem', fontWeight: 500, lineHeight: 1.2, ml: 0.5 }}>
                                      • {entry}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                        )}

                        {/* Column 6 - Network Interfaces */}
                        {!dense && (
                        <Grid size={1.5} sx={{ pr: 0.5 }}>
                          <Box>
                            <Typography variant="subtitle2" color="primary" sx={{ fontSize: dense ? '0.7rem' : '0.75rem', mb: 0.5 }}>
                              Network Interfaces
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              {(() => {
                                if (machine.salt.ipInterfaces === 'N/A') {
                                  return (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666' }}>
                                        Unknown
                                      </Typography>
                                    </Box>
                                  );
                                }
                                try {
                                  const ipInterfaceData = typeof machine.salt.ipInterfaces === 'string' ? JSON.parse(machine.salt.ipInterfaces) : machine.salt.ipInterfaces;
                                  const filtered = Object.entries(ipInterfaceData)
                                    .filter(([iface, ips]) => {
                                      return iface !== 'lo' && Array.isArray(ips) && ips.length > 0;
                                    });
                                  if (filtered.length === 0) {
                                    return (
                                      <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666' }}>
                                          None
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return filtered
                                    .slice(0, 2)
                                    .map(([iface, ips]) => (
                                      <Box key={iface} sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                          {iface}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: dense ? '0.55rem' : '0.6rem', fontFamily: 'monospace', fontWeight: 500, lineHeight: 1.2 }}>
                                          {ips[0]}
                                        </Typography>
                                        {ips.length > 1 && (
                                          <Typography variant="body2" sx={{ fontSize: dense ? '0.55rem' : '0.6rem', color: '#999', lineHeight: 1.2 }}>
                                            +{ips.length - 1} more
                                          </Typography>
                                        )}
                                      </Box>
                                    ));
                                } catch (e) {
                                  return (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666' }}>
                                        Unknown
                                      </Typography>
                                    </Box>
                                  );
                                }
                              })()}
                            </Box>
                          </Box>
                        </Grid>
                        )}

                        {/* Column 7 - Activity Information */}
                        {!dense && (
                        <Grid size={1.5} sx={{ pr: 0.5 }}>
                          <Box>
                            <Typography variant="subtitle2" color="primary" sx={{ fontSize: dense ? '0.7rem' : '0.75rem', mb: 0.5 }}>
                              Activity Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              {machine.activeDirectory.lastLogon !== 'N/A' && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Last AD
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                    {machine.activeDirectory.lastLogon}
                                  </Typography>
                                </Box>
                              )}
                              {machine.parsec.lastConnected !== 'N/A' && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Last Parsec
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                    {machine.parsec.lastConnected}
                                  </Typography>
                                </Box>
                              )}
                              {machine.activeDirectory.logonCount > 0 && (
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Logons
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                    {machine.activeDirectory.logonCount}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                  Kernel
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                  {machine.salt.kernelRelease !== 'N/A' ? machine.salt.kernelRelease : 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        )}

                        {/* Column 8 - Department & Location */}
                        {!dense && (
                        <Grid size={1.5} sx={{ pr: 0.5 }}>
                          <Box>
                              <Typography variant="subtitle2" color="primary" sx={{ fontSize: dense ? '0.7rem' : '0.75rem', mb: 0.5 }}>
                                Department & Location
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                    Site Code
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                    {machine.salt.siteCode !== 'N/A' ? machine.salt.siteCode.toUpperCase() : 'Unknown'}
                                  </Typography>
                                </Box>
                                {machine.activeDirectory.department !== 'N/A' && (
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                      Location
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.activeDirectory.department}
                                    </Typography>
                                  </Box>
                                )}
                                {machine.activeDirectory.location !== 'N/A' && (
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                      Dept
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.activeDirectory.location}
                                    </Typography>
                                  </Box>
                                )}
                                {machine.activeDirectory.deployedAt !== 'N/A' && (
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                      Deployed
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.activeDirectory.deployedAt}
                                    </Typography>
                                  </Box>
                                )}
                                {machine.activeDirectory.isLinuxServer && (
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', color: '#666', lineHeight: 1.2 }}>
                                      Type
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: dense ? '0.6rem' : '0.65rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      Linux Server
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                          </Box>
                        </Grid>
                        )}

                        {/* Second Row for Dense Mode - Columns 5-8 */}
                        {dense && (
                          <>
                            {/* Column 5 - Hardware Details (Dense) */}
                            <Grid size={3} sx={{ pr: 0.5 }}>
                              <Box>
                                <Typography variant="subtitle2" color="primary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Hardware Details
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                      CPU
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.salt.cpuModelDetailed !== 'N/A'
                                        ? (machine.salt.cpuModelDetailed.length > 25
                                          ? `${machine.salt.cpuModelDetailed.substring(0, 25)}...`
                                          : machine.salt.cpuModelDetailed)
                                        : 'Unknown'}
                                    </Typography>
                                  </Box>
                                  {machine.salt.productName && machine.salt.productName !== 'N/A' && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Product Name
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                        {machine.salt.productName.length > 25 ? `${machine.salt.productName.substring(0, 25)}...` : machine.salt.productName}
                                      </Typography>
                                    </Box>
                                  )}
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                      Motherboard
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.salt.motherboardProductName && machine.salt.motherboardProductName !== 'N/A'
                                        ? (machine.salt.motherboardProductName.length > 25 ? `${machine.salt.motherboardProductName.substring(0, 25)}...` : machine.salt.motherboardProductName)
                                        : 'Unknown'}
                                    </Typography>
                                  </Box>
                                  {machine.salt.cdrive !== 'N/A' && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        C: Drive
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2, color: machine.salt.cdrive ? '#2e7d32' : '#666' }}>
                                        {machine.salt.cdrive ? 'Yes' : 'No'}
                                      </Typography>
                                    </Box>
                                  )}
                                  {machine.salt.ddrive !== 'N/A' && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        D: Drive
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2, color: machine.salt.ddrive ? '#2e7d32' : '#666' }}>
                                        {machine.salt.ddrive ? 'Yes' : 'No'}
                                      </Typography>
                                    </Box>
                                  )}
                                  {machine.salt.nvidia && machine.salt.nvidia.length > 0 && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        NVIDIA GPU
                                      </Typography>
                                      {machine.salt.nvidia.map((gpu, index) => (
                                        <Typography key={index} variant="body2" sx={{ fontSize: '0.55rem', fontWeight: 500, lineHeight: 1.2, ml: 0.5 }}>
                                          • {typeof gpu === 'object' ? `${gpu.type || 'GPU'}${gpu.slot ? ` (Slot ${gpu.slot})` : ''}${gpu.firmware ? ` - FW: ${gpu.firmware}` : ''}` : gpu}
                                        </Typography>
                                      ))}
                                    </Box>
                                  )}
                                  {machine.salt.loggedon && machine.salt.loggedon.length > 0 && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Logged On
                                      </Typography>
                                      {machine.salt.loggedon.map((entry, index) => (
                                        <Typography key={index} variant="body2" sx={{ fontSize: '0.55rem', fontWeight: 500, lineHeight: 1.2, ml: 0.5 }}>
                                          • {entry}
                                        </Typography>
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Grid>

                            {/* Column 6 - Network Interfaces (Dense) */}
                            <Grid size={3} sx={{ pr: 0.5 }}>
                              <Box>
                                <Typography variant="subtitle2" color="primary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Network Interfaces
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                  {(() => {
                                    if (machine.salt.ipInterfaces === 'N/A') {
                                      return (
                                        <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                          <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666' }}>
                                            Unknown
                                          </Typography>
                                        </Box>
                                      );
                                    }
                                    try {
                                      const ipInterfaceData = typeof machine.salt.ipInterfaces === 'string' ? JSON.parse(machine.salt.ipInterfaces) : machine.salt.ipInterfaces;
                                      const filtered = Object.entries(ipInterfaceData)
                                        .filter(([iface, ips]) => {
                                          return iface !== 'lo' && Array.isArray(ips) && ips.length > 0;
                                        });
                                      if (filtered.length === 0) {
                                        return (
                                          <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666' }}>
                                              None
                                            </Typography>
                                          </Box>
                                        );
                                      }
                                      return filtered
                                        .slice(0, 2)
                                        .map(([iface, ips]) => (
                                          <Box key={iface} sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                              {iface}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '0.55rem', fontFamily: 'monospace', fontWeight: 500, lineHeight: 1.2 }}>
                                              {ips[0]}
                                            </Typography>
                                            {ips.length > 1 && (
                                              <Typography variant="body2" sx={{ fontSize: '0.55rem', color: '#999', lineHeight: 1.2 }}>
                                                +{ips.length - 1} more
                                              </Typography>
                                            )}
                                          </Box>
                                        ));
                                    } catch (e) {
                                      return (
                                        <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                          <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666' }}>
                                            Unknown
                                          </Typography>
                                        </Box>
                                      );
                                    }
                                  })()}
                                </Box>
                              </Box>
                            </Grid>

                            {/* Column 7 - Activity Information (Dense) */}
                            <Grid size={3} sx={{ pr: 0.5 }}>
                              <Box>
                                <Typography variant="subtitle2" color="primary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Activity Information
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                  {machine.activeDirectory.lastLogon !== 'N/A' && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Last AD
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                        {machine.activeDirectory.lastLogon}
                                      </Typography>
                                    </Box>
                                  )}
                                  {machine.parsec.lastConnected !== 'N/A' && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Last Parsec
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                        {machine.parsec.lastConnected}
                                      </Typography>
                                    </Box>
                                  )}
                                  {machine.activeDirectory.logonCount > 0 && (
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Logons
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                        {machine.activeDirectory.logonCount}
                                      </Typography>
                                    </Box>
                                  )}
                                  <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                      Kernel
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                      {machine.salt.kernelRelease !== 'N/A' ? machine.salt.kernelRelease : 'Unknown'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Column 8 - Department & Location (Dense) */}
                            <Grid size={3} sx={{ pr: 0.5 }}>
                              <Box>
                                  <Typography variant="subtitle2" color="primary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                    Department & Location
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                    <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                        Site Code
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                        {machine.salt.siteCode !== 'N/A' ? machine.salt.siteCode.toUpperCase() : 'Unknown'}
                                      </Typography>
                                    </Box>
                                    {machine.activeDirectory.department !== 'N/A' && (
                                      <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                          Location
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                          {machine.activeDirectory.department}
                                        </Typography>
                                      </Box>
                                    )}
                                    {machine.activeDirectory.location !== 'N/A' && (
                                      <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                          Dept
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                          {machine.activeDirectory.location}
                                        </Typography>
                                      </Box>
                                    )}
                                    {machine.activeDirectory.deployedAt !== 'N/A' && (
                                      <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                          Deployed
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                          {machine.activeDirectory.deployedAt}
                                        </Typography>
                                      </Box>
                                    )}
                                    {machine.activeDirectory.isLinuxServer && (
                                      <Box sx={{ py: 0.25, borderBottom: '1px solid #f0f0f0', px: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', color: '#666', lineHeight: 1.2 }}>
                                          Type
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.2 }}>
                                          Linux Server
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                              </Box>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>

                    {/* Network Information Section - Add IP Addresses */}
                    {machine.salt.ipAddresses !== 'N/A' && (
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Typography variant="subtitle2" color="primary" sx={{ fontSize: dense ? '0.75rem' : '0.85rem', mb: 0.5 }}>
                          Network Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(() => {
                            try {
                              const ipData = typeof machine.salt.ipAddresses === 'string' ? JSON.parse(machine.salt.ipAddresses) : machine.salt.ipAddresses;
                              const ips = [];

                              if (typeof ipData === 'object' && ipData !== null) {
                                Object.entries(ipData).forEach(([interfaceName, interfaceIps]) => {
                                  if (Array.isArray(interfaceIps)) {
                                    interfaceIps.forEach(ip => {
                                      if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('169.254')) {
                                        ips.push({ interface: interfaceName, ip });
                                      }
                                    });
                                  } else if (typeof interfaceIps === 'string' && interfaceIps !== '127.0.0.1') {
                                    ips.push({ interface: interfaceName, ip: interfaceIps });
                                  }
                                });
                              }

                              return ips.slice(0, 3).map((ipInfo, index) => (
                                <Chip
                                  key={index}
                                  size="small"
                                  label={`${ipInfo.interface}: ${ipInfo.ip}`}
                                  variant="outlined"
                                  color="info"
                                  sx={{
                                    fontSize: dense ? '0.6rem' : '0.7rem',
                                    height: dense ? '20px' : '24px',
                                    fontFamily: 'monospace'
                                  }}
                                />
                              ));
                            } catch (e) {
                              return (
                                <Chip
                                  size="small"
                                  label={machine.salt.ipAddresses}
                                  variant="outlined"
                                  color="info"
                                  sx={{
                                    fontSize: dense ? '0.6rem' : '0.7rem',
                                    height: dense ? '20px' : '24px',
                                    fontFamily: 'monospace'
                                  }}
                                />
                              );
                            }
                          })()}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </CardContent>

                {/* Expanded details section */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <CardContent sx={{ p: 2, pt: 1 }}>
                    {/* Hardware Addresses Section */}
                    {machine.salt.hwaddrInterfaces !== 'N/A' && (() => {
                      // Parse hardware addresses from JSON string or object
                      let hwAddresses = [];
                      try {
                        const hwData = typeof machine.salt.hwaddrInterfaces === 'string'
                          ? JSON.parse(machine.salt.hwaddrInterfaces)
                          : machine.salt.hwaddrInterfaces;

                        if (typeof hwData === 'object' && hwData !== null) {
                          // Extract MAC addresses from the interfaces object, filtering out loopback
                          hwAddresses = Object.entries(hwData)
                            .filter(([interfaceName, macAddress]) => {
                              // Filter out Software Loopback Interface and common loopback patterns
                              const isLoopback = interfaceName.toLowerCase().includes('loopback') ||
                                               interfaceName.toLowerCase().includes('software loopback') ||
                                               interfaceName === 'lo' ||
                                               interfaceName === 'lo0';
                              return !isLoopback;
                            })
                            .map(([interfaceName, macAddress]) => ({
                              interface: interfaceName,
                              mac: macAddress
                            }));
                        }
                      } catch (e) {
                        // If parsing fails, treat as single string
                        hwAddresses = [{ interface: 'unknown', mac: machine.salt.hwaddrInterfaces }];
                      }

                      return hwAddresses.length > 0 ? (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Hardware Addresses (MAC)
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {hwAddresses.map((addr, index) => (
                              <Chip
                                key={index}
                                size="small"
                                label={`${addr.interface}: ${addr.mac}`}
                                variant="outlined"
                                color="secondary"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.7rem',
                                  height: '24px'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : null;
                    })()}

                    {/* Processor Type Section */}
                    {machine.salt.processorType !== 'N/A' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Processor Type
                        </Typography>
                        <Chip
                          size="small"
                          label={machine.salt.processorType}
                          variant="filled"
                          color="info"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            height: '28px',
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                    )}

                    {/* Collapsible Information Sections */}
                    <Box sx={{ mt: 2 }}>
                      {/* Active Directory Section - Only show if data exists */}
                      {machine.rawData.activeDirectory && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="primary" fontWeight="medium">
                              Active Directory Information
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
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
                                  {machine.activeDirectory.department !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Department
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          size="small"
                                          label={machine.activeDirectory.department}
                                          variant="outlined"
                                          color="primary"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.activeDirectory.location !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Location
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          size="small"
                                          label={machine.activeDirectory.location}
                                          variant="outlined"
                                          color="secondary"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.activeDirectory.deployedAt !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Deployed At
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          size="small"
                                          label={machine.activeDirectory.deployedAt}
                                          variant="outlined"
                                          color="info"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.activeDirectory.isLinuxServer && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Server Type
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          size="small"
                                          label="Linux Server"
                                          variant="outlined"
                                          color="success"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.activeDirectory.distinguishedName !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Distinguished Name
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                        {machine.activeDirectory.distinguishedName}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* JAMF Section - Only show if data exists */}
                      {machine.rawData.jamf && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="primary" fontWeight="medium">
                              JAMF Information
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
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
                                  {machine.jamf.productName && machine.jamf.productName !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Product Name
                                      </TableCell>
                                      <TableCell>{machine.jamf.productName}</TableCell>
                                    </TableRow>
                                  )}
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
                                  {machine.jamf.username !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Username
                                      </TableCell>
                                      <TableCell>{machine.jamf.username}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.jamf.localUsers && machine.jamf.localUsers.length > 0 && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Local Users
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {machine.jamf.localUsers.map((user, index) => (
                                            <Chip
                                              key={index}
                                              size="small"
                                              label={user}
                                              variant="outlined"
                                              color="secondary"
                                              sx={{ fontSize: '0.7rem', height: '20px' }}
                                            />
                                          ))}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {/* Additional JAMF fields from raw data */}
                                  {machine.rawData.jamf?.hardware?.serialNumber && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Serial Number
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {machine.rawData.jamf.hardware.serialNumber}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.rawData.jamf?.hardware?.macAddress && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        MAC Address
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {machine.rawData.jamf.hardware.macAddress}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.rawData.jamf?.userAndLocation?.realName && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Real Name
                                      </TableCell>
                                      <TableCell>{machine.rawData.jamf.userAndLocation.realName}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.rawData.jamf?.userAndLocation?.emailAddress && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Email Address
                                      </TableCell>
                                      <TableCell>{machine.rawData.jamf.userAndLocation.emailAddress}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.rawData.jamf?.general?.lastContactTime && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Last Contact
                                      </TableCell>
                                      <TableCell>{formatDate(machine.rawData.jamf.general.lastContactTime)}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.rawData.jamf?.general?.lastEnrolledDate && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Enrollment Date
                                      </TableCell>
                                      <TableCell>{formatDate(machine.rawData.jamf.general.lastEnrolledDate)}</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Salt Section - Only show if data exists */}
                      {machine.rawData.salt && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="primary" fontWeight="medium">
                              Salt Information
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium', width: '40%' }}>
                                      OS Version
                                    </TableCell>
                                    <TableCell>{machine.salt.osVersion}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Architecture
                                    </TableCell>
                                    <TableCell>{machine.salt.osArch}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      CPU Model
                                    </TableCell>
                                    <TableCell>{machine.salt.cpuModel}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Total Memory
                                    </TableCell>
                                    <TableCell>
                                      {machine.salt.totalMemory !== 'N/A'
                                        ? `${machine.salt.totalMemory} MB (${Math.round(machine.salt.totalMemory / 1024)} GB)`
                                        : 'N/A'
                                      }
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Kernel
                                    </TableCell>
                                    <TableCell>{machine.salt.kernel}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Kernel Release
                                    </TableCell>
                                    <TableCell>{machine.salt.kernelRelease}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Uptime
                                    </TableCell>
                                    <TableCell>{machine.salt.uptime}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Ping Status
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        size="small"
                                        label={machine.salt.pingStatus}
                                        color={machine.salt.pingStatus === 'Up' ? 'success' : machine.salt.pingStatus === 'Down' ? 'error' : 'default'}
                                        variant="filled"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  {machine.salt.numCpus !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        CPUs
                                      </TableCell>
                                      <TableCell>{machine.salt.numCpus}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.gpus !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        GPUs
                                      </TableCell>
                                      <TableCell>
                                        {(() => {
                                          try {
                                            const gpuData = typeof machine.salt.gpus === 'string' ? JSON.parse(machine.salt.gpus) : machine.salt.gpus;
                                            if (Array.isArray(gpuData)) {
                                              return (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                  {gpuData.map((gpu, index) => (
                                                    <Chip
                                                      key={index}
                                                      size="small"
                                                      label={typeof gpu === 'object' ? (gpu.name || gpu.model || JSON.stringify(gpu)) : gpu}
                                                      variant="outlined"
                                                      color="info"
                                                      sx={{ fontSize: '0.7rem', height: '20px', justifyContent: 'flex-start' }}
                                                    />
                                                  ))}
                                                </Box>
                                              );
                                            } else if (typeof gpuData === 'object' && gpuData !== null) {
                                              return (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                  {Object.entries(gpuData).map(([key, value], index) => (
                                                    <Chip
                                                      key={index}
                                                      size="small"
                                                      label={`${key}: ${value}`}
                                                      variant="outlined"
                                                      color="info"
                                                      sx={{ fontSize: '0.7rem', height: '20px', justifyContent: 'flex-start' }}
                                                    />
                                                  ))}
                                                </Box>
                                              );
                                            }
                                            return machine.salt.gpus;
                                          } catch (e) {
                                            return machine.salt.gpus;
                                          }
                                        })()}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.fqdns !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        FQDNs
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                        {machine.salt.fqdns}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.ipAddresses !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        IP Addresses
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {(() => {
                                            try {
                                              const ipData = typeof machine.salt.ipAddresses === 'string' ? JSON.parse(machine.salt.ipAddresses) : machine.salt.ipAddresses;
                                              const ips = [];

                                              if (typeof ipData === 'object' && ipData !== null) {
                                                Object.entries(ipData).forEach(([interfaceName, interfaceIps]) => {
                                                  if (Array.isArray(interfaceIps)) {
                                                    interfaceIps.forEach(ip => {
                                                      if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('169.254')) {
                                                        ips.push({ interface: interfaceName, ip });
                                                      }
                                                    });
                                                  } else if (typeof interfaceIps === 'string' && interfaceIps !== '127.0.0.1') {
                                                    ips.push({ interface: interfaceName, ip: interfaceIps });
                                                  }
                                                });
                                              }

                                              return ips.map((ipInfo, index) => (
                                                <Chip
                                                  key={index}
                                                  size="small"
                                                  label={`${ipInfo.interface}: ${ipInfo.ip}`}
                                                  variant="outlined"
                                                  color="secondary"
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: '20px',
                                                    fontFamily: 'monospace'
                                                  }}
                                                />
                                              ));
                                            } catch (e) {
                                              return (
                                                <Chip
                                                  size="small"
                                                  label={machine.salt.ipAddresses}
                                                  variant="outlined"
                                                  color="secondary"
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: '20px',
                                                    fontFamily: 'monospace'
                                                  }}
                                                />
                                              );
                                            }
                                          })()}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.ipInterfaces !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        IP Interfaces (Full)
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {(() => {
                                            try {
                                              const ipInterfaceData = typeof machine.salt.ipInterfaces === 'string' ? JSON.parse(machine.salt.ipInterfaces) : machine.salt.ipInterfaces;
                                              const interfaces = [];

                                              if (typeof ipInterfaceData === 'object' && ipInterfaceData !== null) {
                                                Object.entries(ipInterfaceData).forEach(([interfaceName, interfaceData]) => {
                                                  if (interfaceName.toLowerCase() !== 'lo' && !interfaceName.toLowerCase().includes('loopback')) {
                                                    if (Array.isArray(interfaceData)) {
                                                      interfaceData.forEach(ip => {
                                                        if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('169.254')) {
                                                          interfaces.push({ interface: interfaceName, ip });
                                                        }
                                                      });
                                                    } else if (typeof interfaceData === 'string') {
                                                      if (interfaceData !== '127.0.0.1' && interfaceData !== '::1' && !interfaceData.startsWith('169.254')) {
                                                        interfaces.push({ interface: interfaceName, ip: interfaceData });
                                                      }
                                                    }
                                                  }
                                                });
                                              }

                                              return interfaces.map((intInfo, index) => (
                                                <Chip
                                                  key={index}
                                                  size="small"
                                                  label={`${intInfo.interface}: ${intInfo.ip}`}
                                                  variant="outlined"
                                                  color="info"
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: '20px',
                                                    fontFamily: 'monospace'
                                                  }}
                                                />
                                              ));
                                            } catch (e) {
                                              return (
                                                <Chip
                                                  size="small"
                                                  label={machine.salt.ipInterfaces}
                                                  variant="outlined"
                                                  color="info"
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: '20px',
                                                    fontFamily: 'monospace'
                                                  }}
                                                />
                                              );
                                            }
                                          })()}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.cpuModelDetailed !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        CPU Model (Detailed)
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>
                                        {machine.salt.cpuModelDetailed}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Product Name
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem' }}>
                                      {machine.salt.productName}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Motherboard Product Name
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem' }}>
                                      {machine.salt.motherboardProductName}
                                    </TableCell>
                                  </TableRow>
                                  {machine.salt.motherboard !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Motherboard
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem' }}>
                                        {(() => {
                                          try {
                                            const mbData = typeof machine.salt.motherboard === 'string' ? JSON.parse(machine.salt.motherboard) : machine.salt.motherboard;
                                            if (typeof mbData === 'object' && mbData !== null && mbData.productname) {
                                              return mbData.productname;
                                            }
                                            return 'N/A';
                                          } catch (e) {
                                            return 'N/A';
                                          }
                                        })()}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.id !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        Salt ID
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                        {machine.salt.id}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Parsec Section - Only show if data exists */}
                      {machine.rawData.parsec && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="primary" fontWeight="medium">
                              Parsec Information
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
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
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>

                    {/* Raw Data Section */}
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

                              <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Salt Data {machine.rawData.salt ? '' : '(No data found)'}
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
                                    {machine.rawData.salt
                                      ? JSON.stringify(machine.rawData.salt, null, 2)
                                      : 'No Salt data found for this machine'
                                    }
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                            </Paper>
                          </Collapse>
                        </Box>
                  </CardContent>
                </Collapse>
              </Card>
              </Grid>
            );
          })}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default CompositeMachineInfo;
