import {
  Typography, Paper, Box, Button, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, InputAdornment,
  CircularProgress, Snackbar, IconButton, Tooltip, TablePagination
} from '@mui/material';
import { Search as SearchIcon, Restore as RestoreIcon, Storage as StorageIcon } from '@mui/icons-material';
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
        // Store the restore result
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
        // Store the error result
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
        // Store the tier result
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
        endpoint: '/aws/buck_global_archive_project_restore',
        params: { folder: projectName },
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
    
    try {
      const result = await tierMutation.mutateAsync({
        endpoint: '/aws/buck_global_archive_project_tier',
        params: { folder: projectName },
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

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">An error has occurred: {error.message}</Alert>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>{name}</Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Archived Projects</Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {filteredProjects.length} projects
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0); // Reset to first page when searching
          }}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProjects.map((project) => {
                const isProcessing = processingProjects.has(project);
                
                return (
                  <TableRow key={uuid()} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {project}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Restore project from archive">
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={isProcessing ? <CircularProgress size={16} /> : <RestoreIcon />}
                              onClick={() => handleRestore(project)}
                              disabled={isProcessing || restoreMutation.isLoading}
                              sx={{ minWidth: 120 }}
                            >
                              Restore Project
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
                              sx={{ minWidth: 110 }}
                            >
                              Project Tier
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
        
        {filteredProjects.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'No projects found matching your search' : 'No archived projects available'}
            </Typography>
          </Box>
        )}
      </Paper>

      {tierResults.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Storage Tier Results</Typography>
            <Button 
              size="small" 
              onClick={() => setTierResults([])}
              variant="outlined"
            >
              Clear Results
            </Button>
          </Box>
          
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Storage Tier</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Time Retrieved</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tierResults.map((result, index) => (
                  <TableRow key={`${result.project}-${index}`}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {result.project}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {result.tier}
                      </Typography>
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

      {restoreResults.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Restore Results</Typography>
            <Button 
              size="small" 
              onClick={() => setRestoreResults([])}
              variant="outlined"
            >
              Clear Results
            </Button>
          </Box>
          
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {restoreResults.map((result, index) => (
                  <TableRow key={`${result.project}-${index}`}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {result.project}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: result.status === 'Success' ? 'success.main' : 'error.main'
                        }}
                      >
                        {result.status}
                      </Typography>
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}