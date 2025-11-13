import {
  Typography, Paper, Box, Button, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, InputAdornment,
  CircularProgress, Snackbar, Tooltip, TablePagination, Container,
  ToggleButtonGroup, ToggleButton, Card, CardContent, CardActions,
  Grid, Chip, Fade, Link
} from '@mui/material';
import {
  Search as SearchIcon,
  Restore as RestoreIcon,
  Storage as StorageIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CloudQueue as CloudQueueIcon,
  FolderSpecial as FolderSpecialIcon
} from '@mui/icons-material';
import { useProtectedApiGet, useProtectedApiMutation } from '../hooks/useApi';
import { useState, useMemo } from 'react';
import uuid from 'react-uuid';

export default function AWSRestore({ name = "AWS Project Restore" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [processingProjects, setProcessingProjects] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [tierResults, setTierResults] = useState([]);
  const [restoreResults, setRestoreResults] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const { data, isLoading, error, refetch } = useProtectedApiGet('/aws/buck_global_archive_projects', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  const restoreMutation = useProtectedApiMutation('', {
    method: 'POST',
    mutationConfig: {
      onSuccess: (data, variables) => {
        const restoreInfo = {
          project: variables.projectName,
          status: 'Success',
          details: data,
          timestamp: new Date().toLocaleTimeString()
        };

        setRestoreResults(prev => [restoreInfo, ...prev.filter(item => item.project !== variables.projectName)]);

        setSnackbar({
          open: true,
          message: `Successfully initiated restore for project: ${variables.projectName}`,
          severity: 'success'
        });
        setProcessingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.projectName);
          return newSet;
        });
        refetch();
      },
      onError: (error, variables) => {
        const restoreInfo = {
          project: variables.projectName,
          status: 'Failed',
          details: error.message || 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        };

        setRestoreResults(prev => [restoreInfo, ...prev.filter(item => item.project !== variables.projectName)]);

        setSnackbar({
          open: true,
          message: `Failed to restore project ${variables.projectName}: ${error.message}`,
          severity: 'error'
        });
        setProcessingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.projectName);
          return newSet;
        });
      }
    }
  });

  const tierMutation = useProtectedApiMutation('', {
    method: 'POST',
    mutationConfig: {
      onSuccess: (data, variables) => {
        const tierInfo = {
          project: variables.projectName,
          tier: data?.tier || data?.storage_class || 'Unknown',
          details: data,
          timestamp: new Date().toLocaleTimeString()
        };

        setTierResults(prev => [tierInfo, ...prev.filter(item => item.project !== variables.projectName)]);

        setSnackbar({
          open: true,
          message: `Retrieved tier information for ${variables.projectName}`,
          severity: 'success'
        });
        setProcessingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.projectName);
          return newSet;
        });
      },
      onError: (error, variables) => {
        setSnackbar({
          open: true,
          message: `Failed to get storage tier for ${variables.projectName}: ${error.message}`,
          severity: 'error'
        });
        setProcessingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.projectName);
          return newSet;
        });
      }
    }
  });

  const handleRestore = async (projectName) => {
    console.log('Restore button clicked for project:', projectName);
    setProcessingProjects(prev => new Set(prev).add(projectName));

    try {
      const result = await restoreMutation.mutateAsync({
        endpoint: '/utils/celery_restore_from_glacier',
        params: { project: projectName },
        projectName
      });
      console.log('Restore API result:', result);
    } catch (error) {
      console.error('Restore failed:', error);
      setProcessingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectName);
        return newSet;
      });
    }
  };

  const handleTierChange = async (projectName) => {
    console.log('Tier button clicked for project:', projectName);
    setProcessingProjects(prev => new Set(prev).add(projectName));

    setSnackbar({
      open: true,
      message: 'Wait 15 seconds while we send this task to celery. Check http://amscoresrv.buck.local:5555/tasks for the task status.',
      severity: 'info'
    });

    try {
      const result = await tierMutation.mutateAsync({
        endpoint: '/utils/celery_s3_tier',
        params: { project: projectName },
        projectName
      });
      console.log('Tier API result:', result);
    } catch (error) {
      console.error('Tier change failed:', error);
      setProcessingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectName);
        return newSet;
      });
    }
  };

  const filteredProjects = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    if (!searchTerm.trim()) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(project =>
      project.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  const paginatedProjects = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          py: 8,
          gap: 3
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
        <Typography variant="h6" sx={{ color: '#666' }}>Loading Archived Projects...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Typography variant="h6" gutterBottom>Failed to load archived projects</Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
            }}
          >
            <CloudQueueIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 700, color: '#2d3748' }}>
              {name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
              Restore archived projects from AWS Glacier
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${filteredProjects.length} Archived Projects`}
          sx={{
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 2,
            py: 2.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        />
      </Box>

      {/* Info Alert */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #667eea',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CloudQueueIcon sx={{ color: '#667eea', fontSize: 28 }} />
          <Typography variant="body2" sx={{ color: '#4a5568' }}>
            <Link
              href="http://amscoresrv.buck.local:5555/tasks"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontWeight: 600,
                color: '#667eea',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              View task status
            </Link>
            {' • '}Monitor restore operations and storage tier changes
          </Typography>
        </Box>
      </Paper>

      {/* Search and View Toggle */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          background: 'white'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 9 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              fullWidth
              size="small"
            >
              <ToggleButton value="card" aria-label="card view">
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
                Cards
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {filteredProjects.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: 4
          }}
        >
          <SearchIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            {searchTerm ? 'No projects match your search' : 'No archived projects available'}
          </Typography>
        </Box>
      ) : viewMode === 'card' ? (
        /* Card View */
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {paginatedProjects.map((project, index) => {
              const isProcessing = processingProjects.has(project);

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={uuid()}>
                  <Fade in timeout={300 + index * 30}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)',
                          borderColor: '#667eea'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                              flexShrink: 0
                            }}
                          >
                            <FolderSpecialIcon sx={{ fontSize: 24, color: 'white' }} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Tooltip title={project}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: '#2d3748',
                                  fontSize: '0.95rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {project}
                              </Typography>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                              Archived Project
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <RestoreIcon />}
                          onClick={() => handleRestore(project)}
                          disabled={isProcessing || restoreMutation.isLoading}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            },
                            '&:disabled': {
                              background: '#cbd5e0',
                              color: '#a0aec0'
                            }
                          }}
                        >
                          Restore Project
                        </Button>

                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={isProcessing ? <CircularProgress size={16} /> : <StorageIcon />}
                          onClick={() => handleTierChange(project)}
                          disabled={isProcessing || tierMutation.isLoading}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: '#667eea',
                            color: '#667eea',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: '#764ba2',
                              backgroundColor: 'rgba(102, 126, 234, 0.08)',
                              transform: 'translateY(-2px)'
                            },
                            '&:disabled': {
                              borderColor: '#cbd5e0',
                              color: '#a0aec0'
                            }
                          }}
                        >
                          Project Tier
                        </Button>
                      </CardActions>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination for Card View */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2
            }}
          >
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredProjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              showFirstButton
              showLastButton
            />
          </Paper>
        </>
      ) : (
        /* Table View */
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderSpecialIcon fontSize="small" />
                      Project Name
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProjects.map((project, index) => {
                  const isProcessing = processingProjects.has(project);

                  return (
                    <TableRow
                      key={uuid()}
                      sx={{
                        bgcolor: index % 2 === 0 ? 'white' : 'rgba(102, 126, 234, 0.03)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(102, 126, 234, 0.08)',
                          transform: 'scale(1.005)'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FolderSpecialIcon sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#2d3748' }}>
                            {project}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                          <Tooltip title="Restore project from archive">
                            <span>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <RestoreIcon />}
                                onClick={() => handleRestore(project)}
                                disabled={isProcessing || restoreMutation.isLoading}
                                sx={{
                                  borderRadius: 2,
                                  px: 2.5,
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                                  },
                                  '&:disabled': {
                                    background: '#cbd5e0',
                                    color: '#a0aec0'
                                  }
                                }}
                              >
                                Restore
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip title="Change storage tier">
                            <span>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={isProcessing ? <CircularProgress size={16} /> : <StorageIcon />}
                                onClick={() => handleTierChange(project)}
                                disabled={isProcessing || tierMutation.isLoading}
                                sx={{
                                  borderRadius: 2,
                                  px: 2.5,
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  borderColor: '#667eea',
                                  color: '#667eea',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: '#764ba2',
                                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                                    transform: 'translateY(-2px)'
                                  },
                                  '&:disabled': {
                                    borderColor: '#cbd5e0',
                                    color: '#a0aec0'
                                  }
                                }}
                              >
                                Tier
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            showFirstButton
            showLastButton
          />
        </Paper>
      )}

      {/* Storage Tier Results */}
      {tierResults.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            border: '1px solid #e2e8f0',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
              Storage Tier Results
            </Typography>
            <Button
              size="small"
              onClick={() => setTierResults([])}
              variant="outlined"
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Clear Results
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Storage Tier</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time Retrieved</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tierResults.map((result, index) => (
                  <TableRow
                    key={`${result.project}-${index}`}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {result.project}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={result.tier}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {(() => {
                          const detailsStr = typeof result.details === 'object'
                            ? JSON.stringify(result.details)
                            : String(result.details);
                          const items = detailsStr.split(',').map(item => item.trim());

                          return (
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {items.map((item, idx) => (
                                <Typography
                                  key={idx}
                                  component="li"
                                  variant="body2"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                >
                                  {item}
                                </Typography>
                              ))}
                            </Box>
                          );
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {result.timestamp}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Restore Results */}
      {restoreResults.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            border: '1px solid #e2e8f0',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
              Restore Results
            </Typography>
            <Button
              size="small"
              onClick={() => setRestoreResults([])}
              variant="outlined"
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Clear Results
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {restoreResults.map((result, index) => (
                  <TableRow
                    key={`${result.project}-${index}`}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {result.project}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={result.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          background: result.status === 'Success'
                            ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                            : 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {(() => {
                          const detailsStr = typeof result.details === 'object'
                            ? JSON.stringify(result.details)
                            : String(result.details);
                          const items = detailsStr.split(',').map(item => item.trim()).filter(item => item);

                          return (
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {items.map((item, idx) => (
                                <Typography
                                  key={idx}
                                  component="li"
                                  variant="body2"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                >
                                  {item}
                                </Typography>
                              ))}
                            </Box>
                          );
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {result.timestamp}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={10000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
