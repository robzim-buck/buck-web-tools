import {
  Chip, Typography, Box, Container, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Link, TextField, Grid, Card, CardContent, CardActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, InputAdornment,
  ToggleButtonGroup, ToggleButton, Fade, Tooltip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import StorageIcon from '@mui/icons-material/Storage';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import DnsIcon from '@mui/icons-material/Dns';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueries, useMutation } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function NASProjects(props) {
    const [s3Config, setS3Config] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [filters, setFilters] = useState({
        name: '',
        host: '',
        location: ''
    });

    // Get default location based on host/NAS
    const getDefaultLocation = (host) => {
        if (!host) return '';
        const hostLower = host.toLowerCase();

        // Check for each NAS host and set appropriate location
        if (hostLower.includes('abadal')) {
            return 'lax';  // abadal is in LAX
        }
        if (hostLower.includes('caddy')) {
            return 'nyc';  // caddy is in NYC
        }
        if (hostLower.includes('mavis')) {
            return 'syd';  // mavis is in SYD
        }
        // Add any other NAS hosts here if needed

        return '';  // Return empty if no match
    };

    // Get default S3 base based on location
    const getDefaultS3Base = (location) => {
        if (!location) return '';

        // Map each location to its corresponding S3 archive
        switch(location.toLowerCase()) {
            case 'lax':
                return 'LA_Archive8';      // LAX uses LA_Archive8
            case 'nyc':
                return 'NY_Archive17';      // NYC uses NY_Archive17
            case 'syd':
                return 'SYDArchive2';       // SYD uses SYDArchive2
            default:
                return '';                  // Return empty if no match
        }
    };

    const handleS3ConfigChange = (projectId, field, value) => {
        setS3Config(prev => {
            const updatedConfig = {
                ...prev[projectId],
                [field]: value
            };

            // If location changed, also set default S3 base
            if (field === 'location') {
                const defaultS3Base = getDefaultS3Base(value);
                if (defaultS3Base) {
                    updatedConfig.s3base = defaultS3Base;
                }
            }

            return {
                ...prev,
                [projectId]: updatedConfig
            };
        });
    };

    const copyToS3Mutation = useMutation({
        mutationFn: async ({ projectName, s3base, nasflag, location }) => {
            const response = await fetch(
                `https://laxcoresrv.buck.local:8000/utils/celery_copy_to_s3/${projectName}/${s3base}/${nasflag}/${location}`,
                {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                }
            );
            if (!response.ok) {
                throw new Error(`Failed to copy to S3: ${response.statusText}`);
            }
            return response.json();
        },
        onSuccess: (data, variables) => {
            const resultMessage = typeof data === 'object'
                ? `Copy initiated for ${variables.projectName}. Task ID: ${data.task_id || 'N/A'}. Status: ${data.status || 'Started'}. ${data.message || ''}`
                : `Copy initiated for ${variables.projectName}. Response: ${JSON.stringify(data)}`;

            setSnackbar({
                open: true,
                message: resultMessage,
                severity: 'success'
            });
        },
        onError: (error, variables) => {
            setSnackbar({
                open: true,
                message: `Failed to copy ${variables.projectName}: ${error.message}`,
                severity: 'error'
            });
        }
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filterProjects = useCallback((projects) => {
        if (!Array.isArray(projects)) return [];

        return projects.filter(project => {
            const nameMatch = !filters.name ||
                (project.name || '').toLowerCase().includes(filters.name.toLowerCase());
            const hostMatch = !filters.host ||
                (project.host || '').toLowerCase().includes(filters.host.toLowerCase());
            const locationMatch = !filters.location ||
                (s3Config[project.name]?.location || '').toLowerCase() === filters.location.toLowerCase();

            return nameMatch && hostMatch && locationMatch;
        });
    }, [filters, s3Config]);

    const handleCopyToS3 = (projectName) => {
        const config = s3Config[projectName] || {};
        const s3base = config.s3base || '';
        const location = config.location;

        if (!location) {
            setSnackbar({
                open: true,
                message: 'Please select a Location',
                severity: 'warning'
            });
            return;
        }

        // Show immediate feedback
        setSnackbar({
            open: true,
            message: 'Starting the copy in celery, hang on for 15 seconds while the copy starts',
            severity: 'info'
        });

        copyToS3Mutation.mutate({
            projectName,
            s3base: s3base,
            nasflag: true,
            location: location
        });
    };

    const [nasProjects] = useQueries({
        queries: [
          {
            queryKey: ["nasProjects"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/utils/all_nas_projects", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch projects: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    // Memoize sorted data - must be before any conditional returns
    const sortedData = useMemo(() => {
        if (!nasProjects.data) return [];
        return Array.isArray(nasProjects.data)
            ? [...nasProjects.data].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];
    }, [nasProjects.data]);

    // Memoize filtered data - recalculates when filters or s3Config changes
    const filteredData = useMemo(() => {
        return filterProjects(sortedData);
    }, [sortedData, filterProjects]);

    // Set default locations and S3 base based on host when data loads
    useEffect(() => {
        if (nasProjects.data && Array.isArray(nasProjects.data)) {
            const newConfig = {};
            nasProjects.data.forEach(project => {
                if (project.name && project.host) {
                    const defaultLocation = getDefaultLocation(project.host);
                    if (defaultLocation && !s3Config[project.name]?.location) {
                        const defaultS3Base = getDefaultS3Base(defaultLocation);
                        newConfig[project.name] = {
                            ...s3Config[project.name],
                            location: defaultLocation,
                            s3base: defaultS3Base
                        };
                    }
                }
            });
            if (Object.keys(newConfig).length > 0) {
                setS3Config(prev => ({ ...prev, ...newConfig }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nasProjects.data]);

    if (nasProjects.isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    py: 8,
                    gap: 3
                }}
            >
                <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ color: '#666' }}>Loading NAS Projects...</Typography>
            </Box>
        );
    }

    if (nasProjects.error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        '& .MuiAlert-icon': { color: 'white' }
                    }}
                >
                    <Typography variant="h6" gutterBottom>Failed to load NAS projects</Typography>
                    <Typography variant="body2">{nasProjects.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (!sortedData || sortedData.length === 0) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box
                    sx={{
                        p: 8,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: 4
                    }}
                >
                    <DnsIcon sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>
                        No NAS projects found
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box
                sx={{
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                        }}
                    >
                        <DnsIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant='h4' sx={{ fontWeight: 700, color: '#2d3748' }}>
                            {props.name || 'NAS Projects'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
                            Manage and archive NAS projects
                        </Typography>
                    </Box>
                </Box>
                <Chip
                    label={`${filteredData.length} of ${sortedData.length} Projects`}
                    sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        px: 2,
                        py: 2.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                />
            </Box>

            {/* Info Alert */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    p: 2.5,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #667eea',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CloudQueueIcon sx={{ color: '#667eea', fontSize: 28 }} />
                    <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        <Link
                            href="http://amscoresrv.buck.local:5555/tasks"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                fontWeight: 600,
                                color: '#667eea',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            View job status
                        </Link>
                        {' • '}Celery worker runs on amscoresrv
                    </Typography>
                </Box>
            </Paper>

            {/* Filters and View Toggle */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    background: 'white'
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Filter by Name"
                            value={filters.name}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FilterListIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    )
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': { borderColor: '#667eea' },
                                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Filter by Host"
                            value={filters.host}
                            onChange={(e) => handleFilterChange('host', e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DnsIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    )
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': { borderColor: '#667eea' },
                                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Location</InputLabel>
                            <Select
                                value={filters.location}
                                label="Filter by Location"
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                sx={{
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                                }}
                            >
                                <MenuItem value="">All Locations</MenuItem>
                                <MenuItem value="syd">Sydney</MenuItem>
                                <MenuItem value="nyc">New York</MenuItem>
                                <MenuItem value="lax">Los Angeles</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => newMode && setViewMode(newMode)}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="card" aria-label="card view">
                                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                Cards
                            </ToggleButton>
                            <ToggleButton value="table" aria-label="table view">
                                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                                Table
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {filteredData.length === 0 ? (
                <Box
                    sx={{
                        p: 8,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: 4
                    }}
                >
                    <FilterListIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        No projects match the current filters
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Try adjusting your filters to see more projects
                    </Typography>
                </Box>
            ) : viewMode === 'card' ? (
                /* Card View */
                <Grid container spacing={3}>
                    {filteredData.map((project, index) => {
                        const projectKey = `${project.name || 'unnamed'}-${project.host || 'nohost'}`;

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={projectKey}>
                                <Fade in timeout={300 + index * 50}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 3,
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)',
                                                borderColor: '#667eea'
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: 4,
                                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <FolderIcon sx={{ fontSize: 24, color: 'white' }} />
                                                </Box>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Tooltip title={project.name || 'Unnamed Project'}>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#2d3748',
                                                                fontSize: '1rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {project.name || 'Unnamed Project'}
                                                        </Typography>
                                                    </Tooltip>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <DnsIcon sx={{ fontSize: 14, color: '#a0aec0' }} />
                                                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                                            {project.host || 'No host'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <LocationOnIcon sx={{ fontSize: 18, color: '#667eea' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#718096' }}>
                                                            Location
                                                        </Typography>
                                                    </Box>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={s3Config[project.name]?.location || ''}
                                                            onChange={(e) => handleS3ConfigChange(project.name, 'location', e.target.value)}
                                                            displayEmpty
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 2,
                                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                                                            }}
                                                        >
                                                            <MenuItem value="">Select Location</MenuItem>
                                                            <MenuItem value="syd">Sydney</MenuItem>
                                                            <MenuItem value="nyc">New York</MenuItem>
                                                            <MenuItem value="lax">Los Angeles</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Box>

                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <CloudQueueIcon sx={{ fontSize: 18, color: '#667eea' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#718096' }}>
                                                            S3 Base
                                                        </Typography>
                                                    </Box>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={s3Config[project.name]?.s3base || ''}
                                                            onChange={(e) => handleS3ConfigChange(project.name, 's3base', e.target.value)}
                                                            displayEmpty
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 2,
                                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                                                            }}
                                                        >
                                                            <MenuItem value="">Select S3 Base</MenuItem>
                                                            <MenuItem value="NY_Archive17">NY_Archive17</MenuItem>
                                                            <MenuItem value="SYDArchive2">SYDArchive2</MenuItem>
                                                            <MenuItem value="LA_Archive8">LA_Archive8</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            </Box>
                                        </CardContent>

                                        <CardActions sx={{ p: 2, pt: 0 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<CloudUploadIcon />}
                                                onClick={() => handleCopyToS3(project.name)}
                                                disabled={copyToS3Mutation.isPending}
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1.2,
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                                                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                                                    },
                                                    '&:disabled': {
                                                        background: '#cbd5e0',
                                                        color: '#a0aec0'
                                                    }
                                                }}
                                            >
                                                {copyToS3Mutation.isPending ? 'Copying...' : 'Copy to S3'}
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Fade>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                /* Table View */
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden'
                    }}
                >
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FolderIcon fontSize="small" />
                                        Project Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DnsIcon fontSize="small" />
                                        Host
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOnIcon fontSize="small" />
                                        Location
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CloudQueueIcon fontSize="small" />
                                        S3 Base
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((project, index) => {
                                const projectKey = `${project.name || 'unnamed'}-${project.host || 'nohost'}`;

                                return (
                                    <TableRow
                                        key={projectKey}
                                        sx={{
                                            bgcolor: index % 2 === 0 ? 'white' : 'rgba(102, 126, 234, 0.03)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: 'rgba(102, 126, 234, 0.08)',
                                                transform: 'scale(1.01)'
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 1.5,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <FolderIcon sx={{ fontSize: 18, color: 'white' }} />
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                                    {project.name || 'Unnamed Project'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <DnsIcon sx={{ fontSize: 16, color: '#a0aec0' }} />
                                                <Typography variant="body2" sx={{ color: '#4a5568' }}>
                                                    {project.host || '-'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                                <Select
                                                    value={s3Config[project.name]?.location || ''}
                                                    onChange={(e) => handleS3ConfigChange(project.name, 'location', e.target.value)}
                                                    displayEmpty
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select Location</MenuItem>
                                                    <MenuItem value="syd">Sydney</MenuItem>
                                                    <MenuItem value="nyc">New York</MenuItem>
                                                    <MenuItem value="lax">Los Angeles</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                                <Select
                                                    value={s3Config[project.name]?.s3base || ''}
                                                    onChange={(e) => handleS3ConfigChange(project.name, 's3base', e.target.value)}
                                                    displayEmpty
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                                                    }}
                                                >
                                                    <MenuItem value="">Select S3 Base</MenuItem>
                                                    <MenuItem value="NY_Archive17">NY_Archive17</MenuItem>
                                                    <MenuItem value="SYDArchive2">SYDArchive2</MenuItem>
                                                    <MenuItem value="LA_Archive8">LA_Archive8</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<CloudUploadIcon />}
                                                onClick={() => handleCopyToS3(project.name)}
                                                disabled={copyToS3Mutation.isPending}
                                                sx={{
                                                    borderRadius: 2,
                                                    px: 2.5,
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                                                    },
                                                    '&:disabled': {
                                                        background: '#cbd5e0',
                                                        color: '#a0aec0'
                                                    }
                                                }}
                                            >
                                                {copyToS3Mutation.isPending ? 'Copying...' : 'Copy'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
