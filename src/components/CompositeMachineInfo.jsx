import { useState, useEffect } from 'react';
import { 
  Typography, Box, CircularProgress, Paper, Divider, Grid, Chip,
  Container, Card, CardContent, TextField, InputAdornment, 
  IconButton, Stack, Tabs, Tab, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, Collapse, Alert, AlertTitle,
  Button, Accordion, AccordionSummary, AccordionDetails, Pagination,
  Select, MenuItem, FormControl, InputLabel
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
    user: ''
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

  // Use props data if provided, otherwise make API calls
  const usePropData = parsecInfoData && jamfComputersData && machineInfoFromLDAPData && saltMachineInfoData && saltPingInfoData;

  // API Queries - only used when data is not provided via props
  const parsecInfo = useQuery({
    queryKey: ['parsecinfo'],
    queryFn: async () => {
      try {
        const res = await fetch("https://laxcoresrv.buck.local:8000/parsec/parsecreport", {
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
        console.error("Error fetching Parsec info:", error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 1000,
    enabled: !usePropData
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
    retryDelay: 1000,
    enabled: !usePropData
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
    retryDelay: 1000,
    enabled: !usePropData
  });

  const saltMachineInfo = useQuery({
    queryKey: ['saltmachineinfo'],
    queryFn: async () => {
      try {
        const res = await fetch('https://laxcoresrv.buck.local:8000/salt/machine_info', {
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
        console.error("Error fetching Salt machine info:", error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 1000,
    enabled: !usePropData
  });

  const saltPingInfo = useQuery({
    queryKey: ['saltping'],
    queryFn: async () => {
      try {
        const res = await fetch('https://laxcoresrv.buck.local:8000/salt/ping', {
          method: 'POST',
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
        console.error("Error fetching Salt ping info:", error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute since ping status changes frequently
    retry: 2,
    retryDelay: 1000,
    enabled: !usePropData
  });





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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
          Machine Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 3 }}>
              Loading machine data from multiple sources...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This may take a moment as we gather information from JAMF, Active Directory, Parsec, and Salt.
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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

    const saltMachineData = actualSaltMachineData ?
      Object.values(actualSaltMachineData).find(saltData =>
        saltData.localhost && saltData.localhost.toLowerCase() === machine.name.toLowerCase()
      ) : null;

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

    // Extract useful properties with safe string conversion
    const hwMake = typeof jamfComputerInfo?.hardware?.make === 'object'
      ? JSON.stringify(jamfComputerInfo.hardware.make)
      : (jamfComputerInfo?.hardware?.make || 'N/A');
    const hwModel = typeof jamfComputerInfo?.hardware?.model === 'object'
      ? JSON.stringify(jamfComputerInfo.hardware.model)
      : (jamfComputerInfo?.hardware?.model || 'N/A');
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
        numCpus: typeof saltMachineData?.num_cpus === 'object' ? JSON.stringify(saltMachineData.num_cpus) : (saltMachineData?.num_cpus || 'N/A'),
        gpus: typeof saltMachineData?.gpus === 'object' ? JSON.stringify(saltMachineData.gpus) : (saltMachineData?.gpus || 'N/A'),
        hwaddrInterfaces: typeof saltMachineData?.hwaddr_interfaces === 'object' ? JSON.stringify(saltMachineData.hwaddr_interfaces) : (saltMachineData?.hwaddr_interfaces || 'N/A'),
        processorType: typeof saltMachineData?.cpu_model === 'object' ? JSON.stringify(saltMachineData.cpu_model) : (saltMachineData?.cpu_model || 'N/A'),
        pingStatus: saltPingData === true ? 'Up' : saltPingData === false ? 'Down' : 'Unknown'
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
      machine.jamf.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.jamf.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.parsec.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Apply additional filters
  const finalFilteredMachines = filteredMachines.filter(machine => {
    const passedOsFilter = !filters.os || machine.operatingSystem.toLowerCase().includes(filters.os.toLowerCase());
    const passedMakeFilter = !filters.make || machine.jamf.make.toLowerCase().includes(filters.make.toLowerCase());
    const passedModelFilter = !filters.model || machine.jamf.model.toLowerCase().includes(filters.model.toLowerCase());
    const passedUserFilter = !filters.user || machine.currentUser.toLowerCase().includes(filters.user.toLowerCase());

    return passedOsFilter && passedMakeFilter && passedModelFilter && passedUserFilter;
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
      user: ''
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
    <Container maxWidth="lg" sx={{ py: dense ? 2 : 4 }}>
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
      
      {/* Tabs & Search */}
      <Box sx={{ mb: dense ? 2 : 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        {!showOnlyAllSources && (
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
        )}
        
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
          <Grid container spacing={dense ? 1 : 2}>
            {paginatedMachines.map(machine => {
            const isExpanded = expandedMachines[machine.id] || false;
            
            return (
              <Grid item xs={12} md={dense ? 4 : 6} lg={dense ? 3 : 4} key={machine.id}>
                <Card 
                  variant="outlined" 
                  sx={{ height: '100%' }}
                >
                {/* Machine header - simplified view */}
                <CardContent
                  sx={{
                    p: dense ? 1 : 2,
                    '&:last-child': { pb: dense ? 1 : 2 },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleMachineExpand(machine.id)}
                >
                  <Grid container spacing={dense ? 0.5 : 1} alignItems="flex-start">
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

                    {/* Hardware Information Layout - VMware Style */}
                    <Box sx={{ mt: dense ? 0.5 : 1, mb: 2 }}>
                      <Grid container spacing={2}>
                        {/* Left Column */}
                        <Grid size={6}>
                          {/* CPU */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              CPU
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.7rem' : '0.8rem', fontWeight: 500 }}>
                              {machine.salt.numCpus !== 'N/A' ? `${machine.salt.numCpus} CPU(s)` : 'N/A'}
                              {machine.salt.cpuModel !== 'N/A' && `, ${machine.salt.cpuModel.split(' ').slice(0, 3).join(' ')}`}
                            </Typography>
                          </Box>

                          {/* Memory */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              Memory
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.7rem' : '0.8rem', fontWeight: 500 }}>
                              {machine.salt.totalMemory !== 'N/A' ? `${Math.round(machine.salt.totalMemory / 1024)} GB` : 'N/A'}
                            </Typography>
                          </Box>

                          {/* Operating System */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              Operating System
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.7rem' : '0.8rem', fontWeight: 500 }}>
                              {machine.operatingSystem}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Right Column */}
                        <Grid size={6}>
                          {/* Power Status */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              Power Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: machine.upDownStatus === 'Up' ? '#4caf50' : machine.upDownStatus === 'Down' ? '#f44336' : '#757575'
                              }} />
                              <Typography variant="body2" sx={{ fontSize: dense ? '0.7rem' : '0.8rem', fontWeight: 500 }}>
                                {machine.upDownStatus === 'Up' ? 'Powered On' : machine.upDownStatus === 'Down' ? 'Powered Off' : 'Unknown'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Machine Type */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              Machine Type
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: dense ? '0.7rem' : '0.8rem', fontWeight: 500 }}>
                              {machine.machineType}
                            </Typography>
                          </Box>

                          {/* Power Level */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: dense ? '0.7rem' : '0.8rem' }}>
                              Performance Rating
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{
                                fontSize: dense ? '0.7rem' : '0.8rem',
                                fontWeight: 600,
                                color: machine.powerLevel >= 4 ? '#4caf50' : machine.powerLevel >= 3 ? '#ff9800' : '#757575'
                              }}>
                                {machine.powerLevel}/5
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Box
                                    key={star}
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      bgcolor: star <= machine.powerLevel ? '#ff9800' : '#e0e0e0',
                                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
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
                                    <TableCell>{machine.salt.totalMemory}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Kernel
                                    </TableCell>
                                    <TableCell>{machine.salt.kernel}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                      Uptime
                                    </TableCell>
                                    <TableCell>{machine.salt.uptime}</TableCell>
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
                                      <TableCell>{machine.salt.gpus}</TableCell>
                                    </TableRow>
                                  )}
                                  {machine.salt.fqdns !== 'N/A' && (
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        FQDNs
                                      </TableCell>
                                      <TableCell>{machine.salt.fqdns}</TableCell>
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
