import {
  Chip, Typography, Box, Container, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Link, TextField, Grid,
  Select, MenuItem, FormControl, InputLabel, Snackbar
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState, useEffect } from 'react';
import { useQueries, useMutation } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function NASProjects(props) {
    const [s3Config, setS3Config] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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
            case 'ams':
                return 'AMSArchive2';       // AMS uses AMSArchive2
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

    const filterProjects = (projects) => {
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
    };

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
    }, [nasProjects.data]);

    if (nasProjects.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (nasProjects.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load NAS projects</Typography>
                    <Typography variant="body2">{nasProjects.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (nasProjects.data) {
        const sortedData = Array.isArray(nasProjects.data)
            ? nasProjects.data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];

        const filteredData = filterProjects(sortedData);

        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No NAS projects found</Typography>
                </Box>
            );
        }

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'NAS Projects'}
                    </Typography>
                    <Chip
                        label={`${filteredData.length} of ${sortedData.length} Projects`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Filters
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Filter by Name"
                                variant="outlined"
                                value={filters.name}
                                onChange={(e) => handleFilterChange('name', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Filter by Host"
                                variant="outlined"
                                value={filters.host}
                                onChange={(e) => handleFilterChange('host', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Filter by Location</InputLabel>
                                <Select
                                    value={filters.location}
                                    label="Filter by Location"
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                >
                                    <MenuItem value="">All Locations</MenuItem>
                                    <MenuItem value="syd">syd</MenuItem>
                                    <MenuItem value="nyc">nyc</MenuItem>
                                    <MenuItem value="ams">ams</MenuItem>
                                    <MenuItem value="lax">lax</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {filteredData.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No projects match the current filters
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Try adjusting your filters or clearing them to see more projects
                        </Typography>
                    </Box>
                )}

                {filteredData.length > 0 && (
                    <>
                        <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <Link 
                            href="http://amscoresrv.buck.local:5555/tasks" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ fontWeight: 'medium' }}
                        >
                            Use this link to see job status
                        </Link>
                        . Celery worker runs on amscoresrv (screen -ls, screen -r celery), uses redis running on amscoresrv. (systemctl status redis).
                    </Typography>
                </Alert>


                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FolderIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Host
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Location
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    S3 Base
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((project) => {
                                const projectKey = project.id || project.name || Math.random().toString();
                                
                                return (
                                    <TableRow 
                                        key={projectKey}
                                        sx={{ 
                                            '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                            '&:hover': { bgcolor: 'action.selected' }
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {project.name || 'Unnamed Project'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {project.host || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 80 }}>
                                                <Select
                                                    value={s3Config[project.name]?.location || ''}
                                                    onChange={(e) => handleS3ConfigChange(project.name, 'location', e.target.value)}
                                                    displayEmpty
                                                    size="small"
                                                >
                                                    <MenuItem value="">-</MenuItem>
                                                    <MenuItem value="syd">syd</MenuItem>
                                                    <MenuItem value="nyc">nyc</MenuItem>
                                                    <MenuItem value="ams">ams</MenuItem>
                                                    <MenuItem value="lax">lax</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <Select
                                                    value={s3Config[project.name]?.s3base || ''}
                                                    onChange={(e) => handleS3ConfigChange(project.name, 's3base', e.target.value)}
                                                    displayEmpty
                                                    size="small"
                                                >
                                                    <MenuItem value="">-</MenuItem>
                                                    <MenuItem value="NY_Archive17">NY_Archive17</MenuItem>
                                                    <MenuItem value="SYDArchive2">SYDArchive2</MenuItem>
                                                    <MenuItem value="LA_Archive8">LA_Archive8</MenuItem>
                                                    <MenuItem value="AMSArchive2">AMSArchive2</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<CloudUploadIcon />}
                                                onClick={() => handleCopyToS3(project.name)}
                                                disabled={copyToS3Mutation.isPending}
                                                sx={{ minWidth: 100 }}
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
                
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert 
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                        severity={snackbar.severity} 
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
                    </>
                )}
            </Container>
        );
    }
    
    return null;
}