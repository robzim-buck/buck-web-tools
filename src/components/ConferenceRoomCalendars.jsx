import React, { useState, useMemo } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  TextField, Grid, ToggleButton, ToggleButtonGroup, Card, CardContent,
  Chip, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Collapse, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Search as SearchIcon,
  MeetingRoom as MeetingRoomIcon,
  LocationOn as LocationOnIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';

export default function ConferenceRoomCalendars({ name }) {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('room_name');
  const [order, setOrder] = useState('asc');
  const [rawDataDialogOpen, setRawDataDialogOpen] = useState(false);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [daysAhead, setDaysAhead] = useState(7);
  const [daysAheadInput, setDaysAheadInput] = useState('7');

  const applyDaysAhead = () => {
    const value = parseInt(daysAheadInput, 10);
    if (!isNaN(value) && value >= 1 && value <= 365) {
      setDaysAhead(value);
    } else {
      setDaysAheadInput(String(daysAhead));
    }
  };

  const timeMax = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString();
  }, [daysAhead]);

  const toggleRoomExpanded = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const formatEventTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEventDate = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeOnly = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calendar view state and helpers
  const [calendarStartDate, setCalendarStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < daysAhead; i++) {
      const day = new Date(calendarStartDate);
      day.setDate(calendarStartDate.getDate() + i);
      days.push(day);
    }
    return days;
  }, [calendarStartDate, daysAhead]);

  const navigateCalendar = (direction) => {
    setCalendarStartDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction * 7));
      return newDate;
    });
  };

  const resetCalendarToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCalendarStartDate(today);
  };

  const handleOpenRawData = (room) => {
    setSelectedRoomData(room);
    setRawDataDialogOpen(true);
  };

  const handleCloseRawData = () => {
    setRawDataDialogOpen(false);
    setSelectedRoomData(null);
  };

  const conferenceRoomCalendarsQuery = useProtectedApiGet('/google/conf_room_calendars', {
    queryParams: { max_results: 150, time_max: timeMax },
    dependencies: [timeMax],
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    },
  });

  const conferenceRoomCalendars = useMemo(() => {
    if (conferenceRoomCalendarsQuery.isLoading || conferenceRoomCalendarsQuery.error) {
      return [];
    }
    const data = conferenceRoomCalendarsQuery.data;
    // API returns { rooms: [...], total_events: N, query_params: {...} }
    if (data?.rooms && Array.isArray(data.rooms)) {
      return data.rooms;
    }
    return Array.isArray(data) ? data : [];
  }, [conferenceRoomCalendarsQuery.data, conferenceRoomCalendarsQuery.isLoading, conferenceRoomCalendarsQuery.error]);

  // Calendar view: flatten all events from all rooms
  const allEvents = useMemo(() => {
    const events = [];
    conferenceRoomCalendars.forEach(room => {
      if (room.events && Array.isArray(room.events)) {
        room.events.forEach(event => {
          events.push({
            ...event,
            roomName: room.room_name,
            roomLocation: room.location,
            roomCapacity: room.capacity,
            calendarId: room.calendar_id
          });
        });
      }
    });
    return events;
  }, [conferenceRoomCalendars]);

  // Calendar view: group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    allEvents.forEach(event => {
      const startDate = new Date(event.start?.dateTime || event.start);
      const dateKey = startDate.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    // Sort events within each day by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const timeA = new Date(a.start?.dateTime || a.start).getTime();
        const timeB = new Date(b.start?.dateTime || b.start).getTime();
        return timeA - timeB;
      });
    });
    return grouped;
  }, [allEvents]);

  const filteredCalendars = useMemo(() => {
    if (!searchTerm) return conferenceRoomCalendars;

    const searchLower = searchTerm.toLowerCase();
    return conferenceRoomCalendars.filter(room => {
      const nameMatch = room.room_name?.toLowerCase().includes(searchLower);
      const descriptionMatch = room.description?.toLowerCase().includes(searchLower);
      const locationMatch = room.location?.toLowerCase().includes(searchLower);
      const emailMatch = room.calendar_id?.toLowerCase().includes(searchLower);
      const keyMatch = room.room_key?.toLowerCase().includes(searchLower);
      return nameMatch || descriptionMatch || locationMatch || emailMatch || keyMatch;
    });
  }, [conferenceRoomCalendars, searchTerm]);

  const sortedCalendars = useMemo(() => {
    const comparator = (a, b) => {
      let valueA, valueB;

      switch (orderBy) {
        case 'room_name':
          valueA = a.room_name?.toLowerCase() || '';
          valueB = b.room_name?.toLowerCase() || '';
          break;
        case 'description':
          valueA = a.description?.toLowerCase() || '';
          valueB = b.description?.toLowerCase() || '';
          break;
        case 'location':
          valueA = a.location?.toLowerCase() || '';
          valueB = b.location?.toLowerCase() || '';
          break;
        case 'capacity':
          valueA = a.capacity || 0;
          valueB = b.capacity || 0;
          break;
        case 'calendar_id':
          valueA = a.calendar_id?.toLowerCase() || '';
          valueB = b.calendar_id?.toLowerCase() || '';
          break;
        default:
          valueA = a.room_name?.toLowerCase() || '';
          valueB = b.room_name?.toLowerCase() || '';
      }

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    };

    return [...filteredCalendars].sort(comparator);
  }, [filteredCalendars, orderBy, order]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  if (conferenceRoomCalendarsQuery.isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {name || 'Conference Room Calendars'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (conferenceRoomCalendarsQuery.error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {name || 'Conference Room Calendars'}
        </Typography>
        <Alert severity="error">
          Error loading conference room calendars: {conferenceRoomCalendarsQuery.error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
        {name || 'Conference Room Calendars'}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              placeholder="Search by name, description, location, or email..."
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
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Show events for next"
              type="number"
              value={daysAheadInput}
              onChange={(e) => setDaysAheadInput(e.target.value)}
              onBlur={applyDaysAhead}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyDaysAhead();
                  e.target.blur();
                }
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">days</InputAdornment>,
                inputProps: { min: 1, max: 365 }
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredCalendars.length} of {conferenceRoomCalendars.length} rooms
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="table" title="Table View">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="card" title="Card View">
                <ViewModuleIcon />
              </ToggleButton>
              <ToggleButton value="calendar" title="Calendar View">
                <CalendarMonthIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'table' ? (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={orderBy === 'room_name' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'room_name'}
                      direction={orderBy === 'room_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('room_name')}
                    >
                      Room Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'description' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'description'}
                      direction={orderBy === 'description' ? order : 'asc'}
                      onClick={() => handleRequestSort('description')}
                    >
                      Description
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'location' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'location'}
                      direction={orderBy === 'location' ? order : 'asc'}
                      onClick={() => handleRequestSort('location')}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'capacity' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'capacity'}
                      direction={orderBy === 'capacity' ? order : 'asc'}
                      onClick={() => handleRequestSort('capacity')}
                    >
                      Capacity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'calendar_id' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'calendar_id'}
                      direction={orderBy === 'calendar_id' ? order : 'asc'}
                      onClick={() => handleRequestSort('calendar_id')}
                    >
                      Calendar ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Events</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCalendars.map((room, index) => {
                  const roomKey = room.calendar_id || room.room_key || index;
                  const eventCount = room.events?.length || 0;
                  const isExpanded = expandedRooms[roomKey];

                  return (
                    <React.Fragment key={roomKey}>
                      <TableRow hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MeetingRoomIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">
                              {room.room_name || 'Unnamed Room'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {room.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {room.location || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {room.capacity ? (
                            <Chip label={`${room.capacity} people`} size="small" variant="outlined" />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {room.calendar_id || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {eventCount > 0 ? (
                            <IconButton
                              size="small"
                              onClick={() => toggleRoomExpanded(roomKey)}
                              title={isExpanded ? 'Hide Events' : 'Show Events'}
                            >
                              <Chip
                                icon={<EventIcon fontSize="small" />}
                                label={eventCount}
                                size="small"
                                color="primary"
                                variant={isExpanded ? "filled" : "outlined"}
                                deleteIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                onDelete={() => toggleRoomExpanded(roomKey)}
                                sx={{ cursor: 'pointer' }}
                              />
                            </IconButton>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenRawData(room)}
                            title="View Raw Data"
                          >
                            <CodeIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {eventCount > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <EventIcon fontSize="small" color="primary" />
                                  Upcoming Events ({eventCount})
                                </Typography>
                                <List dense disablePadding>
                                  {room.events.map((event, eventIndex) => (
                                    <React.Fragment key={event.id || eventIndex}>
                                      <ListItem sx={{ pl: 0 }}>
                                        <ListItemText
                                          primary={
                                            <Typography variant="body2" fontWeight="medium">
                                              {event.summary || event.title || 'Untitled Event'}
                                            </Typography>
                                          }
                                          secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                              <AccessTimeIcon fontSize="small" color="action" sx={{ fontSize: '0.875rem' }} />
                                              <Typography variant="caption" color="text.secondary">
                                                {formatEventDate(event.start?.dateTime || event.start)} • {formatTimeOnly(event.start?.dateTime || event.start)} - {formatTimeOnly(event.end?.dateTime || event.end)}
                                              </Typography>
                                              {event.organizer?.email && (
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                  | Organizer: {event.organizer.displayName || event.organizer.email}
                                                </Typography>
                                              )}
                                            </Box>
                                          }
                                        />
                                      </ListItem>
                                      {eventIndex < room.events.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                  ))}
                                </List>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {sortedCalendars.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {searchTerm ? 'No conference rooms match your search' : 'No conference rooms found'}
              </Typography>
            </Box>
          )}
        </Paper>
      ) : viewMode === 'card' ? (
        <Grid container spacing={2}>
          {sortedCalendars.map((room, index) => {
            const roomKey = room.calendar_id || room.room_key || index;
            const eventCount = room.events?.length || 0;
            const isExpanded = expandedRooms[roomKey];

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={roomKey}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <MeetingRoomIcon color="primary" />
                      <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 'medium' }}>
                        {room.room_name || 'Unnamed Room'}
                      </Typography>
                    </Box>

                    {room.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                        {room.description}
                      </Typography>
                    )}

                    {room.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {room.location}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                      {room.capacity && (
                        <Chip
                          label={`Capacity: ${room.capacity}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {eventCount > 0 && (
                        <Chip
                          icon={<EventIcon fontSize="small" />}
                          label={`${eventCount} event${eventCount !== 1 ? 's' : ''}`}
                          size="small"
                          color="secondary"
                          variant={isExpanded ? "filled" : "outlined"}
                          onClick={() => toggleRoomExpanded(roomKey)}
                          deleteIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          onDelete={() => toggleRoomExpanded(roomKey)}
                          sx={{ cursor: 'pointer' }}
                        />
                      )}
                      {room.featureInstances && room.featureInstances.length > 0 && (
                        room.featureInstances.slice(0, 2).map((feature, featureIndex) => (
                          <Chip
                            key={featureIndex}
                            label={feature.feature?.name || feature.type || 'Feature'}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      )}
                    </Box>

                    {/* Events Section */}
                    {eventCount > 0 && (
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EventIcon fontSize="small" color="primary" />
                            Upcoming Events
                          </Typography>
                          <List dense disablePadding>
                            {room.events.map((event, eventIndex) => (
                              <React.Fragment key={event.id || eventIndex}>
                                <ListItem sx={{ px: 0, py: 0.5 }}>
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                                        {event.summary || event.title || 'Untitled Event'}
                                      </Typography>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                        <AccessTimeIcon sx={{ fontSize: '0.75rem' }} color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          {formatEventDate(event.start?.dateTime || event.start)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatTimeOnly(event.start?.dateTime || event.start)} - {formatTimeOnly(event.end?.dateTime || event.end)}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                                {eventIndex < room.events.length - 1 && <Divider component="li" />}
                              </React.Fragment>
                            ))}
                          </List>
                        </Box>
                      </Collapse>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {room.calendar_id}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenRawData(room)}
                        title="View Raw Data"
                      >
                        <CodeIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {sortedCalendars.length === 0 && (
            <Grid size={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No conference rooms match your search' : 'No conference rooms found'}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        <Paper sx={{ p: 2 }}>
          {/* Calendar View */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateCalendar(-1)} title="Previous Week">
                <ChevronLeftIcon />
              </IconButton>
              <Button variant="outlined" size="small" onClick={resetCalendarToToday}>
                Today
              </Button>
              <IconButton onClick={() => navigateCalendar(1)} title="Next Week">
                <ChevronRightIcon />
              </IconButton>
            </Box>
            <Typography variant="h6" color="primary">
              {calendarStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {allEvents.length} events across {conferenceRoomCalendars.filter(r => r.events?.length > 0).length} rooms
            </Typography>
          </Box>

          {/* Calendar Grid */}
          <Grid container spacing={1}>
            {calendarDays.map((day, dayIndex) => {
              const dateKey = day.toDateString();
              const dayEvents = eventsByDate[dateKey] || [];
              const isToday = new Date().toDateString() === dateKey;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={dayIndex}>
                  <Paper
                    elevation={isToday ? 4 : 1}
                    sx={{
                      p: 1.5,
                      minHeight: 200,
                      bgcolor: isToday ? 'primary.50' : isWeekend ? 'grey.50' : 'background.paper',
                      border: isToday ? 2 : 1,
                      borderColor: isToday ? 'primary.main' : 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={isToday ? 'bold' : 'medium'}
                        color={isToday ? 'primary.main' : 'text.primary'}
                      >
                        {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Typography>
                      {dayEvents.length > 0 && (
                        <Chip label={dayEvents.length} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>

                    {dayEvents.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {dayEvents.map((event, eventIndex) => (
                          <Paper
                            key={event.id || eventIndex}
                            elevation={0}
                            sx={{
                              p: 1,
                              bgcolor: 'primary.50',
                              borderLeft: 3,
                              borderColor: 'primary.main',
                              '&:hover': { bgcolor: 'primary.100' }
                            }}
                          >
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {event.summary || event.title || 'Untitled'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: '0.75rem' }} color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {formatTimeOnly(event.start?.dateTime || event.start)} - {formatTimeOnly(event.end?.dateTime || event.end)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <MeetingRoomIcon sx={{ fontSize: '0.75rem' }} color="action" />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {event.roomName}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                        <Typography variant="body2" color="text.secondary">
                          No events
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {allEvents.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No events found for the selected time period
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Dialog
        open={rawDataDialogOpen}
        onClose={handleCloseRawData}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            Raw Data: {selectedRoomData?.room_name || 'Room'}
          </Box>
          <IconButton onClick={handleCloseRawData} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              maxHeight: '60vh',
              m: 0
            }}
          >
            {JSON.stringify(selectedRoomData, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRawData}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
