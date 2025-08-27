import React from 'react';
import {
  Box, Typography, Card, CardContent, CardHeader, Chip, Avatar,
  Grid, Divider, List, ListItem, ListItemIcon, ListItemText,
  Alert, Paper
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Laptop as LaptopIcon,
  Storage as ServerIcon,
  Cloud as CloudIcon,
  Memory as MemoryIcon,
  Dns as ProcessorIcon,
  Schedule as ClockIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export default function WorkstationDetail({ workstation }) {
  if (!workstation) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="h6">No Workstation Selected</Typography>
            <Typography>
              Select a workstation from the list to view its detailed information.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'laptop': return <LaptopIcon />;
      case 'server': return <ServerIcon />;
      case 'virtual': return <CloudIcon />;
      default: return <ComputerIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'warning';
      case 'maintenance': return 'error';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              {getTypeIcon(workstation.type)}
            </Avatar>
          }
          title={
            <Typography variant="h5" component="div">
              {workstation.name}
            </Typography>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={workstation.status}
                color={getStatusColor(workstation.status)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {workstation.type} workstation
              </Typography>
            </Box>
          }
        />
      </Card>

      <Grid container spacing={3}>
        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Information" />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ComputerIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Machine Name"
                    secondary={workstation.name}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ProcessorIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Operating System"
                    secondary={`${workstation.operatingSystem}${workstation.operatingSystemVersion ? ` ${workstation.operatingSystemVersion}` : ''}`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <ClockIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Seen"
                    secondary={formatDate(workstation.lastSeen)}
                  />
                </ListItem>

                {workstation.distinguishedName && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Distinguished Name"
                      secondary={workstation.distinguishedName}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Assignment Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Assignment Information" />
            <CardContent>
              {workstation.assignedTo ? (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Assigned To"
                      secondary={workstation.assignedTo}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <ClockIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Assignment Type"
                      secondary="Permanent"
                    />
                  </ListItem>
                </List>
              ) : (
                <Alert severity="success" icon={<ComputerIcon />}>
                  <Typography variant="subtitle2">Available for Assignment</Typography>
                  <Typography variant="body2">
                    This workstation is currently unassigned and available for use.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Technical Details */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Technical Details" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <ComputerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" component="div">
                      {workstation.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Workstation Type
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <ProcessorIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" component="div">
                      {workstation.operatingSystem}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Operating System
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <ClockIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" component="div">
                      {workstation.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Status
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        {workstation.distinguishedName && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="LDAP Information" />
              <CardContent>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  {workstation.distinguishedName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This is the workstation's distinguished name in the LDAP directory.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}