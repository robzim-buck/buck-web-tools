import {
  Typography, Paper, Grid, Box, Chip, LinearProgress, Alert,
  ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TextField,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { ViewModule as ViewModuleIcon, TableChart as TableChartIcon } from '@mui/icons-material';
import { useApiGet } from '../hooks/useApi';
import uuid from 'react-uuid';
import { useMemo, useState } from 'react';

export default function AWSCounts({ name = "AWS Archive File Counts" }) {
  const [viewMode, setViewMode] = useState('card');
  const [orderBy, setOrderBy] = useState('count');
  const [order, setOrder] = useState('desc');
  const [folderFilter, setFolderFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  
  const { data, isLoading, error } = useApiGet('/buck_aws_bucket_counts', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => {
          if (orderBy === 'count') return b[orderBy] - a[orderBy];
          return b[orderBy] > a[orderBy] ? 1 : -1;
        }
      : (a, b) => {
          if (orderBy === 'count') return a[orderBy] - b[orderBy];
          return a[orderBy] < b[orderBy] ? 1 : -1;
        };
  };

  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    let filtered = data;
    
    // Apply folder filter
    if (folderFilter !== 'all') {
      filtered = filtered.filter(item => item.folder === folderFilter);
    }
    
    // Apply project filter
    if (projectFilter.trim()) {
      filtered = filtered.filter(item => 
        item.project.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }

    // Format and sort
    const formatted = filtered.map(item => ({
      ...item,
      formattedCount: item.count ? item.count.toLocaleString() : '0'
    }));

    return formatted.sort(getComparator(order, orderBy));
  }, [data, folderFilter, projectFilter, order, orderBy]);

  const availableFolders = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const folders = [...new Set(data.map(item => item.folder))];
    return folders.sort();
  }, [data]);

  const folderStats = useMemo(() => {
    if (!processedData.length) return {};
    
    const stats = {};
    processedData.forEach(item => {
      if (!stats[item.folder]) {
        stats[item.folder] = {
          totalProjects: 0,
          totalFiles: 0
        };
      }
      stats[item.folder].totalProjects += 1;
      stats[item.folder].totalFiles += item.count || 0;
    });
    
    return stats;
  }, [processedData]);

  const totalStats = useMemo(() => {
    if (!processedData.length) return { projects: 0, files: 0, folders: 0 };
    
    return processedData.reduce((acc, item) => ({
      projects: acc.projects + 1,
      files: acc.files + (item.count || 0),
      folders: Object.keys(folderStats).length
    }), { projects: 0, files: 0, folders: 0 });
  }, [processedData, folderStats]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">An error has occurred: {error.message}</Alert>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>{name}</Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">{totalStats.folders}</Typography>
              <Typography variant="body1" color="text.secondary">Total Folders</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">{totalStats.projects.toLocaleString()}</Typography>
              <Typography variant="body1" color="text.secondary">Total Projects</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">{totalStats.files.toLocaleString()}</Typography>
              <Typography variant="body1" color="text.secondary">Total Files</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Folder Statistics */}
      {Object.keys(folderStats).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Folder Breakdown</Typography>
          <Box 
            sx={{ 
              maxHeight: 300, 
              overflowY: 'auto',
              pr: 1
            }}
          >
            <Grid container spacing={2}>
              {Object.entries(folderStats).map(([folder, stats]) => (
                <Grid item xs={12} md={4} key={folder}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: 2
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 'medium',
                        wordBreak: 'break-word'
                      }}
                    >
                      {folder}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        label={`${stats.totalProjects} projects`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                      <Chip
                        label={`${stats.totalFiles.toLocaleString()} files`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Projects</Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="card">
              <ViewModuleIcon sx={{ mr: 0.5 }} fontSize="small" />
              Cards
            </ToggleButton>
            <ToggleButton value="table">
              <TableChartIcon sx={{ mr: 0.5 }} fontSize="small" />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Folder</InputLabel>
            <Select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              label="Filter by Folder"
            >
              <MenuItem value="all">All Folders</MenuItem>
              {availableFolders.map(folder => (
                <MenuItem key={folder} value={folder}>{folder}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            label="Search Projects"
            variant="outlined"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            sx={{ minWidth: 300 }}
            placeholder="Type to filter projects..."
          />
        </Box>
      </Box>

      {viewMode === 'card' ? (
        <Grid container spacing={2}>
          {processedData.map((project) => {
            const filePercentage = totalStats.files > 0 
              ? (project.count / totalStats.files) * 100 
              : 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={uuid()}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {project.folder}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1, wordBreak: 'break-word', fontWeight: 'medium' }}>
                    {project.project}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Files: {project.formattedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filePercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={filePercentage} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Chip
                    label={`${project.formattedCount} files`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'folder'}
                    direction={orderBy === 'folder' ? order : 'asc'}
                    onClick={() => handleRequestSort('folder')}
                  >
                    Folder
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'project'}
                    direction={orderBy === 'project' ? order : 'asc'}
                    onClick={() => handleRequestSort('project')}
                  >
                    Project
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'count'}
                    direction={orderBy === 'count' ? order : 'asc'}
                    onClick={() => handleRequestSort('count')}
                  >
                    File Count
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedData.map((project) => {
                const filePercentage = totalStats.files > 0 
                  ? (project.count / totalStats.files) * 100 
                  : 0;

                return (
                  <TableRow key={uuid()} hover>
                    <TableCell>{project.folder}</TableCell>
                    <TableCell>{project.project}</TableCell>
                    <TableCell align="right">{project.formattedCount}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={filePercentage} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 45, textAlign: 'right' }}>
                          {filePercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}