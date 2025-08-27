import { useState, useMemo } from 'react';
import { 
    Typography, 
    Button, 
    Container, 
    Card, 
    CardContent, 
    Grid, 
    Box,
    FormControlLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Popover,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useProtectedApiGet } from '../hooks/useApi';

// Calendar View Component
const CalendarView = ({ entries, getEmployeeName, getDepartment, getLocation, getStartDate, getEndDate, queryStartDate, queryEndDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(queryStartDate));
    const [anchorEl, setAnchorEl] = useState(null);
    const [hoveredDate, setHoveredDate] = useState(null);
    const [hoveredEntries, setHoveredEntries] = useState([]);

    // Get days in the current month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        
        // Add empty cells for days before the first day of the month
        const firstDayOfWeek = firstDay.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };

    // Get PTO entries for a specific day
    const getEntriesForDay = (date) => {
        if (!date) return [];
        
        return entries.filter(entry => {
            const startDateStr = getStartDate(entry);
            const endDateStr = getEndDate(entry);
            
            if (!startDateStr || !endDateStr) return false;
            
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            const checkDate = new Date(date);
            
            // Reset time components for accurate date comparison
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            checkDate.setHours(0, 0, 0, 0);
            
            return checkDate >= startDate && checkDate <= endDate;
        });
    };

    const handlePreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleDateHover = (event, date, entries) => {
        if (entries.length > 0) {
            setAnchorEl(event.currentTarget);
            setHoveredDate(date);
            setHoveredEntries(entries);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        setHoveredDate(null);
        setHoveredEntries([]);
    };

    const handlePopoverEnter = () => {
        // Keep the popover open when hovering over it
    };

    const handlePopoverLeave = () => {
        handlePopoverClose();
    };

    const open = Boolean(anchorEl);

    return (
        <Box>
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IconButton onClick={handlePreviousMonth}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5">{monthName}</Typography>
                            <Button size="small" variant="outlined" onClick={handleToday}>
                                Today
                            </Button>
                        </Box>
                        <IconButton onClick={handleNextMonth}>
                            <ArrowForwardIcon />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>

            <Paper elevation={1}>
                <Grid container>
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Grid item key={day} size={1.714} sx={{ 
                            p: 2, 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>
                            {day}
                        </Grid>
                    ))}
                    
                    {/* Calendar days */}
                    {days.map((day, index) => {
                        const dayEntries = day ? getEntriesForDay(day) : [];
                        const isToday = day && day.toDateString() === new Date().toDateString();
                        
                        return (
                            <Grid 
                                item 
                                key={index} 
                                size={1.714} 
                                sx={{ 
                                    minHeight: 120,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 1,
                                    bgcolor: isToday ? 'action.hover' : 'background.paper',
                                    cursor: dayEntries.length > 0 ? 'pointer' : 'default',
                                    '&:hover': dayEntries.length > 0 ? {
                                        bgcolor: 'action.selected'
                                    } : {}
                                }}
                                onMouseEnter={(e) => day && handleDateHover(e, day, dayEntries)}
                                onMouseLeave={() => {
                                    // Small delay to allow moving to popover
                                    setTimeout(() => {
                                        if (!document.querySelector('[data-popover-hover="true"]')) {
                                            handlePopoverClose();
                                        }
                                    }, 100);
                                }}
                            >
                                {day && (
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                                            {day.getDate()}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {dayEntries.slice(0, 3).map((entry, entryIndex) => (
                                                <Chip
                                                    key={entryIndex}
                                                    label={getEmployeeName(entry)?.split(' ')[0] || 'PTO'}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ 
                                                        mb: 0.5, 
                                                        width: '100%',
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                            ))}
                                            {dayEntries.length > 3 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{dayEntries.length - 3} more
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>

            {/* Summary below calendar */}
            <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        PTO Summary for {monthName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total employees on PTO this month: {
                            [...new Set(entries.map(entry => getEmployeeName(entry)))].length
                        }
                    </Typography>
                </CardContent>
            </Card>

            {/* Popover for showing all entries on hover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: '#ffffff',
                            boxShadow: 3,
                            pointerEvents: 'auto'
                        },
                        'data-popover-hover': 'true',
                        onMouseEnter: handlePopoverEnter,
                        onMouseLeave: handlePopoverLeave
                    }
                }}
            >
                <Box sx={{ p: 2, minWidth: 300, maxWidth: 400, bgcolor: '#ffffff' }}>
                    <Typography variant="h6" gutterBottom>
                        {hoveredDate && hoveredDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {hoveredEntries.length} employee{hoveredEntries.length !== 1 ? 's' : ''} on PTO
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                        {hoveredEntries.map((entry, index) => (
                            <ListItem key={index} disableGutters>
                                <ListItemText
                                    primary={getEmployeeName(entry) || 'Unknown Employee'}
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" display="block">
                                                {getDepartment(entry)} • {getLocation(entry)}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                {getStartDate(entry) === getEndDate(entry) 
                                                    ? 'Single day'
                                                    : `${new Date(getStartDate(entry)).toLocaleDateString()} - ${new Date(getEndDate(entry)).toLocaleDateString()}`
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </Box>
    );
};

// Timeline View Component
const TimelineView = ({ entries, getEmployeeName, getDepartment, getLocation, getStartDate, getEndDate }) => {
    const [selectedDepartment, setSelectedDepartment] = useState('');
    
    // Group entries by department
    const entriesByDepartment = useMemo(() => {
        const grouped = {};
        entries.forEach(entry => {
            const dept = getDepartment(entry) || 'No Department';
            if (!grouped[dept]) {
                grouped[dept] = [];
            }
            grouped[dept].push(entry);
        });
        return grouped;
    }, [entries]);
    
    const departments = Object.keys(entriesByDepartment).sort();
    const filteredDepartments = selectedDepartment ? [selectedDepartment] : departments;
    
    // Calculate timeline range
    const timelineRange = useMemo(() => {
        let minDate = new Date();
        let maxDate = new Date();
        
        entries.forEach(entry => {
            const startDate = getStartDate(entry);
            const endDate = getEndDate(entry);
            
            if (startDate) {
                const start = new Date(startDate);
                if (start < minDate) minDate = start;
                if (start > maxDate) maxDate = start;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                if (end > maxDate) maxDate = end;
            }
        });
        
        // Add padding of 1 week on each side
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 7);
        
        return { minDate, maxDate };
    }, [entries]);
    
    const totalDays = Math.ceil((timelineRange.maxDate - timelineRange.minDate) / (1000 * 60 * 60 * 24));
    
    const getPositionPercentage = (date) => {
        const dateObj = new Date(date);
        const daysDiff = Math.ceil((dateObj - timelineRange.minDate) / (1000 * 60 * 60 * 24));
        return (daysDiff / totalDays) * 100;
    };
    
    const getWidthPercentage = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 0;
        }
        
        // Reset time to midnight for accurate day counting
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Calculate difference in milliseconds
        const diffTime = end.getTime() - start.getTime();
        
        // Convert to days - simple difference
        const duration = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for timeline width to show inclusive days visually
        
        return (duration / totalDays) * 100;
    };
    
    return (
        <Box>
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Timeline View
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="timeline-dept-filter">Filter by Department</InputLabel>
                            <Select
                                labelId="timeline-dept-filter"
                                value={selectedDepartment}
                                label="Filter by Department"
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Departments</em>
                                </MenuItem>
                                {departments.map((dept) => (
                                    <MenuItem key={dept} value={dept}>
                                        {dept}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>
            
            <Paper elevation={1} sx={{ p: 3, overflowX: 'auto' }}>
                <Box sx={{ minWidth: 1000 }}>
                    {/* Timeline header with dates */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', position: 'relative', height: 40 }}>
                            {/* Generate month markers */}
                            {(() => {
                                const months = [];
                                const current = new Date(timelineRange.minDate);
                                current.setDate(1);
                                
                                while (current <= timelineRange.maxDate) {
                                    const monthStart = new Date(current);
                                    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                                    
                                    if (monthStart >= timelineRange.minDate || monthEnd <= timelineRange.maxDate) {
                                        const left = getPositionPercentage(monthStart);
                                        const width = getWidthPercentage(monthStart, monthEnd);
                                        
                                        months.push(
                                            <Box
                                                key={monthStart.toISOString()}
                                                sx={{
                                                    position: 'absolute',
                                                    left: `${left}%`,
                                                    width: `${width}%`,
                                                    textAlign: 'center',
                                                    borderRight: '1px solid',
                                                    borderColor: 'divider',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight="bold">
                                                    {monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        );
                                    }
                                    
                                    current.setMonth(current.getMonth() + 1);
                                }
                                
                                return months;
                            })()}
                        </Box>
                    </Box>
                    
                    {/* Department rows */}
                    {filteredDepartments.map((department) => (
                        <Box key={department} sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                {department} ({entriesByDepartment[department].length} employees)
                            </Typography>
                            
                            {entriesByDepartment[department].map((entry, index) => {
                                const startDate = getStartDate(entry);
                                const endDate = getEndDate(entry);
                                
                                if (!startDate || !endDate) return null;
                                
                                const left = getPositionPercentage(startDate);
                                const width = getWidthPercentage(startDate, endDate);
                                
                                return (
                                    <Box key={index} sx={{ position: 'relative', height: 40, mb: 1 }}>
                                        {/* Employee name on the left */}
                                        <Box sx={{ 
                                            position: 'absolute', 
                                            left: -200, 
                                            width: 190, 
                                            pr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            height: '100%'
                                        }}>
                                            <Typography variant="body2" noWrap>
                                                {getEmployeeName(entry)}
                                            </Typography>
                                        </Box>
                                        
                                        {/* Timeline bar */}
                                        <Box sx={{ 
                                            position: 'relative', 
                                            height: '100%',
                                            backgroundColor: 'grey.100',
                                            borderRadius: 1
                                        }}>
                                            <Tooltip 
                                                title={`${getEmployeeName(entry)} - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
                                                arrow
                                            >
                                                <Box sx={{
                                                    position: 'absolute',
                                                    left: `${left}%`,
                                                    width: `${width}%`,
                                                    height: 30,
                                                    backgroundColor: 'primary.main',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    '&:hover': {
                                                        backgroundColor: 'primary.dark',
                                                        boxShadow: 2
                                                    }
                                                }}>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        alignItems: 'center',
                                                        lineHeight: 1.2
                                                    }}>
                                                        {(() => {
                                                            const fullName = getEmployeeName(entry) || '';
                                                            const nameParts = fullName.trim().split(' ');
                                                            const firstName = nameParts[0] || '';
                                                            const lastName = nameParts.slice(1).join(' ') || '';
                                                            
                                                            return (
                                                                <>
                                                                    <Typography 
                                                                        variant="caption" 
                                                                        sx={{ 
                                                                            color: 'white',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 'bold',
                                                                            lineHeight: 1
                                                                        }}
                                                                        noWrap
                                                                    >
                                                                        {firstName}
                                                                    </Typography>
                                                                    {lastName && (
                                                                        <Typography 
                                                                            variant="caption" 
                                                                            sx={{ 
                                                                                color: 'white',
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: 'bold',
                                                                                lineHeight: 1
                                                                            }}
                                                                            noWrap
                                                                        >
                                                                            {lastName}
                                                                        </Typography>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </Box>
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                    
                    {/* Today marker */}
                    <Box sx={{
                        position: 'absolute',
                        left: `${getPositionPercentage(new Date())}%`,
                        top: 60,
                        bottom: 0,
                        width: 2,
                        backgroundColor: 'error.main',
                        zIndex: 10
                    }} />
                </Box>
            </Paper>
        </Box>
    );
};

const PTOCalendar = () => {
    const [viewMode, setViewMode] = useState('card'); // 'card', 'table', 'calendar', or 'timeline'
    const [hidePastDates, setHidePastDates] = useState(false);
    const [sortField, setSortField] = useState('Employee Name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Get end of current month as default end date
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfMonthString = endOfMonth.toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(todayString);
    const [endDate, setEndDate] = useState(endOfMonthString);
    
    // Separate state for the actual API query dates
    const [queryStartDate, setQueryStartDate] = useState(todayString);
    const [queryEndDate, setQueryEndDate] = useState(endOfMonthString);

    // Build query params conditionally
    const queryParams = { id: '10048' };
    if (queryStartDate) {
        queryParams.start_date = queryStartDate;
    }
    if (queryEndDate) {
        queryParams.end_date = queryEndDate;
    }

    const { data: ptoData, isLoading, error } = useProtectedApiGet(
        '/deltek/deltek_databoard',
        {
            queryParams,
            queryConfig: {
                staleTime: 300000, // 5 minutes
                refetchOnWindowFocus: false
            },
            dependencies: [queryStartDate, queryEndDate] // Re-fetch when query dates change
        }
    );

    // Helper function to get field value with multiple possible field names
    const getFieldValue = (entry, possibleFields) => {
        for (const field of possibleFields) {
            if (entry[field] !== undefined && entry[field] !== null && entry[field] !== '') {
                return entry[field];
            }
        }
        return null;
    };

    // Helper functions for specific fields based on actual API response
    const getEmployeeName = (entry) => {
        return getFieldValue(entry, [
            'Employee Name', 'employee_name', 'employeeName', 'name', 'employee'
        ]);
    };

    const getStartDate = (entry) => {
        return getFieldValue(entry, [
            'Start Date', 'start_date', 'startDate', 'start'
        ]);
    };

    const getEndDate = (entry) => {
        return getFieldValue(entry, [
            'End Date', 'end_date', 'endDate', 'end'
        ]);
    };

    const getDuration = (entry) => {
        // If no hours or hours < 8, try to calculate from dates
        const startDateStr = getStartDate(entry);
        const endDateStr = getEndDate(entry);
        
        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            
            // Check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid dates:', startDateStr, endDateStr);
                return null;
            }
            
            // Reset time to midnight for accurate day counting
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            
            // Calculate difference in milliseconds
            const diffTime = end.getTime() - start.getTime();
            
            // Convert to days - simple difference between dates
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            // If start and end dates are the same, it's 1 day
            const finalDays = diffDays === 0 ? 1 : diffDays;
            
            // Debug logging
            console.log('Duration calc:', {
                employeeName: getEmployeeName(entry),
                startDateStr,
                endDateStr,
                start: start.toISOString(),
                end: end.toISOString(),
                diffTime,
                diffDays,
                finalDays
            });
            
            return finalDays;
        }
        
        // Fall back to hours if no dates
        const hours = getFieldValue(entry, ['Hours', 'hours']);
        if (hours && hours >= 8) {
            return Math.floor(hours / 8); // Convert hours to full days only if 8+ hours
        }
        
        return null;
    };

    const getDepartment = (entry) => {
        return getFieldValue(entry, [
            'Department', 'department', 'dept'
        ]);
    };

    const getLocation = (entry) => {
        return getFieldValue(entry, [
            'User Location', 'location', 'office', 'site'
        ]);
    };


    const getUsername = (entry) => {
        return getFieldValue(entry, [
            'Username', 'username', 'email'
        ]);
    };

    const sortEntries = (entries) => {
        if (!entries || entries.length === 0) return entries;

        return [...entries].sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case 'Employee Name':
                    aValue = getEmployeeName(a) || '';
                    bValue = getEmployeeName(b) || '';
                    break;
                case 'Department':
                    aValue = getDepartment(a) || '';
                    bValue = getDepartment(b) || '';
                    break;
                case 'Location':
                    aValue = getLocation(a) || '';
                    bValue = getLocation(b) || '';
                    break;
                case 'Start Date':
                    aValue = getStartDate(a) ? new Date(getStartDate(a)) : new Date(0);
                    bValue = getStartDate(b) ? new Date(getStartDate(b)) : new Date(0);
                    break;
                case 'End Date':
                    aValue = getEndDate(a) ? new Date(getEndDate(a)) : new Date(0);
                    bValue = getEndDate(b) ? new Date(getEndDate(b)) : new Date(0);
                    break;
                case 'Duration':
                    aValue = getDuration(a) || 0;
                    bValue = getDuration(b) || 0;
                    break;
                case 'Hours':
                    aValue = getFieldValue(a, ['Hours', 'hours']) || 0;
                    bValue = getFieldValue(b, ['Hours', 'hours']) || 0;
                    break;
                case 'Email':
                    aValue = getUsername(a) || '';
                    bValue = getUsername(b) || '';
                    break;
                default:
                    aValue = getEmployeeName(a) || '';
                    bValue = getEmployeeName(b) || '';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return sortDirection === 'asc' ? comparison : -comparison;
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    };

    // Process data into array format for hooks
    const ptoEntries = useMemo(() => {
        if (!ptoData) return [];
        
        let entries = [];
        if (Array.isArray(ptoData)) {
            entries = ptoData;
        } else if (typeof ptoData === 'object') {
            // Check if it's a single object or has nested data
            if (ptoData.data && Array.isArray(ptoData.data)) {
                entries = ptoData.data;
            } else if (ptoData.results && Array.isArray(ptoData.results)) {
                entries = ptoData.results;
            } else {
                // Single object, wrap in array
                entries = [ptoData];
            }
        }
        
        // Filter out entries with 'System.String' values
        return entries.filter(entry => {
            if (!entry || typeof entry !== 'object') return false;
            
            // Check if any field contains 'System.String'
            const hasSystemString = Object.values(entry).some(value => 
                value === 'System.String' || 
                (typeof value === 'string' && value.includes('System.String'))
            );
            
            return !hasSystemString;
        });
    }, [ptoData]);

    // Get unique departments and locations for dropdowns
    const uniqueDepartments = useMemo(() => {
        const departments = ptoEntries
            .map(entry => getDepartment(entry))
            .filter(dept => dept && dept.trim() !== '')
            .filter((dept, index, arr) => arr.indexOf(dept) === index)
            .sort();
        return departments;
    }, [ptoEntries]);

    const uniqueLocations = useMemo(() => {
        const locations = ptoEntries
            .map(entry => getLocation(entry))
            .filter(loc => loc && loc.trim() !== '')
            .filter((loc, index, arr) => arr.indexOf(loc) === index)
            .sort();
        return locations;
    }, [ptoEntries]);

    // Filter entries based on all filters
    const filteredEntries = useMemo(() => {
        let filtered = ptoEntries;

        // Date filter
        if (hidePastDates) {
            filtered = filtered.filter(entry => {
                const endDate = getEndDate(entry);
                if (!endDate) return true; // Keep entries without end dates
                const entryEndDate = new Date(endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day
                return entryEndDate >= today;
            });
        }

        // Department filter
        if (selectedDepartment) {
            filtered = filtered.filter(entry => {
                const department = getDepartment(entry);
                return department === selectedDepartment;
            });
        }

        // Location filter
        if (selectedLocation) {
            filtered = filtered.filter(entry => {
                const location = getLocation(entry);
                return location === selectedLocation;
            });
        }

        return filtered;
    }, [ptoEntries, hidePastDates, selectedDepartment, selectedLocation]);

    // Apply sorting to filtered entries
    const sortedEntries = useMemo(() => {
        return sortEntries(filteredEntries);
    }, [filteredEntries, sortField, sortDirection]);

    // Debug logging to see the actual data structure
    console.log('PTO Data received:', ptoData);
    console.log('PTO Data type:', typeof ptoData);
    console.log('PTO Data is array:', Array.isArray(ptoData));
    console.log('Query params:', queryParams);
    console.log('Query dates:', { queryStartDate, queryEndDate });
    if (ptoData && Array.isArray(ptoData) && ptoData.length > 0) {
        console.log('First PTO entry:', ptoData[0]);
        console.log('Field names:', Object.keys(ptoData[0]));
    }

    const handleViewChange = (event) => {
        setViewMode(event.target.value);
    };

    const handleRefresh = () => {
        setQueryStartDate(startDate);
        setQueryEndDate(endDate);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };



    console.log('Processed PTO entries:', ptoEntries);
    console.log('Number of entries:', ptoEntries.length);
    console.log('Filtered entries:', filteredEntries.length);

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error loading PTO data: {error.message}</Typography>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="medium">
                    PTO Calendar
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={hidePastDates}
                                onChange={(e) => setHidePastDates(e.target.checked)}
                                color="secondary"
                            />
                        }
                        label="Hide Past Dates"
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="view-mode-label">View</InputLabel>
                        <Select
                            labelId="view-mode-label"
                            value={viewMode}
                            label="View"
                            onChange={handleViewChange}
                            sx={{ 
                                backgroundColor: '#ffffff',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff'
                                },
                                '& .MuiSelect-select': {
                                    backgroundColor: '#ffffff'
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#ffffff',
                                        boxShadow: 3,
                                        border: '1px solid #e0e0e0'
                                    }
                                }
                            }}
                        >
                            <MenuItem value="card">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small" />
                                    Card View
                                </Box>
                            </MenuItem>
                            <MenuItem value="table">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ViewListIcon fontSize="small" />
                                    Table View
                                </Box>
                            </MenuItem>
                            <MenuItem value="calendar">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarViewMonthIcon fontSize="small" />
                                    Calendar View
                                </Box>
                            </MenuItem>
                            <MenuItem value="timeline">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimelineIcon fontSize="small" />
                                    Timeline View
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Filters */}
            <Card variant="outlined" sx={{ mb: 4, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Filters
                    </Typography>
                    {(startDate !== queryStartDate || endDate !== queryEndDate) && (
                        <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
                            Click "Refresh" to apply date changes
                        </Typography>
                    )}
                    {(startDate === queryStartDate && endDate === queryEndDate) && (
                        <Typography variant="body2" color="success.main" sx={{ fontStyle: 'italic' }}>
                            {queryStartDate && queryEndDate 
                                ? `Showing: ${queryStartDate} to ${queryEndDate}`
                                : 'Showing: All PTO records'
                            }
                        </Typography>
                    )}
                </Box>
                <Grid container spacing={2} alignItems="center">
                    <Grid item size={4}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                }
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item size={4}>
                        <TextField
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                }
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item size={4}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => {
                                    setStartDate(todayString);
                                    setEndDate(endOfMonthString);
                                    setQueryStartDate(todayString);
                                    setQueryEndDate(endOfMonthString);
                                }}
                            >
                                This Month
                            </Button>
                            <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => {
                                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                                    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                                    const nextMonthString = nextMonth.toISOString().split('T')[0];
                                    const endOfNextMonthString = endOfNextMonth.toISOString().split('T')[0];
                                    setStartDate(nextMonthString);
                                    setEndDate(endOfNextMonthString);
                                    setQueryStartDate(nextMonthString);
                                    setQueryEndDate(endOfNextMonthString);
                                }}
                            >
                                Next Month
                            </Button>
                            <Button 
                                variant="outlined" 
                                size="small"
                                color="secondary"
                                onClick={() => {
                                    // Set a wide date range to show all records
                                    const yearStart = new Date(today.getFullYear(), 0, 1);
                                    const yearEnd = new Date(today.getFullYear(), 11, 31);
                                    const yearStartString = yearStart.toISOString().split('T')[0];
                                    const yearEndString = yearEnd.toISOString().split('T')[0];
                                    setStartDate(yearStartString);
                                    setEndDate(yearEndString);
                                    setQueryStartDate(yearStartString);
                                    setQueryEndDate(yearEndString);
                                }}
                            >
                                This Year
                            </Button>
                            <Button 
                                variant="contained" 
                                size="small"
                                color="primary"
                                onClick={handleRefresh}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Refresh'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                
                {/* Department and Location Filters */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Filter by Department & Location
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item size={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="department-filter-label">Department</InputLabel>
                                <Select
                                    labelId="department-filter-label"
                                    value={selectedDepartment}
                                    label="Department"
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    sx={{ 
                                        backgroundColor: '#ffffff',
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#ffffff'
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'divider'
                                        },
                                        '& .MuiSelect-select': {
                                            backgroundColor: '#ffffff'
                                        }
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                boxShadow: 3,
                                                border: '1px solid #e0e0e0'
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>All Departments</em>
                                    </MenuItem>
                                    {uniqueDepartments.map((department) => (
                                        <MenuItem key={department} value={department}>
                                            {department}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="location-filter-label">Location</InputLabel>
                                <Select
                                    labelId="location-filter-label"
                                    value={selectedLocation}
                                    label="Location"
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    sx={{ 
                                        backgroundColor: '#ffffff',
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#ffffff'
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'divider'
                                        },
                                        '& .MuiSelect-select': {
                                            backgroundColor: '#ffffff'
                                        }
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                boxShadow: 3,
                                                border: '1px solid #e0e0e0'
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>All Locations</em>
                                    </MenuItem>
                                    {uniqueLocations.map((location) => (
                                        <MenuItem key={location} value={location}>
                                            {location}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {sortedEntries.length === 0 && ptoEntries.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No PTO data available
                    </Typography>
                    {ptoData && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Debug: Raw data received
                            </Typography>
                            <Typography variant="caption" component="pre" sx={{ display: 'block', mt: 1, textAlign: 'left' }}>
                                {JSON.stringify(ptoData, null, 2)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {sortedEntries.length === 0 && ptoEntries.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No PTO entries found for the current filter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {hidePastDates ? 'All entries are in the past. Toggle "Hide Past Dates" to see them.' : ''}
                    </Typography>
                </Box>
            )}

            {ptoEntries.length > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark" gutterBottom>
                        Debug Info: Found {ptoEntries.length} total entries, showing {sortedEntries.length} entries
                    </Typography>
                    {ptoEntries[0] && (
                        <Typography variant="caption" component="pre" sx={{ display: 'block', mt: 1 }}>
                            Available fields: {Object.keys(ptoEntries[0]).join(', ')}
                        </Typography>
                    )}
                </Box>
            )}

            {viewMode === 'card' ? (
                // Card View
                <Grid container spacing={3}>
                    {sortedEntries.map((entry, index) => (
                        <Grid item size={4} key={index}>
                            <Card 
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" color="primary">
                                                {getEmployeeName(entry) || 'Unknown Employee'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {getDepartment(entry)} • {getLocation(entry)}
                                            </Typography>
                                        </Box>
                                        <Chip 
                                            label="PTO" 
                                            color="primary"
                                            size="small"
                                        />
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Start Date
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(getStartDate(entry)) || 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            End Date
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(getEndDate(entry)) || 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Days
                                        </Typography>
                                        <Typography variant="body1">
                                            {(() => {
                                                const duration = getDuration(entry);
                                                if (duration) {
                                                    // If we have hours and it's less than 8, show as decimal
                                                    const hours = getFieldValue(entry, ['Hours', 'hours']);
                                                    if (hours && hours < 8) {
                                                        return (hours / 8).toFixed(1);
                                                    }
                                                    return duration;
                                                }
                                                return 'N/A';
                                            })()}
                                        </Typography>
                                    </Box>

                                    {(() => {
                                        const hours = getFieldValue(entry, ['Hours', 'hours']);
                                        if (hours && hours < 8) {
                                            return (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Hours
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {hours} hours
                                                    </Typography>
                                                </Box>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {getUsername(entry) && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Email
                                            </Typography>
                                            <Typography variant="body2">
                                                {getUsername(entry)}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : viewMode === 'table' ? (
                // Table View
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ backgroundColor: 'primary.main' }}>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Employee Name')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Employee
                                        {sortField === 'Employee Name' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Department')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Department
                                        {sortField === 'Department' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Location')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Location
                                        {sortField === 'Location' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Start Date')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Start Date
                                        {sortField === 'Start Date' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('End Date')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        End Date
                                        {sortField === 'End Date' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Duration')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Duration
                                        {sortField === 'Duration' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Hours')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Hours
                                        {sortField === 'Hours' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={() => handleSort('Email')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Email
                                        {sortField === 'Email' && (
                                            sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedEntries.map((entry, index) => (
                                <TableRow 
                                    key={index} 
                                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {getEmployeeName(entry) || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        {getDepartment(entry) || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {getLocation(entry) || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(getStartDate(entry)) || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(getEndDate(entry)) || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {getDuration(entry) ? `${getDuration(entry)} days` : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {getFieldValue(entry, ['Hours', 'hours']) || 'N/A'} hours
                                    </TableCell>
                                    <TableCell>
                                        {getUsername(entry) || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : viewMode === 'calendar' ? (
                // Calendar View
                <CalendarView 
                    entries={sortedEntries} 
                    getEmployeeName={getEmployeeName}
                    getDepartment={getDepartment}
                    getLocation={getLocation}
                    getStartDate={getStartDate}
                    getEndDate={getEndDate}
                    queryStartDate={queryStartDate}
                    queryEndDate={queryEndDate}
                />
            ) : (
                // Timeline View
                <TimelineView 
                    entries={sortedEntries} 
                    getEmployeeName={getEmployeeName}
                    getDepartment={getDepartment}
                    getLocation={getLocation}
                    getStartDate={getStartDate}
                    getEndDate={getEndDate}
                />
            )}
        </Container>
    );
};

export default PTOCalendar;