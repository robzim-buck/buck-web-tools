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
  Person as PersonIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  HomeWork as HomeWorkIcon
} from '@mui/icons-material';

const ResidenceProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [orderBy, setOrderBy] = useState('Name');
  const [order, setOrder] = useState('asc');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedResidences, setSelectedResidences] = useState([]);
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedEPs, setSelectedEPs] = useState([]);

  const { data: projectsData, isLoading, error } = useProtectedApiGet('/coda/residence_projects', {
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  });

  // Extract all unique residences from the data
  const allResidences = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    const residenceSet = new Set();
    projectsData.forEach(project => {
      if (project.Residence) {
        // Split on comma and trim whitespace
        const residences = project.Residence.split(',').map(res => res.trim());
        residences.forEach(res => {
          if (res) residenceSet.add(res);
        });
      }
    });

    return Array.from(residenceSet).sort();
  }, [projectsData]);

  // Extract all unique offices from the data
  const allOffices = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    const officeSet = new Set();
    projectsData.forEach(project => {
      if (project.Office) {
        officeSet.add(project.Office.trim());
      }
    });

    return Array.from(officeSet).sort();
  }, [projectsData]);

  // Extract all unique categories from the data
  const allCategories = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    const categorySet = new Set();
    projectsData.forEach(project => {
      if (project.Category) {
        categorySet.add(project.Category.trim());
      }
    });

    return Array.from(categorySet).sort();
  }, [projectsData]);

  // Extract all unique EPs from the data
  const allEPs = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    const epSet = new Set();
    projectsData.forEach(project => {
      if (project.EP) {
        // Split on comma and trim whitespace
        const eps = project.EP.split(',').map(ep => ep.trim());
        eps.forEach(ep => {
          if (ep) epSet.add(ep);
        });
      }
    });

    return Array.from(epSet).sort();
  }, [projectsData]);

  const filteredProjects = useMemo(() => {
    if (!projectsData || !Array.isArray(projectsData)) return [];

    let filtered = projectsData;

    // Filter by selected residences
    if (selectedResidences.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Residence) return false;

        // Split the project's residences and check if any match the selected ones
        const projectResidences = project.Residence.split(',').map(res => res.trim());
        return projectResidences.some(res => selectedResidences.includes(res));
      });
    }

    // Filter by selected offices
    if (selectedOffices.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Office) return false;
        return selectedOffices.includes(project.Office.trim());
      });
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.Category) return false;
        return selectedCategories.includes(project.Category.trim());
      });
    }

    // Filter by selected EPs
    if (selectedEPs.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.EP) return false;

        // Split the project's EPs and check if any match the selected ones
        const projectEPs = project.EP.split(',').map(ep => ep.trim());
        return projectEPs.some(ep => selectedEPs.includes(ep));
      });
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.Name?.toLowerCase().includes(lowerSearchTerm) ||
        project.Client?.toLowerCase().includes(lowerSearchTerm) ||
        project.Status?.toLowerCase().includes(lowerSearchTerm) ||
        project.EP?.toLowerCase().includes(lowerSearchTerm) ||
        project.Category?.toLowerCase().includes(lowerSearchTerm) ||
        project.Office?.toLowerCase().includes(lowerSearchTerm)
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
  }, [projectsData, searchTerm, orderBy, order, selectedResidences, selectedOffices, selectedCategories, selectedEPs]);

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
        return 'success';
      case 'Pitching':
        return 'warning';
      case 'Evaluating':
        return 'info';
      case 'Active':
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
          Residence Projects
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage and view all residence projects across the organization
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by project name, client, status, EP, category, or office..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Residences</InputLabel>
            <Select
              multiple
              value={selectedResidences}
              onChange={(e) => {
                const value = e.target.value;
                // Check if __clear_all__ was clicked
                if (value.includes('__clear_all__')) {
                  setSelectedResidences([]);
                } else {
                  setSelectedResidences(value);
                }
              }}
              input={<OutlinedInput label="Filter by Residences" />}
              renderValue={(selected) => selected.length === 0 ? 'All Residences' : selected.join(', ')}
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
              {allResidences.map((res) => (
                <MenuItem key={res} value={res}>
                  <Checkbox checked={selectedResidences.indexOf(res) > -1} />
                  <ListItemText primary={res} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Office</InputLabel>
            <Select
              multiple
              value={selectedOffices}
              onChange={(e) => {
                const value = e.target.value;
                // Check if __clear_all__ was clicked
                if (value.includes('__clear_all__')) {
                  setSelectedOffices([]);
                } else {
                  setSelectedOffices(value);
                }
              }}
              input={<OutlinedInput label="Filter by Office" />}
              renderValue={(selected) => selected.length === 0 ? 'All Offices' : selected.join(', ')}
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
              {allOffices.map((office) => (
                <MenuItem key={office} value={office}>
                  <Checkbox checked={selectedOffices.indexOf(office) > -1} />
                  <ListItemText primary={office} />
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
                // Check if __clear_all__ was clicked
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by EP</InputLabel>
            <Select
              multiple
              value={selectedEPs}
              onChange={(e) => {
                const value = e.target.value;
                // Check if __clear_all__ was clicked
                if (value.includes('__clear_all__')) {
                  setSelectedEPs([]);
                } else {
                  setSelectedEPs(value);
                }
              }}
              input={<OutlinedInput label="Filter by EP" />}
              renderValue={(selected) => selected.length === 0 ? 'All EPs' : selected.join(', ')}
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
              {allEPs.map((ep) => (
                <MenuItem key={ep} value={ep}>
                  <Checkbox checked={selectedEPs.indexOf(ep) > -1} />
                  <ListItemText primary={ep} />
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
              <MenuItem value="Office">Office</MenuItem>
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
              <Table sx={{ minWidth: 650 }} aria-label="residence projects table">
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
                        active={orderBy === 'EP'}
                        direction={orderBy === 'EP' ? order : 'asc'}
                        onClick={() => handleRequestSort('EP')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>EP</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'Office'}
                        direction={orderBy === 'Office' ? order : 'asc'}
                        onClick={() => handleRequestSort('Office')}
                        sx={{ color: 'white', '&:hover': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Office</Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Residence</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Potential Budget</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'white' }}>Billing Hub Budget</Typography>
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
                      <TableCell>{project.EP || 'N/A'}</TableCell>
                      <TableCell>{project.Office || 'N/A'}</TableCell>
                      <TableCell>{project.Residence || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(project['Potential Budget'])}</TableCell>
                      <TableCell>{formatCurrency(project['Billing Hub Total Budget'])}</TableCell>
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
                        <Chip
                          label={project.Status || 'Unknown'}
                          color={getStatusColor(project.Status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
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

                        {/* EP */}
                        {project.EP && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              EP: {project.EP}
                            </Typography>
                          </Box>
                        )}

                        {/* Office */}
                        {project.Office && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Office: {project.Office}
                            </Typography>
                          </Box>
                        )}

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

                        {/* Residence */}
                        {project.Residence && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <HomeWorkIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              Residence: {project.Residence}
                            </Typography>
                          </Box>
                        )}

                        {/* Budgets */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoneyIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Potential: {formatCurrency(project['Potential Budget'])}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Billing Hub: {formatCurrency(project['Billing Hub Total Budget'])}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Jobcode */}
                        {project.Jobcode && (
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                            Jobcode: {project.Jobcode}
                          </Typography>
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

export default ResidenceProjects;
