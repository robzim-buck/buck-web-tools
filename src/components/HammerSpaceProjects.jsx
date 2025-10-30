import { 
  Chip, Typography, Box, Container, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Link,
  Select, MenuItem, FormControl, Snackbar
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState, useMemo } from 'react';
import { useQueries, useMutation } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceProjects(props) {
    const [s3Config, setS3Config] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const handleS3ConfigChange = (projectId, field, value) => {
        setS3Config(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                [field]: value
            }
        }));
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
    
    const handleCopyToS3 = (projectName) => {
        const config = s3Config[projectName] || {};
        const s3base = config.s3base || 'HS_Archive1';
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
            nasflag: false,
            location: location
        });
    };
    
    const [hammerspaceProjects] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceProjects"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace/projects", {
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

    if (hammerspaceProjects.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceProjects.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace projects</Typography>
                    <Typography variant="body2">{hammerspaceProjects.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceProjects.data) {
        const sortedData = Array.isArray(hammerspaceProjects.data) 
            ? hammerspaceProjects.data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];
        
        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace projects found</Typography>
                </Box>
            );
        }

        const activeProjects = sortedData.filter(project => 
            project.status && project.status.toLowerCase().includes('active')
        ).length;
        
        const projectTypes = [...new Set(sortedData.map(project => project.type).filter(Boolean))];
        const totalSize = sortedData.reduce((sum, project) => 
            sum + (project.size || 0), 0
        );

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Projects'}
                    </Typography>
                    <Chip 
                        label={`${sortedData.length} Projects`} 
                        color="primary" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

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
                        . Celery worker and flower server run on amscoresrv (systemctl status rzcelery, systemctl status rzflower), uses redis running on amscoresrv. (systemctl status redis).
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
                            {sortedData.map((project) => {
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
                                                    value={s3Config[project.name]?.s3base || 'HS_Archive1'}
                                                    onChange={(e) => handleS3ConfigChange(project.name, 's3base', e.target.value)}
                                                    displayEmpty
                                                    size="small"
                                                >
                                                    <MenuItem value="">-</MenuItem>
                                                    <MenuItem value="HS_Archive1">HS_Archive1</MenuItem>
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
            </Container>
        );
    }
    
    return null;
}