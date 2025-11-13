import React from 'react';
import {
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RouterIcon from '@mui/icons-material/Router';
import { useState, useMemo } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceGateways(props) {
    const [expanded, setExpanded] = useState({});

    // Toggle expansion state for a specific gateway
    const handleToggle = (gatewayId) => {
        setExpanded(prev => ({
            ...prev,
            [gatewayId]: !prev[gatewayId]
        }));
    };

    const [hammerspaceGateways] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceGateways"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=gateways", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch gateways: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceGateways.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (hammerspaceGateways.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace gateways</Typography>
                    <Typography variant="body2">{hammerspaceGateways.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (hammerspaceGateways.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerSpaceGateways raw data:', hammerspaceGateways.data);

        // Gateways data is returned as a direct array, not wrapped in 'results'
        const dataArray = Array.isArray(hammerspaceGateways.data) ? hammerspaceGateways.data : [];

        if (!dataArray || dataArray.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace gateways found</Typography>
                </Box>
            );
        }

        // Group gateways by nodeName only
        const groupedData = useMemo(() => {
            const groups = {};

            dataArray.forEach((gateway) => {
                const nodeName = gateway.nodeName || 'Unknown';

                if (!groups[nodeName]) {
                    groups[nodeName] = {
                        nodeName,
                        // Use first item's values for display
                        created: gateway.created,
                        modified: gateway.modified,
                        ipv4: gateway.ipv4,
                        _type: gateway._type,
                        items: [],
                        // Track unique timestamp combinations
                        timestampGroups: {}
                    };
                }

                // Group items by timestamp within each nodeName group
                const timestampKey = `${gateway.created}-${gateway.modified}`;
                if (!groups[nodeName].timestampGroups[timestampKey]) {
                    groups[nodeName].timestampGroups[timestampKey] = {
                        created: gateway.created,
                        modified: gateway.modified,
                        items: []
                    };
                }

                groups[nodeName].timestampGroups[timestampKey].items.push(gateway);
                groups[nodeName].items.push(gateway);
            });

            // Convert to array and sort by nodeName
            return Object.values(groups).sort((a, b) => a.nodeName.localeCompare(b.nodeName));
        }, [dataArray]);

        // Calculate statistics
        const gatewayTypes = [...new Set(dataArray.map(gateway => gateway._type).filter(Boolean))];
        const gatewaysWithIp = groupedData.filter(group => group.ipv4?.address).length;
        const uniqueNodes = [...new Set(dataArray.map(gateway => gateway.nodeName).filter(Boolean))].length;

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Gateways'}
                    </Typography>
                    <Chip
                        label={`${groupedData.length} Gateway Groups (${dataArray.length} total)`}
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
                                {groupedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Gateway Groups
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {uniqueNodes}
                            </Typography>
                            <Typography variant="body2">
                                Unique Nodes
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {gatewaysWithIp}
                            </Typography>
                            <Typography variant="body2">
                                With IP Address
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {gatewayTypes.length}
                            </Typography>
                            <Typography variant="body2">
                                Gateway Types
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
                                        <RouterIcon fontSize="small" />
                                        Node Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    IP Address
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Created
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Modified
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedData.map((group) => {
                                const groupKey = group.nodeName;
                                const hasIpAddress = group.ipv4?.address;
                                const createdDate = group.created ? new Date(group.created).toLocaleDateString() : '-';
                                const modifiedDate = group.modified ? new Date(group.modified).toLocaleDateString() : '-';
                                const itemCount = group.items.length;
                                const timestampGroupCount = Object.keys(group.timestampGroups).length;

                                return (
                                    <React.Fragment key={groupKey}>
                                        <TableRow
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${hasIpAddress ? '#4caf50' : '#9e9e9e'}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(groupKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[groupKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {group.nodeName || 'N/A'}
                                                    </Typography>
                                                    {itemCount > 1 && (
                                                        <Chip
                                                            label={`×${itemCount}`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                    {group.ipv4?.address ?
                                                        `${group.ipv4.address}/${group.ipv4.prefixLength}` :
                                                        '-'
                                                    }
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                    {createdDate}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                    {modifiedDate}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                <Collapse in={expanded[groupKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                                            Gateway Details: {group.nodeName} ({itemCount} {itemCount === 1 ? 'item' : 'items'}, {timestampGroupCount} {timestampGroupCount === 1 ? 'timestamp group' : 'timestamp groups'})
                                                        </Typography>
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Node Name
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group.nodeName || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Type
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group._type || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    IPv4 Address
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {group.ipv4?.address || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Prefix Length
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {group.ipv4?.prefixLength || 'N/A'}
                                                                </Typography>
                                                            </Grid>

                                                            {/* Show timestamp groups */}
                                                            <Grid size={{ xs: 12 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                                                                    Timestamp Groups ({timestampGroupCount})
                                                                </Typography>
                                                                <TableContainer component={Paper} sx={{ mt: 1 }}>
                                                                    <Table size="small">
                                                                        <TableHead>
                                                                            <TableRow sx={{ bgcolor: 'grey.200' }}>
                                                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Created</TableCell>
                                                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Modified</TableCell>
                                                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Count</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {Object.values(group.timestampGroups).map((tsGroup, idx) => (
                                                                                <TableRow key={idx}>
                                                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                                                        {tsGroup.created ? new Date(tsGroup.created).toLocaleString() : 'N/A'}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                                                        {tsGroup.modified ? new Date(tsGroup.modified).toLocaleString() : 'N/A'}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                                                        {tsGroup.items.length}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableContainer>
                                                            </Grid>

                                                            {/* Raw Data */}
                                                            <Grid size={{ xs: 12 }}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                                                                    All Items Raw Data
                                                                </Typography>
                                                                <Box sx={{
                                                                    p: 1,
                                                                    bgcolor: 'white',
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
                                                                        {JSON.stringify(group.items, null, 2)}
                                                                    </pre>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
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
