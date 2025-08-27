import {
  Typography, Paper, Box, Button, TextField, Alert, CircularProgress, Snackbar, Select, MenuItem, FormControl, InputLabel, FormHelperText
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useOktaAuth } from '@okta/okta-react';

export default function RenderManagement() {
  const { authState, oktaAuth } = useOktaAuth();
  const [instanceCount, setInstanceNum] = useState('1');
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [gpu, setGPU] = useState('');
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
    mutationFn: async ({ name, instanceCount, size, gpu: gpu, createdBy }) => {
      //aws/create_aws_ec2_instance/us-east-1/rztest/2/medium/false/rob.zimmelman%40buck.co
      const availabilityZone = 'us-east-1';
      const url = `https://laxcoresrv.buck.local:8000/aws/create_aws_ec2_instance/${availabilityZone}/${encodeURIComponent(name)}/${instanceCount}/${size}/${gpu}/${encodeURIComponent(createdBy)}`;
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
      createdBy: createdBy.trim()
    });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>Render Management</Typography>
      
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Create AWS EC2 Instances</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Instance Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for the instances"
            fullWidth
            helperText="Provide a name for the EC2 instances"
            disabled={createInstancesMutation.isPending}
          />
          
          <TextField
            label="Number of Instances"
            type="number"
            value={instanceCount}
            onChange={(e) => setInstanceNum(e.target.value)}
            placeholder="Enter number of instances to create"
            fullWidth
            slotProps={{
              htmlInput: { min: 1 }
            }}
            helperText="Specify how many EC2 instances you want to create"
            disabled={createInstancesMutation.isPending}
          />
          
          <FormControl fullWidth disabled={createInstancesMutation.isPending} sx={{ backgroundColor: '#ffffff' }}>
            <InputLabel id="gpu-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>GPU</InputLabel>
            <Select
              labelId="gpu-label"
              value={gpu}
              label="GPU"
              onChange={(e) => {
                setGPU(e.target.value);
                // Reset size when GPU selection changes
                setSize('');
              }}
              sx={{ 
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
              }}
              MenuProps={{
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
              }}
            >
              <MenuItem value="true">true</MenuItem>
              <MenuItem value="false">false</MenuItem>
            </Select>
            <FormHelperText>Specify if instances use gpu (true/false)</FormHelperText>
          </FormControl>
          
          <FormControl fullWidth disabled={createInstancesMutation.isPending || !gpu} sx={{ backgroundColor: '#ffffff' }}>
            <InputLabel id="instance-size-label" sx={{ backgroundColor: '#ffffff', px: 0.5 }}>Instance Size</InputLabel>
            <Select
              labelId="instance-size-label"
              id="instance-size"
              value={size}
              displayEmpty
              label="Instance Size"
              renderValue={(selected) => {
                console.log('RenderValue called with:', selected);
                return selected || '';
              }}
              onChange={(e) => {
                console.log('onChange fired with:', e.target.value);
                setSize(e.target.value);
              }}
              sx={{ 
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
              }}
              MenuProps={{
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
              }}
            >
              {gpu === 'false' ? (
                <>
                  <MenuItem value="medium" onClick={() => setSize('medium')}>medium</MenuItem>
                  <MenuItem value="large" onClick={() => setSize('large')}>large</MenuItem>
                  <MenuItem value="xlarge" onClick={() => setSize('xlarge')}>xlarge</MenuItem>
                  <MenuItem value="2xlarge" onClick={() => setSize('2xlarge')}>2xlarge</MenuItem>
                </>
              ) : gpu === 'true' ? (
                <>
                  <MenuItem value="xlarge" onClick={() => setSize('xlarge')}>xlarge</MenuItem>
                  <MenuItem value="2xlarge" onClick={() => setSize('2xlarge')}>2xlarge</MenuItem>
                  <MenuItem value="4xlarge" onClick={() => setSize('4xlarge')}>4xlarge</MenuItem>
                  <MenuItem value="8xlarge" onClick={() => setSize('8xlarge')}>8xlarge</MenuItem>
                  <MenuItem value="12xlarge" onClick={() => setSize('12xlarge')}>12xlarge</MenuItem>
                  <MenuItem value="16xlarge" onClick={() => setSize('16xlarge')}>16xlarge</MenuItem>
                  <MenuItem value="24xlarge" onClick={() => setSize('24xlarge')}>24xlarge</MenuItem>
                  <MenuItem value="48xlarge" onClick={() => setSize('48xlarge')}>48xlarge</MenuItem>
                </>
              ) : null}
            </Select>
            <FormHelperText>Specify the size of the EC2 instances</FormHelperText>
          </FormControl>
          
          <TextField
            label="Created By"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Enter creator's email"
            fullWidth
            helperText="Email of person creating the instances"
            disabled={createInstancesMutation.isPending}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateInstances}
            disabled={createInstancesMutation.isPending || !instanceCount || !name || !size || !gpu || !createdBy}
            sx={{ mt: 1 }}
          >
            {createInstancesMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating Instances...
              </>
            ) : (
              'Create Instances'
            )}
          </Button>
        </Box>
      </Paper>

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