import {
  Typography, Paper, Box, Button, TextField, Alert, CircularProgress, Snackbar, Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useOktaAuth } from '@okta/okta-react';
import RunningInstances from './RunningInstances';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East 1 (N. Virginia)' },
  { value: 'us-west-1', label: 'US West 1 (N. California)' },
  { value: 'us-west-2', label: 'US West 2 (Oregon)' },
  // { value: 'eu-west-1', label: 'Europe (Ireland)' },
  // { value: 'ap-southeast-2', label: 'Australia (Sydney)' },
];

export default function EC2InstanceManagement() {
  const { authState, oktaAuth } = useOktaAuth();
  const [instanceCount, setInstanceNum] = useState('1');
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [gpu, setGPU] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [createdBy, setCreatedBy] = useState('');
  
  // Validate size for current GPU selection
  const getValidSizes = () => {
    if (gpu === 'false') return ['medium', 'large', 'xlarge', '2xlarge'];
    if (gpu === 'true') return ['xlarge', '2xlarge', '4xlarge', '8xlarge', '12xlarge', '16xlarge', '24xlarge', '48xlarge'];
    return [];
  };
  
  const validSizes = getValidSizes();
  const displaySize = validSizes.includes(size) ? size : '';
  
  console.log('Current size state:', size);
  console.log('Display size:', displaySize);
  console.log('Valid sizes:', validSizes);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const selectStyles = {
    backgroundColor: '#ffffff !important',
    '& .MuiSelect-select': { backgroundColor: '#ffffff' },
    '& .MuiOutlinedInput-input': { backgroundColor: '#ffffff' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.87)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
  };

  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: '#ffffff',
        '& .MuiMenuItem-root': {
          backgroundColor: '#ffffff',
          '&:hover': { backgroundColor: '#f5f5f5' },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            '&:hover': { backgroundColor: '#bbdefb' },
          },
        },
      },
    },
  };

  useEffect(() => {
    if (authState?.isAuthenticated && oktaAuth) {
      oktaAuth.getUser().then((userInfo) => {
        if (userInfo?.email) {
          setCreatedBy(userInfo.email);
        }
        if (userInfo?.name) {
          // Remove spaces from the name and set it as default
          setName(userInfo.name.replace(/\s+/g, ''));
        }
      });
    }
  }, [authState, oktaAuth]);


  const createInstancesMutation = useMutation({
    mutationFn: async ({ name, instanceCount, size, gpu: gpu, createdBy, region }) => {
      //aws/create_aws_ec2_instance/us-east-1/rztest/2/medium/false/rob.zimmelman%40buck.co
      const url = `https://laxcoresrv.buck.local:8000/aws/create_aws_ec2_instance/${region}/${encodeURIComponent(name)}/${instanceCount}/${size}/${gpu}/${encodeURIComponent(createdBy)}`;
      console.log(`Protected API POST request to: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    },
    onSuccess: () => {
      setSuccessMessage(`Successfully initiated creation of ${instanceCount} instance(s)`);
      setOpenSnackbar(true);
      setInstanceNum('');
      setName('');
      setSize('');
      setGPU('');
      setCreatedBy('');
    },
    onError: (error) => {
      setErrorMessage(`Failed to create instances: ${error.message}`);
      setOpenSnackbar(true);
    }
  });

  const handleCreateInstances = () => {
    if (!instanceCount || parseInt(instanceCount) <= 0) {
      setErrorMessage('Please enter a valid number of instances (greater than 0)');
      setOpenSnackbar(true);
      return;
    }

    if (!name || name.trim() === '') {
      setErrorMessage('Please enter a name for the instances');
      setOpenSnackbar(true);
      return;
    }

    if (!size || size.trim() === '') {
      setErrorMessage('Please enter a size for the instances');
      setOpenSnackbar(true);
      return;
    }

    if (!gpu || gpu.trim() === '') {
      setErrorMessage('Please specify if instances are using gpu (true/false)');
      setOpenSnackbar(true);
      return;
    }

    if (!createdBy || createdBy.trim() === '') {
      setErrorMessage('Please enter who is creating the instances');
      setOpenSnackbar(true);
      return;
    }

    createInstancesMutation.mutate({
      name: name.trim(),
      instanceCount: parseInt(instanceCount),
      size: size.trim(),
      gpu: gpu.trim(),
      createdBy: createdBy.trim(),
      region: awsRegion
    });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>EC2 Instance Management (wip)</Typography>
      
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Create AWS EC2 Instances</Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth disabled={createInstancesMutation.isPending} sx={{ backgroundColor: '#ffffff' }}>
              <InputLabel id="region-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>AWS Region</InputLabel>
              <Select
                labelId="region-label"
                value={awsRegion}
                label="AWS Region"
                onChange={(e) => setAwsRegion(e.target.value)}
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
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Instance Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              fullWidth
              disabled={createInstancesMutation.isPending}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              label="Count"
              type="number"
              value={instanceCount}
              onChange={(e) => setInstanceNum(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { min: 1 }
              }}
              disabled={createInstancesMutation.isPending}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <FormControl fullWidth disabled={createInstancesMutation.isPending} sx={{ backgroundColor: '#ffffff' }}>
              <InputLabel id="gpu-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>GPU</InputLabel>
              <Select
                labelId="gpu-label"
                value={gpu}
                label="GPU"
                onChange={(e) => {
                  setGPU(e.target.value);
                  setSize('');
                }}
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <FormControl fullWidth disabled={createInstancesMutation.isPending || !gpu} sx={{ backgroundColor: '#ffffff' }}>
              <InputLabel id="instance-size-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>Size</InputLabel>
              <Select
                labelId="instance-size-label"
                id="instance-size"
                value={size}
                displayEmpty
                label="Size"
                renderValue={(selected) => selected || ''}
                onChange={(e) => setSize(e.target.value)}
                sx={selectStyles}
                MenuProps={menuProps}
              >
                {gpu === 'false' ? (
                  ['medium', 'large', 'xlarge', '2xlarge'].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))
                ) : gpu === 'true' ? (
                  ['xlarge', '2xlarge', '4xlarge', '8xlarge', '12xlarge', '16xlarge', '24xlarge', '48xlarge'].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))
                ) : null}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateInstances}
              disabled={createInstancesMutation.isPending || !instanceCount || !name || !size || !gpu || !createdBy}
              fullWidth
              sx={{ height: 56 }}
            >
              {createInstancesMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                'Create'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <RunningInstances region={awsRegion} onRegionChange={setAwsRegion} />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}