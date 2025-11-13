import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DnsIcon from '@mui/icons-material/Dns';
import StorageIcon from '@mui/icons-material/Storage';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceNodes(props) {
    const [expanded, setExpanded] = useState({});

    // Toggle expansion state for a specific node
    const handleToggle = (nodeId) => {
        setExpanded(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const [hammerspaceNodes] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceNodes"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=nodes", {
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
        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace nodes found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const nodeStates = [...new Set(sortedData.map(node => node.state).filter(Boolean))];
        const activeNodes = sortedData.filter(node =>
            node.state && node.state.toLowerCase().includes('active')
        ).length;
        const onlineNodes = sortedData.filter(node =>
            node.state && (node.state.toLowerCase().includes('online') || node.state.toLowerCase().includes('active'))
        ).length;

        // Determine status color based on node state
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
                        {props.name || 'Hammerspace Nodes'}
                    </Typography>
                    <Chip
                        label={`${sortedData.length} Nodes`}
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
                                Total Nodes
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {onlineNodes}
                            </Typography>
                            <Typography variant="body2">
                                Online Nodes
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {activeNodes}
                            </Typography>
                            <Typography variant="body2">
                                Active Nodes
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {nodeStates.length}
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
                                        <DnsIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    UUID
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    State
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon fontSize="small" />
                                        Type
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((nodeItem) => {
                                const statusColor = getStatusColor(nodeItem.state);
                                const nodeKey = nodeItem.name || nodeItem.uuid || nodeItem.id;
                                const isOnline = nodeItem.state &&
                                    (nodeItem.state.toLowerCase().includes('active') ||
                                     nodeItem.state.toLowerCase().includes('online'));

                                return (
                                    <>
                                        <TableRow
                                            key={nodeKey}
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(nodeKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[nodeKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {nodeItem.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={nodeItem.uuid}>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: '200px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {nodeItem.uuid}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    variant="filled"
                                                    color={isOnline ? "success" : "default"}
                                                    size="small"
                                                    label={nodeItem.state}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {nodeItem.type || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                <Collapse in={expanded[nodeKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Node Name
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {nodeItem.name}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    UUID
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                                    {nodeItem.uuid}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {nodeItem.state}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {nodeItem.type || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            {/* Raw Data */}
                                                            {Object.keys(nodeItem).length > 4 && (
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
                                                                            {JSON.stringify(nodeItem, null, 2)}
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
