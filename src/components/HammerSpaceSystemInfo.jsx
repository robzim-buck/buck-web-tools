import { 
  Chip, Typography, Box, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import DevicesIcon from '@mui/icons-material/Devices';
import DnsIcon from '@mui/icons-material/Dns';
import UpdateIcon from '@mui/icons-material/Update';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceSystemInfo(props) {
    
    const [hammerspaceSystemInfo] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceSystemInfo"],
            queryFn: async () => {
                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                try {
                    const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=system-info", {
                        method: "GET",
                        headers: {
                            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                            "Content-type": "application/json"
                        },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch system info: ${response.statusText}`);
                    }
                    return response.json();
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('Request timed out after 30 seconds');
                    }
                    throw error;
                }
            },
            staleTime: 10 * 60 * 1000, // 10 minutes for system info
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceSystemInfo.isLoading) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace System Info
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (hammerspaceSystemInfo.isError) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace System Info
                </Typography>
                <Alert severity="error">
                    Error loading HammerSpace system info: {hammerspaceSystemInfo.error?.message || 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    const systemData = hammerspaceSystemInfo.data || {};
    
    // Helper function to format data sizes
    const formatDataSize = (bytes) => {
        if (typeof bytes !== 'number') return bytes;
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper function to format uptime
    const formatUptime = (seconds) => {
        if (typeof seconds !== 'number') return seconds;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    // Helper function to ensure valid label for Chip components
    const ensureValidLabel = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value);
    };

    // Helper function to get appropriate icon for system component
    const getSystemIcon = (key) => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('cpu') || keyLower.includes('processor')) return <SpeedIcon />;
        if (keyLower.includes('memory') || keyLower.includes('ram')) return <MemoryIcon />;
        if (keyLower.includes('disk') || keyLower.includes('storage')) return <StorageIcon />;
        if (keyLower.includes('network') || keyLower.includes('interface')) return <NetworkCheckIcon />;
        if (keyLower.includes('node') || keyLower.includes('cluster')) return <DnsIcon />;
        if (keyLower.includes('device') || keyLower.includes('hardware')) return <DevicesIcon />;
        if (keyLower.includes('system') || keyLower.includes('host')) return <ComputerIcon />;
        return <InfoIcon />;
    };

    // Process system data into organized sections
    const processSystemData = (data) => {
        const sections = [];
        
        // System Overview section
        if (data.system || data.hostname || data.version || data.uptime) {
            sections.push({
                id: 'system_overview',
                name: 'System Overview',
                icon: <ComputerIcon />,
                data: {
                    hostname: data.hostname,
                    version: data.version,
                    uptime: data.uptime,
                    system_type: data.system_type || data.type,
                    architecture: data.architecture || data.arch,
                    platform: data.platform,
                    kernel: data.kernel,
                    ...data.system
                }
            });
        }

        // Hardware section
        if (data.hardware || data.cpu || data.memory || data.processors) {
            sections.push({
                id: 'hardware',
                name: 'Hardware',
                icon: <DevicesIcon />,
                data: {
                    cpu_count: data.cpu_count || data.processors,
                    cpu_model: data.cpu_model,
                    total_memory: data.total_memory || data.memory,
                    available_memory: data.available_memory,
                    cpu_usage: data.cpu_usage,
                    memory_usage: data.memory_usage,
                    ...data.hardware,
                    ...data.cpu,
                    ...data.memory
                }
            });
        }

        // Storage section
        if (data.storage || data.disks || data.filesystem) {
            sections.push({
                id: 'storage',
                name: 'Storage',
                icon: <StorageIcon />,
                data: {
                    total_storage: data.total_storage,
                    used_storage: data.used_storage,
                    available_storage: data.available_storage,
                    storage_usage: data.storage_usage,
                    ...data.storage,
                    ...data.disks,
                    ...data.filesystem
                }
            });
        }

        // Network section
        if (data.network || data.interfaces || data.ip_address) {
            sections.push({
                id: 'network',
                name: 'Network',
                icon: <NetworkCheckIcon />,
                data: {
                    ip_address: data.ip_address,
                    hostname: data.hostname,
                    domain: data.domain,
                    ...data.network,
                    ...data.interfaces
                }
            });
        }

        // Cluster section
        if (data.cluster || data.nodes || data.cluster_info) {
            sections.push({
                id: 'cluster',
                name: 'Cluster Info',
                icon: <DnsIcon />,
                data: {
                    cluster_id: data.cluster_id,
                    node_count: data.node_count,
                    cluster_status: data.cluster_status,
                    cluster_health: data.cluster_health,
                    ...data.cluster,
                    ...data.nodes,
                    ...data.cluster_info
                }
            });
        }

        // Clearable Events section
        if (data.clearableEvents && Array.isArray(data.clearableEvents)) {
            sections.push({
                id: 'clearable_events',
                name: 'Clearable Events',
                icon: <EventIcon />,
                data: {
                    event_count: data.clearableEvents.length,
                    events: data.clearableEvents
                }
            });
        }

        // Additional properties that don't fit into other sections
        const processedKeys = new Set(['system', 'hostname', 'version', 'uptime', 'system_type', 'type', 'architecture', 'arch', 'platform', 'kernel', 'hardware', 'cpu', 'memory', 'processors', 'cpu_count', 'cpu_model', 'total_memory', 'available_memory', 'cpu_usage', 'memory_usage', 'storage', 'disks', 'filesystem', 'total_storage', 'used_storage', 'available_storage', 'storage_usage', 'network', 'interfaces', 'ip_address', 'domain', 'cluster', 'nodes', 'cluster_info', 'cluster_id', 'node_count', 'cluster_status', 'cluster_health', 'clearableEvents']);
        
        const additionalData = {};
        Object.entries(data).forEach(([key, value]) => {
            if (!processedKeys.has(key)) {
                additionalData[key] = value;
            }
        });

        if (Object.keys(additionalData).length > 0) {
            sections.push({
                id: 'additional',
                name: 'Additional Information',
                icon: <InfoIcon />,
                data: additionalData
            });
        }

        return sections;
    };

    const systemSections = processSystemData(systemData);

    return (
        <Box>
            <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                HammerSpace System Info ({systemSections.length} sections)
            </Typography>
            
            {systemSections.length === 0 ? (
                <Alert severity="info">
                    No system information available.
                </Alert>
            ) : (
                <Grid container spacing={1}>
                    {systemSections.map((section, index) => {
                        return (
                            <Grid item size={12} key={section.id}>
                                <Paper elevation={1} sx={{ p: 1.5, mb: 1 }}>
                                    {/* Section header */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        {section.icon}
                                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                                            {section.name}
                                        </Typography>
                                    </Box>
                                    
                                    {/* Usage progress bars for percentage values */}
                                    {section.data.cpu_usage && (
                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption">CPU Usage</Typography>
                                                <Typography variant="caption">{section.data.cpu_usage}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={parseFloat(section.data.cpu_usage)} 
                                                color={
                                                    parseFloat(section.data.cpu_usage) < 70 ? 'success' : 
                                                    parseFloat(section.data.cpu_usage) < 90 ? 'warning' : 'error'
                                                }
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    )}
                                    
                                    {section.data.memory_usage && (
                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption">Memory Usage</Typography>
                                                <Typography variant="caption">{section.data.memory_usage}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={parseFloat(section.data.memory_usage)} 
                                                color={
                                                    parseFloat(section.data.memory_usage) < 70 ? 'success' : 
                                                    parseFloat(section.data.memory_usage) < 90 ? 'warning' : 'error'
                                                }
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    )}

                                    {section.data.storage_usage && (
                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption">Storage Usage</Typography>
                                                <Typography variant="caption">{section.data.storage_usage}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={parseFloat(section.data.storage_usage)} 
                                                color={
                                                    parseFloat(section.data.storage_usage) < 70 ? 'success' : 
                                                    parseFloat(section.data.storage_usage) < 90 ? 'warning' : 'error'
                                                }
                                                sx={{ height: 4, borderRadius: 2 }}
                                            />
                                        </Box>
                                    )}
                                    
                                    {/* Compact chips for key metrics */}
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                        {section.data.version && (
                                            <Chip 
                                                icon={<UpdateIcon />}
                                                label={ensureValidLabel(`v${section.data.version}`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                        {section.data.uptime && (
                                            <Chip 
                                                icon={<CalendarTodayIcon />}
                                                label={ensureValidLabel(`Up: ${typeof section.data.uptime === 'number' ? formatUptime(section.data.uptime) : section.data.uptime}`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                        {section.data.cpu_count && (
                                            <Chip 
                                                label={ensureValidLabel(`${section.data.cpu_count} CPUs`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                        {section.data.total_memory && (
                                            <Chip 
                                                label={ensureValidLabel(`RAM: ${formatDataSize(section.data.total_memory)}`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                        {section.data.total_storage && (
                                            <Chip 
                                                label={ensureValidLabel(`Storage: ${formatDataSize(section.data.total_storage)}`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                        {section.data.event_count && (
                                            <Chip 
                                                icon={<EventIcon />}
                                                label={ensureValidLabel(`${section.data.event_count} Events`)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        )}
                                    </Box>
                                    
                                    {/* Special handling for clearable events */}
                                    {section.id === 'clearable_events' && section.data.events && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                                                Events ({section.data.event_count})
                                            </Typography>
                                            {section.data.events.map((event, eventIndex) => {
                                                const getEventIcon = (severity) => {
                                                    if (severity && severity.toLowerCase().includes('error')) return <ErrorIcon color="error" />;
                                                    if (severity && severity.toLowerCase().includes('warning')) return <WarningIcon color="warning" />;
                                                    return <EventIcon color="info" />;
                                                };
                                                
                                                const getEventBorderColor = (severity) => {
                                                    if (severity && severity.toLowerCase().includes('error')) return 'error.main';
                                                    if (severity && severity.toLowerCase().includes('warning')) return 'warning.main';
                                                    return 'info.main';
                                                };

                                                // Get summary chips for key properties
                                                const getSummaryChips = () => {
                                                    const chips = [];
                                                    
                                                    // Priority fields to show in collapsed view
                                                    if (event.type) chips.push(`Type: ${event.type}`);
                                                    if (event.sourceName || event.source_name || event['source name']) {
                                                        const sourceName = event.sourceName || event.source_name || event['source name'];
                                                        chips.push(`Source: ${sourceName}`);
                                                    }
                                                    if (event.params) {
                                                        if (typeof event.params === 'object') {
                                                            chips.push(`Params: ${JSON.stringify(event.params)}`);
                                                        } else {
                                                            chips.push(`Params: ${event.params}`);
                                                        }
                                                    }
                                                    
                                                    // Secondary fields if there's space
                                                    if (event.severity) chips.push(event.severity);
                                                    if (event.category) chips.push(event.category);
                                                    if (event.timestamp) chips.push(new Date(event.timestamp).toLocaleString());
                                                    if (event.id) chips.push(`ID: ${event.id}`);
                                                    
                                                    return chips.slice(0, 6); // Show more chips to accommodate the new fields
                                                };

                                                // Filter out common properties for details table
                                                const getEventDetails = () => {
                                                    const excludeKeys = ['title', 'message', 'description', 'severity', 'category', 'timestamp', 'id', 'type', 'sourceName', 'source_name', 'source name', 'params'];
                                                    const details = {};
                                                    Object.entries(event).forEach(([key, value]) => {
                                                        if (!excludeKeys.includes(key) && value !== null && value !== undefined && value !== '') {
                                                            details[key] = value;
                                                        }
                                                    });
                                                    return details;
                                                };

                                                const eventDetails = getEventDetails();

                                                return (
                                                    <Accordion 
                                                        key={eventIndex}
                                                        sx={{ 
                                                            mb: 1,
                                                            border: '2px solid',
                                                            borderColor: getEventBorderColor(event.severity),
                                                            backgroundColor: 'background.paper',
                                                            '&:before': { display: 'none' },
                                                            boxShadow: 1
                                                        }}
                                                    >
                                                        <AccordionSummary 
                                                            expandIcon={<ExpandMoreIcon />}
                                                            sx={{ 
                                                                py: 1,
                                                                '& .MuiAccordionSummary-content': { 
                                                                    alignItems: 'flex-start', 
                                                                    gap: 1,
                                                                    flexWrap: 'wrap',
                                                                    minHeight: '48px',
                                                                    '&.Mui-expanded': {
                                                                        minHeight: '48px'
                                                                    }
                                                                },
                                                                '& .MuiAccordionSummary-expandIconWrapper': {
                                                                    marginTop: '8px'
                                                                }
                                                            }}
                                                        >
                                                            {getEventIcon(event.severity)}
                                                            <Box sx={{ 
                                                                flexGrow: 1, 
                                                                minWidth: 0, 
                                                                overflow: 'hidden',
                                                                paddingRight: 1
                                                            }}>
                                                                <Typography variant="body2" sx={{ 
                                                                    fontWeight: 'medium',
                                                                    wordWrap: 'break-word',
                                                                    overflowWrap: 'break-word',
                                                                    hyphens: 'auto',
                                                                    lineHeight: 1.3,
                                                                    marginBottom: 0.5
                                                                }}>
                                                                    {event.title || event.message || event.description || `Event ${eventIndex + 1}`}
                                                                </Typography>
                                                                <Box sx={{ 
                                                                    display: 'flex', 
                                                                    gap: 0.5, 
                                                                    flexWrap: 'wrap', 
                                                                    alignItems: 'flex-start'
                                                                }}>
                                                                    {getSummaryChips().map((chip, chipIndex) => (
                                                                        <Chip 
                                                                            key={chipIndex}
                                                                            label={chip}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ 
                                                                                fontSize: '0.65rem', 
                                                                                height: 'auto',
                                                                                minHeight: 18,
                                                                                '& .MuiChip-label': {
                                                                                    padding: '2px 6px',
                                                                                    whiteSpace: 'normal',
                                                                                    wordWrap: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    lineHeight: 1.2
                                                                                }
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        </AccordionSummary>
                                                        <AccordionDetails sx={{ pt: 0 }}>
                                                            {/* Event description if different from title */}
                                                            {event.description && event.title && event.description !== event.title && (
                                                                <Box sx={{ mb: 2 }}>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                                                        Description
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                        {event.description}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            
                                                            {/* Main event properties */}
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                                    Event Properties
                                                                </Typography>
                                                                <Grid container spacing={1}>
                                                                    {event.type && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Type
                                                                            </Typography>
                                                                            <Typography variant="body2">{event.type}</Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {(event.sourceName || event.source_name || event['source name']) && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Source Name
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {event.sourceName || event.source_name || event['source name']}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {event.params && (
                                                                        <Grid item size={12}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Params
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ 
                                                                                fontFamily: 'monospace', 
                                                                                fontSize: '0.8rem',
                                                                                backgroundColor: 'grey.100',
                                                                                padding: 1,
                                                                                borderRadius: 1,
                                                                                whiteSpace: 'pre-wrap'
                                                                            }}>
                                                                                {typeof event.params === 'object' ? 
                                                                                    JSON.stringify(event.params, null, 2) : 
                                                                                    String(event.params)
                                                                                }
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {event.severity && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Severity
                                                                            </Typography>
                                                                            <Typography variant="body2">{event.severity}</Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {event.category && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Category
                                                                            </Typography>
                                                                            <Typography variant="body2">{event.category}</Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {event.id && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Event ID
                                                                            </Typography>
                                                                            <Typography variant="body2">{event.id}</Typography>
                                                                        </Grid>
                                                                    )}
                                                                    {event.timestamp && (
                                                                        <Grid item size={6}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                                                                Timestamp
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {new Date(event.timestamp).toLocaleString()}
                                                                            </Typography>
                                                                        </Grid>
                                                                    )}
                                                                </Grid>
                                                            </Box>

                                                            {/* Additional event details */}
                                                            {Object.keys(eventDetails).length > 0 && (
                                                                <Box>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                                        Additional Details
                                                                    </Typography>
                                                                    <TableContainer>
                                                                        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, fontSize: '0.75rem' } }}>
                                                                            <TableBody>
                                                                                {Object.entries(eventDetails).map(([key, value]) => (
                                                                                    <TableRow key={key}>
                                                                                        <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>
                                                                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, ' ').replace(/([A-Z])/g, ' $1')}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            {(() => {
                                                                                                if (typeof value === 'object') {
                                                                                                    return JSON.stringify(value, null, 2);
                                                                                                }
                                                                                                if (key.includes('time') || key.includes('date')) {
                                                                                                    try {
                                                                                                        return new Date(value).toLocaleString();
                                                                                                    } catch (e) {
                                                                                                        return String(value);
                                                                                                    }
                                                                                                }
                                                                                                return String(value);
                                                                                            })()}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableContainer>
                                                                </Box>
                                                            )}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                );
                                            })}
                                        </Box>
                                    )}
                                    
                                    {/* Compact details table */}
                                    <TableContainer sx={{ maxHeight: 200 }}>
                                        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, fontSize: '0.75rem' } }}>
                                            <TableBody>
                                                {Object.entries(section.data)
                                                    .filter(([key, value]) => value !== null && value !== undefined && value !== '' && key !== 'events')
                                                    .map(([key, value]) => (
                                                        <TableRow key={key}>
                                                            <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>
                                                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, ' ').replace(/([A-Z])/g, ' $1')}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(() => {
                                                                    // Format specific data types
                                                                    if (key.includes('memory') || key.includes('storage') || key.includes('size')) {
                                                                        if (typeof value === 'number' && value > 1024) {
                                                                            return formatDataSize(value);
                                                                        }
                                                                    }
                                                                    if (key.includes('uptime') && typeof value === 'number') {
                                                                        return formatUptime(value);
                                                                    }
                                                                    if (key.includes('time') || key.includes('date')) {
                                                                        try {
                                                                            return new Date(value).toLocaleString();
                                                                        } catch (e) {
                                                                            return String(value);
                                                                        }
                                                                    }
                                                                    if (typeof value === 'object') {
                                                                        return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
                                                                    }
                                                                    return String(value);
                                                                })()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                }
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}