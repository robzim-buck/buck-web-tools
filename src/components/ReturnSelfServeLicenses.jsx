import { Alert, AlertTitle, Divider, IconButton, Chip, Grid, Snackbar, Container, Paper, InputAdornment, TextField } from '@mui/material';
import { useState, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SearchIcon from '@mui/icons-material/Search';
import { useProtectedApiGet } from '../hooks/useApi';

import Button from '@mui/material/Button'
import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import uuid from 'react-uuid';
import CircularProgress from '@mui/material/CircularProgress';


const endpoint = 'https://laxcoresrv.buck.local:8000'


export default function ReturnSelfServeLicenses(props) {
    const [successvisible, setSuccessvisible] = useState(false);
    const [previsible, setPrevisible ] = useState(false);
    const [product, setProduct] = useState('')
    const [operation, setOperation] = useState('')
    const [user, setUser] = useState('')

    const PreviewAlert = () => {
        if (previsible) {
            return(<>
              {}
              <Snackbar sx={{minWidth: 1400}} anchorOrigin={{vertical: 'top', horizontal: 'left'}} open={previsible} onClose={() => setPrevisible(false)}  autoHideDuration={3000} >
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


  function releaseLicense(event, useremail, license) {
    if ( ! useremail.includes('buck.co') && ! useremail.includes('anyways.co') && ! useremail.includes('giantant.ca') ) {
      alert(`Only works for Buck, GiantAnt and Anyways Users, not for ${useremail}`)
      return
    }
    setOperation('Returning');
    setPrevisible(true)
    setProduct(license);
    setUser(useremail);
    const url = `${endpoint}/licenses/release_self_service_license?product=${license.toLowerCase()}&email=${useremail}`

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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress sx={{ color: '#667eea' }} size={60} />
        </Box>
      </Container>
    );
  }

  if (oktausers.error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid #fca5a5' }}>
          An error has occurred: {oktausers.error.message}
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
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <PreviewAlert ></PreviewAlert>
            <SuccessAlert ></SuccessAlert>

            {/* Modern Header */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AssignmentReturnIcon sx={{ fontSize: 40 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {props.name}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    For {filteredData.length} Users
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Filter Section */}
            <Paper elevation={0} sx={{ mb: 3, p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  id="filter"
                  name="filter"
                  placeholder="Type to filter users..."
                  value={filter}
                  onChange={event => setFilter(event.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#764ba2',
                      },
                    },
                  }}
                />
                <Button
                  onClick={clearFilter}
                  variant="contained"
                  sx={{
                    minWidth: '140px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                  }}
                >
                  Clear Filter
                </Button>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                  {/* Header Row */}
                  <Grid container spacing={2} sx={{ position: 'sticky', top: 0, zIndex: 10, mb: 2, p: 2, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                    <Grid size={2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', fontSize: '0.875rem' }}>
                        Name
                      </Typography>
                    </Grid>
                    <Grid size={2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', fontSize: '0.875rem' }}>
                        Email
                      </Typography>
                    </Grid>
                    <Grid size={8}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', fontSize: '0.875rem' }}>
                        Products to Return
                      </Typography>
                    </Grid>
                  </Grid>

                  {filteredData.map((item) => {
                    return <Grid container spacing={2} key={myid+item.profile.login} sx={{ alignItems: 'center', mb: 2, p: 2, bgcolor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { bgcolor: '#f5f5f5', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)' } }}>
                      {/* Name Column */}
                      <Grid size={2}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                          {item.profile.displayName ? item.profile.displayName : ''}
                        </Typography>
                      </Grid>

                      {/* Email Column */}
                      <Grid size={2}>
                        <Typography variant="body2" sx={{ color: '#718096' }}>
                          {item.profile.login ? item.profile.login : ''}
                        </Typography>
                      </Grid>

                      {/* Products Column */}
                      <Grid size={8}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label="Adobe"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Adobe')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Acrobat"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Acrobat')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Aquarium"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Aquarium')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Maya"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Maya')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Substance"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Substance')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Parsec"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Parsec')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Office"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'MSO365')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Figma"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Figma')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Figjam"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Figjam')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="FigmaFigjam"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'FigmaFigjam')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                              }
                            }}
                          />
                          <Chip
                            label="Firefly"
                            onClick={(e) => {releaseLicense(e, item.profile.login, 'Firefly')}}
                            clickable
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              transition: 'all 0.2s',
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
                })}
                </Box>
            </Paper>
            </Container>
            )
            }
    }
}


