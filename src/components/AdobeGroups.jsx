import uuid from 'react-uuid';
import { useState, useMemo } from 'react';
import { useQueries, useQuery } from "@tanstack/react-query";
import { Typography, Button, IconButton, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar, Tooltip } from '@mui/material';
import { Chip, Grid, Box, Card, CardContent, Collapse, Paper, Alert } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { useProtectedApiGet } from '../hooks/useApi';

export default function AdobeGroups(props) {
    const [groupFilter, setGroupFilter] = useState('');   
    const [typeFilter, setTypeFilter] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);

    const [adobeGroups] = useQueries({
        queries: [
          {
            queryKey: ["adobeGroups"],
            queryFn: () =>
            fetch("https://laxcoresrv.buck.local:8000/adobe_groups").then((res) => res.json()),
        },
        ]
    });

    // Fetch Google staff users
    const googleStaffUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
        queryParams: { status: 'active', emp_type: 'Staff' },
        queryConfig: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: 1000
        }
    });

    // Fetch Google freelance users
    const googleFreelanceUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
        queryParams: { status: 'active', emp_type: 'Freelance' },
        queryConfig: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: 1000
        },
        dependencies: ['freelance'] // Add to query key to differentiate from staff query
    });

    // Combine and process Google users data
    const googleUsers = useMemo(() => {
        if (googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading) {
            return [];
        }
        
        if (googleStaffUsersQuery.error || googleFreelanceUsersQuery.error) {
            console.error("Error fetching Google users");
            return [];
        }

        const staffData = googleStaffUsersQuery.data || [];
        const freelanceData = googleFreelanceUsersQuery.data || [];
        
        // Combine both sets of users
        const data = [...staffData, ...freelanceData];
        console.log("Combined Google users for Adobe Groups:", data.length);
        
        // Process Google user data to normalize thumbnail URLs
        const processedData = data.map(user => {
            // Check for thumbnail in various possible property names
            const thumbnailUrl = user?.thumbnailPhotoUrl || user?.thumbnail || user?.photo || user?.photoUrl;
            
            if (thumbnailUrl && !user.thumbnailPhotoUrl) {
                // Add standardized property name if found in an alternative property
                return { ...user, thumbnailPhotoUrl: thumbnailUrl };
            }
            
            return user;
        });
        
        // Count users with thumbnails
        const usersWithThumbnails = processedData.filter(user => user.thumbnailPhotoUrl).length;
        console.log(`Google users with thumbnails for Adobe Groups: ${usersWithThumbnails}`);
        
        return processedData;
    }, [googleStaffUsersQuery.data, googleFreelanceUsersQuery.data, 
        googleStaffUsersQuery.isLoading, googleFreelanceUsersQuery.isLoading,
        googleStaffUsersQuery.error, googleFreelanceUsersQuery.error]);
    
    // Create Google user lookup by email
    const googleUsersByEmail = useMemo(() => {
        if (!googleUsers.length) return {};
        
        const emailMap = {};
        
        googleUsers.forEach(user => {
            if (user?.primaryEmail) {
                emailMap[user.primaryEmail.toLowerCase()] = user;
                
                // Also store by username part only (before the @) for flexible matching
                const username = user.primaryEmail.split('@')[0].toLowerCase();
                if (username) {
                    emailMap[username] = user;
                }
            }
        });
        
        console.log(`Created Google user map for Adobe Groups with ${Object.keys(emailMap).length} entries`);
        return emailMap;
    }, [googleUsers]);
    
    // Helper function to get Google user for an Adobe group member
    const getGoogleUserForAdobeUser = (adobeUser) => {
        if (!adobeUser?.email && !adobeUser?.username) return null;

        const email = adobeUser.email?.toLowerCase() || adobeUser.username?.toLowerCase();
        if (!email) return null;

        // Try exact email match first
        if (googleUsersByEmail[email]) {
            return googleUsersByEmail[email];
        }

        // Try username part only
        const username = email.split('@')[0].toLowerCase();
        if (username && googleUsersByEmail[username]) {
            return googleUsersByEmail[username];
        }

        return null;
    };

    const clearGroupFilter = () => {
        setGroupFilter('');
    }
    
    const clearTypeFilter = () => {
        setTypeFilter('');
    }
    
    const toggleGroupExpand = (groupId, groupName) => {
        const isCurrentlyExpanded = expandedGroups[groupId] || false;
        
        // Update expanded state
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !isCurrentlyExpanded
        }));
        
        // If expanding, set the selected group to fetch members
        if (!isCurrentlyExpanded) {
            setSelectedGroup({
                id: groupId,
                name: groupName
            });
        } else {
            setSelectedGroup(null);
        }
    }

    // Check if any data is still loading
    const isLoadingComplete = adobeGroups.isLoading || 
                              googleStaffUsersQuery.isLoading || 
                              googleFreelanceUsersQuery.isLoading;

    if (isLoadingComplete) return <CircularProgress></CircularProgress>;
    if (adobeGroups.error) return "An error has occurred: " + adobeGroups.error.message;
    if (adobeGroups.data) {
        // Sort data by group name
        let sortedData = adobeGroups.data.sort((a, b) => a.groupName.localeCompare(b.groupName));
        
        // Initialize filtered data
        let filteredData = sortedData;
        
        // Apply filters if they exist
        if (groupFilter.length > 0) {
            filteredData = filteredData.filter((f) => f.groupName.toLowerCase().includes(groupFilter.toLowerCase()));
        }

        if (typeFilter.length > 0) {
            filteredData = filteredData.filter((f) => f.type.toLowerCase().includes(typeFilter.toLowerCase()));
        }

        // Count different group types for summary
        const typeCount = (list, type) => {
            return list.reduce((counter, item) => item.type === type ? ++counter : counter, 0);
        };

        // Get unique types for displaying in summary
        const uniqueTypes = [...new Set(sortedData.map(item => item.type))];

        return (
            <>
            <Box sx={{ margin: 2 }}>
                <Typography variant='h4' color="primary" gutterBottom>
                    {props.name} Groups
                </Typography>
                
                <Card 
                    variant="outlined" 
                    sx={{ 
                        mb: 4, 
                        p: 2, 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 2
                    }}
                >
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Top 10 Groups by Member Count
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[...sortedData]
                                    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                                    .slice(0, 10)
                                    .map((group) => (
                                        <Chip
                                            key={group.groupId}
                                            label={`${group.memberCount || 0} ${group.groupName}`}
                                            color="info"
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))
                                }
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                    label={`${sortedData.length} Total Groups`}
                                    color="primary"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Filters</Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ minWidth: 120 }}>
                                            Group Filter:
                                        </Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <input 
                                                id="groupfilter"
                                                name="groupfilter"
                                                type="text"
                                                value={groupFilter}
                                                placeholder="Filter by group name..."
                                                onChange={event => setGroupFilter(event.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 12px', 
                                                    border: '1px solid #ccc', 
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </Box>
                                        <Button 
                                            onClick={clearGroupFilter} 
                                            size="small" 
                                            variant="outlined" 
                                            color="secondary"
                                            disabled={!groupFilter}
                                        >
                                            Clear
                                        </Button>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ minWidth: 120 }}>
                                            Type Filter:
                                        </Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <input 
                                                id="typefilter"
                                                name="typefilter"
                                                type="text"
                                                value={typeFilter}
                                                placeholder="Filter by group type..."
                                                onChange={event => setTypeFilter(event.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 12px', 
                                                    border: '1px solid #ccc', 
                                                    borderRadius: '4px' 
                                                }}
                                            />
                                        </Box>
                                        <Button 
                                            onClick={clearTypeFilter} 
                                            size="small" 
                                            variant="outlined" 
                                            color="secondary"
                                            disabled={!typeFilter}
                                        >
                                            Clear
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Card>

                {/* Check if we have groups */}
                {!filteredData || filteredData.length === 0 ? (
                    <Typography>No groups found with the current filters</Typography>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="primary">
                                Found {filteredData.length} groups
                            </Typography>
                            <Chip 
                                label={`${filteredData.length} Groups`} 
                                color="primary" 
                                variant="outlined" 
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Box>
                        
                        {filteredData.map(group => {
                            if (!group || !group.groupName) return null;
                            
                            const isExpanded = expandedGroups[group.groupId] || false;
                            
                            return (
                                <Card 
                                    key={uuid()} 
                                    variant="outlined" 
                                    sx={{ 
                                        mb: 2, 
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        borderLeft: '4px solid #4caf50',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Grid container alignItems="center" spacing={1}>
                                            {/* Avatar */}
                                            <Grid size={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        bgcolor: 'primary.light',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {group.groupName.charAt(0).toUpperCase()}
                                                </Box>
                                            </Grid>

                                            {/* Group Name */}
                                            <Grid size={4}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {group.groupName}
                                                </Typography>
                                            </Grid>

                                            {/* Type Chip */}
                                            <Grid size={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Chip
                                                    label={group.type}
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                />
                                            </Grid>

                                            {/* Member Count */}
                                            <Grid size={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Chip
                                                    label={`${group.memberCount} members`}
                                                    size="small"
                                                    variant="outlined"
                                                    color="info"
                                                />
                                            </Grid>

                                            {/* Group ID */}
                                            <Grid size={2}>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {group.groupId}
                                                </Typography>
                                            </Grid>
                                            
                                            {/* Show/Hide Button */}
                                            <Grid size={1.5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    aria-label={isExpanded ? 'Hide Details' : 'Show Details'}
                                                    size="small"
                                                    variant="contained"
                                                    color={isExpanded ? "secondary" : "primary"}
                                                    onClick={() => toggleGroupExpand(group.groupId, group.groupName)}
                                                    sx={{
                                                        minWidth: 80,
                                                        borderRadius: 8
                                                    }}
                                                >
                                                    {isExpanded ? 'Hide' : 'Show'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        
                                        <Collapse in={isExpanded}>
                                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                                                    Group Details
                                                </Typography>
                                                
                                                <Card 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        mb: 2, 
                                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                                        borderColor: 'rgba(0,0,0,0.09)'
                                                    }}
                                                >
                                                    <CardContent sx={{ py: 2 }}>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Admin Group Name
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                    {group.adminGroupName ? group.adminGroupName : 'None'}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Profile Group Name
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group.profileGroupName ? group.profileGroupName : 'None'}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Member Count
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group.memberCount} members
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Group Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group.type}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Group ID
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {group.groupId}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                                
                                                {/* Group Members Section */}
                                                {selectedGroup && selectedGroup.id === group.groupId && (
                                                    <Box sx={{ mt: 3 }}>
                                                        <Divider sx={{ mb: 2 }} />
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center' }}>
                                                            <GroupIcon sx={{ mr: 1 }} /> Group Members
                                                        </Typography>
                                                        <GroupMembers 
                                                            groupName={group.groupName} 
                                                            getGoogleUserForAdobeUser={getGoogleUserForAdobeUser}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </>
                )}
            </Box>
            </>
        );
    }
    return (
        <>
        <Typography variant='h3'>{props.name} Groups</Typography>
        <Box sx={{ display: 'flex' }}>
            <CircularProgress color="inherit"></CircularProgress>
        </Box>
        </>
    );
}

// Group Members Component
function GroupMembers({ groupName, getGoogleUserForAdobeUser }) {
    // URL encode the group name for the API request
    const encodedGroupName = encodeURIComponent(groupName);
    
    // Log the API URL for debugging
    console.log(`Fetching users for group: ${groupName}`);
    console.log(`API URL: https://laxcoresrv.buck.local:8000/adobe_users_in_group?group=${encodedGroupName}`);
    
    // Fetch group members
    const { data, isLoading, error } = useQuery({
        queryKey: ["adobeGroupMembers", encodedGroupName],
        queryFn: () => fetch(
            `https://laxcoresrv.buck.local:8000/adobe_users_in_group?group=${encodedGroupName}`,
            {
                method: 'GET',
                headers: {
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            }
        )
        .then(res => {
            if (!res.ok) {
                console.error(`Error fetching group members: ${res.status} ${res.statusText}`);
                throw new Error(`API responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`Received data for ${groupName}:`, data);
            
            // Check for throttling response
            if (Array.isArray(data) && data.length === 1 && 
                typeof data[0] === 'string' && data[0].includes('throttled')) {
                throw new Error(`API throttled: ${data[0]}`);
            }
            
            // Handle the nested users format
            if (data && typeof data === 'object' && data.result === 'success' && Array.isArray(data.users)) {
                console.log(`Found ${data.users.length} users in nested format`);
                return data.users;
            }
            
            return data;
        })
        .catch(err => {
            console.error(`Error in group members fetch for ${groupName}:`, err);
            throw err;
        })
    });
    
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={30} />
            </Box>
        );
    }
    
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading group members: {error.message}
            </Alert>
        );
    }
    
    if (!data) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No data received for this group. Please check the console for more information.
            </Alert>
        );
    }
    
    if (!Array.isArray(data)) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                Unexpected data format received: {typeof data === 'object' ? JSON.stringify(data) : String(data)}.
            </Alert>
        );
    }
    
    if (data.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No members found in the group "{groupName}".
            </Alert>
        );
    }
    
    return (
        <Card variant="outlined" sx={{ mt: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ 
                p: 2, 
                backgroundColor: 'primary.main', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} /> 
                    Members of "{groupName}"
                </Typography>
                <Chip 
                    label={`${data.length} ${data.length === 1 ? 'Member' : 'Members'}`}
                    color="secondary"
                    size="small"
                    sx={{ fontWeight: 'bold', color: 'white' }}
                />
            </Box>
            
            <Divider />
            
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    {data.map((user, index) => {
                        // Get initials for avatar
                        let initials = '';
                        if (user.firstname && user.lastname) {
                            // If we have first and last name, use those for initials
                            initials = (user.firstname.charAt(0) + user.lastname.charAt(0)).toUpperCase();
                        } else {
                            // Fall back to name or other fields
                            const name = user.name || user.userName || user.username || user.email || '';
                            initials = name.split(' ')
                                .map(part => part.charAt(0))
                                .join('')
                                .toUpperCase()
                                .substring(0, 2);
                        }

                        // Get Google user data for this Adobe user
                        const googleUser = getGoogleUserForAdobeUser ? getGoogleUserForAdobeUser(user) : null;
                        const isFreelance = googleUser?.organizations &&
                                          googleUser.organizations[0]?.costCenter &&
                                          googleUser.organizations[0].costCenter.toLowerCase() === 'freelance';
                            
                        return (
                            <ListItem 
                                key={uuid()} 
                                divider={index < data.length - 1}
                                sx={{ 
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ListItemAvatar>
                                    {googleUser?.thumbnailPhotoUrl ? (
                                        <Tooltip title={isFreelance ? "Freelancer - Google profile photo" : "Google profile photo"}>
                                            <Avatar 
                                                src={googleUser.thumbnailPhotoUrl}
                                                alt={initials}
                                                onError={() => {
                                                    console.log("Image failed to load for:", user.email || user.username);
                                                }}
                                                sx={{ 
                                                    bgcolor: initials ? 'primary.light' : 'primary.main',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    border: isFreelance
                                                        ? '2px solid #f50057'  // Freelancer border
                                                        : '2px solid #8c9eff', // Staff border
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    '& img': {
                                                        loading: 'lazy'
                                                    }
                                                }}
                                            >
                                                {initials || <PersonIcon />}
                                            </Avatar>
                                        </Tooltip>
                                    ) : (
                                        <Avatar 
                                            sx={{ 
                                                bgcolor: initials ? 'primary.light' : 'primary.main',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                border: '2px solid #8c9eff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {initials || <PersonIcon />}
                                        </Avatar>
                                    )}
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {/* Format name from firstname/lastname if available */}
                                                {user.firstname && user.lastname 
                                                    ? `${user.firstname} ${user.lastname}`
                                                    : user.name || user.userName || user.username || user.email || 'Unknown User'}
                                            </Typography>
                                            {isFreelance && (
                                                <Chip 
                                                    label="Freelance" 
                                                    size="small" 
                                                    color="error" 
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                {user.email || 'No email available'}
                                            </Typography>
                                            {user.username && user.username !== user.email && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Username: {user.username}
                                                </Typography>
                                            )}
                                            {user.status && (
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        ml: 1,
                                                        color: user.status === 'active' ? 'success.main' : 'warning.main',
                                                        fontWeight: 'medium'
                                                    }}
                                                >
                                                    ({user.status})
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {user.type && (
                                        <Chip 
                                            label={user.type} 
                                            size="small" 
                                            color="secondary" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {user.country && (
                                        <Chip 
                                            label={user.country} 
                                            size="small" 
                                            color="info" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {user.domain && (
                                        <Chip 
                                            label={user.domain} 
                                            size="small" 
                                            color="default" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {user.id && (
                                        <Tooltip title={user.id}>
                                            <Chip 
                                                label="ID" 
                                                size="small" 
                                                color="default" 
                                                variant="outlined" 
                                                sx={{ opacity: 0.6 }}
                                            />
                                        </Tooltip>
                                    )}
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
            
            {data.length > 10 && (
                <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                        Showing all {data.length} members of this group
                    </Typography>
                </Box>
            )}
        </Card>
    );
}