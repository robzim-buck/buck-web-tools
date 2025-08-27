import React, { useState, useMemo } from 'react';
import {
  Typography, Container, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { useOktaAuth } from '@okta/okta-react';
import { useProtectedApiGet } from '../hooks/useApi';

export default function GoogleCalendars(props) {
  const { authState } = useOktaAuth();
  const [selectedUser, setSelectedUser] = useState('coda_admin@buck.co');

  console.log("GoogleCalendars render - Auth state:", authState?.isAuthenticated);

  // Fetch Google users for dropdown
  const googleStaffUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Staff' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    },
    dependencies: ['staff']
  });

  const googleFreelanceUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Freelance' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    },
    dependencies: ['freelance']
  });

  // Fetch calendars for selected user
  const googleCalendarsQuery = useProtectedApiGet('/google/calendars/user', {
    queryParams: { user: selectedUser },
    queryConfig: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      enabled: !!selectedUser,
      onSuccess: (data) => {
        console.log("Google calendars fetched successfully:", data);
      }
    },
    dependencies: [selectedUser]
  });

  // Combine Google users data
  const googleUsers = useMemo(() => {
    if (googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading) {
      return [];
    }

    if (googleStaffUsersQuery.error || googleFreelanceUsersQuery.error) {
      console.error("Error fetching Google users:", googleStaffUsersQuery.error || googleFreelanceUsersQuery.error);
      return [];
    }

    const staffData = Array.isArray(googleStaffUsersQuery.data) ? googleStaffUsersQuery.data : [];
    const freelanceData = Array.isArray(googleFreelanceUsersQuery.data) ? googleFreelanceUsersQuery.data : [];

    const combinedUsers = [...staffData, ...freelanceData];
    
    // Sort users by first name (givenName) in ascending order
    return combinedUsers.sort((a, b) => {
      const firstNameA = (a.name?.givenName || '').toLowerCase();
      const firstNameB = (b.name?.givenName || '').toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  }, [googleStaffUsersQuery.data, googleFreelanceUsersQuery.data,
      googleStaffUsersQuery.isLoading, googleFreelanceUsersQuery.isLoading,
      googleStaffUsersQuery.error, googleFreelanceUsersQuery.error]);

  const isLoadingUsers = googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading;
  const isLoadingCalendars = googleCalendarsQuery.isLoading;
  const calendarsError = googleCalendarsQuery.error;
  const calendars = googleCalendarsQuery.data || [];

  if (isLoadingUsers) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
          {props.name || 'Google Calendars'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
        {props.name || 'Google Calendars'}
      </Typography>
      
      {authState ? (
        <Alert severity={authState.isAuthenticated ? "success" : "warning"} sx={{ mb: 2 }}>
          Authentication Status: {authState.isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Authentication state is loading...
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="user-select-label">Select User</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUser}
                label="Select User"
                onChange={(e) => setSelectedUser(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: 'white',
                      color: 'black'
                    }
                  }
                }}
              >
                {googleUsers.map(user => (
                  <MenuItem key={user.primaryEmail} value={user.primaryEmail}>
                    {user.name?.fullName || `${user.name?.givenName || ''} ${user.name?.familyName || ''}`} ({user.primaryEmail})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        <Grid size={12}>
          {isLoadingCalendars ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading calendars for {selectedUser}...</Typography>
              </Box>
            </Paper>
          ) : calendarsError ? (
            <Paper sx={{ p: 3, bgcolor: '#fff5f5' }}>
              <Typography color="error" variant="h6" gutterBottom>Error loading calendars</Typography>
              <Typography color="text.secondary">
                Failed to fetch calendars for {selectedUser}
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calendars for {selectedUser} ({calendars.length} total)
              </Typography>
              
              {calendars.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Calendar Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Access Role</TableCell>
                        <TableCell>Time Zone</TableCell>
                        <TableCell>Primary</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calendars.map((calendar, index) => (
                        <TableRow key={calendar.id || index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={calendar.primary ? "bold" : "normal"}>
                              {calendar.summary || 'Untitled Calendar'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {calendar.description || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {calendar.accessRole || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {calendar.timeZone || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {calendar.primary ? 'Yes' : 'No'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No calendars found for {selectedUser}
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}