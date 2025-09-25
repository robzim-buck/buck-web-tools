import React, { useState, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography, 
  Paper, Chip, Avatar, LinearProgress, Tabs, Tab,
  List, ListItem, ListItemText, ListItemAvatar,
  Divider, IconButton, Tooltip, Alert, Button, Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Computer as WorkstationIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';
import UsersList from './UsersList';
import WorkstationsList from './WorkstationsList';
import WorkstationDetail from './WorkstationDetail';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Dashboard({ name = "Dashboard" }) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch data for dashboard
  const usersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users' },
    queryConfig: { staleTime: 5 * 60 * 1000 }
  });

  const machinesQuery = useProtectedApiGet('/buckldap_machineinfo', {
    queryConfig: { staleTime: 5 * 60 * 1000 }
  });

  const assignmentsQuery = useProtectedApiGet('/assignments/Assignments', {
    queryConfig: { staleTime: 30 * 1000 }
  });

  // Process data for dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const users = usersQuery.data || [];
    const machines = machinesQuery.data || [];
    const assignments = assignmentsQuery.data || [];

    const totalUsers = users.length;
    const totalMachines = machines.length;
    const totalAssignments = assignments.length;
    const unassignedMachines = totalMachines - totalAssignments;
    const assignmentRate = totalMachines > 0 ? (totalAssignments / totalMachines) * 100 : 0;

    // Group assignments by user for analysis
    const assignmentsByUser = assignments.reduce((acc, assignment) => {
      const email = assignment.email;
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(assignment);
      return acc;
    }, {});

    // Recent assignments (mock data since we don't have timestamps)
    const recentAssignments = assignments.slice(0, 5).map(assignment => ({
      ...assignment,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last week
    })).sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalUsers,
      totalMachines,
      totalAssignments,
      unassignedMachines,
      assignmentRate,
      assignmentsByUser,
      recentAssignments,
      usersWithMultipleAssignments: Object.entries(assignmentsByUser)
        .filter(([email, userAssignments]) => userAssignments.length > 1)
        .length
    };
  }, [usersQuery.data, machinesQuery.data, assignmentsQuery.data]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle workstation assignment
  const handleAssignWorkstation = async () => {
    if (!selectedUser || !selectedWorkstation) {
      setSnackbar({
        open: true,
        message: 'Please select both a user and a workstation',
        severity: 'warning'
      });
      return;
    }

    setIsAssigning(true);
    
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/assignments/Assignment/${encodeURIComponent(selectedUser.email)}/${encodeURIComponent(selectedWorkstation.name)}/true`,
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
      
      setSnackbar({
        open: true,
        message: `Successfully assigned ${selectedWorkstation.name} to ${selectedUser.email}`,
        severity: 'success'
      });
      
      // Refresh assignments data
      assignmentsQuery.refetch();
      
      // Optionally clear selections
      // setSelectedUser(null);
      // setSelectedWorkstation(null);
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to assign workstation: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const isLoading = usersQuery.isLoading || machinesQuery.isLoading || assignmentsQuery.isLoading;
  const hasError = usersQuery.error || machinesQuery.error || assignmentsQuery.error;

  if (hasError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading dashboard data: {usersQuery.error?.message || machinesQuery.error?.message || assignmentsQuery.error?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{name}</Typography>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={() => {
              usersQuery.refetch();
              machinesQuery.refetch();
              assignmentsQuery.refetch();
            }}
            disabled={isLoading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <UsersIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {isLoading ? '-' : dashboardMetrics.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <WorkstationIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {isLoading ? '-' : dashboardMetrics.totalMachines}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Workstations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {isLoading ? '-' : dashboardMetrics.totalAssignments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Assignments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {isLoading ? '-' : `${Math.round(dashboardMetrics.assignmentRate)}%`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assignment Rate
                  </Typography>
                </Box>
              </Box>
              {!isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={dashboardMetrics.assignmentRate} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={<UsersIcon />} 
            label="Users & Workstations" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="Recent Activity" 
            iconPosition="start"
          />
          <Tab 
            icon={<WarningIcon />} 
            label="Alerts" 
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Assignment Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Assignment Statistics" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <AssignmentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Assigned Workstations"
                        secondary={`${dashboardMetrics.totalAssignments} out of ${dashboardMetrics.totalMachines}`}
                      />
                      <Chip 
                        label={`${Math.round(dashboardMetrics.assignmentRate)}%`}
                        color="primary"
                        size="small"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <WarningIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Unassigned Workstations"
                        secondary={`${dashboardMetrics.unassignedMachines} workstations available`}
                      />
                      <Chip 
                        label={dashboardMetrics.unassignedMachines}
                        color="warning"
                        size="small"
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <UsersIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Users with Multiple Assignments"
                        secondary={`${dashboardMetrics.usersWithMultipleAssignments} users have multiple workstations`}
                      />
                      <Chip 
                        label={dashboardMetrics.usersWithMultipleAssignments}
                        color="info"
                        size="small"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* System Status */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="System Status" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="User Directory"
                        secondary={`${dashboardMetrics.totalUsers} users loaded from Okta`}
                      />
                      <Chip 
                        label="Online"
                        color="success"
                        size="small"
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Machine Directory"
                        secondary={`${dashboardMetrics.totalMachines} machines from LDAP`}
                      />
                      <Chip 
                        label="Online"
                        color="success"
                        size="small"
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Assignment Service"
                        secondary="Assignment API responding normally"
                      />
                      <Chip 
                        label="Online"
                        color="success"
                        size="small"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Users List */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 500 }}>
                <CardHeader title="Users" />
                <CardContent sx={{ p: 0 }}>
                  <UsersList 
                    onSelectUser={setSelectedUser}
                    selectedUser={selectedUser}
                    maxHeight={440}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Workstations List */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 500 }}>
                <CardHeader title="Workstations" />
                <CardContent sx={{ p: 0 }}>
                  <WorkstationsList 
                    onSelectWorkstation={setSelectedWorkstation}
                    selectedWorkstation={selectedWorkstation}
                    maxHeight={440}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Assignment Button - shown when both user and workstation are selected */}
            {selectedUser && selectedWorkstation && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'primary.50', border: '2px dashed', borderColor: 'primary.main' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Ready to Assign
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Assign <strong>{selectedWorkstation.name}</strong> to <strong>{selectedUser.displayName || selectedUser.email}</strong>
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleAssignWorkstation}
                      disabled={isAssigning}
                      startIcon={<AssignmentIcon />}
                      sx={{ minWidth: 200 }}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Workstation'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Workstation Detail - shown when a workstation is selected */}
            {selectedWorkstation && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title={`Workstation Details: ${selectedWorkstation.name}`}
                    action={
                      <IconButton onClick={() => setSelectedWorkstation(null)}>
                        <CloseIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <WorkstationDetail workstation={selectedWorkstation} />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* User Detail - shown when a user is selected */}
            {selectedUser && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title={`User Details: ${selectedUser.displayName || selectedUser.email}`}
                    action={
                      <IconButton onClick={() => setSelectedUser(null)}>
                        <CloseIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body2">{selectedUser.email}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                        <Typography variant="body2">{selectedUser.department}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedUser.status} 
                          size="small" 
                          color={selectedUser.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                        <Typography variant="body2">{selectedUser.location}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardHeader title="Recent Assignment Activity" />
            <CardContent>
              {isLoading ? (
                <Typography>Loading recent activity...</Typography>
              ) : dashboardMetrics.recentAssignments.length === 0 ? (
                <Typography color="text.secondary">No recent assignments found</Typography>
              ) : (
                <List>
                  {dashboardMetrics.recentAssignments.map((assignment, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <AssignmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${assignment.email} → ${assignment.machine_name}`}
                          secondary={`Assigned ${assignment.timestamp.toLocaleDateString()}`}
                        />
                        <Chip 
                          label={assignment.permanent_assignment ? "Permanent" : "Temporary"}
                          color={assignment.permanent_assignment ? "primary" : "secondary"}
                          size="small"
                        />
                      </ListItem>
                      {index < dashboardMetrics.recentAssignments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={2}>
            {dashboardMetrics.unassignedMachines > 0 && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<WarningIcon />}>
                  <Typography variant="h6">Unassigned Workstations</Typography>
                  <Typography>
                    {dashboardMetrics.unassignedMachines} workstations are currently unassigned and available for use.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {dashboardMetrics.usersWithMultipleAssignments > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<UsersIcon />}>
                  <Typography variant="h6">Multiple Assignments</Typography>
                  <Typography>
                    {dashboardMetrics.usersWithMultipleAssignments} users have multiple workstation assignments. 
                    Review if this is intended for your organization.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {dashboardMetrics.assignmentRate < 50 && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<TrendingUpIcon />}>
                  <Typography variant="h6">Low Assignment Rate</Typography>
                  <Typography>
                    Only {Math.round(dashboardMetrics.assignmentRate)}% of workstations are currently assigned. 
                    Consider reviewing workstation utilization.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {!isLoading && dashboardMetrics.unassignedMachines === 0 && 
             dashboardMetrics.usersWithMultipleAssignments === 0 && 
             dashboardMetrics.assignmentRate >= 50 && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="h6">All Systems Normal</Typography>
                  <Typography>
                    No alerts or issues detected with the current workstation assignments.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>

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