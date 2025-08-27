import {
  Typography, Paper, Grid, Box, Button, TextField, Autocomplete,
  CircularProgress, Alert, Snackbar, Chip, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useState, useMemo } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';

export default function AssignWorkstations({ name = "Assign Workstations" }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, assignment: null });

  // Fetch users from Okta
  const usersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users' },
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Fetch machines from /buckldap_machineinfo
  const machinesQuery = useProtectedApiGet('/buckldap_machineinfo', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    }
  });

  // Fetch current assignments
  const assignmentsQuery = useProtectedApiGet('/assignments/Assignments', {
    queryConfig: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
      retry: 2
    }
  });

  // Create assignment mutation - using custom fetch since path params are needed
  const createAssignment = async (email, machineName, permanent = true) => {
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(email)}/${encodeURIComponent(machineName)}/${permanent}`,
        {
          method: 'POST',
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setSnackbar({
        open: true,
        message: 'Workstation assigned successfully!',
        severity: 'success'
      });
      setSelectedUser(null);
      setSelectedMachine(null);
      assignmentsQuery.refetch();
      return data;
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to assign workstation: ${error.message}`,
        severity: 'error'
      });
      throw error;
    }
  };

  // Delete assignment - using custom fetch since path params are needed
  const deleteAssignment = async (email, machineName) => {
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(email)}/${encodeURIComponent(machineName)}`,
        {
          method: 'DELETE',
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setSnackbar({
        open: true,
        message: 'Assignment removed successfully!',
        severity: 'success'
      });
      setDeleteDialog({ open: false, assignment: null });
      assignmentsQuery.refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to remove assignment: ${error.message}`,
        severity: 'error'
      });
      setDeleteDialog({ open: false, assignment: null });
      throw error;
    }
  };

  // Process users data
  const usersList = useMemo(() => {
    if (!usersQuery.data) return [];
    
    console.log('Raw users data:', usersQuery.data);
    
    // The API returns an array of user objects with profile.email property
    if (Array.isArray(usersQuery.data)) {
      const processed = usersQuery.data
        .filter(user => {
          // Only include users with email in profile
          if (!user.profile?.email) return false;
          
          // Include users with relevant statuses for workstation assignment
          const status = user.status || 'ACTIVE';
          
          // Include ACTIVE, PASSWORD_EXPIRED, and RECOVERY users
          // Exclude SUSPENDED users as they shouldn't get workstation assignments
          return ['ACTIVE', 'PASSWORD_EXPIRED', 'RECOVERY'].includes(status);
        })
        .map(user => ({
          email: user.profile.email,
          label: `${user.profile.email}${user.profile.displayName ? ` (${user.profile.displayName})` : ''}`,
          displayName: user.profile.displayName,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          status: user.status || 'ACTIVE'
        }));
      console.log('Processed users:', processed);
      console.log('User statuses:', processed.map(u => u.status).slice(0, 10));
      return processed;
    }
    
    console.log('Users data is not an array:', typeof usersQuery.data);
    return [];
  }, [usersQuery.data]);

  // Process machines data
  const machinesList = useMemo(() => {
    if (!machinesQuery.data) return [];
    
    console.log('Raw machines data:', machinesQuery.data);
    
    // Parse machine info data
    if (Array.isArray(machinesQuery.data)) {
      const processed = machinesQuery.data
        .filter(machine => machine.name) // Only include machines with names
        .map(machine => ({
          name: machine.name,
          label: machine.name,
          operatingSystem: machine.operatingSystem,
          operatingSystemVersion: machine.operatingSystemVersion,
          distinguishedName: machine.distinguishedName
        }));
      
      console.log('Processed machines:', processed);
      return processed;
    }
    
    return [];
  }, [machinesQuery.data]);

  // Process assignments data
  const assignmentsList = useMemo(() => {
    if (!assignmentsQuery.data) return [];
    
    if (Array.isArray(assignmentsQuery.data)) {
      return assignmentsQuery.data;
    }
    
    return [];
  }, [assignmentsQuery.data]);

  // Filter assignments for selected user
  const userAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return assignmentsList.filter(assignment => 
      assignment.email === selectedUser.email
    );
  }, [assignmentsList, selectedUser]);

  // Filter available machines (not already assigned to the selected user)
  const availableMachines = useMemo(() => {
    console.log('Computing available machines...');
    console.log('selectedUser:', selectedUser);
    console.log('machinesList count:', machinesList.length);
    console.log('userAssignments count:', userAssignments.length);
    
    if (!selectedUser) {
      console.log('No user selected, returning all machines');
      return machinesList;
    }
    
    const assignedMachineNames = userAssignments.map(a => a.machine_name);
    console.log('Assigned machine names:', assignedMachineNames);
    
    const filtered = machinesList.filter(machine => 
      !assignedMachineNames.includes(machine.name)
    );
    
    console.log('Available machines after filtering:', filtered.length);
    return filtered;
  }, [machinesList, selectedUser, userAssignments]);

  const handleAssignWorkstation = async () => {
    if (!selectedUser || !selectedMachine) {
      setSnackbar({
        open: true,
        message: 'Please select both a user and a workstation',
        severity: 'warning'
      });
      return;
    }

    await createAssignment(selectedUser.email, selectedMachine.name, true);
  };

  const handleDeleteAssignment = (assignment) => {
    setDeleteDialog({ open: true, assignment });
  };

  const confirmDelete = async () => {
    if (deleteDialog.assignment) {
      await deleteAssignment(
        deleteDialog.assignment.email,
        deleteDialog.assignment.machine_name
      );
    }
  };

  const isLoading = usersQuery.isLoading || machinesQuery.isLoading || assignmentsQuery.isLoading;
  const hasError = usersQuery.error || machinesQuery.error || assignmentsQuery.error;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading data: {usersQuery.error?.message || machinesQuery.error?.message || assignmentsQuery.error?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>{name}</Typography>
      
      <Grid container spacing={3}>
        {/* Assignment Form */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3 }}>Create New Assignment</Typography>
              
              <Grid container spacing={2}>
                <Grid size={5}>
                  <Autocomplete
                    value={selectedUser}
                    onChange={(event, newValue) => setSelectedUser(newValue)}
                    options={usersList}
                    getOptionLabel={(option) => option.label}
                    slotProps={{
                      paper: {
                        sx: {
                          backgroundColor: 'white',
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'white'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select User (${usersList.length} available)`}
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ backgroundColor: 'white' }}>
                        <Box>
                          <Typography>{option.email}</Typography>
                          {option.displayName && (
                            <Typography variant="caption" color="text.secondary">
                              {option.displayName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
                
                <Grid size={5}>
                  <Autocomplete
                    value={selectedMachine}
                    onChange={(event, newValue) => {
                      console.log('Machine selected:', newValue);
                      setSelectedMachine(newValue);
                    }}
                    options={availableMachines}
                    getOptionLabel={(option) => option.label || option.name || 'Unknown'}
                    disabled={!selectedUser}
                    slotProps={{
                      paper: {
                        sx: {
                          backgroundColor: 'white',
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'white'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select Workstation (${availableMachines.length} available)`}
                        variant="outlined"
                        fullWidth
                        helperText={!selectedUser ? "Select a user first" : `${availableMachines.length} machines available`}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ backgroundColor: 'white' }}>
                        <Box>
                          <Typography>{option.name}</Typography>
                          {option.operatingSystem && (
                            <Typography variant="caption" color="text.secondary">
                              {option.operatingSystem} {option.operatingSystemVersion}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    noOptionsText={selectedUser ? "No workstations available" : "Select a user first"}
                  />
                </Grid>
                
                <Grid size={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={handleAssignWorkstation}
                    disabled={!selectedUser || !selectedMachine}
                    startIcon={<AddIcon />}
                    sx={{ height: '56px' }}
                  >
                    Assign
                  </Button>
                </Grid>
              </Grid>
              
              {selectedUser && userAssignments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Current Assignments for {selectedUser.email}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userAssignments.map((assignment, index) => (
                      <Chip
                        key={index}
                        label={assignment.machine_name}
                        onDelete={() => handleDeleteAssignment(assignment)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Assignments List */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3 }}>All Assignments</Typography>
              
              {assignmentsList.length === 0 ? (
                <Alert severity="info">No assignments found</Alert>
              ) : (
                <Paper variant="outlined">
                  <List>
                    {assignmentsList.map((assignment, index) => (
                      <ListItem key={index} divider={index < assignmentsList.length - 1}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                {assignment.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                              <Chip
                                label={assignment.machine_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            assignment.assigned_at && 
                            `Assigned on ${new Date(assignment.assigned_at).toLocaleDateString()}`
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteAssignment(assignment)}
                            disabled={false}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, assignment: null })}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the assignment of{' '}
            <strong>{deleteDialog.assignment?.machine_name}</strong> from{' '}
            <strong>{deleteDialog.assignment?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, assignment: null })}
            disabled={false}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={false}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}