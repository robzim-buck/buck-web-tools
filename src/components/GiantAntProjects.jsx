import React, { useMemo, useState } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import {
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const GiantAntProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [orderBy, setOrderBy] = useState('Start Date');
  const [order, setOrder] = useState('desc');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedExecutions, setSelectedExecutions] = useState([]);

  const { data: projectsData, isLoading, error } = useProtectedApiGet('/coda/ga_projects', {
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  });

  // Extract all unique statuses from the data
  const allStatuses = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];
    const statusSet = new Set();
    projectsData.forEach(project => {
      if (project.Status) statusSet.add(project.Status.trim());
    });
    return Array.from(statusSet).sort();
  }, [projectsData]);

  // Extract all unique clients from the data
  const allClients = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];
    const clientSet = new Set();
    projectsData.forEach(project => {
      if (project.Client) clientSet.add(project.Client.trim());
    });
    return Array.from(clientSet).sort();
  }, [projectsData]);

  // Extract all unique categories from the data
  const allCategories = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];
    const categorySet = new Set();
    projectsData.forEach(project => {
      if (project.Category) categorySet.add(project.Category.trim());
    });
    return Array.from(categorySet).sort();
  }, [projectsData]);

  // Extract all unique departments from the data (split on comma)
  const allDepartments = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];
    const departmentSet = new Set();
    projectsData.forEach(project => {
      if (project.Department) {
        const departments = project.Department.split(',').map(dept => dept.trim());
        departments.forEach(dept => {
          if (dept) departmentSet.add(dept);
        });
      }
    });
    return Array.from(departmentSet).sort();
  }, [projectsData]);

  // Extract all unique executions from the data (split on comma)
  const allExecutions = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];
    const executionSet = new Set();
    projectsData.forEach(project => {
      if (project.Execution) {
        const executions = project.Execution.split(',').map(exec => exec.trim());
        executions.forEach(exec => {
          if (exec) executionSet.add(exec);
        });
      }
    });
    return Array.from(executionSet).sort();
  }, [projectsData]);

  const filteredProjects = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    let filtered = projectsData;

    // Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Status) return false;
        return selectedStatuses.includes(project.Status.trim());
      });
    }

    // Filter by selected clients
    if (selectedClients.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Client) return false;
        return selectedClients.includes(project.Client.trim());
      });
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Category) return false;
        return selectedCategories.includes(project.Category.trim());
      });
    }

    // Filter by selected departments
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Department) return false;
        const projectDepartments = project.Department.split(',').map(dept => dept.trim());
        return projectDepartments.some(dept => selectedDepartments.includes(dept));
      });
    }

    // Filter by selected executions
    if (selectedExecutions.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Execution) return false;
        const projectExecutions = project.Execution.split(',').map(exec => exec.trim());
        return projectExecutions.some(exec => selectedExecutions.includes(exec));
      });
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.Name?.toLowerCase().includes(lowerSearchTerm) ||
        project.Client?.toLowerCase().includes(lowerSearchTerm) ||
        project.Status?.toLowerCase().includes(lowerSearchTerm) ||
        project.Category?.toLowerCase().includes(lowerSearchTerm) ||
        project.Type?.toLowerCase().includes(lowerSearchTerm) ||
        project.Department?.toLowerCase().includes(lowerSearchTerm) ||
        project.Execution?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[orderBy] || '';
      let bValue = b[orderBy] || '';

      // Handle date sorting
      if (orderBy === 'Start Date' || orderBy === 'End Date') {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [projectsData, searchTerm, orderBy, order, selectedStatuses, selectedClients, selectedCategories, selectedDepartments, selectedExecutions]);

  const groupedProjects = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Projects': filteredProjects };
    }

    const groups = {};
    filteredProjects.forEach(project => {
      const groupKey = project[groupBy] || 'Unknown';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(project);
    });

    // Sort groups alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredProjects, groupBy]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Awarded':
      case 'Active':
        return 'success';
      case 'Bidding':
        return 'warning';
      case 'Evaluating':
        return 'info';
      case 'Pitching':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading projects: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Giant Ant Projects
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View and manage Giant Ant projects across the organization
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by project name, client, status, category, type, department, or execution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              multiple
              value={selectedStatuses}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedStatuses([]);
                } else {
                  setSelectedStatuses(value);
                }
              }}
              input={<OutlinedInput label="Filter by Status" />}
              renderValue={(selected) => selected.length === 0 ? 'All Statuses' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
                  <ListItemText primary={status} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Client</InputLabel>
            <Select
              multiple
              value={selectedClients}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedClients([]);
                } else {
                  setSelectedClients(value);
                }
              }}
              input={<OutlinedInput label="Filter by Client" />}
              renderValue={(selected) => selected.length === 0 ? 'All Clients' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allClients.map((client) => (
                <MenuItem key={client} value={client}>
                  <Checkbox checked={selectedClients.indexOf(client) > -1} />
                  <ListItemText primary={client} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              multiple
              value={selectedCategories}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedCategories([]);
                } else {
                  setSelectedCategories(value);
                }
              }}
              input={<OutlinedInput label="Filter by Category" />}
              renderValue={(selected) => selected.length === 0 ? 'All Categories' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  <Checkbox checked={selectedCategories.indexOf(category) > -1} />
                  <ListItemText primary={category} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Department</InputLabel>
            <Select
              multiple
              value={selectedDepartments}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedDepartments([]);
                } else {
                  setSelectedDepartments(value);
                }
              }}
              input={<OutlinedInput label="Filter by Department" />}
              renderValue={(selected) => selected.length === 0 ? 'All Departments' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allDepartments.map((department) => (
                <MenuItem key={department} value={department}>
                  <Checkbox checked={selectedDepartments.indexOf(department) > -1} />
                  <ListItemText primary={department} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Execution</InputLabel>
            <Select
              multiple
              value={selectedExecutions}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('__clear_all__')) {
                  setSelectedExecutions([]);
                } else {
                  setSelectedExecutions(value);
                }
              }}
              input={<OutlinedInput label="Filter by Execution" />}
              renderValue={(selected) => selected.length === 0 ? 'All Executions' : selected.join(', ')}
            >
              <MenuItem
                value="__clear_all__"
                sx={{
                  fontWeight: 'bold',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText primary="Clear All" sx={{ fontStyle: 'italic' }} />
              </MenuItem>
              {allExecutions.map((execution) => (
                <MenuItem key={execution} value={execution}>
                  <Checkbox checked={selectedExecutions.indexOf(execution) > -1} />
                  <ListItemText primary={execution} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={groupBy}
              label="Group By"
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="Status">Status</MenuItem>
              <MenuItem value="Client">Client</MenuItem>
              <MenuItem value="Category">Category</MenuItem>
              <MenuItem value="Type">Type</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="cards" aria-label="card view">
              <ViewModuleIcon sx={{ mr: 1 }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <TableRowsIcon sx={{ mr: 1 }} />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Paper>

      {viewMode === 'table' ? (
        Object.entries(groupedProjects).map(([groupName, projects]) => (
          <Box key={groupName} sx={{ mb: 3 }}>
            {groupBy !== 'none' && (
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {groupName} ({projects.length})
              </Typography>
            )}
            <TableContainer component={Paper} elevation={3}>
              <Table sx={{ minWidth: 650 }} aria-label="giant ant projects table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Name'}
                        direction={orderBy === 'Name' ? order : 'asc'}
                        onClick={() => handleRequestSort('Name')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Project Name</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Client'}
                        direction={orderBy === 'Client' ? order : 'asc'}
                        onClick={() => handleRequestSort('Client')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Client</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Status'}
                        direction={orderBy === 'Status' ? order : 'asc'}
                        onClick={() => handleRequestSort('Status')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Status</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Start Date'}
                        direction={orderBy === 'Start Date' ? order : 'asc'}
                        onClick={() => handleRequestSort('Start Date')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Start Date</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'End Date'}
                        direction={orderBy === 'End Date' ? order : 'asc'}
                        onClick={() => handleRequestSort('End Date')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>End Date</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Category'}
                        direction={orderBy === 'Category' ? order : 'asc'}
                        onClick={() => handleRequestSort('Category')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Category</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Type'}
                        direction={orderBy === 'Type' ? order : 'asc'}
                        onClick={() => handleRequestSort('Type')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Type</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Department</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Execution</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project, index) => (
                    <TableRow
                      key={`${project.rowname}-${index}`}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                        '&:hover': { backgroundColor: 'action.selected' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{project.Name || 'N/A'}</TableCell>
                      <TableCell>{project.Client || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.Status || 'Unknown'}
                          color={getStatusColor(project.Status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(project['Start Date'])}</TableCell>
                      <TableCell>{formatDate(project['End Date'])}</TableCell>
                      <TableCell>{project.Category || 'N/A'}</TableCell>
                      <TableCell>{project.Type || 'N/A'}</TableCell>
                      <TableCell>{project.Department || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                          {project.Execution || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      ) : (
        Object.entries(groupedProjects).map(([groupName, projects]) => (
          <Box key={groupName} sx={{ mb: 4 }}>
            {groupBy !== 'none' && (
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {groupName} ({projects.length})
              </Typography>
            )}
            <Grid container spacing={3}>
              {projects.map((project, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${project.rowname}-${index}`}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Project Header */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {project.Name || 'Unnamed Project'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
                            {project.Client || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={project.Status || 'Unknown'}
                            color={getStatusColor(project.Status)}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                          {project['Security Level'] && (
                            <Chip
                              icon={<SecurityIcon fontSize="small" />}
                              label={project['Security Level']}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Project Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Dates */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Start: {formatDate(project['Start Date'])}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              End: {formatDate(project['End Date'])}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Category & Type */}
                        {(project.Category || project.Type) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {project.Category && project.Type
                                ? `${project.Category} / ${project.Type}`
                                : project.Category || project.Type}
                            </Typography>
                          </Box>
                        )}

                        {/* Department */}
                        {project.Department && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                              Department:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {project.Department}
                            </Typography>
                          </Box>
                        )}

                        {/* Execution */}
                        {project.Execution && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                              Execution:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                              {project.Execution}
                            </Typography>
                          </Box>
                        )}

                        {/* Buck As Agency */}
                        {project['Buck As Agency'] && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Buck As Agency:
                            </Typography>
                            <Chip
                              label={project['Buck As Agency']}
                              size="small"
                              color={project['Buck As Agency'] === 'Yes' ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        )}

                        {/* Systems */}
                        {project.Systems && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Systems:
                            </Typography>
                            <Chip
                              label={project.Systems}
                              size="small"
                              color={project.Systems === 'Yes' ? 'info' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search criteria
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default GiantAntProjects;
