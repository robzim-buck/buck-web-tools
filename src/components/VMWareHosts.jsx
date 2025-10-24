import { useState } from 'react';
import axios from 'axios';
import { 
  Typography, Button, Box, Container, Grid, 
  Card, CardContent, Chip, Divider, Alert, Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';
import uuid from 'react-uuid';

export default function VMWareHosts(props) {
  // State for search filters and notifications
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHost, setSelectedHost] = useState(null);
  const [dialogAction, setDialogAction] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch VM data with automatic refresh every 10 seconds
  const [vmwarehosts] = useQueries({
    queries: [
      {
        queryKey: ["vmwarehosts"],
        queryFn: () =>
        fetch('https://laxcoresrv.buck.local:8000/vmware/vmware_hosts', {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }).then((res) => res.json()),
      },
    ]
  });

  // Power control functions with confirmation and feedback
  const promptPowerAction = (action, host) => {
    setSelectedHost(host);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const executePowerAction = () => {
    setDialogOpen(false);
    
    if (!selectedHost) return;
    
    const instruction = dialogAction === 'powerOff' ? 'stop' : 'start';
    const actionText = dialogAction === 'powerOff' ? 'Powering off' : 'Powering on';
    
    // Show initial notification
    setSnackbar({
      open: true,
      message: `${actionText} ${selectedHost.host}...`,
      severity: 'info'
    });
    
    // Make API requestno 
    axios.get(`https://laxcoresrv.buck.local:8000/vmware/vmware_power?vm=${selectedHost.vm}&instruction=${instruction}`)
      .then(response => {
        // Show success notification
        setSnackbar({
          open: true,
          message: `${dialogAction === 'powerOff' ? 'Powered off' : 'Powered on'} ${selectedHost.host} successfully`,
          severity: 'success'
        });
      })
      .catch(error => {
        // Show error notification
        setSnackbar({
          open: true,
          message: `Failed to ${dialogAction === 'powerOff' ? 'power off' : 'power on'} ${selectedHost.host}: ${error.message}`,
          severity: 'error'
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Loading state
  if (vmwarehosts.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  // Error state
  if (vmwarehosts.error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>An error has occurred</Typography>
        <Typography color="text.secondary">{vmwarehosts.error.message}</Typography>
      </Box>
    );
  }
  
  // Data processing
  if (!vmwarehosts.data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="warning.main" gutterBottom>No data available</Typography>
        <Typography color="text.secondary" paragraph>
          The VMWare hosts endpoint returned an empty response.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }
  
  // Continue with data processing if we have data
  if (vmwarehosts.data) {
    // Check if data has expected structure
    if (!vmwarehosts.data.value || !Array.isArray(vmwarehosts.data.value)) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="warning.main" gutterBottom>No data available</Typography>
          <Typography color="text.secondary" paragraph>
            The VMWare hosts endpoint did not return any data in the expected format.
          </Typography>
          <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mt: 3, p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Response received:</Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto', maxHeight: 200 }}>
              <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace' }}>
                {JSON.stringify(vmwarehosts.data, null, 2)}
              </Typography>
            </Box>
          </Card>
        </Box>
      );
    }
    
    // Filter VDI VMs
    const filteredHosts = vmwarehosts.data.value.filter(
      host => host.name.includes('VDI') && host.name.includes('VM')
    );
    
    // Apply search filter
    const searchFilteredHosts = searchTerm 
      ? filteredHosts.filter(host => 
          host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          host.vm.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filteredHosts;
    
    // Format data for display
    const formattedHosts = searchFilteredHosts.map(host => ({
      host: host.name,
      vm: host.vm,
      memoryMB: host.memory_size_MiB,
      powerState: host.power_state,
      cpus: host.cpu_count,
      original: host
    }));
    
    // Empty state
    if (filteredHosts.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="info.main" gutterBottom>No VMWare hosts found</Typography>
          <Typography color="text.secondary" paragraph>
            The endpoint returned data, but no hosts matched the VDI VM criteria.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Data was received from the endpoint, but none of the hosts matched the filter criteria:
            </Typography>
            <Chip 
              label={`${vmwarehosts.data.value.length} total hosts in response`} 
              color="primary" 
              variant="outlined" 
              size="small"
            />
            <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mt: 1, p: 1, bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Current filter: Host names must include both "VDI" and "VM"
              </Typography>
              <Typography variant="caption" color="text.secondary">
                First few host names in response:
              </Typography>
              <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, mt: 1 }}>
                {vmwarehosts.data.value.slice(0, 5).map((host, index) => (
                  <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {host.name || "Unknown"}
                  </Typography>
                ))}
                {vmwarehosts.data.value.length > 5 && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    ...and {vmwarehosts.data.value.length - 5} more
                  </Typography>
                )}
              </Box>
            </Card>
          </Box>
        </Box>
      );
    }

    // Group hosts by power state for summary
    const hostStats = {
      total: filteredHosts.length,
      poweredOn: filteredHosts.filter(host => host.power_state === 'POWERED_ON').length,
      poweredOff: filteredHosts.filter(host => host.power_state === 'POWERED_OFF').length,
      other: filteredHosts.filter(host => 
        host.power_state !== 'POWERED_ON' && host.power_state !== 'POWERED_OFF'
      ).length
    };

    // Helper function to format memory size
    const formatMemory = (megabytes) => {
      if (megabytes < 1024) return `${megabytes} MB`;
      return `${(megabytes / 1024).toFixed(2)} GB`;
    };

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant='h4' color="primary" fontWeight="medium">
            {props.name || 'VMWare VDI Hosts'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<StorageIcon />}
              label={`${hostStats.total} Total Hosts`} 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              icon={<PlayArrowIcon />}
              label={`${hostStats.poweredOn} On`} 
              color="success" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              icon={<StopIcon />}
              label={`${hostStats.poweredOff} Off`} 
              color="error" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>

        {/* Search bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by host name or VM ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Box>

        {/* Host listing */}
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader aria-label="vmware hosts table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Host Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>VM ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resources</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formattedHosts.map((host) => {
                  // Determine status color
                  const getStatusColor = () => {
                    switch (host.powerState) {
                      case 'POWERED_ON': return 'success';
                      case 'POWERED_OFF': return 'error';
                      default: return 'warning';
                    }
                  };

                  return (
                    <TableRow 
                      key={host.vm || uuid()}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        borderLeft: `4px solid ${host.powerState === 'POWERED_ON' ? '#4caf50' : '#f44336'}`
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {host.host}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {host.vm}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={host.powerState.replace('POWERED_', '')} 
                          color={getStatusColor()}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<MemoryIcon fontSize="small" />}
                            label={`${host.cpus} CPU`} 
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                          <Chip 
                            icon={<StorageIcon fontSize="small" />}
                            label={formatMemory(host.memoryMB)} 
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<StopIcon />}
                            disabled={host.powerState === 'POWERED_OFF'}
                            onClick={() => promptPowerAction('powerOff', host)}
                          >
                            Power Off
                          </Button>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            disabled={host.powerState === 'POWERED_ON'}
                            onClick={() => promptPowerAction('powerOn', host)}
                          >
                            Power On
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {formattedHosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No hosts match your search criteria</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Power action confirmation dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
        >
          <DialogTitle>
            {dialogAction === 'powerOff' ? 'Power Off Confirmation' : 'Power On Confirmation'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to {dialogAction === 'powerOff' ? 'power off' : 'power on'} the VM "{selectedHost?.host}"?
              {dialogAction === 'powerOff' && (
                <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', display: 'block', mt: 1 }}>
                  Warning: This will immediately shut down the VM and may cause data loss if not properly saved.
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={executePowerAction} 
              color={dialogAction === 'powerOff' ? 'error' : 'success'} 
              variant="contained"
              startIcon={dialogAction === 'powerOff' ? <StopIcon /> : <PlayArrowIcon />}
            >
              {dialogAction === 'powerOff' ? 'Power Off' : 'Power On'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }
  
  // Fallback
  return null;
}