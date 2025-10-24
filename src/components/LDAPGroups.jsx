import { useState } from 'react';
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Typography, Box, Container, Grid,
  Card, CardContent, Chip, Divider,
  Paper, TextField, InputAdornment,
  IconButton, Avatar,
  Collapse, Button, CircularProgress, Alert, AlertTitle,
  Table, TableContainer, TableBody, TableCell, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  ContentCopy as ContentCopyIcon,
  CalendarToday as CalendarIcon,
  FilterAlt as FilterIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import uuid from 'react-uuid';

const getGroupTypeLabel = (groupType) => {
    // Common AD group types
    if (groupType === 2) return 'Global Distribution';
    if (groupType === 4) return 'Domain Local Distribution';
    if (groupType === 8) return 'Universal Distribution';
    if (groupType === -2147483646) return 'Global Security';
    if (groupType === -2147483644) return 'Domain Local Security';
    if (groupType === -2147483640) return 'Universal Security';
    return `Type ${groupType}`;
};

const getGroupTypeColor = (groupType) => {
    // Security groups get different color than distribution groups
    if (groupType < 0) return 'primary'; // Security groups (negative values)
    return 'secondary'; // Distribution groups (positive values)
};

export default function LDAPGroups(props) {
    const queryClient = useQueryClient();

    // State for search, filtering, and expanded items
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [copiedText, setCopiedText] = useState('');
    const [filters, setFilters] = useState({
        groupType: '',
        scope: ''
    });

    // State for create group dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // State for add users to group dialog
    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isAddingUsers, setIsAddingUsers] = useState(false);

    // State for group members
    const [groupMembers, setGroupMembers] = useState({});
    const [loadingMembers, setLoadingMembers] = useState({});

    // Fetch group members
    const fetchGroupMembers = async (groupName) => {
        if (groupMembers[groupName] || loadingMembers[groupName]) {
            return; // Already loaded or loading
        }

        setLoadingMembers(prev => ({ ...prev, [groupName]: true }));

        try {
            const url = `https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=group&_att=name&_match=${encodeURIComponent(groupName)}`;
            console.log("Fetching group members for:", groupName, "URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            });

            console.log("Group members response status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Group members data:", data);

            // Extract members from the response - assuming the response contains member information
            let members = [];
            if (data && data.length > 0 && data[0].member) {
                // If members are in 'member' field as an array
                members = Array.isArray(data[0].member) ? data[0].member : [data[0].member];
            }

            setGroupMembers(prev => ({ ...prev, [groupName]: members }));

        } catch (error) {
            console.error("Error fetching group members:", error);
            setGroupMembers(prev => ({ ...prev, [groupName]: [] }));
        } finally {
            setLoadingMembers(prev => ({ ...prev, [groupName]: false }));
        }
    };

    // Toggle group expansion
    const toggleGroupExpand = (groupId) => {
        const isExpanding = !expandedGroups[groupId];

        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: isExpanding
        }));

        // Fetch members when expanding
        if (isExpanding) {
            fetchGroupMembers(groupId);
        }
    };

    // Handle clearing the search filter
    const handleClearFilter = () => {
        setSearchTerm('');
    };

    // Handle resetting all filters
    const handleResetFilters = () => {
        setFilters({
            groupType: '',
            scope: ''
        });
    };

    // Toggle expand all
    const toggleExpandAll = (groups, expand) => {
        const newExpandedState = {};
        groups.forEach(group => {
            newExpandedState[group.name] = expand;
        });
        setExpandedGroups(newExpandedState);
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
        if (!dateString) return 'Not specified';

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

    // Handle create group
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            setNotification({
                open: true,
                message: 'Please enter a group name',
                severity: 'error'
            });
            return;
        }

        setIsCreating(true);
        try {
            const url = `https://laxcoresrv.buck.local:8000/buckldap_create_group?group=${encodeURIComponent(newGroupName.trim())}`;
            console.log("Creating group with URL:", url);

            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            });

            console.log("Create group response status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Create group result:", result);

            setNotification({
                open: true,
                message: `Group "${newGroupName}" created successfully!`,
                severity: 'success'
            });

            // Reset form and close dialog
            setNewGroupName('');
            setCreateDialogOpen(false);

            // Refresh the groups list
            queryClient.invalidateQueries(['ldapGroups']);

        } catch (error) {
            console.error("Error creating group:", error);
            setNotification({
                open: true,
                message: `Failed to create group: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Handle close notification
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Extract user name from distinguished name
    const extractUserName = (dn) => {
        if (!dn) return 'Unknown User';

        // Extract CN (Common Name) from distinguished name
        const cnMatch = dn.match(/CN=([^,]+)/i);
        if (cnMatch) {
            return cnMatch[1];
        }

        return dn;
    };

    // Handle open add users dialog
    const handleOpenAddUsersDialog = (group) => {
        setSelectedGroup(group);
        setSelectedUsers([]);
        setUserSearchTerm('');
        setAddUsersDialogOpen(true);
    };

    // Handle close add users dialog
    const handleCloseAddUsersDialog = () => {
        setAddUsersDialogOpen(false);
        setSelectedGroup(null);
        setSelectedUsers([]);
        setUserSearchTerm('');
    };

    // Handle user selection toggle
    const handleUserToggle = (user) => {
        const currentIndex = selectedUsers.findIndex(u => u.mail === user.mail);
        const newSelectedUsers = [...selectedUsers];

        if (currentIndex === -1) {
            newSelectedUsers.push(user);
        } else {
            newSelectedUsers.splice(currentIndex, 1);
        }

        setSelectedUsers(newSelectedUsers);
    };

    // Handle add users to group
    const handleAddUsersToGroup = async () => {
        if (!selectedGroup || selectedUsers.length === 0) {
            setNotification({
                open: true,
                message: 'Please select at least one user',
                severity: 'error'
            });
            return;
        }

        setIsAddingUsers(true);
        try {
            // Create comma-separated list of user emails
            const userEmails = selectedUsers
                .map(user => user.mail)
                .filter(email => email) // Filter out any undefined emails
                .join(',');

            if (!userEmails) {
                throw new Error('No valid user emails found');
            }

            const url = `https://laxcoresrv.buck.local:8000/buckldap_add_users_to_group?user_email_comma_separated_list=${encodeURIComponent(userEmails)}&group_name=${encodeURIComponent(selectedGroup.name)}`;
            console.log("Adding users to group with URL:", url);
            console.log("User emails:", userEmails);
            console.log("Group name:", selectedGroup.name);

            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            });

            console.log("Add users to group response status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Add users to group result:", result);

            setNotification({
                open: true,
                message: `Successfully added ${selectedUsers.length} user(s) to group "${selectedGroup.name}"`,
                severity: 'success'
            });

            // Close dialog and reset state
            handleCloseAddUsersDialog();

        } catch (error) {
            console.error("Error adding users to group:", error);
            setNotification({
                open: true,
                message: `Failed to add users to group: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setIsAddingUsers(false);
        }
    };

    const [adGroups, adUsers] = useQueries({
        queries: [
            {
                queryKey: ["ldapGroups"],
                queryFn: async () => {
                    console.log("Making LDAP Groups API request...");
                    try {
                        const url = 'https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=group';
                        console.log("LDAP Groups API URL:", url);

                        const res = await fetch(url, {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                            }
                        });

                        console.log("LDAP Groups API response status:", res.status);

                        if (!res.ok) {
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        }

                        const data = await res.json();
                        console.log("LDAP Groups API response data:", data);
                        return data;
                    } catch (error) {
                        console.error("Error fetching LDAP groups:", error);
                        throw error;
                    }
                },
                retry: 2,
                retryDelay: 1000,
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000 // 10 minutes
            },
            {
                queryKey: ["ldapUsers"],
                queryFn: async () => {
                    console.log("Making LDAP Users API request...");
                    try {
                        const url = 'https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=person';
                        console.log("LDAP Users API URL:", url);

                        const res = await fetch(url, {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                            }
                        });

                        console.log("LDAP Users API response status:", res.status);

                        if (!res.ok) {
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        }

                        const data = await res.json();
                        console.log("LDAP Users API response data:", data);
                        return data;
                    } catch (error) {
                        console.error("Error fetching LDAP users:", error);
                        throw error;
                    }
                },
                retry: 2,
                retryDelay: 1000,
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
                enabled: addUsersDialogOpen // Only fetch users when dialog is open
            }
        ]
    });

    // Loading state
    if (adGroups.isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                    {props.name || 'LDAP Groups'}
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="body1" sx={{ mt: 3 }}>
                            Loading group data from LDAP...
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
    if (adGroups.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                    {props.name || 'LDAP Groups'}
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Error Loading Data</AlertTitle>
                    Failed to load LDAP group data. Please try refreshing the page.
                </Alert>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" color="error" gutterBottom>Error Details:</Typography>
                    <Typography variant="body2">
                        {adGroups.error.message || JSON.stringify(adGroups.error)}
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Data state
    if (adGroups.data) {
        // Sort data alphabetically by name
        const sortedData = adGroups.data.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Apply search filter
        const filteredGroups = sortedData.filter(group => {
            if (!searchTerm) return true;

            return (
                group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.distinguishedName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });

        // Apply additional filters
        const finalFilteredGroups = filteredGroups.filter(group => {
            const groupTypeFilter = !filters.groupType ||
                getGroupTypeLabel(group.groupType).toLowerCase().includes(filters.groupType.toLowerCase());

            const scopeFilter = !filters.scope ||
                (filters.scope === 'security' && group.groupType < 0) ||
                (filters.scope === 'distribution' && group.groupType > 0);

            return groupTypeFilter && scopeFilter;
        });

        // Get unique group type options for filters
        const groupTypeOptions = [...new Set(sortedData.map(group => getGroupTypeLabel(group.groupType)))];

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" color="primary" fontWeight="medium" gutterBottom>
                            {props.name || 'LDAP Groups'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Group information from Active Directory
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ mt: 1 }}
                    >
                        Create Group
                    </Button>
                </Box>

                {/* Search and filter controls */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                        <TextField
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1, maxWidth: 400 }}
                            slotProps={{
                                input: {
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
                                }
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

                    <Box>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => toggleExpandAll(finalFilteredGroups, true)}
                            startIcon={<ExpandMoreIcon />}
                            sx={{ mr: 1 }}
                        >
                            Expand All
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => toggleExpandAll(finalFilteredGroups, false)}
                            startIcon={<ExpandLessIcon />}
                        >
                            Collapse All
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Collapse in={showFilters}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Filters</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Group Type"
                                    size="small"
                                    fullWidth
                                    select
                                    slotProps={{ select: { native: true } }}
                                    value={filters.groupType}
                                    onChange={(e) => setFilters({ ...filters, groupType: e.target.value })}
                                >
                                    <option value="">Any Type</option>
                                    {groupTypeOptions.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Scope"
                                    size="small"
                                    fullWidth
                                    select
                                    slotProps={{ select: { native: true } }}
                                    value={filters.scope}
                                    onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
                                >
                                    <option value="">Any Scope</option>
                                    <option value="security">Security Groups</option>
                                    <option value="distribution">Distribution Groups</option>
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
                        Showing {finalFilteredGroups.length} of {sortedData.length} groups
                    </Typography>

                    {searchTerm && (
                        <Typography variant="body2" color="text.secondary">
                            Search: "{searchTerm}"
                        </Typography>
                    )}
                </Box>

                {/* Group list */}
                {finalFilteredGroups.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No groups match your search or filters
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
                    <Box>
                        {finalFilteredGroups.map(group => {
                            const isExpanded = expandedGroups[group.name] || false;
                            const groupTypeLabel = getGroupTypeLabel(group.groupType);
                            const groupTypeColor = getGroupTypeColor(group.groupType);
                            const createdDate = formatDate(group.whenCreated);
                            const modifiedDate = formatDate(group.whenChanged);

                            return (
                                <Card variant="outlined" sx={{ mb: 1 }} key={uuid()}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        {/* Group header - always visible */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => toggleGroupExpand(group.name)}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: groupTypeColor === 'primary' ? 'primary.main' : 'secondary.main',
                                                        width: 32,
                                                        height: 32
                                                    }}
                                                >
                                                    {group.groupType < 0 ? <SecurityIcon fontSize="small" /> : <GroupIcon fontSize="small" />}
                                                </Avatar>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight="medium"
                                                        sx={{ minWidth: 200 }}
                                                    >
                                                        {group.name}
                                                    </Typography>

                                                    <Chip
                                                        size="small"
                                                        color={groupTypeColor}
                                                        label={groupTypeLabel}
                                                        sx={{ mr: 2 }}
                                                    />

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                    >
                                                        <CalendarIcon fontSize="small" />
                                                        Created: {createdDate}
                                                    </Typography>

                                                    {group.description && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                maxWidth: 300,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            title={group.description}
                                                        >
                                                            {group.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleGroupExpand(group.name);
                                                }}
                                            >
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>

                                        {/* Expanded details */}
                                        <Collapse in={isExpanded}>
                                            <Divider sx={{ my: 2 }} />

                                            <Box sx={{ mb: 2 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<PersonAddIcon />}
                                                    onClick={() => handleOpenAddUsersDialog(group)}
                                                    size="small"
                                                >
                                                    Add Users to Group
                                                </Button>
                                            </Box>

                                            {/* Group Members Section */}
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                                    Group Members
                                                </Typography>

                                                {loadingMembers[group.name] ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                                                        <CircularProgress size={20} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Loading members...
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                                                        {groupMembers[group.name] && groupMembers[group.name].length > 0 ? (
                                                            <List dense disablePadding>
                                                                {groupMembers[group.name].map((member, index) => (
                                                                    <ListItem
                                                                        key={index}
                                                                        divider={index < groupMembers[group.name].length - 1}
                                                                        sx={{
                                                                            py: 1.5,
                                                                            px: 2,
                                                                            display: 'flex',
                                                                            alignItems: 'flex-start',
                                                                            width: '100%'
                                                                        }}
                                                                    >
                                                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                                                                {extractUserName(member).charAt(0).toUpperCase()}
                                                                            </Avatar>
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={extractUserName(member)}
                                                                            secondary={member}
                                                                            slotProps={{
                                                                                primary: {
                                                                                    sx: {
                                                                                        fontSize: '0.875rem',
                                                                                        fontWeight: 500,
                                                                                        wordBreak: 'break-word'
                                                                                    }
                                                                                },
                                                                                secondary: {
                                                                                    variant: 'caption',
                                                                                    sx: {
                                                                                        fontSize: '0.75rem',
                                                                                        display: 'block',
                                                                                        mt: 0.5,
                                                                                        wordBreak: 'break-all',
                                                                                        color: 'text.secondary'
                                                                                    }
                                                                                }
                                                                            }}
                                                                            sx={{
                                                                                my: 0,
                                                                                display: 'block'
                                                                            }}
                                                                        />
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        ) : (
                                                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {groupMembers[group.name] !== undefined ? 'No members found' : 'Members not loaded'}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                )}
                                            </Box>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                        Group Details
                                                    </Typography>

                                                    <TableContainer component={Paper} variant="outlined">
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
                                                                        Modified
                                                                    </TableCell>
                                                                    <TableCell>{modifiedDate}</TableCell>
                                                                </TableRow>

                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                                                        Group Type
                                                                    </TableCell>
                                                                    <TableCell>{group.groupType}</TableCell>
                                                                </TableRow>

                                                                {group.mail && (
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 'medium' }}>
                                                                            Email
                                                                        </TableCell>
                                                                        <TableCell>{group.mail}</TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                        Distinguished Name
                                                    </Typography>

                                                    <Box sx={{
                                                        p: 2,
                                                        backgroundColor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontSize: '0.875rem',
                                                        fontFamily: 'monospace',
                                                        wordBreak: 'break-all',
                                                        position: 'relative',
                                                        minHeight: 60
                                                    }}>
                                                        {group.distinguishedName}

                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                opacity: 0.7,
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                            onClick={() => copyToClipboard(group.distinguishedName)}
                                                            color={copiedText === group.distinguishedName ? "success" : "default"}
                                                        >
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Collapse>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}

                {/* Create Group Dialog */}
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New LDAP Group</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Group Name"
                            fullWidth
                            variant="outlined"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            sx={{ mt: 2 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isCreating) {
                                    handleCreateGroup();
                                }
                            }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            The group will be created in Active Directory.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateGroup}
                            variant="contained"
                            disabled={isCreating || !newGroupName.trim()}
                        >
                            {isCreating ? <CircularProgress size={20} /> : 'Create Group'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Users to Group Dialog */}
                <Dialog open={addUsersDialogOpen} onClose={handleCloseAddUsersDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        Add Users to Group: {selectedGroup?.name}
                    </DialogTitle>
                    <DialogContent>
                        {/* Search field for users */}
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search users..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            size="small"
                            sx={{ mb: 2, mt: 1 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />

                        {/* Selected users count */}
                        {selectedUsers.length > 0 && (
                            <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                                {selectedUsers.length} user(s) selected
                            </Typography>
                        )}

                        {/* Users list */}
                        <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            {adUsers.isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : adUsers.error ? (
                                <Box sx={{ p: 2 }}>
                                    <Typography color="error">Error loading users: {adUsers.error.message}</Typography>
                                </Box>
                            ) : adUsers.data ? (
                                <List dense>
                                    {adUsers.data
                                        .filter(user => {
                                            if (!userSearchTerm) return true;
                                            const searchLower = userSearchTerm.toLowerCase();
                                            return (
                                                user.name?.toLowerCase().includes(searchLower) ||
                                                user.mail?.toLowerCase().includes(searchLower) ||
                                                user.description?.toLowerCase().includes(searchLower)
                                            );
                                        })
                                        .sort((a, b) => a.name?.localeCompare(b.name))
                                        .map((user) => {
                                            const isSelected = selectedUsers.some(u => u.mail === user.mail);

                                            return (
                                                <ListItem key={user.distinguishedName} disablePadding>
                                                    <ListItemButton onClick={() => handleUserToggle(user)}>
                                                        <ListItemIcon>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                tabIndex={-1}
                                                                disableRipple
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={user.name}
                                                            secondary={user.mail}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })
                                    }
                                </List>
                            ) : (
                                <Box sx={{ p: 2 }}>
                                    <Typography color="text.secondary">No users data available</Typography>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseAddUsersDialog} disabled={isAddingUsers}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddUsersToGroup}
                            variant="contained"
                            disabled={isAddingUsers || selectedUsers.length === 0}
                            startIcon={isAddingUsers ? <CircularProgress size={16} /> : <PersonAddIcon />}
                        >
                            {isAddingUsers ? 'Adding...' : `Add ${selectedUsers.length} User(s)`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Notification Snackbar */}
                <Snackbar
                    open={notification.open}
                    autoHideDuration={6000}
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseNotification}
                        severity={notification.severity}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
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