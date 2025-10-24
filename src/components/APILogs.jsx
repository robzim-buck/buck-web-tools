import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Select, Box, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
export default function APILogs(props) {
    const [fetchHost, setFetchHost] = useState('nyc');
    const [logType, setLogType] = useState('api');
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [countdown, setCountdown] = useState(refreshInterval / 1000);

    // Use React Query for data fetching
    const { data: logData, isLoading, isError, error, dataUpdatedAt } = useQuery({
        queryKey: ['apiLogs', fetchHost, logType],
        queryFn: async () => {
            const response = await fetch(
                `https://laxcoresrv.buck.local:8000/${logType}_logs?host=${fetchHost}`,
                {
                    headers: {
                        'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                    }
                }
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch logs: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Limit log entries to prevent performance issues
            if (Array.isArray(data)) {
                return data.slice(-500); // Keep only last 500 entries
            }
            return data;
        },
        refetchInterval: isAutoRefresh ? refreshInterval : false,
        staleTime: 5000,
        retry: 2
    });

    // Countdown timer effect
    useEffect(() => {
        if (!isAutoRefresh) {
            setCountdown(0);
            return;
        }

        // Reset countdown to full interval
        setCountdown(refreshInterval / 1000);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return refreshInterval / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [refreshInterval, isAutoRefresh]);

    // Reset countdown when data updates
    useEffect(() => {
        if (dataUpdatedAt && isAutoRefresh) {
            setCountdown(refreshInterval / 1000);
        }
    }, [dataUpdatedAt, refreshInterval, isAutoRefresh]);

    const handleHostChange = (event) => {
        setFetchHost(event.target.value);
    };
    
    const handleLogChange = (event) => {
        setLogType(event.target.value);
    };

    // Error state
    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load logs: {error?.message || 'Unknown error'}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    {/* Controls still available during error */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Host</InputLabel>
                        <Select
                            value={fetchHost}
                            label="Host"
                            onChange={handleHostChange}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        backgroundColor: 'white',
                                        color: 'black'
                                    }
                                }
                            }}>
                            <MenuItem value='nyc'>NYC</MenuItem>
                            <MenuItem value='lax'>LAX</MenuItem>        
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Log Type</InputLabel>
                        <Select
                            value={logType}
                            label="Log Type"
                            onChange={handleLogChange}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        backgroundColor: 'white',
                                        color: 'black'
                                    }
                                }
                            }}>
                            <MenuItem value='api'>API</MenuItem>
                            <MenuItem value='bolt'>Bolt</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Main render
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Host</InputLabel>
                    <Select
                        value={fetchHost}
                        label="Host"
                        onChange={handleHostChange}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black'
                                }
                            }
                        }}>
                        <MenuItem value='nyc'>NYC</MenuItem>
                        <MenuItem value='lax'>LAX</MenuItem>        
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Log Type</InputLabel>
                    <Select
                        value={logType}
                        label="Log Type"
                        onChange={handleLogChange}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black'
                                }
                            }
                        }}>
                        <MenuItem value='api'>API</MenuItem>
                        <MenuItem value='bolt'>Bolt</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Refresh Interval</InputLabel>
                    <Select
                        value={refreshInterval}
                        label="Refresh Interval"
                        onChange={(e) => setRefreshInterval(e.target.value)}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black'
                                }
                            }
                        }}>
                        <MenuItem value={5000}>5 seconds</MenuItem>
                        <MenuItem value={15000}>15 seconds</MenuItem>
                        <MenuItem value={30000}>30 seconds</MenuItem>
                        <MenuItem value={60000}>1 minute</MenuItem>
                        <MenuItem value={300000}>5 minutes</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Typography variant='h4' gutterBottom>
                {logType.toUpperCase()} Logs - {fetchHost.toUpperCase()} {props.name}
            </Typography>
            
            <Typography variant='body2' color="text.secondary" sx={{ mb: 2 }}>
                Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Never'}
                {isAutoRefresh && ` (next refresh in ${countdown}s)`}
            </Typography>

            <Box sx={{ 
                maxHeight: '70vh', 
                overflow: 'auto', 
                bgcolor: 'grey.50', 
                p: 1, 
                borderRadius: 1,
                fontFamily: 'monospace'
            }}>
                {logData && Array.isArray(logData) ? (
                    logData.map((logEntry, index) => (
                        <Typography 
                            key={`${fetchHost}-${logType}-${index}`}
                            variant='body2' 
                            component="div"
                            sx={{ 
                                whiteSpace: 'pre-wrap',
                                borderBottom: '1px solid #eee',
                                py: 0.5
                            }}
                        >
                            {logEntry}
                        </Typography>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No log data available
                    </Typography>
                )}
            </Box>
        </Box>
    );

}
