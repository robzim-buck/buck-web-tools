import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip, Card, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceNodes(props) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [viewMode, setViewMode] = useState('simple');

    const handleOpenDetails = (node) => {
        setSelectedNode(node);
        setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedNode(null);
    };

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const [hammerspaceNodes] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceNodes"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace/from_all_nodes?item=nodes", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch nodes: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceNodes.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (hammerspaceNodes.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace nodes</Typography>
                    <Typography variant="body2">{hammerspaceNodes.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (hammerspaceNodes.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerSpaceNodes raw data:', hammerspaceNodes.data);

        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceNodes.data.results || hammerspaceNodes.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];

        // Log first item keys to see field names
        if (dataArray.length > 0) {
            console.log('First node keys:', Object.keys(dataArray[0]));
            console.log('First node sample:', dataArray[0]);
        }

        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace nodes found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const nodeStates = [...new Set(sortedData.map(node => node.hwComponentState).filter(Boolean))];
        const healthyNodes = sortedData.filter(node =>
            node.hwComponentState && node.hwComponentState.toLowerCase() === 'ok'
        ).length;
        const managedNodes = sortedData.filter(node =>
            node.nodeState && node.nodeState.toLowerCase() === 'managed'
        ).length;

        // Determine status color based on HW component state
        const getStatusColor = (state) => {
            const stateLower = state ? state.toLowerCase() : '';
            if (stateLower === 'ok' || stateLower === 'healthy') return '#4caf50';
            if (stateLower.includes('warn') || stateLower.includes('degraded')) return '#ff9800';
            if (stateLower.includes('error') || stateLower.includes('fail')) return '#f44336';
            return '#2196f3'; // default blue
        };

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Nodes'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            size="small"
                        >
                            <ToggleButton value="simple">
                                <Tooltip title="Simple View">
                                    <ViewListIcon />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="detailed">
                                <Tooltip title="Detailed View">
                                    <TableChartIcon />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <Chip
                            label={`${sortedData.length} Nodes`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                </Box>

                {/* Summary Statistics */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Total Nodes
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {healthyNodes}
                            </Typography>
                            <Typography variant="body2">
                                Healthy (OK)
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {managedNodes}
                            </Typography>
                            <Typography variant="body2">
                                Managed
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {nodeStates.length}
                            </Typography>
                            <Typography variant="body2">
                                HW States
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Simple View Table */}
                {viewMode === 'simple' && (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DnsIcon fontSize="small" />
                                            Name
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        HW State
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Node Type
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedData.map((nodeItem) => {
                                    const hwState = nodeItem.hwComponentState || '';
                                    const statusColor = getStatusColor(hwState);
                                    const nodeKey = nodeItem.uoid?.uuid || nodeItem.name || nodeItem.id;
                                    const isHealthy = hwState && hwState.toLowerCase() === 'ok';

                                    return (
                                        <TableRow
                                            key={nodeKey}
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {nodeItem.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    variant="filled"
                                                    color={isHealthy ? "success" : "default"}
                                                    size="small"
                                                    label={hwState || '-'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {nodeItem.nodeType || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<InfoIcon />}
                                                    onClick={() => handleOpenDetails(nodeItem)}
                                                >
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Detailed View Table */}
                {viewMode === 'detailed' && (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table sx={{ minWidth: 900 }} size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Name
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Node State
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        HW State
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Node Type
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Mgmt IP
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Platform Services
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        System Services
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedData.map((nodeItem) => {
                                    const hwState = nodeItem.hwComponentState || '';
                                    const statusColor = getStatusColor(hwState);
                                    const nodeKey = nodeItem.uoid?.uuid || nodeItem.uuid || nodeItem.name || nodeItem.id;
                                    const isHealthy = hwState && hwState.toLowerCase() === 'ok';
                                    const mgmtIp = nodeItem.mgmtIpAddress?.address || '-';
                                    const platformServicesCount = nodeItem.platformServices?.length || 0;
                                    const systemServicesCount = nodeItem.systemServices?.length || 0;

                                    return (
                                        <TableRow
                                            key={nodeKey}
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {nodeItem.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {nodeItem.nodeState || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    variant="filled"
                                                    color={isHealthy ? "success" : "default"}
                                                    size="small"
                                                    label={hwState || '-'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {nodeItem.nodeType || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                    {mgmtIp}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={platformServicesCount} variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={systemServicesCount} variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Details Dialog */}
                <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                    <DialogTitle>
                        Node Details: {selectedNode?.name}
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedNode && (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                    <Typography variant="body1">{selectedNode.name}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">UUID</Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                        {selectedNode.uoid?.uuid || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Node State</Typography>
                                    <Typography variant="body1">{selectedNode.nodeState || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">HW Component State</Typography>
                                    <Chip
                                        size="small"
                                        label={selectedNode.hwComponentState || 'N/A'}
                                        color={selectedNode.hwComponentState?.toLowerCase() === 'ok' ? 'success' : 'default'}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Node Type</Typography>
                                    <Typography variant="body1">{selectedNode.nodeType || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Management IP</Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                        {selectedNode.mgmtIpAddress?.address || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Orchestration System</Typography>
                                    <Typography variant="body1">{selectedNode.orchestrationSystemType || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">S3 Signing Type</Typography>
                                    <Typography variant="body1">{selectedNode.s3SigningType || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                                    <Typography variant="body1">
                                        {selectedNode.created ? new Date(selectedNode.created).toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Modified</Typography>
                                    <Typography variant="body1">
                                        {selectedNode.modified ? new Date(selectedNode.modified).toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>

                                {/* Platform Services */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Platform Services ({selectedNode.platformServices?.length || 0})
                                    </Typography>
                                    {selectedNode.platformServices && selectedNode.platformServices.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedNode.platformServices.map((svc, idx) => (
                                                <Tooltip key={idx} title={`${svc._type || ''} - ${svc.serviceState || ''}`}>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={svc.serviceState === 'RUNNING' ? 'success' : 'default'}
                                                        label={svc.name || svc.exportPath || `Service ${idx + 1}`}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                    )}
                                </Grid>

                                {/* System Services */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        System Services ({selectedNode.systemServices?.length || 0})
                                    </Typography>
                                    {selectedNode.systemServices && selectedNode.systemServices.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedNode.systemServices.map((svc, idx) => (
                                                <Tooltip key={idx} title={`${svc._type || ''} - ${svc.operState || ''}`}>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={svc.operState === 'UP' ? 'success' : 'default'}
                                                        label={svc.name || `Service ${idx + 1}`}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                    )}
                                </Grid>

                                {/* Gateway Info */}
                                {selectedNode.gateway && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Gateway UUID</Typography>
                                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {selectedNode.gateway.uoid?.uuid || 'N/A'}
                                        </Typography>
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Raw Data
                                    </Typography>
                                    <Box sx={{
                                        p: 1,
                                        bgcolor: 'grey.100',
                                        borderRadius: 1,
                                        maxHeight: 300,
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
                                            {JSON.stringify(selectedNode, null, 2)}
                                        </pre>
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetails}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }

    // Fallback
    return null;
}
