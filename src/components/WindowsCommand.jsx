import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function WindowsCommand(props) {
    const [commandToExecute, setCommandToExecute] = useState('dir');
    const [hostName, setHostName] = useState('NYVDI05-VM08');
    const [executeCommand, setExecuteCommand] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState('dir');

    const commonCommands = [
        'dir',
        'Get-Process',
        'Get-Service',
        'Get-ComputerInfo',
        'Get-EventLog -LogName System -Newest 10',
        'Get-WmiObject Win32_OperatingSystem',
        'Get-Disk',
        'Get-NetIPAddress',
        'Get-LocalUser'
    ];

    const handleCommandSelect = (event) => {
        const selectedCmd = event.target.value;
        setSelectedCommand(selectedCmd);
        setCommandToExecute(selectedCmd);
        setExecuteCommand(false);
    };

    const handleHostSelect = (event) => {
        setHostName(event.target.value);
        setExecuteCommand(false);
    };

    const handleExecuteCommand = () => {
        setExecuteCommand(true);
    };

    // Fetch LDAP machine info for host dropdown
    const ldapMachineInfoQuery = useQuery({
        queryKey: ["ldap_machine_info"],
        queryFn: () =>
            fetch("https://laxcoresrv.buck.local:8000/buckldap_machineinfo", {
                headers: { 'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo' }
            }).then((res) => res.json()),
    });

    // Execute Windows PowerShell command
    const windowsCommandQuery = useQuery({
        queryKey: ["windowsCommand", commandToExecute, hostName],
        queryFn: async () => {
            const encodedCommand = encodeURIComponent(commandToExecute);
            const apiEndpoint = `https://laxcoresrv.buck.local:8000/powershell/run_command_on_windows_host/${hostName}/${encodedCommand}`;
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            });
            
            // Return text directly
            const text = await response.text();
            console.log('Raw response text:', text);
            return text;
        },
        enabled: executeCommand
    });

    const renderCommandResult = (data) => {
        console.log('renderCommandResult called with data:', data);
        console.log('Data type:', typeof data);
        
        // Handle null or undefined data
        if (data === null || data === undefined) {
            return (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    No data returned from the command.
                </Alert>
            );
        }
        
        // First, check if data is a string that starts with '['
        if (typeof data === 'string' && data.includes('[')) {
            // Find the start of the array
            const arrayStart = data.indexOf('[');
            const arrayContent = data.substring(arrayStart);
            
            // Check if it's a Python-style list with single quotes
            if (arrayContent.includes("'")) {
                try {
                    // Convert Python-style list to JSON format
                    // Replace single quotes with double quotes, handle escaped quotes
                    const jsonString = arrayContent
                        .replace(/'/g, '"')
                        .replace(/"\s*,\s*"/g, '","')
                        .replace(/\["\s*,/g, '["",')
                        .replace(/,\s*"\]/g, ',""]');
                    
                    const parsedData = JSON.parse(jsonString);
                    if (Array.isArray(parsedData)) {
                        return (
                            <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                                <List dense>
                                    {parsedData.map((line, index) => (
                                        <ListItem key={index} sx={{ py: 0, minHeight: 'auto' }}>
                                            <ListItemText 
                                                primary={line || '\u00A0'} // Use non-breaking space for empty lines
                                                slotProps={{
                                                    primary: {
                                                        sx: {
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.875rem',
                                                            whiteSpace: 'pre-wrap'
                                                        }
                                                    }
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        );
                    }
                } catch (e) {
                    // If parsing fails, try standard JSON parsing
                    try {
                        const parsedData = JSON.parse(arrayContent);
                        if (Array.isArray(parsedData)) {
                            return (
                                <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                                    <List dense>
                                        {parsedData.map((line, index) => (
                                            <ListItem key={index} sx={{ py: 0, minHeight: 'auto' }}>
                                                <ListItemText 
                                                    primary={line || '\u00A0'}
                                                    slotProps={{
                                                        primary: {
                                                            sx: {
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.875rem',
                                                                whiteSpace: 'pre-wrap'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            );
                        }
                    } catch (e2) {
                        // Continue with normal string rendering
                    }
                }
            }
        }
        
        if (typeof data === 'object' && data !== null) {
            // Check if the response is an array of strings (typical PowerShell output)
            if (Array.isArray(data)) {
                return (
                    <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                        <List dense>
                            {data.map((line, index) => (
                                <ListItem key={index} sx={{ py: 0, minHeight: 'auto' }}>
                                    <ListItemText 
                                        primary={line || '\u00A0'} // Use non-breaking space for empty lines
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                    whiteSpace: 'pre-wrap'
                                                }
                                            }
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                );
            }
            // Check if the response has a specific structure for PowerShell output
            else if (data.output) {
                // If output is a string, split by newlines
                const lines = data.output.split('\n');
                return (
                    <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                        <List dense>
                            {lines.map((line, index) => (
                                <ListItem key={index} sx={{ py: 0, minHeight: 'auto' }}>
                                    <ListItemText 
                                        primary={line || '\u00A0'}
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                    whiteSpace: 'pre-wrap'
                                                }
                                            }
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                );
            } else if (data.error) {
                return (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {data.error}
                    </Alert>
                );
            } else {
                return (
                    <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                        <Typography component="div" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {JSON.stringify(data, null, 2)}
                        </Typography>
                    </Box>
                );
            }
        } else {
            // For plain strings, first try to split by commas, then by newlines
            let lines = [];
            const stringData = String(data);
            
            // Check if the string contains commas - if so, split by commas
            if (stringData.includes(',')) {
                lines = stringData.split(',').map(item => item.trim()).filter(line => line !== '');
            } else {
                // Otherwise, split by newlines as before
                lines = stringData.split('\n').filter(line => line !== '');
            }
            
            // If no lines with content, show a message
            if (lines.length === 0) {
                return (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Command completed successfully but returned no output.
                    </Alert>
                );
            }
            
            return (
                <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                    <List dense>
                        {lines.map((line, index) => (
                            <ListItem key={index} sx={{ py: 0, minHeight: 'auto' }}>
                                <ListItemText 
                                    primary={line}
                                    slotProps={{
                                        primary: {
                                            sx: {
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all'
                                            }
                                        }
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            );
        }
    };

    // Helper function to determine if machine is online based on lastLogon
    const getMachineStatus = (machine) => {
        if (!machine.lastLogon) return 'unknown';
        
        const lastLogonDate = new Date(machine.lastLogon);
        const daysSinceLogon = Math.floor((new Date() - lastLogonDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLogon <= 7) {
            return 'online';
        } else {
            return 'offline';
        }
    };

    // Get all machines from LDAP data with status
    const allMachines = ldapMachineInfoQuery.data ? 
        ldapMachineInfoQuery.data
            .filter(machine => machine.name)
            .map(machine => ({
                ...machine,
                status: getMachineStatus(machine)
            }))
            .sort((a, b) => {
                // Sort online machines first, then by name (case-insensitive)
                if (a.status === 'online' && b.status !== 'online') return -1;
                if (a.status !== 'online' && b.status === 'online') return 1;
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            })
        : [];

    return (
        <Paper style={{ height: 'auto', overflow: 'auto', border: "1px solid #ccc" }} variant="outlined">
            <Box sx={{ p: 3 }}>
                <Typography variant='h3' sx={{ mb: 3 }}>{props.name}</Typography>
                
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="command-select-label">Common PowerShell Commands</InputLabel>
                        <Select
                            labelId="command-select-label"
                            id="command-select"
                            value={selectedCommand}
                            label="Common Powershell Commands"
                            onChange={handleCommandSelect}
                            variant="outlined"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#ffffff !important',
                                        '& .MuiMenuItem-root': {
                                            backgroundColor: '#ffffff !important',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5 !important'
                                            },
                                            '&.Mui-selected': {
                                                backgroundColor: '#f0f0f0 !important'
                                            }
                                        }
                                    }
                                }
                            }}
                            sx={{ 
                                backgroundColor: '#ffffff !important',
                                '& .MuiSelect-select': {
                                    backgroundColor: '#ffffff !important'
                                },
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff !important'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                }
                            }}
                        >
                            {commonCommands.map((command) => (
                                <MenuItem key={command} value={command}>
                                    {command}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField
                        fullWidth
                        label="PowerShell Command"
                        value={commandToExecute}
                        onChange={(e) => {
                            setCommandToExecute(e.target.value);
                            setSelectedCommand(''); // Clear dropdown selection when manually typing
                            setExecuteCommand(false);
                        }}
                        sx={{ mb: 2 }}
                        placeholder="e.g., dir, Get-Process, Get-Service"
                        slotProps={{
                            input: {
                                startAdornment: 'powershell ',
                            },
                        }}
                    />
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="host-select-label">Windows Host</InputLabel>
                        <Select
                            labelId="host-select-label"
                            id="host-select"
                            value={hostName}
                            label="Windows Host"
                            onChange={handleHostSelect}
                            variant="outlined"
                            disabled={ldapMachineInfoQuery.isLoading}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#ffffff !important',
                                        '& .MuiMenuItem-root': {
                                            backgroundColor: '#ffffff !important',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5 !important'
                                            },
                                            '&.Mui-selected': {
                                                backgroundColor: '#f0f0f0 !important'
                                            }
                                        }
                                    }
                                }
                            }}
                            sx={{ 
                                backgroundColor: '#ffffff !important',
                                '& .MuiSelect-select': {
                                    backgroundColor: '#ffffff !important'
                                },
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff !important'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    backgroundColor: 'white'
                                }
                            }}
                        >
                            {allMachines.length > 0 ? (
                                allMachines.map((machine) => (
                                    <MenuItem key={machine.name} value={machine.name}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <Typography>{machine.name}</Typography>
                                            <Chip 
                                                label={machine.status === 'online' ? 'Online' : machine.status === 'offline' ? 'Offline' : 'Unknown'}
                                                size="small"
                                                color={machine.status === 'online' ? 'success' : machine.status === 'offline' ? 'default' : 'warning'}
                                                sx={{ ml: 2 }}
                                            />
                                        </Box>
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value={hostName}>
                                    {hostName}
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Selected Host: <strong>{hostName}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Command: <strong>{commandToExecute}</strong>
                        </Typography>
                    </Box>
                    
                    <Button
                        variant="contained"
                        onClick={handleExecuteCommand}
                        disabled={windowsCommandQuery.isLoading || !commandToExecute.trim() || !hostName.trim()}
                        sx={{ mt: 1 }}
                    >
                        {windowsCommandQuery.isLoading ? 'Executing...' : 'Execute Command'}
                    </Button>
                </Box>

                {windowsCommandQuery.isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 2 }} />
                        <Typography>Executing PowerShell command on {hostName}...</Typography>
                    </Box>
                )}

                {windowsCommandQuery.data && !windowsCommandQuery.isLoading && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            Command Results for {hostName}n
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Command: {commandToExecute}
                        </Typography>
                        {(() => {
                            console.log('Full query data:', windowsCommandQuery.data);
                            console.log('Looking for hostData with key:', hostName);
                            
                            // Check if the data has a host key with the result
                            const hostData = windowsCommandQuery.data[hostName];
                            console.log('hostData found:', hostData);
                            
                            if (hostData !== undefined) {
                                return renderCommandResult(hostData);
                            }
                            // Otherwise render the data directly
                            return renderCommandResult(windowsCommandQuery.data);
                        })()}
                    </Box>
                )}

                {windowsCommandQuery.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Failed to execute PowerShell command: {windowsCommandQuery.error.message || "An unknown error occurred"}
                    </Alert>
                )}

                {executeCommand && !windowsCommandQuery.data && !windowsCommandQuery.isLoading && !windowsCommandQuery.error && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No results returned from the PowerShell command.
                    </Alert>
                )}
            </Box>
        </Paper>
    );
}