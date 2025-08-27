import { 
  Chip, Typography, Box, Grid, Alert,
  Paper, LinearProgress, Button, Collapse, IconButton
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQueries } from "@tanstack/react-query";
import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceSystemHealth() {
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    const toggleExpanded = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };
    
    const [hammerspaceSystemHealth] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceSystemHealth"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=/system/health", {
                    method: "GET",
                    
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch system health: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 2 * 60 * 1000, // 2 minutes for health data
            refetchOnWindowFocus: true,
            retry: 3
        },
        ]
    });

    if (hammerspaceSystemHealth.isLoading) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace System Health
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (hammerspaceSystemHealth.isError) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace System Health
                </Typography>
                <Alert severity="error">
                    Error loading HammerSpace system health: {hammerspaceSystemHealth.error?.message || 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    const healthData = hammerspaceSystemHealth.data || {};
    
    // Helper function to check for degraded entries in nested data
    const checkForDegradedEntries = (obj) => {
        if (typeof obj !== 'object' || obj === null) return false;
        
        // Check arrays for degraded entries
        if (Array.isArray(obj)) {
            return obj.some(item => checkForDegradedEntries(item));
        }
        
        // Check object properties
        for (const [key, value] of Object.entries(obj)) {
            const keyLower = key.toLowerCase();
            const valueLower = typeof value === 'string' ? value.toLowerCase() : '';
            
            // Check for numeric degraded counts
            if (keyLower === 'degraded' || keyLower === 'failed' || keyLower === 'error') {
                if (typeof value === 'number' && value > 0) {
                    return true;
                }
            }
            
            // Check if this property indicates degradation (string values)
            if (keyLower.includes('status') || keyLower.includes('state') || keyLower.includes('health')) {
                if (valueLower.includes('degraded') || valueLower.includes('warning') || 
                    valueLower.includes('error') || valueLower.includes('failed') || 
                    valueLower.includes('critical')) {
                    return true;
                }
            }
            
            // Recursively check nested objects
            if (typeof value === 'object' && value !== null) {
                if (checkForDegradedEntries(value)) {
                    return true;
                }
            }
        }
        
        return false;
    };

    // Helper function to get health status color and icon
    const getHealthStatus = (status, value, threshold, fullItem) => {
        // First check for degraded sub-entries
        if (fullItem && checkForDegradedEntries(fullItem)) {
            return { color: 'warning', icon: <WarningIcon />, text: 'Warning' };
        }
        
        if (!status && value !== undefined && threshold !== undefined) {
            // Calculate status based on value and threshold
            if (value < threshold * 0.5) return { color: 'success', icon: <CheckCircleIcon />, text: 'Good' };
            if (value < threshold * 0.8) return { color: 'warning', icon: <WarningIcon />, text: 'Warning' };
            return { color: 'error', icon: <ErrorIcon />, text: 'Critical' };
        }
        
        if (!status) return { color: 'default', icon: <InfoIcon />, text: '' };
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('ok') || statusLower.includes('good') || statusLower.includes('healthy') || statusLower.includes('normal')) {
            return { color: 'success', icon: <CheckCircleIcon />, text: 'Healthy' };
        }
        if (statusLower.includes('warning') || statusLower.includes('degraded')) {
            return { color: 'warning', icon: <WarningIcon />, text: 'Warning' };
        }
        if (statusLower.includes('error') || statusLower.includes('critical') || statusLower.includes('failed')) {
            return { color: 'error', icon: <ErrorIcon />, text: 'Critical' };
        }
        return { color: 'info', icon: <InfoIcon />, text: status };
    };

    // Helper function to format percentage values
    const formatPercentage = (value) => {
        if (typeof value === 'number') {
            return `${value.toFixed(1)}%`;
        }
        return String(value || '');
    };

    // Helper function to ensure valid label for Chip components
    const ensureValidLabel = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value);
    };

    // Helper function to get appropriate icon for metric type
    const getMetricIcon = (key) => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('cpu') || keyLower.includes('processor')) return <SpeedIcon />;
        if (keyLower.includes('memory') || keyLower.includes('ram')) return <MemoryIcon />;
        if (keyLower.includes('disk') || keyLower.includes('storage')) return <StorageIcon />;
        if (keyLower.includes('network') || keyLower.includes('bandwidth')) return <NetworkCheckIcon />;
        return <HealthAndSafetyIcon />;
    };

    // Process health data into displayable format
    const processHealthData = (data) => {
        if (Array.isArray(data)) {
            return data.map((item, index) => ({
                id: item.id || `item_${index}`,
                name: item.name || item.component || `Health Check ${index + 1}`,
                ...item
            }));
        } else if (typeof data === 'object') {
            return Object.entries(data).map(([key, value], index) => ({
                id: `${key}_${index}`,
                name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                value: value,
                ...value
            }));
        }
        return [];
    };

    const healthItems = processHealthData(healthData);

    // Calculate health status counts
    const healthCounts = healthItems.reduce((counts, item) => {
        const healthStatus = getHealthStatus(item.status, item.value, item.threshold, item);
        
        if (healthStatus.color === 'success') {
            counts.ok++;
        } else if (healthStatus.color === 'warning') {
            counts.degraded++;
        } else if (healthStatus.color === 'error') {
            counts.failed++;
        } else {
            counts.unknown++;
        }
        
        return counts;
    }, { ok: 0, degraded: 0, failed: 0, unknown: 0 });

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant='h4' color="primary" fontWeight="medium">
                    HammerSpace System Health
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                        label={`${healthCounts.ok} OK`}
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                        sx={{ fontWeight: 'medium' }}
                    />
                    {healthCounts.degraded > 0 && (
                        <Chip 
                            label={`${healthCounts.degraded} Degraded`}
                            color="warning"
                            size="small"
                            icon={<WarningIcon />}
                            sx={{ fontWeight: 'medium' }}
                        />
                    )}
                    {healthCounts.failed > 0 && (
                        <Chip 
                            label={`${healthCounts.failed} Failed`}
                            color="error"
                            size="small"
                            icon={<ErrorIcon />}
                            sx={{ fontWeight: 'medium' }}
                        />
                    )}
                    {healthCounts.unknown > 0 && (
                        <Chip 
                            label={`${healthCounts.unknown} Unknown`}
                            color="default"
                            size="small"
                            icon={<InfoIcon />}
                            sx={{ fontWeight: 'medium' }}
                        />
                    )}
                    <Chip 
                        label={`${healthItems.length} Total`}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                    />
                </Box>
            </Box>
            
            {healthItems.length === 0 ? (
                <Alert severity="info">
                    No system health data available.
                </Alert>
            ) : (
                <Grid container spacing={1}>
                    {healthItems.map((item, index) => {
                        const itemId = item.id || index;
                        const healthStatus = getHealthStatus(item.status, item.value, item.threshold, item);
                        const isOk = healthStatus.color === 'success';
                        const isDegraded = healthStatus.color === 'warning';
                        const isFailed = healthStatus.color === 'error';
                        
                        return (
                            <Grid item size={6} key={itemId}>
                                <Paper 
                                    elevation={1} 
                                    sx={{ 
                                        p: 1, 
                                        mb: 0.5,
                                        backgroundColor: isOk ? 'success.light' : (isDegraded ? 'warning.light' : (isFailed ? 'error.light' : 'background.paper')),
                                        border: `1px solid ${isOk ? 'success.main' : (isDegraded ? 'warning.main' : (isFailed ? 'error.main' : 'divider'))}`,
                                        '&:hover': {
                                            elevation: 2
                                        }
                                    }}
                                >
                                    {/* Compact header with name, status, and value */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        {getMetricIcon(item.name)}
                                        <Typography variant="subtitle2" sx={{ 
                                            fontWeight: 'medium', 
                                            flexGrow: 1, 
                                            fontSize: '0.8rem',
                                            color: isOk ? 'success.dark' : (isDegraded ? 'warning.dark' : (isFailed ? 'error.dark' : 'text.primary'))
                                        }}>
                                            {item.name}
                                        </Typography>
                                        <Chip 
                                            label={healthStatus.text || (typeof item.value === 'number' ? formatPercentage(item.value) : 'OK')}
                                            color={healthStatus.color}
                                            size="small"
                                            icon={healthStatus.icon}
                                            sx={{ 
                                                fontSize: '0.6rem', 
                                                height: 18,
                                                '& .MuiChip-icon': { fontSize: '0.8rem' }
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleExpanded(itemId)}
                                            sx={{ ml: 0.5, width: 20, height: 20 }}
                                        >
                                            {expandedItems.has(itemId) ? <ExpandLessIcon sx={{ fontSize: '0.8rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.8rem' }} />}
                                        </IconButton>
                                    </Box>
                                    
                                    {/* Compact progress bar */}
                                    {typeof item.value === 'number' && item.value >= 0 && item.value <= 100 && (
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={item.value} 
                                            color={
                                                item.value < 50 ? 'success' : 
                                                item.value < 80 ? 'warning' : 'error'
                                            }
                                            sx={{ height: 3, borderRadius: 2, mb: 0.5 }}
                                        />
                                    )}
                                    
                                    {/* Display OK/Degraded/Failed counts if available */}
                                    <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', mb: 0.5 }}>
                                        {(item.ok !== undefined || item.degraded !== undefined || item.failed !== undefined) ? (
                                            <>
                                                {item.ok !== undefined && (
                                                    <Chip 
                                                        label={`${item.ok} OK`}
                                                        color="success"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                                {item.degraded !== undefined && item.degraded > 0 && (
                                                    <Chip 
                                                        label={`${item.degraded} Degraded`}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                                {item.failed !== undefined && item.failed > 0 && (
                                                    <Chip 
                                                        label={`${item.failed} Failed`}
                                                        color="error"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {item.uptime && (
                                                    <Chip 
                                                        label={ensureValidLabel(`${item.uptime}`)}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                                {item.responseTime && (
                                                    <Chip 
                                                        label={ensureValidLabel(`${item.responseTime}ms`)}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                                {item.availability && (
                                                    <Chip 
                                                        label={ensureValidLabel(`${formatPercentage(item.availability)}`)}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </Box>
                                    
                                    {/* Show only critical details */}
                                    {(item.message || item.errorMessage) && (
                                        <Box sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                                            {item.errorMessage && (
                                                <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                                                    {item.errorMessage}
                                                </Typography>
                                            )}
                                            {item.message && !item.errorMessage && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    {item.message}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                    
                                    {/* Raw data section */}
                                    <Collapse in={expandedItems.has(itemId)}>
                                        <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                                Raw Data:
                                            </Typography>
                                            <Box sx={{ 
                                                backgroundColor: 'background.paper', 
                                                p: 1, 
                                                borderRadius: 0.5,
                                                maxHeight: 200,
                                                overflow: 'auto',
                                                fontSize: '0.7rem',
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all'
                                            }}>
                                                {JSON.stringify(item, null, 2)}
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}