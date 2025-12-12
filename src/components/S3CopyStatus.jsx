import { useState, useEffect } from 'react';
import { useApiGet } from '../hooks/useApi';
import {
  Typography,
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  LinearProgress,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export default function S3CopyStatus(props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [killDialog, setKillDialog] = useState({ open: false, host: '', pid: '' });

  const { data, isLoading, error, refetch } = useApiGet('/utils/copy_to_s3_status', {
    queryConfig: {
      refetchInterval: 10000, // Auto refresh every 10 seconds
      refetchIntervalInBackground: true
    },
    dependencies: [refreshKey]
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const handleExpandClick = (taskId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedRows(newExpanded);
  };

  const handleKillClick = (host, pid) => {
    setKillDialog({ open: true, host, pid });
  };

  const handleKillDialogClose = () => {
    setKillDialog({ open: false, host: '', pid: '' });
  };

  const handleKillConfirm = async () => {
    const { host, pid } = killDialog;
    handleKillDialogClose();

    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/utils/kill_process_on_host/${encodeURIComponent(host)}coresrv/${encodeURIComponent(pid)}`,
        {
          method: 'POST',
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Successfully killed process ${pid} on ${host}`,
          severity: 'success'
        });
        // Refresh the list after killing
        handleRefresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSnackbar({
          open: true,
          message: `Failed to kill process: ${errorData.message || response.statusText}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error killing process: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    return dateString || 'N/A';
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading S3 copy status...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Failed to load S3 copy status</Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  // Process data
  let tasks = [];

  if (data) {
    // Handle different possible response formats
    if (Array.isArray(data)) {
      tasks = data;
    } else if (data.tasks) {
      tasks = data.tasks;
    } else if (data.results) {
      tasks = data.results;
    } else if (typeof data === 'object') {
      // If it's an object with task IDs as keys
      tasks = Object.entries(data).map(([id, task]) => ({
        id,
        ...task
      }));
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight="medium">
          {props.name || 'S3 Copy Status'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="primary" onClick={handleRefresh} title="Refresh">
            <RefreshIcon />
          </IconButton>
          {tasks.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Tasks Table */}
      {tasks.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell width="5%"></TableCell>
                <TableCell>Host</TableCell>
                <TableCell>PID</TableCell>
                <TableCell>Date/Time</TableCell>
                <TableCell>Command</TableCell>
                <TableCell width="10%" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task, index) => {
                const taskId = task.id || task.task_id || index;
                const isExpanded = expandedRows.has(taskId);
                const dateTime = formatDate(task.date_time);

                return (
                  <>
                    <TableRow key={taskId} hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleExpandClick(taskId)}
                          aria-label="expand row"
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {task.host || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {task.pid !== undefined && task.pid !== null ? task.pid : 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {dateTime}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {task.command || 'N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {task.host && (task.pid !== undefined && task.pid !== null) && (
                          <Tooltip title="Kill this process" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleKillClick(task.host, task.pid)}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <StopIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Box sx={{ m: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Raw JSON Data
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                backgroundColor: '#f5f5f5',
                                overflowX: 'auto',
                                maxHeight: '400px',
                                overflowY: 'auto'
                              }}
                            >
                              <pre style={{ 
                                margin: 0, 
                                fontFamily: 'monospace', 
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                                {JSON.stringify(task, null, 2)}
                              </pre>
                            </Paper>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No S3 copy tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tasks will appear here when S3 copy operations are initiated
          </Typography>
        </Paper>
      )}

      {/* Kill Confirmation Dialog */}
      <Dialog
        open={killDialog.open}
        onClose={handleKillDialogClose}
        aria-labelledby="kill-dialog-title"
        aria-describedby="kill-dialog-description"
      >
        <DialogTitle id="kill-dialog-title">
          Confirm Kill Process
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="kill-dialog-description">
            Are you sure you want to kill this process?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Machine:</strong> {killDialog.host}
            </Typography>
            <Typography variant="body2">
              <strong>PID:</strong> {killDialog.pid}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKillDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleKillConfirm} color="error" variant="contained">
            Kill Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}