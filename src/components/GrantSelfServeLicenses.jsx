import {
  Alert, AlertTitle, IconButton, Snackbar, Chip, Grid, TextField,
  Container, Paper, InputAdornment
} from '@mui/material';
import { useState, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SearchIcon from '@mui/icons-material/Search';
import { useProtectedApiGet } from '../hooks/useApi';
import Button from '@mui/material/Button'
import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import uuid from 'react-uuid';
import CircularProgress from '@mui/material/CircularProgress';

const endpoint = 'https://laxcoresrv.buck.local:8000'


export default function GrantSelfServeLicenses(props) {
    const [successvisible, setSuccessvisible] = useState(false);
    const [previsible, setPrevisible ] = useState(false);
    const [product, setProduct] = useState('')
    const [operation, setOperation] = useState('')
    const [user, setUser] = useState('')

    const PreviewAlert = () => {
        if (previsible) {
            return(<>
              {}
              <Snackbar sx={{minWidth: 1400}} anchorOrigin={{vertical: 'top', horizontal: 'left'}} open={previsible} onClose={() => setPrevisible(false)}>
              <Alert sx={{minWidth: 1400}} action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="large"
                  onClick={() => {
                    setPrevisible(false)}}>
                  <AlertTitle>Processing...</AlertTitle>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              } severity="info">
                {operation} {product} License for {user}
              </Alert>
              </Snackbar>
              </>
            )
          }
      }


      const SuccessAlert = () => {
        if (successvisible) {
            return(<>
              {}
              <Snackbar sx={{minWidth: 1400}} anchorOrigin={{vertical: 'top', horizontal: 'left'}} open={successvisible} onClose={() => setSuccessvisible(false)}  autoHideDuration={3000} >
              <Alert sx={{minWidth: 1400}} action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="large"
                  onClick={() => {
                    setSuccessvisible(false);
                  }}>
                    <AlertTitle>Success!</AlertTitle>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }  icon={<CheckIcon fontSize="inherit" />} severity="success">
                Success {operation} {product} for {user}!
              </Alert>

              </Snackbar>
              </>
            )
          }
      }



  function grabLicense(event, useremail, license) {
    console.log(event)
    if ( ! useremail.includes('buck.co') && ! useremail.includes('anyways.co') && ! useremail.includes('giantant.ca') && ! useremail.includes('residence.co') && ! useremail.includes('partandsum.com')) {
      alert(`Only works for Buck, Residence, GiantAnt and Anyways Users, not for ${useremail}`)
      return
    }
    setOperation('Grabbing');
    setPrevisible(true)
    setProduct(license);
    setUser(useremail);
    const url = `${endpoint}/licenses/get_self_service_license?product=${license.toLowerCase()}&email=${useremail}`

    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
      }
    })
    .then(response => response.json())
    .then(data => {
      setPrevisible(false)
      setSuccessvisible(true);
      return data;
    })
    .catch(error => {
      console.error('Error:', error);
      setPrevisible(false);
    });
  }


  const [filter, setFilter] = useState('');

    // Fetch all Okta users by status like OktaUsers.jsx does
    const oktaActiveUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
        queryParams: { _category: 'users', _att: 'status', _comparison: 'eq', _match: 'ACTIVE' },
        queryConfig: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, retry: 2, retryDelay: 1000 },
        dependencies: ['ACTIVE']
    });

    const oktaStagedUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
        queryParams: { _category: 'users', _att: 'status', _comparison: 'eq', _match: 'STAGED' },
        queryConfig: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, retry: 2, retryDelay: 1000 },
        dependencies: ['STAGED']
    });

    const oktaProvisionedUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
        queryParams: { _category: 'users', _att: 'status', _comparison: 'eq', _match: 'PROVISIONED' },
        queryConfig: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, retry: 2, retryDelay: 1000 },
        dependencies: ['PROVISIONED']
    });

    // Combine all Okta user queries like OktaUsers.jsx
    const oktausers = useMemo(() => {
        const queries = [oktaActiveUsersQuery, oktaStagedUsersQuery, oktaProvisionedUsersQuery];

        const isLoading = queries.some(q => q.isLoading);
        const error = queries.find(q => q.error)?.error || null;

        // Combine all data arrays
        const data = queries.reduce((acc, query) => {
            if (query.data && Array.isArray(query.data)) {
                return [...acc, ...query.data];
            }
            return acc;
        }, []);

        return { isLoading, error, data };
    }, [
        oktaActiveUsersQuery.isLoading, oktaActiveUsersQuery.error, oktaActiveUsersQuery.data,
        oktaStagedUsersQuery.isLoading, oktaStagedUsersQuery.error, oktaStagedUsersQuery.data,
        oktaProvisionedUsersQuery.isLoading, oktaProvisionedUsersQuery.error, oktaProvisionedUsersQuery.data
    ]);

    if (oktausers.isLoading) {
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
          <Typography variant="h6" sx={{ color: '#666' }}>Loading Users...</Typography>
        </Box>
      );
    }

    if (oktausers.error) {
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
            <Typography variant="h6" gutterBottom>Failed to load users</Typography>
            <Typography variant="body2">{oktausers.error.message}</Typography>
          </Alert>
        </Container>
      );
    }

    if (oktausers.data) {

    const clearFilter = () => {
      setFilter('')
    }
    let sortedData = oktausers.data.sort((a, b) => a.profile.login.localeCompare(b.profile.login));
    if (sortedData) {
      let filteredData = sortedData;
      if (filter.length > 0) {
        console.log(sortedData)
        filteredData = sortedData.filter((f) => f.profile.login.includes(filter));
      }
      let myid = uuid()
        return (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <PreviewAlert />
            <SuccessAlert />

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
                  <CardGiftcardIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {props.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
                    Grant software licenses to users
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${filteredData.length} Users`}
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

            {/* Filter */}
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
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Filter by Email"
                    placeholder="Type to filter users..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
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
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    onClick={clearFilter}
                    variant="outlined"
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(102, 126, 234, 0.08)'
                      }
                    }}
                  >
                    Clear Filter
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Users List */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                background: 'white'
              }}
            >
              <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                {/* Header Row */}
                <Grid
                  container
                  spacing={2}
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    mb: 2,
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Grid size={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Name
                    </Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Email
                    </Typography>
                  </Grid>
                  <Grid size={8}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Available Products
                    </Typography>
                  </Grid>
                </Grid>

                {filteredData.map((item) => {
                  return (
                    <Grid
                      container
                      spacing={2}
                      key={myid+item.profile.login}
                      sx={{
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      {/* Name Column */}
                      <Grid size={2}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                          {item.profile.displayName ? item.profile.displayName : ''}
                        </Typography>
                      </Grid>

                      {/* Email Column */}
                      <Grid size={2}>
                        <Typography variant="body2" sx={{ color: '#718096', fontFamily: 'monospace' }}>
                          {item.profile.login ? item.profile.login : ''}
                        </Typography>
                      </Grid>

                      {/* Products Column */}
                      <Grid size={8}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label="Adobe"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Adobe')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Acrobat"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Acrobat')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Aquarium"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Aquarium')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Maya"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Maya')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Substance"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Substance')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Parsec"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Parsec')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Office"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'MSO365')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Figma"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Figma')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Figjam"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Figjam')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="FigmaFigjam"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'FigmaFigjam')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Firefly"
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Firefly')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  )
              })}
              </Box>
            </Paper>
          </Container>
        )
      }
    }
}
