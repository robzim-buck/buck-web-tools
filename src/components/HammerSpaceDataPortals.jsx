import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceDataPortals(props) {
    const [expanded, setExpanded] = useState({});

    // Toggle expansion state for a specific portal
    const handleToggle = (portalId) => {
        setExpanded(prev => ({
            ...prev,
            [portalId]: !prev[portalId]
        }));
    };

    const [hammerspaceDataPortals] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceDataPortals"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=data-portals", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch data portals: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceDataPortals.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (hammerspaceDataPortals.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace data portals</Typography>
                    <Typography variant="body2">{hammerspaceDataPortals.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (hammerspaceDataPortals.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerSpaceDataPortals raw data:', hammerspaceDataPortals.data);

        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceDataPortals.data.results || hammerspaceDataPortals.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const sortedData = dataArray.sort((a, b) =>
            (a.node?.name || '').localeCompare(b.node?.name || '') ||
            (a.dataPortalType || '').localeCompare(b.dataPortalType || '')
        );

        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace data portals found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const totalExports = sortedData.reduce((sum, portal) =>
            sum + (portal.exported ? portal.exported.length : 0), 0
        );

        const portalTypes = [...new Set(sortedData.map(portal => portal.dataPortalType).filter(Boolean))];
        const activePortals = sortedData.filter(portal =>
            portal.operState && portal.operState.toLowerCase() === 'up'
        ).length;

        // Determine status color based on portal state
        const getStatusColor = (operState, adminState) => {
            if (operState === 'UP' && adminState === 'UP') return '#4caf50';
            if (operState === 'UP' && adminState !== 'UP') return '#ff9800';
            return '#f44336';
        };

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Data Portals'}
                    </Typography>
                    <Chip
                        label={`${sortedData.length} Portals`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                {/* Summary Statistics */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Total Portals
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {activePortals}
                            </Typography>
                            <Typography variant="body2">
                                Active Portals
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {totalExports}
                            </Typography>
                            <Typography variant="body2">
                                Total Exports
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {portalTypes.length}
                            </Typography>
                            <Typography variant="body2">
                                Portal Types
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
                                        <DashboardIcon fontSize="small" />
                                        Node
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Type
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon fontSize="small" />
                                        Exports
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((portalItem, index) => {
                                const exportCount = portalItem.exported ? portalItem.exported.length : 0;
                                const statusColor = getStatusColor(portalItem.operState, portalItem.adminState);
                                const portalKey = portalItem.uoid?.uuid || `portal-${index}`;
                                const isActive = portalItem.operState === 'UP' && portalItem.adminState === 'UP';

                                return (
                                    <>
                                        <TableRow
                                            key={portalKey}
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(portalKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[portalKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {portalItem.node?.name || 'Unknown'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={portalItem.dataPortalType || 'Unknown'}
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Chip
                                                        variant="filled"
                                                        color={isActive ? "success" : "error"}
                                                        size="small"
                                                        label={`Oper: ${portalItem.operState || 'Unknown'}`}
                                                    />
                                                    <Chip
                                                        variant="outlined"
                                                        size="small"
                                                        label={`Admin: ${portalItem.adminState || 'Unknown'}`}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {exportCount > 0 ? (
                                                    <Chip
                                                        variant="outlined"
                                                        color="secondary"
                                                        size="small"
                                                        label={`${exportCount} exports`}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                <Collapse in={expanded[portalKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Node Name
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.node?.name || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Portal Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.dataPortalType || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Operational State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.operState || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Admin State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.adminState || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Data Portal State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.dataPortalState || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Node Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.node?.productNodeType || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Created
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.created ? new Date(portalItem.created).toLocaleString() : 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Modified
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {portalItem.modified ? new Date(portalItem.modified).toLocaleString() : 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            {/* Exported Paths */}
                                                            {portalItem.exported && portalItem.exported.length > 0 && (
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Exported Paths ({portalItem.exported.length})
                                                                    </Typography>
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexWrap: 'wrap',
                                                                        gap: 0.5,
                                                                        maxHeight: 200,
                                                                        overflow: 'auto',
                                                                        p: 1,
                                                                        bgcolor: 'white',
                                                                        borderRadius: 1,
                                                                        border: '1px solid',
                                                                        borderColor: 'grey.300'
                                                                    }}>
                                                                        {portalItem.exported.map((path, idx) => (
                                                                            <Chip
                                                                                key={idx}
                                                                                label={path}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {/* Raw Data */}
                                                            <Grid size={{ xs: 12 }}>
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
                                                                        {JSON.stringify(portalItem, null, 2)}
                                                                    </pre>
                                                                </Box>
                                                            </Grid>
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
