import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Fade,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Folder as FolderIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoLibraryIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const SyncSketchProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [rawDataDialog, setRawDataDialog] = useState({ open: false, data: null });
  const [copySuccess, setCopySuccess] = useState(false);
  const [usersDialog, setUsersDialog] = useState({ open: false, users: [], loading: false, projectName: '' });

  const { data: projectsData, isLoading, error } = useQuery({
    queryKey: ['syncSketchProjects'],
    queryFn: async () => {
      const response = await fetch(
        'https://laxcoresrv.buck.local:8000/syncsketch/buck_syncsketch_projects',
        {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const filteredProjects = useMemo(() => {
    let dataArray = projectsData;

    if (projectsData && typeof projectsData === 'object' && !Array.isArray(projectsData)) {
      if (projectsData.objects && Array.isArray(projectsData.objects)) {
        dataArray = projectsData.objects;
      } else if (projectsData.data && Array.isArray(projectsData.data)) {
        dataArray = projectsData.data;
      } else if (projectsData.results && Array.isArray(projectsData.results)) {
        dataArray = projectsData.results;
      } else if (projectsData.projects && Array.isArray(projectsData.projects)) {
        dataArray = projectsData.projects;
      }
    }

    if (!dataArray || !Array.isArray(dataArray)) {
      return [];
    }

    let filtered = dataArray;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(lowerSearchTerm) ||
        project.description?.toLowerCase().includes(lowerSearchTerm) ||
        project.slug?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [projectsData, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return `${diffMonths}mo ago`;
  };

  const handleViewRawData = (project) => {
    setRawDataDialog({ open: true, data: project });
  };

  const handleViewUsers = async (project) => {
    setUsersDialog({ open: true, users: [], loading: true, projectName: project.name });
    try {
      const response = await fetch(
        `https://laxcoresrv.buck.local:8000/syncsketch/buck_syncsketch_users_for_project?projectid=${project.id}`,
        {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setUsersDialog(prev => ({ ...prev, users: data, loading: false }));
    } catch (err) {
      setUsersDialog(prev => ({ ...prev, users: [], loading: false }));
      console.error('Error fetching users:', err);
    }
  };

  const handleCloseUsersDialog = () => {
    setUsersDialog({ open: false, users: [], loading: false, projectName: '' });
  };

  // DataGrid columns configuration
  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, color: '#1e40af' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'slug',
      headerName: 'Slug',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#64748b' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 200
    },
    {
      field: 'created',
      headerName: 'Created',
      width: 120,
      valueGetter: (value) => value ? new Date(value) : null,
      renderCell: (params) => (
        <Typography sx={{ color: '#64748b' }}>
          {formatDate(params.row.created)}
        </Typography>
      )
    },
    {
      field: 'modified',
      headerName: 'Modified',
      width: 120,
      valueGetter: (value) => value ? new Date(value) : null,
      renderCell: (params) => (
        <Typography sx={{ color: '#64748b' }}>
          {formatDate(params.row.modified)}
        </Typography>
      )
    },
    {
      field: 'lastActivity',
      headerName: 'Last Activity',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: '#0891b2' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891b2' }}>
              {getTimeSince(params.row.modified)}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            {formatDateWithTime(params.row.modified)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Users">
            <IconButton
              size="small"
              onClick={() => handleViewUsers(params.row)}
              sx={{
                color: '#047857',
                '&:hover': {
                  bgcolor: '#d1fae5'
                }
              }}
            >
              <PeopleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Raw Data">
            <IconButton
              size="small"
              onClick={() => handleViewRawData(params.row)}
              sx={{
                color: '#1e40af',
                '&:hover': {
                  bgcolor: '#e0e7ff'
                }
              }}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], []);

  // Prepare rows with unique IDs for DataGrid
  const rows = useMemo(() =>
    filteredProjects.map((project, index) => ({
      ...project,
      id: project.id || index
    })),
  [filteredProjects]);

  const handleCloseRawData = () => {
    setRawDataDialog({ open: false, data: null });
    setCopySuccess(false);
  };

  const handleCopyRawData = () => {
    if (rawDataDialog.data) {
      navigator.clipboard.writeText(JSON.stringify(rawDataDialog.data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#1e40af', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#64748b' }}>Loading SyncSketch Projects...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <Alert
          severity="error"
          sx={{
            maxWidth: 800,
            mx: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          Error loading SyncSketch projects: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 4,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            letterSpacing: '-1px'
          }}
        >
          SyncSketch Projects
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
          Manage and view all SyncSketch projects across the organization
        </Typography>
      </Box>

      {/* Stats Bar */}
      <Box sx={{
        mb: 3,
        p: 2,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#1e40af', fontWeight: 700 }}>
            {filteredProjects.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {searchTerm ? 'Filtered Projects' : 'Total Projects'}
          </Typography>
        </Box>
      </Box>

      {/* Search and Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 9 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by project name, description, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#1e40af' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#ffffff',
                  '&:hover fieldset': {
                    borderColor: '#1e40af'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1e40af'
                  }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              fullWidth
              sx={{
                backgroundColor: '#fff',
                '& .MuiToggleButton-root': {
                  borderColor: '#e2e8f0',
                  '&.Mui-selected': {
                    backgroundColor: '#1e40af',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#1e3a8a'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="cards">
                <ViewModuleIcon sx={{ mr: 1 }} fontSize="small" />
                Cards
              </ToggleButton>
              <ToggleButton value="table">
                <TableRowsIcon sx={{ mr: 1 }} fontSize="small" />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {viewMode === 'table' ? (
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            height: 'calc(100vh - 350px)'
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 }
              },
              sorting: {
                sortModel: [{ field: 'name', sort: 'asc' }]
              }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#1e40af'
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#1e40af'
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: '#fff',
                fontWeight: 700
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#fff'
              },
              '& .MuiDataGrid-menuIconButton': {
                color: '#fff'
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: '#f8f9fa'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#e0e7ff'
              },
              '& .MuiDataGrid-cell': {
                py: 1,
                display: 'flex',
                alignItems: 'center'
              }
            }}
          />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id || index}>
              <Fade in timeout={300 + (index % 12) * 50}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(30, 64, 175, 0.15)',
                      borderColor: '#1e40af'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                    {/* Action Buttons */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Users" placement="left">
                        <IconButton
                          onClick={() => handleViewUsers(project)}
                          sx={{
                            bgcolor: 'rgba(4, 120, 87, 0.1)',
                            color: '#047857',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              bgcolor: '#047857',
                              color: '#ffffff',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Raw Data" placement="left">
                        <IconButton
                          onClick={() => handleViewRawData(project)}
                          sx={{
                            bgcolor: 'rgba(30, 64, 175, 0.1)',
                            color: '#1e40af',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              bgcolor: '#1e40af',
                              color: '#ffffff',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Project Icon and Name */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, pr: 5 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                        }}
                      >
                        <VideoLibraryIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {project.name || 'Unnamed Project'}
                        </Typography>
                        {project.slug && (
                          <Chip
                            label={project.slug}
                            size="small"
                            icon={<FolderIcon />}
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              bgcolor: '#e0e7ff',
                              color: '#1e40af',
                              fontFamily: 'monospace',
                              '& .MuiChip-icon': { color: '#1e40af' }
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Description */}
                    {project.description && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <DescriptionIcon fontSize="small" sx={{ color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Description
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#475569',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.6
                          }}
                        >
                          {project.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Last Activity Badge */}
                    <Box sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      border: '1px solid rgba(8, 145, 178, 0.2)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <TrendingUpIcon sx={{ fontSize: 18, color: '#0891b2' }} />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Last Activity
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h6" sx={{ color: '#0891b2', fontWeight: 700 }}>
                          {getTimeSince(project.modified)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        {formatDateWithTime(project.modified)}
                      </Typography>
                    </Box>

                    {/* Dates */}
                    <Box sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" sx={{ color: '#047857' }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Created: <strong style={{ color: '#047857' }}>{formatDate(project.created)}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" sx={{ color: '#dc2626' }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Modified: <strong style={{ color: '#dc2626' }}>{formatDate(project.modified)}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <VideoLibraryIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
            No projects found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'No SyncSketch projects available'}
          </Typography>
        </Paper>
      )}

      {/* Raw Data Dialog */}
      <Dialog
        open={rawDataDialog.open}
        onClose={handleCloseRawData}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#1e40af',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Raw Project Data
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseRawData}
            sx={{
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              bgcolor: '#1e293b',
              color: '#e2e8f0',
              p: 3,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowX: 'auto',
              maxHeight: '60vh',
              position: 'relative'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(rawDataDialog.data, null, 2)}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            bgcolor: '#f8f9fa',
            p: 2,
            gap: 1
          }}
        >
          <Button
            onClick={handleCopyRawData}
            startIcon={<ContentCopyIcon />}
            variant="contained"
            sx={{
              bgcolor: copySuccess ? '#047857' : '#1e40af',
              '&:hover': {
                bgcolor: copySuccess ? '#047857' : '#1e3a8a'
              },
              transition: 'background-color 0.2s'
            }}
          >
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          <Button
            onClick={handleCloseRawData}
            variant="outlined"
            sx={{
              borderColor: '#1e40af',
              color: '#1e40af',
              '&:hover': {
                borderColor: '#1e3a8a',
                bgcolor: 'rgba(30, 64, 175, 0.05)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Users Dialog */}
      <Dialog
        open={usersDialog.open}
        onClose={handleCloseUsersDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#047857',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Users - {usersDialog.projectName}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseUsersDialog}
            sx={{
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {usersDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#047857' }} />
            </Box>
          ) : usersDialog.users && usersDialog.users.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {usersDialog.users.map((user, index) => (
                <Paper
                  key={user.id || index}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={user.thumbnail_url}
                      sx={{ bgcolor: '#047857', width: 48, height: 48 }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {user.name || user.email || 'Unknown User'}
                      </Typography>
                      {user.email && user.name && (
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {user.email}
                        </Typography>
                      )}
                      {user.role && (
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: '#e0e7ff',
                            color: '#1e40af'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography sx={{ color: '#64748b' }}>
                No users found for this project
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f8f9fa', p: 2 }}>
          <Button
            onClick={handleCloseUsersDialog}
            variant="outlined"
            sx={{
              borderColor: '#047857',
              color: '#047857',
              '&:hover': {
                borderColor: '#065f46',
                bgcolor: 'rgba(4, 120, 87, 0.05)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyncSketchProjects;
