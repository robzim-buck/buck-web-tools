import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Typography, Paper, Box, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
];

const fetchRunningInstances = async (region) => {
  const url = `https://laxcoresrv.buck.local:8000/aws/aws_ec2_instances/${region}?running=true`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
};

const getStateChipColor = (state) => {
  switch (state) {
    case 'running':
      return 'success';
    case 'stopped':
      return 'error';
    case 'pending':
      return 'warning';
    case 'stopping':
      return 'warning';
    default:
      return 'default';
  }
};

const formatLaunchTime = (launchTime) => {
  if (!launchTime) return '-';
  const date = new Date(launchTime);
  return date.toLocaleString();
};

export default function RunningInstances({ region, onRegionChange }) {
  const queryClient = useQueryClient();

  const {
    data: instancesData,
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['runningInstances', region],
    queryFn: () => fetchRunningInstances(region),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['runningInstances', region] });
  };

  const memoizedInstances = useMemo(() => {
    if (!instancesData) return [];
    return instancesData;
  }, [instancesData]);

  const selectStyles = {
    backgroundColor: '#ffffff !important',
    '& .MuiSelect-select': {
      backgroundColor: '#ffffff',
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: '#ffffff',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.87)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    }
  };

  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: '#ffffff',
        '& .MuiMenuItem-root': {
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            '&:hover': {
              backgroundColor: '#bbdefb',
            },
          },
        },
      },
    },
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Running EC2 Instances</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 250, backgroundColor: '#ffffff' }}>
            <InputLabel id="running-instances-region-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>
              AWS Region
            </InputLabel>
            <Select
              labelId="running-instances-region-label"
              value={region}
              label="AWS Region"
              onChange={(e) => onRegionChange(e.target.value)}
              sx={selectStyles}
              MenuProps={menuProps}
            >
              {AWS_REGIONS.map((region) => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh instances">
            <IconButton onClick={handleRefresh} disabled={isFetching}>
              <RefreshIcon sx={{ animation: isFetching ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to fetch instances: {error?.message || 'Unknown error'}
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {memoizedInstances.length} instance(s) found in {region}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Instance ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Private IP</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Public IP</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Launch Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memoizedInstances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No instances found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  memoizedInstances.map((instance) => (
                    <TableRow key={instance.instance_id} hover>
                      <TableCell>{instance.name || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {instance.instance_id}
                      </TableCell>
                      <TableCell>{instance.instance_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={instance.state}
                          color={getStateChipColor(instance.state)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {instance.private_ip || '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {instance.public_ip || '-'}
                      </TableCell>
                      <TableCell>{formatLaunchTime(instance.launch_time)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}
