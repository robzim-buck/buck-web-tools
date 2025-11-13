import {
  Typography, Paper, Grid, Box, Button, TextField, Autocomplete,
  CircularProgress, Alert, Snackbar, Chip, Card, CardContent,
  IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Fade, Divider, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  ToggleButtonGroup, ToggleButton, InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import TableViewIcon from '@mui/icons-material/TableView';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useMemo } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import { useAppData } from '../contexts/AppDataProvider';
import CompositeMachineInfo from './CompositeMachineInfo';

export default function AssignWorkstations({ name = "Assign Workstations" }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedParsecHost, setSelectedParsecHost] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, assignment: null });
  const [showMachineInfo, setShowMachineInfo] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [searchFilter, setSearchFilter] = useState('');
  const [orderBy, setOrderBy] = useState('email');
  const [order, setOrder] = useState('asc');


  // Get data from context (pre-fetched)
  const { queries, data } = useAppData();

  // Use Okta users from context
  const usersQuery = queries.oktaUsers;

  // Get Google users data for profile pictures
  const googleUsersByEmail = data.googleUsersByEmail || {};

  // Get Salt data for GPU/CPU info
  const saltMachineInfoQuery = queries.saltMachineInfo;

  // Create a lookup object for salt data by machine name
  const saltDataByMachine = useMemo(() => {
    if (!saltMachineInfoQuery?.data) return {};

    const lookup = {};
    const saltData = saltMachineInfoQuery.data;

    // Salt data is an object where values contain machine data
    // Match by the 'localhost' field in the salt data
    if (typeof saltData === 'object') {
      Object.values(saltData).forEach(machineData => {
        if (machineData.localhost) {
          // Store by lowercase localhost name for case-insensitive matching
          lookup[machineData.localhost.toLowerCase()] = machineData;
        }
      });
    }

    console.log('Salt data lookup created:', {
      totalMachines: Object.keys(lookup).length,
      sampleKeys: Object.keys(lookup).slice(0, 10),
      sampleNvidiaData: Object.values(lookup).slice(0, 3).map(m => ({
        localhost: m.localhost,
        hasNvidia: !!m.nvidia,
        nvidia: m.nvidia,
        num_cpus: m.num_cpus
      }))
    });

    return lookup;
  }, [saltMachineInfoQuery?.data]);

  // Use machines from context (pre-fetched)
  const machinesQuery = queries.ldapRawMachineInfo;

  // Use assignments from context (pre-fetched from SQL database)
  const assignmentsQuery = queries.assignments;

  // Fetch Parsec machines data (for assignment dropdowns only)
  const parsecMachinesQuery = useProtectedApiGet('/parsec/parsecinfo/category', {
    queryParams: {
      _category: 'machines'
    },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Process Parsec machines data
  const parsecMachinesList = useMemo(() => {
    console.log('Processing Parsec machines...');
    console.log('parsecMachinesQuery.data:', parsecMachinesQuery.data);
    console.log('parsecMachinesQuery.isLoading:', parsecMachinesQuery.isLoading);
    console.log('parsecMachinesQuery.error:', parsecMachinesQuery.error);

    if (!parsecMachinesQuery.data) {
      console.log('No Parsec data available');
      return [];
    }

    console.log('Raw Parsec machines data:', parsecMachinesQuery.data);
    console.log('Data type:', typeof parsecMachinesQuery.data);
    console.log('Is array:', Array.isArray(parsecMachinesQuery.data));

    if (Array.isArray(parsecMachinesQuery.data)) {
      console.log('Processing array with length:', parsecMachinesQuery.data.length);

      // Log first few items to see structure
      console.log('First 3 items:', parsecMachinesQuery.data.slice(0, 3));

      const processed = parsecMachinesQuery.data
        .filter(machine => {
          console.log('Checking machine:', machine);
          // Check various possible field names for the data
          const hasHost = machine.host || machine.hostname || machine.host_name || machine.name;
          const hasHostId = machine.host_id || machine.hostId || machine.id || machine._id;
          console.log(`Host: ${hasHost}, HostId: ${hasHostId}`);
          console.log('All machine keys:', Object.keys(machine));
          return hasHost && hasHostId;
        })
        .map(machine => ({
          host: machine.host || machine.hostname || machine.host_name || machine.name,
          hostId: machine.host_id || machine.hostId || machine.id || machine._id,
          name: machine.name || machine.host || machine.hostname || machine.host_name,
          label: `${machine.host || machine.hostname || machine.host_name || machine.name}${machine.name && machine.name !== (machine.host || machine.hostname || machine.host_name) ? ` (${machine.name})` : ''}`,
          online: machine.machine_online || machine.online || machine.status === 'online' || false,
          lastConnected: machine.last_connected || machine.lastConnected,
          guests: machine.guests || machine.guest_count || 0,
          rawData: machine // Keep the original data for debugging
        }))
        .sort((a, b) => a.host.localeCompare(b.host));

      console.log('Processed Parsec machines:', processed);
      console.log('Final count:', processed.length);
      return processed;
    }

    console.log('Data is not an array, returning empty array');
    return [];
  }, [parsecMachinesQuery.data]);

  // Create a lookup object for parsec data by machine host name
  const parsecDataByMachine = useMemo(() => {
    const lookup = {};

    parsecMachinesList.forEach(parsecMachine => {
      if (parsecMachine.host) {
        // Store by lowercase host name for case-insensitive matching
        lookup[parsecMachine.host.toLowerCase()] = parsecMachine;
      }
    });

    console.log('Parsec data lookup created:', {
      totalMachines: Object.keys(lookup).length,
      sampleKeys: Object.keys(lookup).slice(0, 10),
      sampleData: Object.values(lookup).slice(0, 3).map(m => ({
        host: m.host,
        name: m.name,
        online: m.online
      }))
    });

    return lookup;
  }, [parsecMachinesList]);

  // Create assignment mutation - using custom fetch since path params are needed
  const createAssignment = async (email, machineName, permanent = true) => {
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(email)}/${encodeURIComponent(machineName)}/${permanent}`,
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
      
      const data = await response.json();
      setSnackbar({
        open: true,
        message: 'Workstation assigned successfully!',
        severity: 'success'
      });
      setSelectedUser(null);
      setSelectedMachine(null);
      assignmentsQuery.refetch();
      return data;
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to assign workstation: ${error.message}`,
        severity: 'error'
      });
      throw error;
    }
  };

  // Delete assignment - using custom fetch since path params are needed
  const deleteAssignment = async (email, machineName) => {
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(email)}/${encodeURIComponent(machineName)}`,
        {
          method: 'DELETE',
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
        message: 'Assignment removed successfully!',
        severity: 'success'
      });
      setDeleteDialog({ open: false, assignment: null });
      assignmentsQuery.refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to remove assignment: ${error.message}`,
        severity: 'error'
      });
      setDeleteDialog({ open: false, assignment: null });
      throw error;
    }
  };

  // Assign user to machine in Parsec
  const assignParsecHost = async (email, hostId) => {
    console.log('assignParsecHost called with:');
    console.log('- email:', email);
    console.log('- hostId:', hostId);
    console.log('- email type:', typeof email);
    console.log('- hostId type:', typeof hostId);

    const requestBody = {
      user_email: email,
      host_id: hostId
    };
    console.log('Request body:', requestBody);

    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/parsec/parsec_assign_host_to_user/${hostId}/${email}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('Parsec assignment response status:', response.status);
      
      if (!response.ok) {
        // Handle 422 specifically - might mean user already assigned or other business logic issue
        if (response.status === 422) {
          const errorText = await response.text();
          console.warn('Parsec assignment returned 422:', errorText);
          setSnackbar({
            open: true,
            message: 'Parsec assignment not processed (422) - User may already be assigned or endpoint unavailable',
            severity: 'warning'
          });
          return { status: 'warning', message: 'Assignment not processed (422)' };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: 'Parsec assignment successful!',
        severity: 'success'
      });
      return data;
    } catch (error) {
      console.error('Error in assignParsecHost:', error);

      // Handle 422 errors gracefully
      if (error.message && error.message.includes('422')) {
        setSnackbar({
          open: true,
          message: 'Parsec assignment not processed - User may already be assigned or service unavailable',
          severity: 'warning'
        });
        return { status: 'warning', message: 'Assignment not processed (422)' };
      }

      setSnackbar({
        open: true,
        message: `Failed to assign in Parsec: ${error.message}`,
        severity: 'error'
      });
      throw error;
    }
  };

  // Process users data
  const usersList = useMemo(() => {
    if (!usersQuery.data) return [];

    console.log('Raw users data:', usersQuery.data);

    // The API returns an array of user objects with profile.email property
    if (Array.isArray(usersQuery.data)) {
      const processed = usersQuery.data
        .filter(user => {
          // Only include users with email in profile
          if (!user.profile?.email) return false;

          // Include users with relevant statuses for workstation assignment
          const status = user.status || 'ACTIVE';

          // Include ACTIVE, PASSWORD_EXPIRED, and RECOVERY users
          // Exclude SUSPENDED users as they shouldn't get workstation assignments
          return ['ACTIVE', 'PASSWORD_EXPIRED', 'RECOVERY'].includes(status);
        })
        .map(user => {
          // Get Google user data for profile picture
          const googleUser = googleUsersByEmail[user.profile.email.toLowerCase()];
          const profilePicture = googleUser?.thumbnailPhotoUrl || googleUser?.photoUrl || null;

          return {
            email: user.profile.email,
            label: `${user.profile.email}${user.profile.displayName ? ` (${user.profile.displayName})` : ''}`,
            displayName: user.profile.displayName,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            status: user.status || 'ACTIVE',
            profilePicture: profilePicture
          };
        });
      console.log('Processed users:', processed);
      console.log('User statuses:', processed.map(u => u.status).slice(0, 10));
      console.log('Users with profile pictures:', processed.filter(u => u.profilePicture).length);
      return processed;
    }

    console.log('Users data is not an array:', typeof usersQuery.data);
    return [];
  }, [usersQuery.data, googleUsersByEmail]);

  // Process machines data
  const machinesList = useMemo(() => {
    if (!machinesQuery.data) {
      console.log('No machines data available');
      return [];
    }

    console.log('Raw machines data:', machinesQuery.data);
    console.log('Machines data type:', typeof machinesQuery.data);
    console.log('Machines data is array:', Array.isArray(machinesQuery.data));

    // Handle different data formats - check if it's an array or nested object
    let machinesArray = [];

    if (Array.isArray(machinesQuery.data)) {
      machinesArray = machinesQuery.data;
    } else if (typeof machinesQuery.data === 'object') {
      // If it's an object, try to extract machines from common nested structures
      if (machinesQuery.data.machines && Array.isArray(machinesQuery.data.machines)) {
        machinesArray = machinesQuery.data.machines;
      } else if (machinesQuery.data.data && Array.isArray(machinesQuery.data.data)) {
        machinesArray = machinesQuery.data.data;
      } else {
        // Try to get values from the object
        machinesArray = Object.values(machinesQuery.data);
      }
    }

    console.log('Extracted machines array:', machinesArray);
    console.log('Machines array length:', machinesArray.length);

    // Debug: Show structure of first machine
    if (machinesArray.length > 0) {
      console.log('First machine structure:', machinesArray[0]);
      console.log('First machine keys:', Object.keys(machinesArray[0]));
      console.log('First machine cn:', machinesArray[0].cn);
      // Debug OS fields specifically
      const firstMachine = machinesArray[0];
      console.log('OS Fields Debug:', {
        operatingSystem: firstMachine.operatingSystem,
        os: firstMachine.os,
        operatingSystemName: firstMachine.operatingSystemName,
        operatingSystemVersion: firstMachine.operatingSystemVersion,
        osVersion: firstMachine.osVersion,
        description: firstMachine.description,
        info: firstMachine.info,
        allKeys: Object.keys(firstMachine)
      });
    }

    if (!Array.isArray(machinesArray) || machinesArray.length === 0) {
      console.log('No valid machines array found');
      return [];
    }

    // Helper function to extract machine name from DN
    const extractMachineNameFromDN = (dn) => {
      if (!dn) return null;
      // DN format is typically: CN=MACHINE-NAME,OU=...,DC=...
      const cnMatch = dn.match(/^CN=([^,]+)/i);
      return cnMatch ? cnMatch[1] : null;
    };

    // Helper function to parse DN and extract machine information
    const parseDNInfo = (dn) => {
      if (!dn) return { location: 'Unknown', type: 'Unknown', os: 'Unknown', details: [] };

      const dnString = typeof dn === 'string' ? dn : String(dn);

      // Extract all OU (Organizational Unit) components
      const ouMatches = dnString.match(/OU=([^,]+)/gi) || [];
      const ous = ouMatches.map(ou => ou.replace(/^OU=/i, ''));

      // Extract DC (Domain Component) for location context
      const dcMatches = dnString.match(/DC=([^,]+)/gi) || [];
      const dcs = dcMatches.map(dc => dc.replace(/^DC=/i, ''));

      // Initialize result object
      const result = {
        location: 'Unknown',
        type: 'Unknown',
        os: 'Unknown',
        details: [],
        rawOUs: ous,
        rawDCs: dcs
      };

      // Parse location from OUs - look for specific location codes
      const locationCodes = [
        // Primary locations mentioned
        'LAX', 'NYC', 'AMS', 'SYD',
        // Common US locations
        'SF', 'CHI', 'BOS', 'ATL', 'SEA', 'DEN', 'DAL', 'PHX', 'MIA', 'LAS', 'PDX', 'SLC',
        // International locations
        'LON', 'PAR', 'FRA', 'BER', 'MAD', 'ROM', 'ZUR', 'VIE', 'DUB', 'MIL', 'BCN',
        'TOK', 'HKG', 'SIN', 'BOM', 'DEL', 'BLR', 'HYD', 'PUN', 'CHE', 'KOL', 'MUM',
        'TOR', 'YVR', 'YYZ', 'YUL', 'YWG', 'YEG', 'YHZ'
      ];

      // Look for exact location code matches in OUs
      const foundLocation = ous.find(ou => {
        const ouUpper = ou.toUpperCase();
        return locationCodes.includes(ouUpper);
      });

      if (foundLocation) {
        result.location = foundLocation.toUpperCase();
      } else {
        // Look for location codes as part of OU names
        const partialLocation = ous.find(ou =>
          locationCodes.some(loc => ou.toUpperCase().includes(loc))
        );
        if (partialLocation) {
          // Extract just the location code part
          const matchedCode = locationCodes.find(loc => partialLocation.toUpperCase().includes(loc));
          result.location = matchedCode;
        } else if (ous.length > 0) {
          // Use the first OU as potential location if no standard codes found
          result.location = ous[0];
        }
      }

      // Parse machine type from OUs
      const typeKeywords = {
        'SERVER': ['Server', 'Servers', 'Domain Controllers', 'SQL', 'Exchange', 'SharePoint'],
        'WORKSTATION': ['Workstations', 'Desktops', 'Computers', 'Workstation'],
        'LAPTOP': ['Laptops', 'Mobile', 'Portable'],
        'MAC': ['Mac', 'Apple', 'macOS', 'iMac', 'MacBook'],
        'LINUX': ['Linux', 'Ubuntu', 'RedHat', 'CentOS', 'Unix']
      };

      // First check for location-type patterns (e.g., NYC-Workstation, LAX-Server, AMS-Laptop)
      const locationTypePatterns = {
        'WORKSTATION': ['-WORKSTATION', '-WORKSTATIONS'],
        'SERVER': ['-SERVER', '-SERVERS'],
        'LAPTOP': ['-LAPTOP', '-LAPTOPS', '-MOBILE'],
        'MAC': ['-MAC', '-APPLE', '-IMAC', '-MACBOOK'],
        'LINUX': ['-LINUX', '-UBUNTU', '-REDHAT']
      };

      let foundLocationTypePattern = null;
      let foundType = null;

      for (const [type, patterns] of Object.entries(locationTypePatterns)) {
        const matchingOU = ous.find(ou => {
          const ouUpper = ou.toUpperCase();
          return patterns.some(pattern =>
            locationCodes.some(loc => ouUpper.includes(`${loc}${pattern}`))
          );
        });

        if (matchingOU) {
          foundLocationTypePattern = matchingOU;
          foundType = type;
          break;
        }
      }

      if (foundLocationTypePattern && foundType) {
        result.type = foundType;
        // Also extract location from this pattern if we haven't found one yet
        if (result.location === 'Unknown') {
          const ouUpper = foundLocationTypePattern.toUpperCase();
          const matchedLocationCode = locationCodes.find(loc =>
            Object.values(locationTypePatterns).flat().some(pattern =>
              ouUpper.includes(`${loc}${pattern}`)
            )
          );
          if (matchedLocationCode) {
            result.location = matchedLocationCode;
          }
        }
      } else {
        // Fall back to general keyword matching
        for (const [type, keywords] of Object.entries(typeKeywords)) {
          if (ous.some(ou => keywords.some(keyword => ou.toLowerCase().includes(keyword.toLowerCase())))) {
            result.type = type;
            break;
          }
        }
      }

      // Parse OS information from OUs
      const osKeywords = {
        'Windows': ['Windows', 'Win10', 'Win11', 'WinServer', 'Server2019', 'Server2022'],
        'macOS': ['Mac', 'Apple', 'macOS', 'OSX'],
        'Linux': ['Linux', 'Ubuntu', 'RedHat', 'CentOS', 'Unix', 'RHEL']
      };

      for (const [os, keywords] of Object.entries(osKeywords)) {
        if (ous.some(ou => keywords.some(keyword => ou.toLowerCase().includes(keyword.toLowerCase())))) {
          result.os = os;
          break;
        }
      }

      // Add all OUs as details for debugging
      result.details = ous;

      // Debug logging for DN parsing (first few only)
      if (ous.length > 0) {
        console.log(`DN Parsing for ${dnString}:`, {
          extractedOUs: ous,
          extractedDCs: dcs,
          foundLocation: result.location,
          foundType: result.type,
          foundOS: result.os,
          locationTypePattern: foundLocationTypePattern || 'none detected',
          patternMatched: foundType || 'none'
        });
      }

      return result;
    };

    // Parse machine info data
    const processed = machinesArray
      .filter(machine => {
        const hasName = machine && (
          machine.name ||
          machine.hostname ||
          machine.computerName ||
          machine.cn?.[0] ||
          machine.cn ||
          machine.dn ||
          extractMachineNameFromDN(machine.dn)
        );
        if (!hasName) {
          console.log('Filtering out machine without name:', machine);
          console.log('Machine keys:', Object.keys(machine));
          console.log('Machine dn:', machine.dn);
        }
        return hasName;
      })
      .map((machine, index) => {
        // Extract machine name from various possible fields - prioritize dn extraction for LDAP data
        const machineName =
          machine.cn?.[0] ||
          machine.cn ||
          extractMachineNameFromDN(machine.dn) ||
          machine.name ||
          machine.hostname ||
          machine.computerName;

        // Debug logging for name extraction
        if (machine.cn?.[0]) {
          console.log(`Using cn[0] for machine name: ${machine.cn[0]}`);
        } else if (machine.cn) {
          console.log(`Using cn for machine name: ${machine.cn}`);
        } else if (extractMachineNameFromDN(machine.dn)) {
          console.log(`Using DN for machine name: ${extractMachineNameFromDN(machine.dn)} (from ${machine.dn})`);
        } else {
          console.log(`Using fallback for machine name: ${machineName}`);
        }

        // Note: Salt and Parsec data enrichment removed since CompositeMachineInfo handles its own data
        const saltOSInfo = null;

        // LDAP fields might be arrays, so handle both array and string formats
        const getFieldValue = (field) => {
          if (!field) return null;
          return Array.isArray(field) ? field[0] : field;
        };

        // Helper to safely extract values that might be objects or complex types
        const getSafeStringValue = (field) => {
          if (!field || field === 'N/A') return 'N/A';
          if (typeof field === 'string' || typeof field === 'number') return String(field);
          if (typeof field === 'object') {
            // For objects, try to extract meaningful information
            if (field.vendor && field.model) {
              return `${field.vendor} ${field.model}`;
            }
            if (field.name) return String(field.name);
            if (field.value) return String(field.value);
            // Fall back to JSON stringify for complex objects
            return JSON.stringify(field);
          }
          return String(field);
        };

        const adOSInfo = getFieldValue(machine.operatingSystem) ||
                        getFieldValue(machine.os) ||
                        getFieldValue(machine.operatingSystemName) ||
                        getFieldValue(machine.operatingSystemVersion) ||
                        getFieldValue(machine.description) ||
                        getFieldValue(machine.info);

        // Parse DN information
        const dnInfo = parseDNInfo(machine.distinguishedName || machine.dn);

        // Debug logging for first few machines (using index instead of processed.length)
        if (index < 5) {
          console.log(`Machine ${machineName}:`, {
            rawMachine: machine,
            distinguishedName: machine.distinguishedName || machine.dn,
            adOSInfo,
            finalOS: adOSInfo || 'N/A',
            osSource: 'AD',
            dnInfo: dnInfo,
            parsedOUs: dnInfo.rawOUs,
            extractedLocation: dnInfo.location,
            extractedType: dnInfo.type
          });
        }

        return {
          name: machineName,
          label: machineName,
          operatingSystem: adOSInfo || 'N/A',
          operatingSystemVersion: getFieldValue(machine.operatingSystemVersion) || getFieldValue(machine.osVersion) || 'N/A',
          distinguishedName: machine.distinguishedName || machine.dn || 'N/A',
          // Simplified salt object with N/A values since CompositeMachineInfo handles detailed data
          salt: {
            osVersion: 'N/A',
            osArch: 'N/A',
            cpuModel: 'N/A',
            totalMemory: 'N/A',
            uptime: 'N/A',
            numCpus: 'N/A',
            gpus: 'N/A'
          },
          // Add DN parsed information
          dnInfo: {
            location: dnInfo.location,
            type: dnInfo.type,
            osFromDN: dnInfo.os,
            details: dnInfo.details,
            rawOUs: dnInfo.rawOUs,
            rawDCs: dnInfo.rawDCs
          },
          // Keep track of data sources for debugging
          osSource: 'AD'
        };
      });

    console.log('Processed machines:', processed);
    return processed;
  }, [machinesQuery.data]);

  // Process assignments data
  const assignmentsList = useMemo(() => {
    if (!assignmentsQuery.data) return [];

    if (Array.isArray(assignmentsQuery.data)) {
      return assignmentsQuery.data;
    }

    return [];
  }, [assignmentsQuery.data]);

  // Filtered and sorted assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = [...assignmentsList];

    // Apply search filter
    if (searchFilter) {
      const lowerFilter = searchFilter.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.email.toLowerCase().includes(lowerFilter) ||
        assignment.machine_name.toLowerCase().includes(lowerFilter)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'machine':
          aValue = a.machine_name.toLowerCase();
          bValue = b.machine_name.toLowerCase();
          break;
        case 'date':
          aValue = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
          bValue = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
          break;
        default:
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [assignmentsList, searchFilter, orderBy, order]);

  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };


  // Filter assignments for selected user
  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return assignmentsList.filter(assignment => 
      assignment.email === selectedUser.email
    );
  }, [assignmentsList, selectedUser]);


  // Filter available machines (not already assigned to the selected user)
  const availableMachines = useMemo(() => {
    console.log('Computing available machines...');
    console.log('selectedUser:', selectedUser);
    console.log('machinesList count:', machinesList.length);
    console.log('userAssignments count:', userAssignments.length);

    if (!selectedUser) {
      console.log('No user selected, returning all machines');
      return machinesList;
    }

    const assignedMachineNames = userAssignments.map(a => a.machine_name);
    console.log('Assigned machine names:', assignedMachineNames);

    const filtered = machinesList.filter(machine =>
      !assignedMachineNames.includes(machine.name)
    );

    console.log('Available machines after filtering:', filtered.length);
    return filtered;
  }, [machinesList, selectedUser, userAssignments]);

  const handleAssignWorkstation = async () => {
    if (!selectedUser || !selectedMachine) {
      setSnackbar({
        open: true,
        message: 'Please select both a user and a workstation',
        severity: 'warning'
      });
      return;
    }

    await createAssignment(selectedUser.email, selectedMachine.name, true);
  };

  const handleAssignParsec = async () => {
    console.log('handleAssignParsec called');
    console.log('selectedUser:', selectedUser);
    console.log('selectedParsecHost:', selectedParsecHost);

    if (!selectedUser || !selectedParsecHost) {
      setSnackbar({
        open: true,
        message: 'Please select both a user and a Parsec host',
        severity: 'warning'
      });
      return;
    }

    // Debug the values being passed
    const userEmail = selectedUser.email;
    const hostId = selectedParsecHost.hostId;
    console.log('Assigning Parsec host:');
    console.log('- User email:', userEmail);
    console.log('- Host ID:', hostId);
    console.log('- Full selectedParsecHost object:', selectedParsecHost);

    if (!userEmail) {
      setSnackbar({
        open: true,
        message: 'Selected user does not have an email address',
        severity: 'error'
      });
      return;
    }

    if (!hostId) {
      setSnackbar({
        open: true,
        message: 'Selected Parsec host does not have a host ID',
        severity: 'error'
      });
      return;
    }

    try {
      const result = await assignParsecHost(userEmail, hostId);

      // Handle both success and warning responses
      if (result && result.status === 'warning') {
        console.log('Parsec assignment returned warning:', result.message);
        // Still clear the selection for warnings (422 errors)
        setSelectedParsecHost(null);
      } else {
        // Success case
        setSelectedParsecHost(null);
      }
    } catch (error) {
      console.error('Error in handleAssignParsec:', error);
      // Only real errors (not 422) will reach here now
    }
  };

  const handleDeleteAssignment = (assignment) => {
    setDeleteDialog({ open: true, assignment });
  };

  const confirmDelete = async () => {
    if (deleteDialog.assignment) {
      await deleteAssignment(
        deleteDialog.assignment.email,
        deleteDialog.assignment.machine_name
      );
    }
  };


  const isLoading = usersQuery.isLoading || machinesQuery.isLoading || assignmentsQuery.isLoading || parsecMachinesQuery.isLoading;
  const hasError = usersQuery.error || machinesQuery.error || assignmentsQuery.error || parsecMachinesQuery.error;

  // Debug logging
  console.log('AssignWorkstations loading states:', {
    usersQuery: { isLoading: usersQuery.isLoading, error: usersQuery.error, data: !!usersQuery.data },
    machinesQuery: { isLoading: machinesQuery.isLoading, error: machinesQuery.error, data: !!machinesQuery.data },
    assignmentsQuery: { isLoading: assignmentsQuery.isLoading, error: assignmentsQuery.error, data: !!assignmentsQuery.data },
    parsecMachinesQuery: { isLoading: parsecMachinesQuery.isLoading, error: parsecMachinesQuery.error, data: !!parsecMachinesQuery.data },
    isLoading,
    hasError
  });

  // Additional debug logging for machines data structure
  if (machinesQuery.data) {
    console.log('Machines data structure:', {
      isArray: Array.isArray(machinesQuery.data),
      length: machinesQuery.data?.length,
      firstItem: machinesQuery.data[0],
      dataType: typeof machinesQuery.data
    });
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2">Loading Assignments from Database, LDAP Users and Hosts, and Parsec Hosts...</Typography>
          <Typography variant="caption" color="text.secondary">
            Users: {usersQuery.isLoading ? 'Loading...' : 'Done'} |
            Machines: {machinesQuery.isLoading ? 'Loading...' : 'Done'} |
            Assignments: {assignmentsQuery.isLoading ? 'Loading...' : 'Done'} |
            Parsec Hosts: {parsecMachinesQuery.isLoading ? 'Loading...' : 'Done'}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading data:
        </Alert>
        {usersQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Users Error: {usersQuery.error.message}
          </Alert>
        )}
        {machinesQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Machines Error: {machinesQuery.error.message}
          </Alert>
        )}
        {assignmentsQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Assignments Error: {assignmentsQuery.error.message}
          </Alert>
        )}
        {parsecMachinesQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Parsec Hosts Error: {parsecMachinesQuery.error.message}
          </Alert>
        )}
      </Box>
    );
  }

  // Final debug check before render
  console.log('Final render check:', {
    usersList: usersList.length,
    machinesList: machinesList.length,
    assignmentsList: assignmentsList.length,
    parsecMachinesList: parsecMachinesList.length,
    availableMachines: availableMachines.length
  });

  // Add error boundary check
  try {
    console.log('About to render component...');

  return (
    <Box sx={{
      p: 4,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
    }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            letterSpacing: '-1px'
          }}
        >
          {name}
        </Typography>
        <Typography variant="body1" sx={{ color: '#718096', fontWeight: 500 }}>
          Manage workstation assignments and Parsec hosts efficiently
        </Typography>
      </Box>

      {/* Compact stats bar */}
      <Box sx={{
        mb: 3,
        p: 2,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#667eea', fontWeight: 700 }}>
            {usersList.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096' }}>
            Users
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#43a047', fontWeight: 700 }}>
            {machinesList.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096' }}>
            Machines
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#f093fb', fontWeight: 700 }}>
            {parsecMachinesList.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096' }}>
            Parsec Hosts
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#f5576c', fontWeight: 700 }}>
            {assignmentsList.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096' }}>
            Assignments
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Assignment Form */}
        <Grid size={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              overflow: 'visible',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px 12px 0 0'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <AssignmentIndIcon sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, letterSpacing: '-0.5px' }}>
                    Create New Assignment
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5 }}>
                    Assign users to workstations and Parsec hosts
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid size={3}>
                  <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <PersonIcon sx={{ color: '#667eea', fontSize: 24 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea' }}>
                        Select User
                      </Typography>
                    </Box>
                    <Autocomplete
                      value={selectedUser}
                      onChange={(_, newValue) => setSelectedUser(newValue)}
                      options={usersList}
                      getOptionLabel={(option) => option.label}
                      slotProps={{
                        paper: {
                          sx: {
                            backgroundColor: 'white',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            borderRadius: 2,
                            mt: 1,
                            '& .MuiAutocomplete-listbox': {
                              backgroundColor: 'white',
                              '& .MuiAutocomplete-option': {
                                borderRadius: 1,
                                mx: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(102, 126, 234, 0.08)'
                                }
                              }
                            }
                          }
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search users..."
                          variant="outlined"
                          fullWidth
                          size="small"
                          helperText={`${usersList.length} users available`}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: selectedUser ? (
                              <>
                                <Avatar
                                  src={selectedUser.profilePicture}
                                  alt={selectedUser.displayName || selectedUser.email}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    ml: 0.5,
                                    mr: 1,
                                    border: '2px solid #667eea',
                                    bgcolor: selectedUser.profilePicture ? 'transparent' : '#667eea',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {!selectedUser.profilePicture && (selectedUser.firstName?.[0] || selectedUser.email[0]).toUpperCase()}
                                </Avatar>
                                {params.InputProps.startAdornment}
                              </>
                            ) : params.InputProps.startAdornment
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(102, 126, 234, 0.2)'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(102, 126, 234, 0.4)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea'
                              }
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ backgroundColor: 'transparent !important' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                            <Avatar
                              src={option.profilePicture}
                              alt={option.displayName || option.email}
                              sx={{
                                width: 40,
                                height: 40,
                                border: '2px solid #667eea',
                                bgcolor: option.profilePicture ? 'transparent' : '#667eea'
                              }}
                            >
                              {!option.profilePicture && (option.firstName?.[0] || option.email[0]).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 500 }}>{option.email}</Typography>
                              {option.displayName && (
                                <Typography variant="caption" color="text.secondary">
                                  {option.displayName}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                  </Box>
                </Grid>

                <Grid size={3}>
                  <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <StorageIcon sx={{ color: '#f093fb', fontSize: 24 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f093fb' }}>
                        Parsec Host
                      </Typography>
                    </Box>
                    <Autocomplete
                      value={selectedParsecHost}
                      onChange={(_, newValue) => {
                        console.log('Parsec host selected:', newValue);
                        setSelectedParsecHost(newValue);
                      }}
                      options={parsecMachinesList}
                      getOptionLabel={(option) => option.label || option.host || 'Unknown'}
                      slotProps={{
                        paper: {
                          sx: {
                            backgroundColor: 'white',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            borderRadius: 2,
                            mt: 1,
                            '& .MuiAutocomplete-listbox': {
                              backgroundColor: 'white',
                              '& .MuiAutocomplete-option': {
                                borderRadius: 1,
                                mx: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(240, 147, 251, 0.08)'
                                }
                              }
                            }
                          }
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search Parsec hosts..."
                          variant="outlined"
                          fullWidth
                          size="small"
                          helperText={parsecMachinesQuery.isLoading ? 'Loading...' : parsecMachinesQuery.error ? `Error: ${parsecMachinesQuery.error.message}` : `${parsecMachinesList.length} hosts available`}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(240, 147, 251, 0.2)'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(240, 147, 251, 0.4)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#f093fb'
                              }
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ backgroundColor: 'transparent !important' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>{option.host}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={option.online ? 'Online' : 'Offline'}
                                size="small"
                                color={option.online ? 'success' : 'default'}
                                variant="outlined"
                                sx={{ height: '18px' }}
                              />
                              {option.name !== option.host && (
                                <Typography variant="caption" color="text.secondary">
                                  {option.name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                      noOptionsText="No Parsec hosts available"
                    />
                  </Box>
                </Grid>

                <Grid size={3}>
                  <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    opacity: !selectedUser ? 0.6 : 1,
                    '&:hover': !selectedUser ? {} : {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <ComputerIcon sx={{ color: '#43a047', fontSize: 24 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#43a047' }}>
                        Workstation
                      </Typography>
                    </Box>
                    <Autocomplete
                      value={selectedMachine}
                      onChange={(_, newValue) => {
                        console.log('Machine selected:', newValue);
                        setSelectedMachine(newValue);
                      }}
                      options={availableMachines}
                      getOptionLabel={(option) => option.label || option.name || 'Unknown'}
                      disabled={!selectedUser}
                      slotProps={{
                        paper: {
                          sx: {
                            backgroundColor: 'white',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            borderRadius: 2,
                            mt: 1,
                            '& .MuiAutocomplete-listbox': {
                              backgroundColor: 'white',
                              '& .MuiAutocomplete-option': {
                                borderRadius: 1,
                                mx: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(67, 160, 71, 0.08)'
                                }
                              }
                            }
                          }
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search workstations..."
                          variant="outlined"
                          fullWidth
                          size="small"
                          helperText={!selectedUser ? "Select a user first" : `${availableMachines.length} machines available`}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(67, 160, 71, 0.2)'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(67, 160, 71, 0.4)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#43a047'
                              }
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ backgroundColor: 'transparent !important' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>{option.name}</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                OS: {option.operatingSystem}
                                {option.osSource && option.osSource !== 'Unknown' && (
                                  <Chip
                                    size="small"
                                    label={option.osSource}
                                    variant="outlined"
                                    color={option.osSource === 'Salt' ? 'primary' : 'default'}
                                    sx={{ ml: 0.5, height: '14px', fontSize: '0.5rem' }}
                                  />
                                )}
                                {option.salt.osArch !== 'N/A' && ` (${option.salt.osArch})`}
                              </Typography>
                              {option.dnInfo && (
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {option.dnInfo.location !== 'Unknown' && (
                                    <Chip
                                      size="small"
                                      label={`📍 ${option.dnInfo.location}`}
                                      variant="outlined"
                                      sx={{ height: '16px', fontSize: '0.5rem' }}
                                    />
                                  )}
                                  {option.dnInfo.type !== 'Unknown' && (
                                    <Chip
                                      size="small"
                                      label={option.dnInfo.type}
                                      variant="outlined"
                                      color={
                                        option.dnInfo.type === 'SERVER' ? 'error' :
                                        option.dnInfo.type === 'WORKSTATION' ? 'success' :
                                        option.dnInfo.type === 'MAC' ? 'secondary' :
                                        option.dnInfo.type === 'LINUX' ? 'warning' :
                                        option.dnInfo.type === 'LAPTOP' ? 'info' :
                                        'info'
                                      }
                                      sx={{ height: '16px', fontSize: '0.5rem' }}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                      noOptionsText={selectedUser ? "No workstations available" : "Select a user first"}
                    />
                  </Box>
                </Grid>

                <Grid size={3}>
                  <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2
                  }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleAssignWorkstation}
                      disabled={!selectedUser || !selectedMachine}
                      startIcon={<AddIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          background: 'rgba(0, 0, 0, 0.12)',
                          color: 'rgba(0, 0, 0, 0.26)'
                        }
                      }}
                    >
                      Assign Database
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleAssignParsec}
                      disabled={!selectedUser || !selectedParsecHost}
                      startIcon={<AddIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                          boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          background: 'rgba(0, 0, 0, 0.12)',
                          color: 'rgba(0, 0, 0, 0.26)'
                        }
                      }}
                    >
                      Assign Parsec
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

              <Alert
                severity="info"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '& .MuiAlert-icon': {
                    color: 'white'
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Database assignments are for production tracking. Parsec assignments are for the Parsec remote access system.
                </Typography>
              </Alert>

              {selectedUser && userAssignments.length > 0 && (
                <Fade in={true}>
                  <Box sx={{
                    mt: 3,
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      {selectedUser.profilePicture ? (
                        <Avatar
                          src={selectedUser.profilePicture}
                          alt={selectedUser.displayName || selectedUser.email}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '3px solid white',
                          }}
                        />
                      ) : (
                        <CheckCircleIcon sx={{ color: 'white', fontSize: 40 }} />
                      )}
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                          Current Assignments
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          {selectedUser.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {userAssignments.map((assignment, index) => (
                        <Chip
                          key={index}
                          label={assignment.machine_name}
                          onDelete={() => handleDeleteAssignment(assignment)}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.95)',
                            color: '#667eea',
                            fontWeight: 600,
                            '& .MuiChip-deleteIcon': {
                              color: '#f5576c',
                              '&:hover': {
                                color: '#d32f2f'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Assignments List */}
        <Grid size={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 3,
              overflow: 'visible',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px 12px 0 0'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2d3748', letterSpacing: '-0.5px' }}>
                    All Assignments
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
                    Complete overview of workstation assignments
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => assignmentsQuery.refetch()}
                    disabled={assignmentsQuery.isRefetching}
                    sx={{
                      background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
                      color: 'white',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                        boxShadow: '0 6px 16px rgba(67, 160, 71, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)'
                      }
                    }}
                  >
                    {assignmentsQuery.isRefetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Chip
                    label={`${assignmentsList.length} Total`}
                    sx={{
                      bgcolor: '#667eea',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 2,
                      py: 2.5
                    }}
                  />
                </Box>
              </Box>

              {/* Search and View Toggle Controls */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search by email or machine..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.4)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea'
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    )
                  }}
                />
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '& .MuiToggleButton-root': {
                      color: '#667eea',
                      borderColor: 'rgba(102, 126, 234, 0.2)',
                      '&.Mui-selected': {
                        bgcolor: '#667eea',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#764ba2'
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="card" aria-label="card view">
                    <ViewListIcon sx={{ mr: 1 }} />
                    Card
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="table view">
                    <TableViewIcon sx={{ mr: 1 }} />
                    Table
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {filteredAndSortedAssignments.length === 0 ? (
                <Box
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 2,
                    border: '2px dashed rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <ComputerIcon sx={{ fontSize: 64, color: 'rgba(102, 126, 234, 0.3)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#718096', fontWeight: 500 }}>
                    {searchFilter ? 'No matching assignments found' : 'No assignments found'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
                    {searchFilter ? 'Try a different search term' : 'Create your first assignment above'}
                  </Typography>
                </Box>
              ) : viewMode === 'table' ? (
                /* Table View */
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: '500px',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                    '&::-webkit-scrollbar': {
                      width: '10px',
                      height: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#667eea',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#764ba2',
                    },
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600 }}>
                          User
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600 }}>
                          <TableSortLabel
                            active={orderBy === 'email'}
                            direction={orderBy === 'email' ? order : 'asc'}
                            onClick={() => handleRequestSort('email')}
                            sx={{
                              color: 'white !important',
                              '& .MuiTableSortLabel-icon': {
                                color: 'white !important'
                              }
                            }}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600 }}>
                          <TableSortLabel
                            active={orderBy === 'machine'}
                            direction={orderBy === 'machine' ? order : 'asc'}
                            onClick={() => handleRequestSort('machine')}
                            sx={{
                              color: 'white !important',
                              '& .MuiTableSortLabel-icon': {
                                color: 'white !important'
                              }
                            }}
                          >
                            Machine
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600 }}>
                          Machine Details
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600 }}>
                          <TableSortLabel
                            active={orderBy === 'date'}
                            direction={orderBy === 'date' ? order : 'asc'}
                            onClick={() => handleRequestSort('date')}
                            sx={{
                              color: 'white !important',
                              '& .MuiTableSortLabel-icon': {
                                color: 'white !important'
                              }
                            }}
                          >
                            Assigned Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 600, textAlign: 'center' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAndSortedAssignments.map((assignment, index) => {
                        const user = usersList.find(u => u.email.toLowerCase() === assignment.email.toLowerCase());
                        const machineInfo = machinesList.find(m => m.name === assignment.machine_name);

                        return (
                          <TableRow
                            key={index}
                            sx={{
                              '&:hover': {
                                bgcolor: 'rgba(102, 126, 234, 0.08)'
                              },
                              bgcolor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.02)'
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {user ? (
                                  <Avatar
                                    src={user.profilePicture}
                                    alt={user.displayName || user.email}
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      border: '2px solid #667eea',
                                      bgcolor: user.profilePicture ? 'transparent' : '#667eea'
                                    }}
                                  >
                                    {!user.profilePicture && (user.firstName?.[0] || user.email[0]).toUpperCase()}
                                  </Avatar>
                                ) : (
                                  <PersonIcon sx={{ color: '#667eea', fontSize: 36 }} />
                                )}
                                {user?.displayName && (
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {user.displayName}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {assignment.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.machine_name}
                                sx={{
                                  bgcolor: '#667eea',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {machineInfo ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#718096' }}>
                                      {machineInfo.operatingSystem}
                                    </Typography>
                                    {machineInfo.dnInfo && machineInfo.dnInfo.location !== 'Unknown' && (
                                      <Chip
                                        size="small"
                                        label={`📍 ${machineInfo.dnInfo.location}`}
                                        sx={{
                                          bgcolor: 'rgba(67, 160, 71, 0.1)',
                                          color: '#43a047',
                                          fontWeight: 600,
                                          height: '20px',
                                          fontSize: '0.65rem'
                                        }}
                                      />
                                    )}
                                    {machineInfo.dnInfo && machineInfo.dnInfo.type !== 'Unknown' && (
                                      <Chip
                                        size="small"
                                        label={machineInfo.dnInfo.type}
                                        color={
                                          machineInfo.dnInfo.type === 'SERVER' ? 'error' :
                                          machineInfo.dnInfo.type === 'WORKSTATION' ? 'success' :
                                          machineInfo.dnInfo.type === 'MAC' ? 'secondary' :
                                          machineInfo.dnInfo.type === 'LINUX' ? 'warning' :
                                          machineInfo.dnInfo.type === 'LAPTOP' ? 'info' :
                                          'default'
                                        }
                                        sx={{
                                          height: '20px',
                                          fontSize: '0.65rem',
                                          fontWeight: 600
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {/* GPU Info */}
                                  {(() => {
                                    const saltData = saltDataByMachine[assignment.machine_name.toLowerCase()];
                                    if (saltData && Array.isArray(saltData.nvidia) && saltData.nvidia.length > 0) {
                                      const gpuText = saltData.nvidia.map(gpu => {
                                        if (typeof gpu === 'string') return gpu;
                                        if (typeof gpu === 'object' && gpu !== null) {
                                          return gpu.type || gpu.Type || '';
                                        }
                                        return '';
                                      }).filter(text => text && text !== 'null' && text !== 'undefined').join(', ');

                                      if (gpuText) {
                                        return (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#718096', fontWeight: 500 }}>
                                              GPU:
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f093fb' }}>
                                              {gpuText}
                                            </Typography>
                                          </Box>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.assigned_at ? (
                                <Typography variant="body2" sx={{ color: '#718096' }}>
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAssignment(assignment)}
                                sx={{
                                  bgcolor: 'rgba(245, 87, 108, 0.1)',
                                  color: '#f5576c',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: '#f5576c',
                                    color: 'white',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Card View - Dense Multi-Column Grid */
                <Box
                  sx={{
                    maxHeight: '500px',
                    overflow: 'auto',
                    bgcolor: 'transparent',
                    '&::-webkit-scrollbar': {
                      width: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#667eea',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#764ba2',
                    },
                  }}
                >
                  <Grid container spacing={2}>
                    {filteredAndSortedAssignments.map((assignment, index) => {
                      const user = usersList.find(u => u.email.toLowerCase() === assignment.email.toLowerCase());
                      const machineInfo = machinesList.find(m => m.name === assignment.machine_name);

                      // Get salt data for GPU/CPU info
                      const lookupKey = assignment.machine_name.toLowerCase();
                      const saltData = saltDataByMachine[lookupKey];

                      // Debug first 3 assignments - log before processing
                      if (index < 3) {
                        console.log(`Assignment card ${index}:`, {
                          machineName: assignment.machine_name,
                          lookupKey: lookupKey,
                          hasSaltData: !!saltData,
                          allLookupKeys: Object.keys(saltDataByMachine).slice(0, 10),
                          saltDataFields: saltData ? Object.keys(saltData).filter(k => k.includes('nvidia') || k.includes('gpu') || k.includes('cpu')).slice(0, 20) : []
                        });
                      }

                      // Parse GPU info from the 'nvidia' grain - matching CompositeMachineInfo style
                      let gpuInfo = 'N/A';
                      if (saltData && Array.isArray(saltData.nvidia) && saltData.nvidia.length > 0) {
                        const gpuText = saltData.nvidia.map(gpu => {
                          if (typeof gpu === 'string') return gpu;
                          if (typeof gpu === 'object' && gpu !== null) {
                            return gpu.type || gpu.Type || '';
                          }
                          return '';
                        }).filter(text => text && text !== 'null' && text !== 'undefined').join(', ');

                        if (gpuText) {
                          gpuInfo = gpuText;
                        }
                      }

                      const cpuInfo = saltData?.num_cpus || 'N/A';

                      // Debug after processing
                      if (index < 3) {
                        console.log(`Assignment card ${index} parsed:`, {
                          rawNvidia: saltData?.nvidia,
                          gpuInfo,
                          cpuInfo
                        });
                      }

                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                          <Card
                            sx={{
                              height: '100%',
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              '&:hover': {
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                                transform: 'translateY(-4px)',
                                bgcolor: 'rgba(255, 255, 255, 1)'
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: index % 4 === 0 ? '#667eea' :
                                           index % 4 === 1 ? '#f093fb' :
                                           index % 4 === 2 ? '#43a047' :
                                           '#f5576c'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                              {/* User Section */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                {user ? (
                                  <Avatar
                                    src={user.profilePicture}
                                    alt={user.displayName || user.email}
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      border: '2px solid #667eea',
                                      bgcolor: user.profilePicture ? 'transparent' : '#667eea',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {!user.profilePicture && (user.firstName?.[0] || user.email[0]).toUpperCase()}
                                  </Avatar>
                                ) : (
                                  <PersonIcon sx={{ color: '#667eea', fontSize: 32 }} />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  {user?.displayName && (
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#2d3748', display: 'block', lineHeight: 1.2 }}>
                                      {user.displayName}
                                    </Typography>
                                  )}
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#718096',
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {assignment.email}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Machine Section */}
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <ComputerIcon sx={{ color: '#43a047', fontSize: 16 }} />
                                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
                                    Machine
                                  </Typography>
                                </Box>
                                <Chip
                                  label={assignment.machine_name}
                                  size="small"
                                  sx={{
                                    bgcolor: '#667eea',
                                    color: 'white',
                                    fontWeight: 600,
                                    height: '24px',
                                    fontSize: '0.7rem',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    mb: 0.5
                                  }}
                                />

                                {/* Parsec Username - Prominently displayed */}
                                {(() => {
                                  const parsecData = parsecDataByMachine[assignment.machine_name.toLowerCase()];
                                  const parsecUsername = parsecData?.name;

                                  if (parsecUsername && parsecUsername !== 'N/A') {
                                    return (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#718096', fontWeight: 500 }}>
                                          Parsec User:
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#667eea' }}>
                                          {parsecUsername}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* GPU and CPU Info - Prominently displayed */}
                                {saltData && (
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                    {cpuInfo !== 'N/A' && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#718096', fontWeight: 500 }}>
                                          CPU:
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#667eea' }}>
                                          {cpuInfo}
                                        </Typography>
                                      </Box>
                                    )}
                                    {gpuInfo !== 'N/A' && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#718096', fontWeight: 500 }}>
                                          GPU:
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f093fb' }}>
                                          {gpuInfo}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                              </Box>

                              {/* Machine Details */}
                              {machineInfo && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
                                    DETAILS
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: '#2d3748', fontSize: '0.65rem', lineHeight: 1.3 }}>
                                      OS: {machineInfo.operatingSystem.length > 25
                                        ? machineInfo.operatingSystem.substring(0, 25) + '...'
                                        : machineInfo.operatingSystem}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                      {machineInfo.dnInfo && machineInfo.dnInfo.location !== 'Unknown' && (
                                        <Chip
                                          size="small"
                                          label={machineInfo.dnInfo.location}
                                          icon={<Typography sx={{ fontSize: '0.65rem' }}>📍</Typography>}
                                          sx={{
                                            bgcolor: 'rgba(67, 160, 71, 0.1)',
                                            color: '#43a047',
                                            fontWeight: 600,
                                            height: '18px',
                                            fontSize: '0.6rem',
                                            '& .MuiChip-icon': {
                                              margin: 0,
                                              marginRight: '2px'
                                            }
                                          }}
                                        />
                                      )}
                                      {machineInfo.dnInfo && machineInfo.dnInfo.type !== 'Unknown' && (
                                        <Chip
                                          size="small"
                                          label={machineInfo.dnInfo.type}
                                          color={
                                            machineInfo.dnInfo.type === 'SERVER' ? 'error' :
                                            machineInfo.dnInfo.type === 'WORKSTATION' ? 'success' :
                                            machineInfo.dnInfo.type === 'MAC' ? 'secondary' :
                                            machineInfo.dnInfo.type === 'LINUX' ? 'warning' :
                                            machineInfo.dnInfo.type === 'LAPTOP' ? 'info' :
                                            'default'
                                          }
                                          sx={{
                                            height: '18px',
                                            fontSize: '0.6rem',
                                            fontWeight: 600
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              )}

                              {/* Date and Action Row */}
                              <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                pt: 1,
                                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                              }}>
                                {assignment.assigned_at ? (
                                  <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.65rem' }}>
                                    {new Date(assignment.assigned_at).toLocaleDateString()}
                                  </Typography>
                                ) : (
                                  <Box />
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAssignment(assignment)}
                                  sx={{
                                    bgcolor: 'rgba(245, 87, 108, 0.1)',
                                    color: '#f5576c',
                                    width: 28,
                                    height: 28,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      bgcolor: '#f5576c',
                                      color: 'white',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Machine Info Panel Toggle Button */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Machine Information</Typography>
                <Button
                  variant={showMachineInfo ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setShowMachineInfo(!showMachineInfo)}
                  sx={{ minWidth: '200px' }}
                >
                  {showMachineInfo ? 'Hide Machine Info' : 'Show Machine Info'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Composite Machine Information Panel - Only show when toggled */}
        {showMachineInfo && (
          <Grid size={12}>
            <Box sx={{ p: 2, border: '2px solid #1976d2', borderRadius: 1, bgcolor: '#f8f9fa' }}>
              {/* CompositeMachineInfo Component - Pass pre-fetched data as props */}
              <CompositeMachineInfo
                showOnlyAllSources={true}
                dense={true}
                parsecInfoData={queries.parsecReport.data}
                jamfComputersData={queries.jamfMachineInfo.data}
                machineInfoFromLDAPData={queries.ldapMachineInfo.data}
                saltMachineInfoData={queries.saltMachineInfo.data}
                saltPingInfoData={queries.saltPingInfo.data}
                isLoading={queries.parsecReport.isLoading || queries.jamfMachineInfo.isLoading || queries.ldapMachineInfo.isLoading || queries.saltMachineInfo.isLoading || queries.saltPingInfo.isLoading}
                hasError={queries.parsecReport.error || queries.jamfMachineInfo.error || queries.ldapMachineInfo.error || queries.saltMachineInfo.error || queries.saltPingInfo.error}
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, assignment: null })}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the assignment of{' '}
            <strong>{deleteDialog.assignment?.machine_name}</strong> from{' '}
            <strong>{deleteDialog.assignment?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, assignment: null })}
            disabled={false}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={false}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  } catch (error) {
    console.error('Error rendering AssignWorkstations:', error);
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h3" color="error">Rendering Error</Typography>
        <Typography variant="body2">
          Error: {error.message}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Check console for details
        </Typography>
      </Box>
    );
  }
}