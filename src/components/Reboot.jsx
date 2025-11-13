import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Switch, FormControlLabel, TextField, InputAdornment,
  ToggleButton, ToggleButtonGroup, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ComputerIcon from '@mui/icons-material/Computer';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import React, { useState, useMemo } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function Reboot(props) {
    const [expanded, setExpanded] = useState({});
    const [rebootDialog, setRebootDialog] = useState({ open: false, machine: null });
    const [rebootLoading, setRebootLoading] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [sectionCollapsed, setSectionCollapsed] = useState({
        windows: false,
        mac: false,
        linux: false
    });
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [viewMode, setViewMode] = useState('grouped');
    const [searchTerm, setSearchTerm] = useState('');
    const [osFilter, setOsFilter] = useState('all');
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    
    const handleToggle = (machineId) => {
        setExpanded(prev => ({
            ...prev,
            [machineId]: !prev[machineId]
        }));
    };

    const handleSectionToggle = (section) => {
        setSectionCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleRebootClick = (machine) => {
        setRebootDialog({ open: true, machine });
    };

    const handleRebootConfirm = async () => {
        const machine = rebootDialog.machine;
        setRebootDialog({ open: false, machine: null });
        setRebootLoading(prev => ({ ...prev, [machine.name]: true }));

        // Show alert that machine is being rebooted
        setSnackbar({
            open: true,
            message: `Initiating reboot for ${machine.name}...`,
            severity: 'info'
        });

        try {
            const response = await fetch(`https://laxcoresrv.buck.local:8000/powershell/reboot_windows_host/${machine.name}`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                }
            });

            if (response.status === 200) {
                setSnackbar({
                    open: true,
                    message: `✅ Reboot command successfully sent to ${machine.name}`,
                    severity: 'success'
                });
            } else {
                throw new Error(`Failed to reboot ${machine.name}: ${response.statusText}`);
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: `❌ Failed to reboot ${machine.name}: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setRebootLoading(prev => ({ ...prev, [machine.name]: false }));
        }
    };

    const handleRebootCancel = () => {
        setRebootDialog({ open: false, machine: null });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (column) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
    };

    const [ldapMachineInfo] = useQueries({
        queries: [
          {
            queryKey: ["ldap_machine_info"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/buckldap_machineinfo", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch machine info: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    // Helper function to get the best available last logon date
    const getLastLogonDate = (machine) => {
        if (machine.lastLogon && machine.lastLogon !== "N/A") {
            return machine.lastLogon;
        } else if (machine.lastLogonTimestamp && machine.lastLogonTimestamp !== "N/A") {
            return machine.lastLogonTimestamp;
        } else if (machine.whenChanged) {
            return machine.whenChanged;
        }
        return null;
    };

    // Helper function to check if machine is active (last logon within 7 days)
    const isActiveSystem = (machine) => {
        const dateToCheck = getLastLogonDate(machine);
        if (!dateToCheck) return false;

        const lastLogonDate = new Date(dateToCheck);
        const daysSinceLogon = Math.floor((Date.now() - lastLogonDate) / (1000 * 60 * 60 * 24));
        return daysSinceLogon <= 7;
    };

    // Process data with useMemo at the top level
    const sortedData = useMemo(() => {
        if (!ldapMachineInfo.data) return [];
        return Array.isArray(ldapMachineInfo.data)
            ? [...ldapMachineInfo.data].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];
    }, [ldapMachineInfo.data]);

    // Filtered and sorted list for table view
    const filteredAndSortedMachines = useMemo(() => {
        let filtered = [...sortedData];

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(machine =>
                (machine.name || '').toLowerCase().includes(search) ||
                (machine.operatingSystem || '').toLowerCase().includes(search)
            );
        }

        // Apply OS filter
        if (osFilter !== 'all') {
            if (osFilter === 'windows') {
                filtered = filtered.filter(machine =>
                    machine.operatingSystem && machine.operatingSystem.toLowerCase().includes('windows')
                );
            } else if (osFilter === 'mac') {
                filtered = filtered.filter(machine =>
                    machine.operatingSystem && (
                        machine.operatingSystem.toLowerCase().includes('mac') ||
                        machine.operatingSystem.toLowerCase().includes('darwin') ||
                        machine.operatingSystem.toLowerCase().includes('osx') ||
                        machine.operatingSystem.toLowerCase().includes('os x')
                    )
                );
            } else if (osFilter === 'linux') {
                filtered = filtered.filter(machine =>
                    machine.operatingSystem && (
                        machine.operatingSystem.toLowerCase().includes('linux') ||
                        machine.operatingSystem.toLowerCase().includes('ubuntu') ||
                        machine.operatingSystem.toLowerCase().includes('centos') ||
                        machine.operatingSystem.toLowerCase().includes('redhat') ||
                        machine.operatingSystem.toLowerCase().includes('debian')
                    )
                );
            }
        }

        // Apply active filter
        if (showActiveOnly) {
            filtered = filtered.filter(isActiveSystem);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortColumn) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'os':
                    aValue = (a.operatingSystem || '').toLowerCase();
                    bValue = (b.operatingSystem || '').toLowerCase();
                    break;
                case 'status':
                    const aActive = isActiveSystem(a);
                    const bActive = isActiveSystem(b);
                    aValue = aActive ? 'active' : 'inactive';
                    bValue = bActive ? 'active' : 'inactive';
                    break;
                case 'lastLogon':
                    aValue = a.lastLogon ? new Date(a.lastLogon).getTime() : 0;
                    bValue = b.lastLogon ? new Date(b.lastLogon).getTime() : 0;
                    break;
                case 'critical':
                    aValue = a.isCriticalSystemObject === "No" ? 0 : 1;
                    bValue = b.isCriticalSystemObject === "No" ? 0 : 1;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [sortedData, searchTerm, osFilter, showActiveOnly, sortColumn, sortDirection]);

    // Separate machines by operating system
    const windowsMachines = useMemo(() => {
        return filteredAndSortedMachines.filter(machine =>
            machine.operatingSystem && machine.operatingSystem.toLowerCase().includes('windows')
        );
    }, [filteredAndSortedMachines]);

    const macMachines = useMemo(() => {
        return filteredAndSortedMachines.filter(machine =>
            machine.operatingSystem && (
                machine.operatingSystem.toLowerCase().includes('mac') ||
                machine.operatingSystem.toLowerCase().includes('darwin') ||
                machine.operatingSystem.toLowerCase().includes('osx') ||
                machine.operatingSystem.toLowerCase().includes('os x')
            )
        );
    }, [filteredAndSortedMachines]);

    const linuxMachines = useMemo(() => {
        return filteredAndSortedMachines.filter(machine =>
            machine.operatingSystem && (
                machine.operatingSystem.toLowerCase().includes('linux') ||
                machine.operatingSystem.toLowerCase().includes('ubuntu') ||
                machine.operatingSystem.toLowerCase().includes('centos') ||
                machine.operatingSystem.toLowerCase().includes('redhat') ||
                machine.operatingSystem.toLowerCase().includes('debian')
            )
        );
    }, [filteredAndSortedMachines]);

    const criticalSystems = useMemo(() => {
        return sortedData.filter(machine => machine.isCriticalSystemObject !== "No").length;
    }, [sortedData]);

    if (ldapMachineInfo.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (ldapMachineInfo.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load machine information</Typography>
                    <Typography variant="body2">{ldapMachineInfo.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (!sortedData || sortedData.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary">No machines found</Typography>
            </Box>
        );
    }

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Typography variant='h5' color="primary" fontWeight="medium">
                            {props.name || 'Machine Reboot Control'}
                        </Typography>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => newMode && setViewMode(newMode)}
                            size="small"
                        >
                            <ToggleButton value="grouped">
                                <ViewModuleIcon sx={{ mr: 1 }} fontSize="small" />
                                Grouped
                            </ToggleButton>
                            <ToggleButton value="table">
                                <ViewListIcon sx={{ mr: 1 }} fontSize="small" />
                                Table
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Typography variant='body2' color="text.secondary" sx={{ mb: 2 }}>
                        Note: only Windows Machines are Rebootable at this time
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Search machines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }
                            }}
                            sx={{ minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>OS Type</InputLabel>
                            <Select
                                value={osFilter}
                                onChange={(e) => setOsFilter(e.target.value)}
                                label="OS Type"
                            >
                                <MenuItem value="all">All OS</MenuItem>
                                <MenuItem value="windows">Windows</MenuItem>
                                <MenuItem value="mac">Mac</MenuItem>
                                <MenuItem value="linux">Linux</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip label={`${showActiveOnly ? windowsMachines.length + macMachines.length + linuxMachines.length : sortedData.length} ${showActiveOnly ? 'Active' : 'Total'}`} color="primary" variant="filled" />
                            <Chip label={`🪟 ${windowsMachines.length}`} color="info" variant="outlined" />
                            <Chip label={`🍎 ${macMachines.length}`} color="success" variant="outlined" />
                            <Chip label={`🐧 ${linuxMachines.length}`} color="warning" variant="outlined" />
                            <Chip label={`⚠️ ${criticalSystems} Critical`} color="error" variant="outlined" />
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showActiveOnly}
                                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label="Active Only"
                            sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}
                        />
                    </Box>
                </Box>

                {/* Table View - All Machines */}
                {viewMode === 'table' && (
                    <Box sx={{ mb: 4 }}>
                        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Table sx={{ minWidth: 650 }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        <TableCell
                                            sx={{
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': { bgcolor: 'primary.dark' }
                                            }}
                                            onClick={() => handleSort('name')}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ComputerIcon fontSize="small" />
                                                Machine Name
                                                {getSortIcon('name')}
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': { bgcolor: 'primary.dark' }
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
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': { bgcolor: 'primary.dark' }
                                            }}
                                            onClick={() => handleSort('critical')}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                Critical
                                                {getSortIcon('critical')}
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': { bgcolor: 'primary.dark' }
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
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': { bgcolor: 'primary.dark' }
                                            }}
                                            onClick={() => handleSort('lastLogon')}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarTodayIcon fontSize="small" />
                                                Last Logon
                                                {getSortIcon('lastLogon')}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAndSortedMachines.map((machine) => {
                                        const machineKey = machine.objectGUID || machine.name || Math.random().toString();
                                        const lastLogonDateStr = getLastLogonDate(machine);
                                        const lastLogonDate = lastLogonDateStr ? new Date(lastLogonDateStr) : null;
                                        const daysSinceLogon = lastLogonDate ? Math.floor((Date.now() - lastLogonDate) / (1000 * 60 * 60 * 24)) : null;
                                        const isRecentlyActive = daysSinceLogon !== null && daysSinceLogon <= 7;
                                        const statusColor = isRecentlyActive ? '#4caf50' : '#757575';
                                        const isWindows = machine.operatingSystem && machine.operatingSystem.toLowerCase().includes('windows');

                                        return (
                                            <TableRow
                                                key={machineKey}
                                                sx={{
                                                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                    '&:hover': { bgcolor: 'action.selected' },
                                                    borderLeft: `4px solid ${statusColor}`,
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {machine.name || 'Unknown Machine'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {machine.operatingSystem || 'Unknown'}
                                                    </Typography>
                                                    {machine.operatingSystemVersion && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {machine.operatingSystemVersion}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={machine.isCriticalSystemObject === "No" ? "Non-Critical" : "Critical"}
                                                        size="small"
                                                        color={machine.isCriticalSystemObject === "No" ? "success" : "error"}
                                                        variant="filled"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        variant="filled"
                                                        color={isRecentlyActive ? "success" : "default"}
                                                        size="small"
                                                        label={isRecentlyActive ? "Active" : "Inactive"}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {lastLogonDate ? (
                                                        <Tooltip title={lastLogonDate.toLocaleString()}>
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {lastLogonDate.toLocaleDateString()}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {daysSinceLogon === 0 ? 'Today' :
                                                                     daysSinceLogon === 1 ? 'Yesterday' :
                                                                     `${daysSinceLogon} days ago`}
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Never</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="warning"
                                                        size="small"
                                                        startIcon={<RestartAltIcon />}
                                                        onClick={() => handleRebootClick(machine)}
                                                        disabled={!isWindows || rebootLoading[machine.name]}
                                                        sx={{ minWidth: '90px' }}
                                                    >
                                                        {rebootLoading[machine.name] ? (
                                                            <CircularProgress size={16} color="inherit" />
                                                        ) : isWindows ? (
                                                            'Reboot'
                                                        ) : (
                                                            'Disabled'
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredAndSortedMachines.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                                    No machines found matching the current filters
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Showing {filteredAndSortedMachines.length} machines
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Windows Machines Section */}
                {viewMode === 'grouped' && windowsMachines.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Box 
                            onClick={() => handleSectionToggle('windows')}
                            sx={{ 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 2,
                                '&:hover': { bgcolor: 'action.hover' },
                                p: 1,
                                borderRadius: 1
                            }}
                        >
                            {sectionCollapsed.windows ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                                🪟 Windows Machines ({windowsMachines.length})
                            </Typography>
                        </Box>
                        <Collapse in={!sectionCollapsed.windows} timeout="auto" unmountOnExit>
                            <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Table sx={{ minWidth: 650 }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'info.main' }}>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold', width: '40px' }}>
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ComputerIcon fontSize="small" />
                                                Machine Name
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            Operating System
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarTodayIcon fontSize="small" />
                                                Last Logon
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {windowsMachines.map((machine) => {
                                const machineKey = machine.objectGUID || machine.name || Math.random().toString();
                                const lastLogonDateStr = getLastLogonDate(machine);
                                const lastLogonDate = lastLogonDateStr ? new Date(lastLogonDateStr) : null;
                                const daysSinceLogon = lastLogonDate ? Math.floor((Date.now() - lastLogonDate) / (1000 * 60 * 60 * 24)) : null;
                                const isRecentlyActive = daysSinceLogon !== null && daysSinceLogon <= 7;
                                const statusColor = isRecentlyActive ? '#4caf50' : '#757575';
                                
                                return (
                                    <React.Fragment key={machineKey}>
                                        <TableRow 
                                            sx={{ 
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`,
                                            }}
                                        >
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleToggle(machineKey)}>
                                                    {expanded[machineKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {machine.name || 'Unknown Machine'}
                                                </Typography>
                                                <Chip 
                                                    label={machine.isCriticalSystemObject === "No" ? "Non-Critical" : "Critical"} 
                                                    size="small" 
                                                    color={machine.isCriticalSystemObject === "No" ? "success" : "error"} 
                                                    variant="filled"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {machine.operatingSystem || 'Unknown'}
                                                </Typography>
                                                {machine.operatingSystemVersion && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {machine.operatingSystemVersion}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    variant="filled" 
                                                    color={isRecentlyActive ? "success" : "default"}
                                                    size="small"
                                                    label={isRecentlyActive ? "Active" : "Inactive"} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {lastLogonDate ? (
                                                    <Tooltip title={lastLogonDate.toLocaleString()}>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {lastLogonDate.toLocaleDateString()}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {daysSinceLogon === 0 ? 'Today' : 
                                                                 daysSinceLogon === 1 ? 'Yesterday' : 
                                                                 `${daysSinceLogon} days ago`}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">Never</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="contained"
                                                    color="warning"
                                                    size="small"
                                                    startIcon={<RestartAltIcon />}
                                                    onClick={() => handleRebootClick(machine)}
                                                    disabled={rebootLoading[machine.name]}
                                                    sx={{ minWidth: '90px' }}
                                                >
                                                    {rebootLoading[machine.name] ? (
                                                        <CircularProgress size={16} color="inherit" />
                                                    ) : (
                                                        'Reboot'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                <Collapse in={expanded[machineKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Object GUID
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {machine.objectGUID || 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid size={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Logon Count
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {machine.logonCount || 0}
                                                                </Typography>
                                                            </Grid>

                                                            {machine.whenCreated && (
                                                                <Grid size={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Created
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {new Date(machine.whenCreated).toLocaleString()}
                                                                    </Typography>
                                                                </Grid>
                                                            )}

                                                            {machine.whenChanged && (
                                                                <Grid size={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Last Changed
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {new Date(machine.whenChanged).toLocaleString()}
                                                                    </Typography>
                                                                </Grid>
                                                            )}

                                                            {machine.pwdLastSet && (
                                                                <Grid size={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Password Last Set
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {new Date(machine.pwdLastSet).toLocaleString()}
                                                                    </Typography>
                                                                </Grid>
                                                            )}

                                                            <Grid size={12}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Raw Data
                                                                </Typography>
                                                                <Box sx={{ 
                                                                    p: 1, 
                                                                    bgcolor: 'white', 
                                                                    borderRadius: 1, 
                                                                    maxHeight: 200, 
                                                                    overflow: 'auto',
                                                                    border: '1px solid',
                                                                    borderColor: 'grey.300'
                                                                }}>
                                                                    <pre style={{ 
                                                                        margin: 0, 
                                                                        fontSize: '0.75rem', 
                                                                        whiteSpace: 'pre-wrap',
                                                                        fontFamily: 'monospace'
                                                                    }}>
                                                                        {JSON.stringify(machine, null, 2)}
                                                                    </pre>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                        </Collapse>
                    </Box>
                )}

                {/* Mac Machines Section */}
                {viewMode === 'grouped' && macMachines.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Box 
                            onClick={() => handleSectionToggle('mac')}
                            sx={{ 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 2,
                                '&:hover': { bgcolor: 'action.hover' },
                                p: 1,
                                borderRadius: 1
                            }}
                        >
                            {sectionCollapsed.mac ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                                🍎 Mac Machines ({macMachines.length})
                            </Typography>
                        </Box>
                        <Collapse in={!sectionCollapsed.mac} timeout="auto" unmountOnExit>
                            <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Table sx={{ minWidth: 650 }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'success.main' }}>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold', width: '40px' }}>
                                        </TableCell>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ComputerIcon fontSize="small" />
                                                Machine Name
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            Operating System
                                        </TableCell>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarTodayIcon fontSize="small" />
                                                Last Logon
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {macMachines.map((machine) => {
                                        const machineKey = machine.objectGUID || machine.name || Math.random().toString();
                                        const lastLogonDateStr = getLastLogonDate(machine);
                                        const lastLogonDate = lastLogonDateStr ? new Date(lastLogonDateStr) : null;
                                        const daysSinceLogon = lastLogonDate ? Math.floor((Date.now() - lastLogonDate) / (1000 * 60 * 60 * 24)) : null;
                                        const isRecentlyActive = daysSinceLogon !== null && daysSinceLogon <= 7;
                                        const statusColor = isRecentlyActive ? '#4caf50' : '#757575';
                                        
                                        return (
                                            <React.Fragment key={machineKey}>
                                                <TableRow 
                                                    sx={{ 
                                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                        '&:hover': { bgcolor: 'action.selected' },
                                                        borderLeft: `4px solid ${statusColor}`,
                                                    }}
                                                >
                                                    <TableCell>
                                                        <IconButton size="small" onClick={() => handleToggle(machineKey)}>
                                                            {expanded[machineKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {machine.name || 'Unknown Machine'}
                                                        </Typography>
                                                        <Chip 
                                                            label={machine.isCriticalSystemObject === "No" ? "Non-Critical" : "Critical"} 
                                                            size="small" 
                                                            color={machine.isCriticalSystemObject === "No" ? "success" : "error"} 
                                                            variant="filled"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {machine.operatingSystem || 'Unknown'}
                                                        </Typography>
                                                        {machine.operatingSystemVersion && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {machine.operatingSystemVersion}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            variant="filled" 
                                                            color={isRecentlyActive ? "success" : "default"}
                                                            size="small"
                                                            label={isRecentlyActive ? "Active" : "Inactive"} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {lastLogonDate ? (
                                                            <Tooltip title={lastLogonDate.toLocaleString()}>
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        {lastLogonDate.toLocaleDateString()}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {daysSinceLogon === 0 ? 'Today' : 
                                                                         daysSinceLogon === 1 ? 'Yesterday' : 
                                                                         `${daysSinceLogon} days ago`}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">Never</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            size="small"
                                                            startIcon={<RestartAltIcon />}
                                                            onClick={() => handleRebootClick(machine)}
                                                            disabled={true}
                                                            sx={{ minWidth: '90px' }}
                                                        >
                                                            Disabled
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                        <Collapse in={expanded[machineKey]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                                <Grid container spacing={3}>
                                                                    <Grid size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Object GUID
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                            {machine.objectGUID || 'N/A'}
                                                                        </Typography>
                                                                    </Grid>
                                                                    
                                                                    <Grid size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Logon Count
                                                                        </Typography>
                                                                        <Typography variant="body2">
                                                                            {machine.logonCount || 0}
                                                                        </Typography>
                                                                    </Grid>

                                                                    {machine.whenCreated && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Created
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.whenCreated).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    {machine.whenChanged && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Last Changed
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.whenChanged).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    {machine.pwdLastSet && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Password Last Set
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.pwdLastSet).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    <Grid size={12}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Raw Data
                                                                        </Typography>
                                                                        <Box sx={{ 
                                                                            p: 1, 
                                                                            bgcolor: 'white', 
                                                                            borderRadius: 1, 
                                                                            maxHeight: 200, 
                                                                            overflow: 'auto',
                                                                            border: '1px solid',
                                                                            borderColor: 'grey.300'
                                                                        }}>
                                                                            <pre style={{ 
                                                                                margin: 0, 
                                                                                fontSize: '0.75rem', 
                                                                                whiteSpace: 'pre-wrap',
                                                                                fontFamily: 'monospace'
                                                                            }}>
                                                                                {JSON.stringify(machine, null, 2)}
                                                                            </pre>
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Collapse>
                    </Box>
                )}

                {/* Linux Machines Section */}
                {viewMode === 'grouped' && linuxMachines.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Box 
                            onClick={() => handleSectionToggle('linux')}
                            sx={{ 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 2,
                                '&:hover': { bgcolor: 'action.hover' },
                                p: 1,
                                borderRadius: 1
                            }}
                        >
                            {sectionCollapsed.linux ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                                🐧 Linux Machines ({linuxMachines.length})
                            </Typography>
                        </Box>
                        <Collapse in={!sectionCollapsed.linux} timeout="auto" unmountOnExit>
                            <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Table sx={{ minWidth: 650 }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'warning.main' }}>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold', width: '40px' }}>
                                        </TableCell>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ComputerIcon fontSize="small" />
                                                Machine Name
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                                            Operating System
                                        </TableCell>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarTodayIcon fontSize="small" />
                                                Last Logon
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {linuxMachines.map((machine) => {
                                        const machineKey = machine.objectGUID || machine.name || Math.random().toString();
                                        const lastLogonDateStr = getLastLogonDate(machine);
                                        const lastLogonDate = lastLogonDateStr ? new Date(lastLogonDateStr) : null;
                                        const daysSinceLogon = lastLogonDate ? Math.floor((Date.now() - lastLogonDate) / (1000 * 60 * 60 * 24)) : null;
                                        const isRecentlyActive = daysSinceLogon !== null && daysSinceLogon <= 7;
                                        const statusColor = isRecentlyActive ? '#4caf50' : '#757575';
                                        
                                        return (
                                            <React.Fragment key={machineKey}>
                                                <TableRow 
                                                    sx={{ 
                                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                        '&:hover': { bgcolor: 'action.selected' },
                                                        borderLeft: `4px solid ${statusColor}`,
                                                    }}
                                                >
                                                    <TableCell>
                                                        <IconButton size="small" onClick={() => handleToggle(machineKey)}>
                                                            {expanded[machineKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {machine.name || 'Unknown Machine'}
                                                        </Typography>
                                                        <Chip 
                                                            label={`Raw: "${machine.isCriticalSystemObject}" | Test: ${machine.isCriticalSystemObject === "No"}`} 
                                                            size="small" 
                                                            color={machine.isCriticalSystemObject === "No" ? "success" : "error"} 
                                                            variant="filled"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {machine.operatingSystem || 'Unknown'}
                                                        </Typography>
                                                        {machine.operatingSystemVersion && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {machine.operatingSystemVersion}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            variant="filled" 
                                                            color={isRecentlyActive ? "success" : "default"}
                                                            size="small"
                                                            label={isRecentlyActive ? "Active" : "Inactive"} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {lastLogonDate ? (
                                                            <Tooltip title={lastLogonDate.toLocaleString()}>
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        {lastLogonDate.toLocaleDateString()}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {daysSinceLogon === 0 ? 'Today' : 
                                                                         daysSinceLogon === 1 ? 'Yesterday' : 
                                                                         `${daysSinceLogon} days ago`}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">Never</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            size="small"
                                                            startIcon={<RestartAltIcon />}
                                                            onClick={() => handleRebootClick(machine)}
                                                            disabled={true}
                                                            sx={{ minWidth: '90px' }}
                                                        >
                                                            Disabled
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                        <Collapse in={expanded[machineKey]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                                <Grid container spacing={3}>
                                                                    <Grid size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Object GUID
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                            {machine.objectGUID || 'N/A'}
                                                                        </Typography>
                                                                    </Grid>
                                                                    
                                                                    <Grid size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Logon Count
                                                                        </Typography>
                                                                        <Typography variant="body2">
                                                                            {machine.logonCount || 0}
                                                                        </Typography>
                                                                    </Grid>

                                                                    {machine.whenCreated && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Created
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.whenCreated).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    {machine.whenChanged && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Last Changed
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.whenChanged).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    {machine.pwdLastSet && (
                                                                        <Grid size={12} md={6}>
                                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                                Password Last Set
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(machine.pwdLastSet).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}

                                                                    <Grid size={12}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Raw Data
                                                                        </Typography>
                                                                        <Box sx={{ 
                                                                            p: 1, 
                                                                            bgcolor: 'white', 
                                                                            borderRadius: 1, 
                                                                            maxHeight: 200, 
                                                                            overflow: 'auto',
                                                                            border: '1px solid',
                                                                            borderColor: 'grey.300'
                                                                        }}>
                                                                            <pre style={{ 
                                                                                margin: 0, 
                                                                                fontSize: '0.75rem', 
                                                                                whiteSpace: 'pre-wrap',
                                                                                fontFamily: 'monospace'
                                                                            }}>
                                                                                {JSON.stringify(machine, null, 2)}
                                                                            </pre>
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Collapse>
                    </Box>
                )}

                {/* Reboot Confirmation Dialog */}
                <Dialog
                    open={rebootDialog.open}
                    onClose={handleRebootCancel}
                    aria-labelledby="reboot-dialog-title"
                    aria-describedby="reboot-dialog-description"
                    slotProps={{
                        paper: {
                            sx: {
                                bgcolor: '#ffffff',
                                backgroundImage: 'none',
                                opacity: 1,
                                boxShadow: 3
                            }
                        }
                    }}
                >
                    <DialogTitle id="reboot-dialog-title">
                        Confirm Reboot
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="reboot-dialog-description">
                            Are you sure you want to reboot <strong>{rebootDialog.machine?.name}</strong>?
                            {rebootDialog.machine?.isCriticalSystemObject !== "No" && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                                    <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                                        ⚠️ This is a critical system. Please ensure this reboot is necessary.
                                    </Typography>
                                </Box>
                            )}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleRebootCancel} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleRebootConfirm} color="warning" variant="contained" autoFocus>
                            Reboot
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                >
                    <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        );
}