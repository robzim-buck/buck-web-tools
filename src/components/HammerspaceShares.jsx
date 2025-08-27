import { 
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import StorageIcon from '@mui/icons-material/Storage';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerspaceShares(props) {
    const [expanded, setExpanded] = useState({});
    
    // Toggle expansion state for a specific share
    const handleToggle = (shareId) => {
        setExpanded(prev => ({
            ...prev,
            [shareId]: !prev[shareId]
        }));
    };
    
    const [hammerspaceShares] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceShares"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=shares", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch shares: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceShares.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceShares.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace shares</Typography>
                    <Typography variant="body2">{hammerspaceShares.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceShares.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerspaceShares raw data:', hammerspaceShares.data);
        
        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceShares.data.results || hammerspaceShares.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace shares found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const totalObjectives = sortedData.reduce((sum, share) => 
            sum + (share.shareObjectives ? share.shareObjectives.length : 0), 0
        );
        
        const shareStates = [...new Set(sortedData.map(share => share.shareState).filter(Boolean))];
        const activeShares = sortedData.filter(share => 
            share.shareState && share.shareState.toLowerCase().includes('active')
        ).length;

        // Determine status color based on share state
        const getStatusColor = (state) => {
            const stateLower = state ? state.toLowerCase() : '';
            if (stateLower.includes('active') || stateLower.includes('online')) return '#4caf50';
            if (stateLower.includes('warn') || stateLower.includes('partial')) return '#ff9800';
            if (stateLower.includes('error') || stateLower.includes('offline')) return '#f44336';
            return '#2196f3'; // default blue
        };

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Shares'}
                    </Typography>
                    <Chip 
                        label={`${sortedData.length} Shares`} 
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
                                Total Shares
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {activeShares}
                            </Typography>
                            <Typography variant="body2">
                                Active Shares
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {totalObjectives}
                            </Typography>
                            <Typography variant="body2">
                                Total Objectives
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {shareStates.length}
                            </Typography>
                            <Typography variant="body2">
                                Unique States
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
                                        <FolderSharedIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Path
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    State
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon fontSize="small" />
                                        Objectives
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((shareItem) => {
                                const objectiveCount = shareItem.shareObjectives ? shareItem.shareObjectives.length : 0;
                                const statusColor = getStatusColor(shareItem.shareState);
                                const shareKey = shareItem.name || shareItem.id;
                                const isActive = shareItem.shareState && shareItem.shareState.toLowerCase().includes('active');
                                
                                return (
                                    <>
                                        <TableRow 
                                            key={shareKey}
                                            sx={{ 
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(shareKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[shareKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {shareItem.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={shareItem.path}>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                                        {shareItem.path}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    variant="filled" 
                                                    color={isActive ? "success" : "default"}
                                                    size="small"
                                                    label={shareItem.shareState} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {objectiveCount > 0 ? (
                                                    <Chip 
                                                        variant="outlined" 
                                                        color="secondary" 
                                                        size="small"
                                                        label={`${objectiveCount} objectives`} 
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                <Collapse in={expanded[shareKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Full Path
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {shareItem.path}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Share State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {shareItem.shareState}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            {shareItem.shareObjectives && shareItem.shareObjectives.length > 0 && (
                                                                <Grid item xs={12} sx={{ overflow: 'visible' }}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Associated Objectives
                                                                    </Typography>
                                                                    <Box sx={{ 
                                                                        display: 'flex', 
                                                                        flexDirection: 'column',
                                                                        gap: 1,
                                                                        width: '100%',
                                                                        overflow: 'visible'
                                                                    }}>
                                                                        {shareItem.shareObjectives
                                                                            .sort((a, b) => {
                                                                                const nameA = a.objective?.name || `Objective ${shareItem.shareObjectives.indexOf(a) + 1}`;
                                                                                const nameB = b.objective?.name || `Objective ${shareItem.shareObjectives.indexOf(b) + 1}`;
                                                                                return nameA.localeCompare(nameB);
                                                                            })
                                                                            .map((objective, index) => (
                                                                            <Chip 
                                                                                key={`${shareKey}-obj-${index}`}
                                                                                variant="outlined" 
                                                                                color="secondary" 
                                                                                size="small"
                                                                                label={objective.objective?.name || `Objective ${index + 1}`}
                                                                                sx={{ 
                                                                                    whiteSpace: 'normal', 
                                                                                    height: 'auto', 
                                                                                    maxWidth: '250px',
                                                                                    flexShrink: 0,
                                                                                    '& .MuiChip-label': { 
                                                                                        whiteSpace: 'normal', 
                                                                                        wordWrap: 'break-word' 
                                                                                    } 
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {/* Raw Data */}
                                                            {Object.keys(shareItem).length > 4 && (
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
                                                                            {JSON.stringify(shareItem, null, 2)}
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