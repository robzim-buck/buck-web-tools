import {
  Typography, Paper, Grid, Box, Button, TextField, Autocomplete,
  CircularProgress, Alert, Snackbar, Chip, Card, CardContent,
  List, ListItem, ListItemText, IconButton, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProtectedApiGet } from '../hooks/useApi';
import CompositeMachineInfo from './CompositeMachineInfo';

export default function AssignWorkstations({ name = "Assign Workstations" }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedParsecHost, setSelectedParsecHost] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, assignment: null });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Machine list filtering and sorting state
  const [machineNameFilter, setMachineNameFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showParsecHostsOnly, setShowParsecHostsOnly] = useState(false);

  // Fetch users from Okta (ACTIVE users for assignments)
  const usersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { 
      _category: 'users', 
      _att: 'status', 
      _comparison: 'eq', 
      _match: 'ACTIVE' 
    },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Fetch machines from /buckldap_machineinfo
  const machinesQuery = useProtectedApiGet('/buckldap_raw_machineinfo', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Fetch current assignments
  const assignmentsQuery = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      console.log('Fetching assignments...');
      try {
        const response = await fetch('https://laxcoresrv.buck.local:8000/assignments/Assignments', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });

        console.log('Assignments API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Assignments API response data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Fetch Parsec machines data - trying both protected and unprotected
  const parsecMachinesQuery = useQuery({
    queryKey: ['parsecMachines'],
    queryFn: async () => {
      console.log('Fetching Parsec machines from API...');
      try {
        // Try protected endpoint first
        const response = await fetch('https://laxcoresrv.buck.local:8000/parsec/parsecinfo/category?_category=machines', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });

        console.log('Parsec API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Parsec API response data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching Parsec machines:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Fetch Salt machine info data
  const saltMachineInfoQuery = useQuery({
    queryKey: ['saltMachineInfo'],
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Fetch Salt ping info
  const saltPingInfoQuery = useQuery({
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
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Fetch JAMF computers data
  const jamfComputersQuery = useQuery({
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Fetch Parsec report data (comprehensive version for CompositeMachineInfo)
  const parsecReportQuery = useQuery({
    queryKey: ['parsecreport'],
    queryFn: async () => {
      try {
        const res = await fetch("https://laxcoresrv.buck.local:8000/parsec/parsecreport", {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) {
          // Handle 422 specifically as a non-critical error
          if (res.status === 422) {
            console.warn('Parsec report endpoint returned 422 - returning empty data');
            return null; // Return null instead of throwing
          }
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching Parsec report:", error);
        // For 422 or network errors, return null instead of throwing
        if (error.message && error.message.includes('422') || error.name === 'TypeError') {
          console.warn('Parsec report failed, continuing without data');
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry 422 errors
      if (error.message && error.message.includes('422')) {
        return false;
      }
      return failureCount < 2;
    }
  });


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
        .map(user => ({
          email: user.profile.email,
          label: `${user.profile.email}${user.profile.displayName ? ` (${user.profile.displayName})` : ''}`,
          displayName: user.profile.displayName,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          status: user.status || 'ACTIVE'
        }));
      console.log('Processed users:', processed);
      console.log('User statuses:', processed.map(u => u.status).slice(0, 10));
      return processed;
    }
    
    console.log('Users data is not an array:', typeof usersQuery.data);
    return [];
  }, [usersQuery.data]);

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

        // Find matching Salt data
        const saltMachineData = saltMachineInfoQuery.data ?
          Object.values(saltMachineInfoQuery.data).find(saltData =>
            saltData.localhost && saltData.localhost.toLowerCase() === machineName.toLowerCase()
          ) : null;

        // Find matching Parsec host data - use raw query data to avoid circular dependency
        const parsecData = parsecMachinesQuery.data;
        const parsecHostData = parsecData && Array.isArray(parsecData) ?
          parsecData.find(parsecHost =>
            parsecHost && (parsecHost.host || parsecHost.hostname || parsecHost.host_name || parsecHost.name) &&
            (parsecHost.host || parsecHost.hostname || parsecHost.host_name || parsecHost.name).toLowerCase() === machineName.toLowerCase()
          ) : null;

        // Prioritize Salt OS information over AD OS information
        const saltOSInfo = saltMachineData?.osfullname || saltMachineData?.os;

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
            saltMachineData,
            saltOSInfo,
            adOSInfo,
            finalOS: saltOSInfo || adOSInfo || 'N/A',
            osSource: saltOSInfo ? 'Salt' : (adOSInfo ? 'AD' : 'Unknown'),
            dnInfo: dnInfo,
            parsedOUs: dnInfo.rawOUs,
            extractedLocation: dnInfo.location,
            extractedType: dnInfo.type
          });
        }

        return {
          name: machineName,
          label: machineName,
          operatingSystem: saltOSInfo || adOSInfo || 'N/A',
          operatingSystemVersion: getFieldValue(machine.operatingSystemVersion) || getFieldValue(machine.osVersion) || 'N/A',
          distinguishedName: machine.distinguishedName || machine.dn || 'N/A',
          // Add Salt data - use safe string extraction
          salt: {
            osVersion: getSafeStringValue(saltMachineData?.osfullname || saltMachineData?.os),
            osArch: getSafeStringValue(saltMachineData?.osarch),
            cpuModel: getSafeStringValue(saltMachineData?.cpu_model),
            totalMemory: getSafeStringValue(saltMachineData?.mem_total),
            uptime: getSafeStringValue(saltMachineData?.uptime),
            numCpus: getSafeStringValue(saltMachineData?.num_cpus),
            gpus: getSafeStringValue(saltMachineData?.gpus)
          },
          // Add Parsec data
          parsec: {
            isHost: !!parsecHostData,
            hostId: parsecHostData?.host_id || parsecHostData?.hostId || parsecHostData?.id || parsecHostData?._id || null,
            online: parsecHostData?.machine_online || parsecHostData?.online || parsecHostData?.status === 'online' || false,
            lastConnected: parsecHostData?.last_connected || parsecHostData?.lastConnected || null,
            guests: parsecHostData?.guests || parsecHostData?.guest_count || 0
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
          osSource: saltOSInfo ? 'Salt' : (adOSInfo ? 'AD' : 'Unknown')
        };
      });

    console.log('Processed machines:', processed);
    return processed;
  }, [machinesQuery.data, saltMachineInfoQuery.data, parsecMachinesQuery.data]);

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

  // Process assignments data
  const assignmentsList = useMemo(() => {
    if (!assignmentsQuery.data) return [];
    
    if (Array.isArray(assignmentsQuery.data)) {
      return assignmentsQuery.data;
    }
    
    return [];
  }, [assignmentsQuery.data]);


  // Filter assignments for selected user
  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return assignmentsList.filter(assignment => 
      assignment.email === selectedUser.email
    );
  }, [assignmentsList, selectedUser]);

  // Filter and sort machines for the Machine Information section
  const filteredAndSortedMachines = useMemo(() => {
    // Ensure we have a valid array to work with
    if (!Array.isArray(machinesList)) {
      console.warn('machinesList is not an array:', machinesList);
      return [];
    }

    let filtered = machinesList;

    // Apply active filter if enabled
    if (showActiveOnly) {
      filtered = filtered.filter(machine =>
        machine && machine.distinguishedName && machine.distinguishedName !== 'N/A'
      );
    }

    // Apply Parsec hosts filter if enabled
    if (showParsecHostsOnly) {
      filtered = filtered.filter(machine =>
        machine && machine.parsec && machine.parsec.isHost
      );
    }

    // Apply name filter if set
    if (machineNameFilter && machineNameFilter.trim()) {
      filtered = filtered.filter(machine =>
        machine && machine.name && machine.name.toLowerCase().includes(machineNameFilter.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const nameA = (a && a.name) || '';
      const nameB = (b && b.name) || '';
      const comparison = nameA.localeCompare(nameB);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [machinesList, machineNameFilter, sortOrder, showActiveOnly, showParsecHostsOnly]);

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


  const isLoading = usersQuery.isLoading || machinesQuery.isLoading || assignmentsQuery.isLoading || parsecMachinesQuery.isLoading || saltMachineInfoQuery.isLoading || saltPingInfoQuery.isLoading || jamfComputersQuery.isLoading || parsecReportQuery.isLoading;
  const hasError = usersQuery.error || machinesQuery.error || assignmentsQuery.error || parsecMachinesQuery.error || saltMachineInfoQuery.error || saltPingInfoQuery.error || jamfComputersQuery.error || (parsecReportQuery.error && !(parsecReportQuery.error.message && parsecReportQuery.error.message.includes('422')));

  // Debug logging
  console.log('AssignWorkstations loading states:', {
    usersQuery: { isLoading: usersQuery.isLoading, error: usersQuery.error, data: !!usersQuery.data },
    machinesQuery: { isLoading: machinesQuery.isLoading, error: machinesQuery.error, data: !!machinesQuery.data },
    assignmentsQuery: { isLoading: assignmentsQuery.isLoading, error: assignmentsQuery.error, data: !!assignmentsQuery.data },
    parsecMachinesQuery: { isLoading: parsecMachinesQuery.isLoading, error: parsecMachinesQuery.error, data: !!parsecMachinesQuery.data },
    saltMachineInfoQuery: { isLoading: saltMachineInfoQuery.isLoading, error: saltMachineInfoQuery.error, data: !!saltMachineInfoQuery.data },
    saltPingInfoQuery: { isLoading: saltPingInfoQuery.isLoading, error: saltPingInfoQuery.error, data: !!saltPingInfoQuery.data },
    jamfComputersQuery: { isLoading: jamfComputersQuery.isLoading, error: jamfComputersQuery.error, data: !!jamfComputersQuery.data },
    parsecReportQuery: { isLoading: parsecReportQuery.isLoading, error: parsecReportQuery.error, data: !!parsecReportQuery.data },
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
          <Typography variant="body2">Loading data...</Typography>
          <Typography variant="caption" color="text.secondary">
            Users: {usersQuery.isLoading ? 'Loading...' : 'Done'} |
            Machines: {machinesQuery.isLoading ? 'Loading...' : 'Done'} |
            Assignments: {assignmentsQuery.isLoading ? 'Loading...' : 'Done'} |
            Parsec: {parsecMachinesQuery.isLoading ? 'Loading...' : 'Done'} |
            Salt: {saltMachineInfoQuery.isLoading ? 'Loading...' : 'Done'} |
            SaltPing: {saltPingInfoQuery.isLoading ? 'Loading...' : 'Done'} |
            JAMF: {jamfComputersQuery.isLoading ? 'Loading...' : 'Done'} |
            ParsecReport: {parsecReportQuery.isLoading ? 'Loading...' : 'Done'}
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
            Parsec Error: {parsecMachinesQuery.error.message}
          </Alert>
        )}
        {saltMachineInfoQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Salt Machine Info Error: {saltMachineInfoQuery.error.message}
          </Alert>
        )}
        {saltPingInfoQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Salt Ping Error: {saltPingInfoQuery.error.message}
          </Alert>
        )}
        {jamfComputersQuery.error && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            JAMF Error: {jamfComputersQuery.error.message}
          </Alert>
        )}
        {parsecReportQuery.error && !(parsecReportQuery.error.message && parsecReportQuery.error.message.includes('422')) && (
          <Alert severity="error" sx={{ mb: 1 }} variant="outlined">
            Parsec Report Error: {parsecReportQuery.error.message}
          </Alert>
        )}
        {parsecReportQuery.error && parsecReportQuery.error.message && parsecReportQuery.error.message.includes('422') && (
          <Alert severity="warning" sx={{ mb: 1 }} variant="outlined">
            Parsec Report Unavailable (422) - Continuing without Parsec report data
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
    <Box sx={{ p: 2, minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ mb: 3 }}>{name}</Typography>

      {/* Always show debug info to confirm rendering */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="body2">
          Status: Users: {usersList.length}, Machines: {machinesList.length},
          Assignments: {assignmentsList.length}, Parsec: {parsecMachinesList.length}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Component is rendering successfully!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Assignment Form */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3 }}>Create New Assignment</Typography>
              
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Autocomplete
                    value={selectedUser}
                    onChange={(_, newValue) => setSelectedUser(newValue)}
                    options={usersList}
                    getOptionLabel={(option) => option.label}
                    slotProps={{
                      paper: {
                        sx: {
                          backgroundColor: 'white',
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'white'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select User (${usersList.length} available)`}
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ backgroundColor: 'white' }}>
                        <Box>
                          <Typography>{option.email}</Typography>
                          {option.displayName && (
                            <Typography variant="caption" color="text.secondary">
                              {option.displayName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
                
                <Grid size={3}>
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
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'white'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select Parsec Host (${parsecMachinesList.length} available)`}
                        variant="outlined"
                        fullWidth
                        helperText={parsecMachinesQuery.isLoading ? 'Loading...' : parsecMachinesQuery.error ? `Error: ${parsecMachinesQuery.error.message}` : `${parsecMachinesList.length} Parsec hosts available`}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ backgroundColor: 'white' }}>
                        <Box>
                          <Typography>{option.host}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip 
                              label={option.online ? 'Online' : 'Offline'} 
                              size="small" 
                              color={option.online ? 'success' : 'default'}
                              variant="outlined"
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
                </Grid>
                
                <Grid size={3}>
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
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'white'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select Workstation (${availableMachines.length} available)`}
                        variant="outlined"
                        fullWidth
                        helperText={!selectedUser ? "Select a user first" : `${availableMachines.length} machines available`}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ backgroundColor: 'white' }}>
                        <Box>
                          <Typography>{option.name}</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                            {option.salt.cpuModel !== 'N/A' && option.salt.totalMemory !== 'N/A' && (
                              <Typography variant="caption" color="text.secondary">
                                {option.salt.cpuModel} • {option.salt.totalMemory} MB
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              {option.salt.numCpus !== 'N/A' && (
                                <Typography variant="caption" color="text.secondary">
                                  CPUs: {option.salt.numCpus}
                                </Typography>
                              )}
                              {option.salt.gpus !== 'N/A' && (
                                <Typography variant="caption" color="text.secondary">
                                  GPUs: {option.salt.gpus}
                                </Typography>
                              )}
                            </Box>
                            {/* DN Information in dropdown */}
                            {option.dnInfo && (
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
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
                </Grid>
                
                <Grid size={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="medium"
                      fullWidth
                      onClick={handleAssignWorkstation}
                      disabled={!selectedUser || !selectedMachine}
                      startIcon={<AddIcon />}
                      sx={{ height: '40px' }}
                    >
                      Assign
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="medium"
                      fullWidth
                      onClick={handleAssignParsec}
                      disabled={!selectedUser || !selectedParsecHost}
                      startIcon={<AddIcon />}
                      sx={{ height: '40px' }}
                    >
                      Assign In Parsec
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              {selectedUser && userAssignments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Current Assignments for {selectedUser.email}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userAssignments.map((assignment, index) => (
                      <Chip
                        key={index}
                        label={assignment.machine_name}
                        onDelete={() => handleDeleteAssignment(assignment)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Assignments List */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">All Assignments</Typography>
                <Typography variant="body2" color="text.secondary">
                  {assignmentsList.length} assignments
                </Typography>
              </Box>
              
              {assignmentsList.length === 0 ? (
                <Alert severity="info">No assignments found</Alert>
              ) : (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: '400px', 
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#555',
                    },
                  }}
                >
                  <List dense>
                    {assignmentsList.map((assignment, index) => (
                      <ListItem
                        key={index}
                        divider={index < assignmentsList.length - 1}
                        sx={{
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {assignment.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                              <Chip
                                label={assignment.machine_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: '20px', fontSize: '0.7rem' }}
                              />
                              {assignment.assigned_at && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            (() => {
                              // Find machine info including Salt data
                              const machineInfo = machinesList.find(m => m.name === assignment.machine_name);
                              if (!machineInfo) return null;

                              return (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                    OS: {machineInfo.operatingSystem}
                                    {machineInfo.osSource && machineInfo.osSource !== 'Unknown' && (
                                      <Chip
                                        size="small"
                                        label={machineInfo.osSource}
                                        variant="outlined"
                                        color={machineInfo.osSource === 'Salt' ? 'primary' : 'default'}
                                        sx={{ ml: 0.5, height: '14px', fontSize: '0.5rem' }}
                                      />
                                    )}
                                  </Typography>
                                  {machineInfo.salt.osArch !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                      Arch: {machineInfo.salt.osArch}
                                    </Typography>
                                  )}
                                  {machineInfo.salt.numCpus !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                      CPUs: {machineInfo.salt.numCpus}
                                    </Typography>
                                  )}
                                  {machineInfo.salt.gpus !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                      GPUs: {machineInfo.salt.gpus}
                                    </Typography>
                                  )}
                                  {machineInfo.salt.uptime !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary">
                                      Uptime: {machineInfo.salt.uptime}
                                    </Typography>
                                  )}
                                  {/* DN Information in assignments */}
                                  {machineInfo.dnInfo && (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                                      {machineInfo.dnInfo.location !== 'Unknown' && (
                                        <Chip
                                          size="small"
                                          label={`📍 ${machineInfo.dnInfo.location}`}
                                          variant="outlined"
                                          sx={{ height: '16px', fontSize: '0.55rem' }}
                                        />
                                      )}
                                      {machineInfo.dnInfo.type !== 'Unknown' && (
                                        <Chip
                                          size="small"
                                          label={machineInfo.dnInfo.type}
                                          variant="outlined"
                                          color={
                                            machineInfo.dnInfo.type === 'SERVER' ? 'error' :
                                            machineInfo.dnInfo.type === 'WORKSTATION' ? 'success' :
                                            machineInfo.dnInfo.type === 'MAC' ? 'secondary' :
                                            machineInfo.dnInfo.type === 'LINUX' ? 'warning' :
                                            machineInfo.dnInfo.type === 'LAPTOP' ? 'info' :
                                            'info'
                                          }
                                          sx={{ height: '16px', fontSize: '0.55rem' }}
                                        />
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })()
                          }
                          sx={{ margin: 0, flex: 1 }}
                        />
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteAssignment(assignment)}
                          size="small"
                          sx={{ padding: '4px', flexShrink: 0 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Composite Machine Information Panel */}
        <Grid size={12}>
          <Box sx={{ p: 2, border: '2px solid #1976d2', borderRadius: 1, bgcolor: '#f8f9fa', mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>Machine Information</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedMachines.length)}-{Math.min(currentPage * itemsPerPage, filteredAndSortedMachines.length)} of {filteredAndSortedMachines.length} machines
                </Typography>
                <TextField
                  select
                  size="small"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  slotProps={{ select: { native: true } }}
                  sx={{ minWidth: 100 }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </TextField>
              </Box>
            </Box>

            {/* Filter and Sort Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Filter by machine name"
                value={machineNameFilter}
                onChange={(e) => {
                  setMachineNameFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
                size="small"
                sx={{ minWidth: 250 }}
                placeholder="Type to filter machines..."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showActiveOnly}
                    onChange={(e) => {
                      setShowActiveOnly(e.target.checked);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    size="small"
                  />
                }
                label="Active machines only"
                sx={{ minWidth: 150 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showParsecHostsOnly}
                    onChange={(e) => {
                      setShowParsecHostsOnly(e.target.checked);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    size="small"
                  />
                }
                label="Parsec hosts only"
                sx={{ minWidth: 150 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                sx={{ minWidth: 140 }}
              >
                Sort by Name ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
              </Button>
              {(machineNameFilter || showActiveOnly || showParsecHostsOnly) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setMachineNameFilter('');
                    setShowActiveOnly(false);
                    setShowParsecHostsOnly(false);
                    setCurrentPage(1);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Box>

            {/* Temporarily comment out CompositeMachineInfo to test basic rendering */}
            {false && (
              <CompositeMachineInfo
                showOnlyAllSources={true}
                dense={true}
                parsecInfoData={parsecReportQuery.data}
                jamfComputersData={jamfComputersQuery.data}
                machineInfoFromLDAPData={machinesQuery.data}
                saltMachineInfoData={saltMachineInfoQuery.data}
                saltPingInfoData={saltPingInfoQuery.data}
                isLoading={isLoading}
                hasError={hasError}
              />
            )}

            {/* Debug info */}
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
              <Typography variant="caption">
                Debug: filteredAndSortedMachines.length = {filteredAndSortedMachines.length},
                currentPage = {currentPage},
                itemsPerPage = {itemsPerPage},
                slice range = {(currentPage - 1) * itemsPerPage} to {currentPage * itemsPerPage}
                {machineNameFilter && `, filter: "${machineNameFilter}"`}
                {showActiveOnly && `, active only: true`}
                {showParsecHostsOnly && `, parsec hosts only: true`}
                , sort: {sortOrder}
              </Typography>
            </Box>

            {/* Paginated list of machines */}
            <Box sx={{ mb: 2 }}>
              {filteredAndSortedMachines.length > 0 ? (
                filteredAndSortedMachines
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((machine, index) => (
                    <Box key={index} sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {machine.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          OS: {machine.operatingSystem && machine.operatingSystem !== 'N/A' ? machine.operatingSystem : 'N/A'}
                          {machine.osSource && machine.osSource !== 'Unknown' && machine.operatingSystem && machine.operatingSystem !== 'N/A' && (
                            <Chip
                              size="small"
                              label={machine.osSource}
                              variant="outlined"
                              color={machine.osSource === 'Salt' ? 'primary' : 'default'}
                              sx={{ ml: 1, height: '16px', fontSize: '0.6rem' }}
                            />
                          )}
                        </Typography>
                        {/* Debug info for first few machines - temporarily commented out
                        {index < 3 && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.6rem' }}>
                            Debug: OS="{machine.operatingSystem}", Source="{machine.osSource}", Salt="{machine.salt?.osVersion}"
                          </Typography>
                        )}
                        */}
                        {machine.salt && machine.salt.osArch !== 'N/A' && (
                          <Typography variant="caption" color="text.secondary">
                            Architecture: {machine.salt.osArch}
                          </Typography>
                        )}
                        {machine.salt && machine.salt.cpuModel !== 'N/A' && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            CPU: {machine.salt.cpuModel.split(' ').slice(0, 4).join(' ')}
                          </Typography>
                        )}
                        {/* DN Information */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                          {machine.dnInfo.location !== 'Unknown' && (
                            <Chip
                              size="small"
                              label={`📍 ${machine.dnInfo.location}`}
                              variant="outlined"
                              color="default"
                              sx={{ height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {machine.dnInfo.type !== 'Unknown' && (
                            <Chip
                              size="small"
                              label={machine.dnInfo.type}
                              variant="outlined"
                              color={
                                machine.dnInfo.type === 'SERVER' ? 'error' :
                                machine.dnInfo.type === 'WORKSTATION' ? 'success' :
                                machine.dnInfo.type === 'MAC' ? 'secondary' :
                                machine.dnInfo.type === 'LINUX' ? 'warning' :
                                machine.dnInfo.type === 'LAPTOP' ? 'info' :
                                'info'
                              }
                              sx={{ height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {machine.dnInfo.osFromDN !== 'Unknown' && (
                            <Chip
                              size="small"
                              label={machine.dnInfo.osFromDN}
                              variant="outlined"
                              color="primary"
                              sx={{ height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                        {/* Debug: Show raw OUs for first few machines */}
                        {index < 3 && machine.dnInfo.rawOUs.length > 0 && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.6rem', mt: 0.5 }}>
                            Debug OUs: {machine.dnInfo.rawOUs.join(', ')}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        <Chip
                          size="small"
                          label={machine.distinguishedName ? 'Active' : 'Unknown'}
                          color={machine.distinguishedName ? 'success' : 'default'}
                          variant="outlined"
                        />
                        {machine.parsec && machine.parsec.isHost && (
                          <Chip
                            size="small"
                            label={`Parsec${machine.parsec.online ? ' (Online)' : ' (Offline)'}`}
                            color={machine.parsec.online ? 'primary' : 'secondary'}
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: '18px' }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    {(machineNameFilter || showActiveOnly || showParsecHostsOnly) ?
                      `No machines found${machineNameFilter ? ` matching "${machineNameFilter}"` : ''}${showActiveOnly ? ' (active only)' : ''}${showParsecHostsOnly ? ' (Parsec hosts only)' : ''}` :
                      'No machines available to display'
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(machineNameFilter || showActiveOnly || showParsecHostsOnly) ?
                      `Total machines: ${machinesList.length}, Filtered: ${filteredAndSortedMachines.length}` :
                      `machinesList.length = ${machinesList.length}`
                    }
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredAndSortedMachines.length / itemsPerPage)}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
                siblingCount={2}
                boundaryCount={1}
              />
            </Box>
          </Box>
        </Grid>
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