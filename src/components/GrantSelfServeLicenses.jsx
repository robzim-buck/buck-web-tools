import { Alert, AlertTitle, Divider, IconButton, Snackbar, Chip, Grid } from '@mui/material';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

import Button from '@mui/material/Button'
import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import uuid from 'react-uuid';
import CircularProgress from '@mui/material/CircularProgress';

// const endpoint = 'http://core-tools.buck.local:7000'
const endpoint = 'https://laxcoresrv.buck.local:8000'
// const endpoint = 'http://10.20.18.159:8000'


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
    if ( ! useremail.includes('buck.co') && ! useremail.includes('anyways.co') && ! useremail.includes('giantant.ca') ) {
      alert(`Only works for Buck, GiantAnt and Anyways Users, not for ${useremail}`)
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

    const [oktausers] = useQueries({
        queries: [
          {
            queryKey: ["oktausers"],
            queryFn: () =>
            fetch(`${endpoint}/buckokta/category/att/comparison/match?_category=users`,
              {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
              }
            }).then((res) => res.json()),
        },
        ]
    });
      if (oktausers.isLoading) return <CircularProgress></CircularProgress>;
      if (oktausers.error) return "An error has occurred: " + oktausers.error.message;
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
            <>
            <Typography variant='h3'>{props.name} For {filteredData.length} Users</Typography>
            <PreviewAlert ></PreviewAlert>
            <SuccessAlert ></SuccessAlert>
            <p>
              Type to filter the list: &nbsp; &nbsp;
              <input id="filter"
                name="filter"
                type="text"
                value={filter}
                onChange={event => setFilter(event.target.value)}
              /> &nbsp; &nbsp;
            <Button onClick={clearFilter} size="small" variant="contained">Clear Filter</Button>
            </p>
            <Box sx={{ margin: 2 }}>
                {/* Header Row */}
                <Grid container spacing={2} sx={{ mb: 2, p: 1, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Name
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Email
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Available Products
                    </Typography>
                  </Grid>
                </Grid>
                
                {filteredData.map((item) => {
                    return <Grid container spacing={2} key={myid+item.profile.login} sx={{ alignItems: 'center', mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      {/* Name Column */}
                      <Grid size={3}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {item.profile.displayName ? item.profile.displayName : ''}
                        </Typography>
                      </Grid>
                      
                      {/* Email Column */}
                      <Grid size={3}>
                        <Typography variant="body2" color="text.secondary">
                          {item.profile.login ? item.profile.login : ''}
                        </Typography>
                      </Grid>
                      
                      {/* Products Column */}
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            label="Adobe" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Adobe')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Acrobat" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Acrobat')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Aquarium" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Aquarium')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Maya" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Maya')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Substance" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Substance')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Parsec" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Parsec')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Office" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'MSO365')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Figma" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Figma')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="Figjam" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'Figjam')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="FigmaFigjam" 
                            onClick={(e) => {grabLicense(e, item.profile.login, 'FigmaFigjam')}} 
                            clickable 
                            color="primary" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                })}
                </Box>
            </>
            )
            }
    }
}


