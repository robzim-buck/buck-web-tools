import { 
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card, Button, TableSortLabel, LinearProgress,
  TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceTasks(props) {
    const [expanded, setExpanded] = useState({});
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [dateFilter, setDateFilter] = useState('all'); // Date filter preset
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    // Toggle expansion state for a specific task
    const handleToggle = (taskId) => {
        setExpanded(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get date range based on filter preset
    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(dateFilter) {
            case 'today':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'thisWeek':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                return { start: weekStart, end: weekEnd };
            case 'thisMonth':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start: monthStart, end: monthEnd };
            case 'lastMonth':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start: lastMonthStart, end: lastMonthEnd };
            case 'custom':
                return { 
                    start: customStartDate ? new Date(customStartDate) : null, 
                    end: customEndDate ? new Date(customEndDate) : null 
                };
            default:
                return { start: null, end: null };
        }
    };

    // Filter tasks by date
    const filterTasksByDate = (tasks) => {
        if (dateFilter === 'all') return tasks;
        
        const { start, end } = getDateRange();
        if (!start && !end) return tasks;
        
        return tasks.filter(task => {
            // Check multiple date fields in order of preference
            const taskDate = task.created || task.started || task.ended || task.lastUpdated;
            if (!taskDate) return false;
            
            const date = new Date(taskDate);
            if (isNaN(date.getTime())) return false;
            
            if (start && end) {
                return date >= start && date <= end;
            } else if (start) {
                return date >= start;
            } else if (end) {
                return date <= end;
            }
            return true;
        });
    };

    // Sort tasks based on current sort config
    const getSortedTasks = (tasks) => {
        if (!sortConfig.key) return tasks;
        
        return [...tasks].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            
            // Special handling for name field (could be 'name' or 'title')
            if (sortConfig.key === 'name') {
                aValue = a.name || a.title || '';
                bValue = b.name || b.title || '';
            }
            
            // Handle null/undefined values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';
            
            // Handle date and timestamp sorting
            if (sortConfig.key.includes('Date') || ['created', 'started', 'ended'].includes(sortConfig.key.toLowerCase())) {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            }

            // Handle numeric sorting for progress
            if (sortConfig.key === 'progress') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            }
            
            // Convert to strings for comparison
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
            
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };
    
    const [hammerspaceTasks] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceTasks"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=tasks", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceTasks.isLoading) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace Tasks
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (hammerspaceTasks.isError) {
        return (
            <Box>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    HammerSpace Tasks
                </Typography>
                <Alert severity="error">
                    Error loading HammerSpace tasks: {hammerspaceTasks.error?.message || 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    // Debug: Log the structure to understand the data format
    console.log('HammerspaceTasks raw data:', hammerspaceTasks.data);
    
    // Check if data is wrapped in a 'results' field
    const rawData = hammerspaceTasks.data?.results || hammerspaceTasks.data;
    const allTasks = Array.isArray(rawData) ? rawData : [];
    const filteredTasks = filterTasksByDate(allTasks);
    const sortedTasks = getSortedTasks(filteredTasks);
    
    // Helper function to format task status
    const getStatusColor = (status) => {
        if (!status) return 'default';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('complete') || statusLower.includes('done')) return 'success';
        if (statusLower.includes('progress') || statusLower.includes('running')) return 'info';
        if (statusLower.includes('error') || statusLower.includes('failed')) return 'error';
        if (statusLower.includes('pending') || statusLower.includes('waiting')) return 'warning';
        return 'default';
    };

    // Helper function to format priority
    const getPriorityColor = (priority) => {
        if (!priority) return 'default';
        const priorityLower = priority.toLowerCase();
        if (priorityLower === 'high' || priorityLower === 'critical') return 'error';
        if (priorityLower === 'medium') return 'warning';
        if (priorityLower === 'low') return 'success';
        return 'default';
    };

    // Helper function to format timestamps as DateTime
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString();
        } catch (error) {
            return '-';
        }
    };

    // Render table view
    const renderTableView = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'name'}
                                direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Task Name
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'status'}
                                direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('status')}
                            >
                                Status
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'created'}
                                direction={sortConfig.key === 'created' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('created')}
                            >
                                Created
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'started'}
                                direction={sortConfig.key === 'started' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('started')}
                            >
                                Started
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'ended'}
                                direction={sortConfig.key === 'ended' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('ended')}
                            >
                                Ended
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'progress'}
                                direction={sortConfig.key === 'progress' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('progress')}
                            >
                                Progress
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortConfig.key === 'statusMessage'}
                                direction={sortConfig.key === 'statusMessage' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('statusMessage')}
                            >
                                Status Message
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedTasks.map((task, index) => (
                        <TableRow key={task.id || task.taskId || index}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PlaylistAddCheckIcon color="primary" fontSize="small" />
                                    {task.name || task.title || `Task ${index + 1}`}
                                </Box>
                            </TableCell>
                            <TableCell>
                                {task.status && (
                                    <Chip 
                                        label={task.status} 
                                        color={getStatusColor(task.status)}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {formatTimestamp(task.created)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {formatTimestamp(task.started)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {formatTimestamp(task.ended)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {task.progress !== undefined && task.progress !== null ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={parseFloat(task.progress) || 0}
                                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                            color={
                                                parseFloat(task.progress) >= 100 ? 'success' :
                                                parseFloat(task.progress) >= 50 ? 'primary' : 'warning'
                                            }
                                        />
                                        <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                                            {Math.round(parseFloat(task.progress) || 0)}%
                                        </Typography>
                                    </Box>
                                ) : '-'}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ 
                                    maxWidth: 200, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {task.statusMessage || '-'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h4' color="primary" fontWeight="medium">
                    HammerSpace Tasks ({filteredTasks.length} of {allTasks.length} tasks)
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                        startIcon={<ViewModuleIcon />}
                        onClick={() => setViewMode('cards')}
                        size="small"
                    >
                        Cards
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'contained' : 'outlined'}
                        startIcon={<ViewListIcon />}
                        onClick={() => setViewMode('table')}
                        size="small"
                    >
                        Table
                    </Button>
                </Box>
            </Box>
            
            {/* Date Filter Controls */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <FilterListIcon color="action" />
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Date Filter</InputLabel>
                        <Select
                            value={dateFilter}
                            label="Date Filter"
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Time</MenuItem>
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="thisWeek">This Week</MenuItem>
                            <MenuItem value="thisMonth">This Month</MenuItem>
                            <MenuItem value="lastMonth">Last Month</MenuItem>
                            <MenuItem value="custom">Custom Range</MenuItem>
                        </Select>
                    </FormControl>
                    
                    {dateFilter === 'custom' && (
                        <>
                            <TextField
                                label="Start Date"
                                type="date"
                                size="small"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                size="small"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                        </>
                    )}
                    
                    {dateFilter !== 'all' && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={() => {
                                setDateFilter('all');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                        >
                            Clear Filter
                        </Button>
                    )}
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    {dateFilter !== 'all' && (
                        <Chip
                            label={`Showing ${filteredTasks.length} of ${allTasks.length} tasks`}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
            </Paper>
            
            {filteredTasks.length === 0 ? (
                <Alert severity="info">
                    {allTasks.length === 0 ? 
                        'No HammerSpace tasks found.' : 
                        `No tasks found matching the selected date filter. (${allTasks.length} total tasks)`}
                </Alert>
            ) : viewMode === 'table' ? (
                renderTableView()
            ) : (
                <Grid container spacing={3}>
                    {sortedTasks.map((task, index) => {
                        const taskId = task.id || task.taskId || index;
                        const isExpanded = expanded[taskId];
                        
                        return (
                            <Grid item size={12} key={taskId}>
                                <Card elevation={2} sx={{ mb: 2 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <PlaylistAddCheckIcon color="primary" />
                                                <Typography variant="h6" color="primary">
                                                    {task.name || task.title || `Task ${index + 1}`}
                                                </Typography>
                                                {task.status && (
                                                    <Chip 
                                                        label={task.status} 
                                                        color={getStatusColor(task.status)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                                {task.priority && (
                                                    <Chip 
                                                        label={`Priority: ${task.priority}`} 
                                                        color={getPriorityColor(task.priority)}
                                                        size="small"
                                                        variant="filled"
                                                    />
                                                )}
                                            </Box>
                                            <IconButton 
                                                onClick={() => handleToggle(taskId)}
                                                size="small"
                                            >
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                        
                                        {task.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {task.description}
                                            </Typography>
                                        )}
                                        
                                        {/* Progress Bar */}
                                        {task.progress !== undefined && task.progress !== null && (
                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        Progress
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {Math.round(parseFloat(task.progress) || 0)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={parseFloat(task.progress) || 0}
                                                    sx={{ height: 8, borderRadius: 4 }}
                                                    color={
                                                        parseFloat(task.progress) >= 100 ? 'success' :
                                                        parseFloat(task.progress) >= 75 ? 'info' :
                                                        parseFloat(task.progress) >= 50 ? 'primary' :
                                                        parseFloat(task.progress) >= 25 ? 'warning' : 'error'
                                                    }
                                                />
                                                {task.statusMessage && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {task.statusMessage}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                        
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                                            {task.assignee && (
                                                <Chip 
                                                    icon={<AssignmentIcon />}
                                                    label={`Assigned to: ${task.assignee}`}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            )}
                                            {task.created && (
                                                <Chip 
                                                    icon={<CalendarTodayIcon />}
                                                    label={`Created: ${formatTimestamp(task.created)}`}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            )}
                                            {task.started && (
                                                <Chip 
                                                    icon={<CalendarTodayIcon />}
                                                    label={`Started: ${formatTimestamp(task.started)}`}
                                                    variant="outlined"
                                                    size="small"
                                                    color="info"
                                                />
                                            )}
                                            {task.ended && (
                                                <Chip 
                                                    icon={<CalendarTodayIcon />}
                                                    label={`Ended: ${formatTimestamp(task.ended)}`}
                                                    variant="outlined"
                                                    size="small"
                                                    color="success"
                                                />
                                            )}
                                            {task.dueDate && (
                                                <Chip 
                                                    icon={<CalendarTodayIcon />}
                                                    label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                                                    variant="outlined"
                                                    size="small"
                                                    color={new Date(task.dueDate) < new Date() ? 'error' : 'default'}
                                                />
                                            )}
                                            {task.lastUpdated && (
                                                <Chip 
                                                    icon={<UpdateIcon />}
                                                    label={`Updated: ${new Date(task.lastUpdated).toLocaleDateString()}`}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        
                                        <Collapse in={isExpanded}>
                                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableBody>
                                                            {Object.entries(task).map(([key, value]) => {
                                                                // Skip already displayed fields
                                                                if (['name', 'title', 'description', 'status', 'priority', 'assignee', 'created', 'started', 'ended', 'createdDate', 'dueDate', 'lastUpdated', 'progress', 'statusMessage'].includes(key)) {
                                                                    return null;
                                                                }
                                                                
                                                                return (
                                                                    <TableRow key={key}>
                                                                        <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>
                                                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {typeof value === 'object' ? 
                                                                                JSON.stringify(value, null, 2) : 
                                                                                String(value)
                                                                            }
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        </Collapse>
                                    </Paper>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}