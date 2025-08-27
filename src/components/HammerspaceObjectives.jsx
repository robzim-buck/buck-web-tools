import { 
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StorageIcon from '@mui/icons-material/Storage';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerspaceObjectives(props) {
    const [expanded, setExpanded] = useState({});
    
    // Toggle expansion state for a specific objective
    const handleToggle = (objectiveId) => {
        setExpanded(prev => ({
            ...prev,
            [objectiveId]: !prev[objectiveId]
        }));
    };
    
    const [hammerspaceObjectives] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceObjectives"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=objectives", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch objectives: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceObjectives.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceObjectives.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace objectives</Typography>
                    <Typography variant="body2">{hammerspaceObjectives.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceObjectives.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerspaceObjectives raw data:', hammerspaceObjectives.data);
        
        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceObjectives.data.results || hammerspaceObjectives.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace objectives found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const recentObjectives = sortedData.filter(obj => {
            const daysSinceCreation = Math.floor((Date.now() - new Date(obj.created)) / (1000 * 60 * 60 * 24));
            return daysSinceCreation < 7;
        });
        
        const objectiveTypes = [...new Set(sortedData.map(obj => obj.type).filter(Boolean))];
        const averageAge = Math.floor(sortedData.reduce((sum, obj) => {
            return sum + Math.floor((Date.now() - new Date(obj.created)) / (1000 * 60 * 60 * 24));
        }, 0) / sortedData.length);

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Objectives'}
                    </Typography>
                    <Chip 
                        label={`${sortedData.length} Objectives`} 
                        color="primary" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                {/* Summary Statistics */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Total Objectives
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {recentObjectives.length}
                            </Typography>
                            <Typography variant="body2">
                                Created This Week
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {objectiveTypes.length}
                            </Typography>
                            <Typography variant="body2">
                                Unique Types
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {averageAge}
                            </Typography>
                            <Typography variant="body2">
                                Avg Age (days)
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '40px' }}>
                                    {/* Expand column */}
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Type
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarTodayIcon fontSize="small" />
                                        Created
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <UpdateIcon fontSize="small" />
                                        Modified
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Status
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((objective) => {
                                // Calculate time since creation and modification
                                const createdDate = new Date(objective.created);
                                const modifiedDate = new Date(objective.modified);
                                const daysSinceCreation = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
                                const daysSinceModification = Math.floor((Date.now() - modifiedDate) / (1000 * 60 * 60 * 24));
                                const isRecent = daysSinceCreation < 7; // Consider "recent" if created in the last 7 days
                                const objectiveKey = objective.name || objective.id;
                                
                                return (
                                    <>
                                        <TableRow 
                                            key={objectiveKey}
                                            sx={{ 
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: isRecent ? '4px solid #4caf50' : '4px solid white',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(objectiveKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[objectiveKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {objective.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {objective.type ? (
                                                    <Chip 
                                                        variant="outlined" 
                                                        color="secondary" 
                                                        size="small"
                                                        label={objective.type} 
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={createdDate.toLocaleString()}>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {createdDate.toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {daysSinceCreation === 0 ? 'Today' : 
                                                             daysSinceCreation === 1 ? 'Yesterday' : 
                                                             `${daysSinceCreation} days ago`}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={modifiedDate.toLocaleString()}>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {modifiedDate.toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {daysSinceModification === 0 ? 'Today' : 
                                                             daysSinceModification === 1 ? 'Yesterday' : 
                                                             `${daysSinceModification} days ago`}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {isRecent && (
                                                        <Chip 
                                                            variant="filled" 
                                                            color="success" 
                                                            size="small"
                                                            label="New" 
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                <Collapse in={expanded[objectiveKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            {objective.id && (
                                                                <Grid item xs={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Objective ID
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        {objective.id}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Timestamps
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    Created: {createdDate.toLocaleString()}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    Modified: {modifiedDate.toLocaleString()}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            {objective.description && (
                                                                <Grid item xs={12}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Description
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        {objective.description}
                                                                    </Typography>
                                                                </Grid>
                                                            )}

                                                            {/* Additional Properties */}
                                                            {Object.keys(objective).length > 5 && (
                                                                <Grid item xs={12}>
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
                                                                            {JSON.stringify(objective, null, 2)}
                                                                        </pre>
                                                                    </Box>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        );
    }
    
    // Fallback
    return null;
}