import { 
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerspaceSites(props) {
    const [expanded, setExpanded] = useState({});
    
    // Toggle expansion state for a specific site
    const handleToggle = (siteId) => {
        setExpanded(prev => ({
            ...prev,
            [siteId]: !prev[siteId]
        }));
    };
    
    const [hammerspaceSites] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceSites"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=sites", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch sites: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceSites.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceSites.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace sites</Typography>
                    <Typography variant="body2">{hammerspaceSites.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceSites.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerspaceSites raw data:', hammerspaceSites.data);
        
        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceSites.data.results || hammerspaceSites.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace sites found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const recentSites = sortedData.filter(site => {
            const daysSinceModification = Math.floor((Date.now() - new Date(site.modified)) / (1000 * 60 * 60 * 24));
            return daysSinceModification < 7;
        });
        
        const siteTypes = [...new Set(sortedData.map(site => site.type).filter(Boolean))];
        const averageAge = Math.floor(sortedData.reduce((sum, site) => {
            return sum + Math.floor((Date.now() - new Date(site.created)) / (1000 * 60 * 60 * 24));
        }, 0) / sortedData.length);

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Sites'}
                    </Typography>
                    <Chip 
                        label={`${sortedData.length} Sites`} 
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
                                Total Sites
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {recentSites.length}
                            </Typography>
                            <Typography variant="body2">
                                Recently Updated
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {siteTypes.length}
                            </Typography>
                            <Typography variant="body2">
                                Site Types
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
                                        <BusinessIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Internal ID
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Management Address
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((site) => {
                                // Calculate time since creation and modification
                                const createdDate = new Date(site.created);
                                const modifiedDate = new Date(site.modified);
                                const daysSinceCreation = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
                                const daysSinceModification = Math.floor((Date.now() - modifiedDate) / (1000 * 60 * 60 * 24));
                                const siteKey = site.name || site.uoid?.uuid || site.internalId;
                                const isRecentlyUpdated = daysSinceModification < 7;
                                
                                return (
                                    <>
                                        <TableRow 
                                            key={siteKey}
                                            sx={{ 
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: isRecentlyUpdated ? '4px solid #4caf50' : '4px solid #2196f3',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(siteKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[siteKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {site.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    variant="outlined" 
                                                    color="secondary" 
                                                    size="small"
                                                    label={site.internalId || 'N/A'} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {site.mgmtAddress || 'N/A'}
                                                </Typography>
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
                                                        {isRecentlyUpdated && (
                                                            <Chip 
                                                                variant="filled" 
                                                                color="success" 
                                                                size="small"
                                                                label="Recent" 
                                                                sx={{ ml: 1 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                <Collapse in={expanded[siteKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Data Address
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {site.dataAddress || 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Site Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {site.type || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            {site.uoid && (
                                                                <Grid item xs={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        UUID
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        {site.uoid.uuid}
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

                                                            {/* Raw Data */}
                                                            {Object.keys(site).length > 6 && (
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
                                                                            {JSON.stringify(site, null, 2)}
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