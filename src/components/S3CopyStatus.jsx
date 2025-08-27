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
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export default function S3CopyStatus(props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const { data, isLoading, error, refetch } = useApiGet('/utils/copy_to_s3__status', {
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

  const formatDate = (dateString) => {
    if (!dateString) return { relative: 'N/A', formatted: 'N/A' };
    
    // Check if it's just a time (HH:MM format)
    if (/^\d{1,2}:\d{2}$/.test(dateString)) {
      // It's just a time, add today's date
      const today = dayjs().format('YYYY-MM-DD');
      const fullDateTime = dayjs(`${today} ${dateString}`);
      return {
        relative: fullDateTime.fromNow(),
        formatted: fullDateTime.format('h:mm A')
      };
    }
    
    // Otherwise parse it as a full date
    const date = dayjs(dateString);
    
    // Check if the date is today
    if (date.isSame(dayjs(), 'day')) {
      return {
        relative: date.fromNow(),
        formatted: date.format('h:mm A')
      };
    } else {
      return {
        relative: date.fromNow(),
        formatted: date.format('MMM D, YYYY h:mm A')
      };
    }
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
                        <Tooltip title={dateTime.relative}>
                          <Typography variant="body2">
                            {dateTime.formatted}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {task.command || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0 }}>
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
    </Container>
  );
}