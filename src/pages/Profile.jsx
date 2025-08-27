/*
 * Copyright (c) 2021-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { 
  Typography, 
  Box, 
  Paper,
  Table, 
  TableContainer, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  CircularProgress,
  Card,
  Grid
} from '@mui/material';
import { Badge as BadgeIcon, AccountCircle } from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';

const Profile = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      // When user isn't authenticated, forget any user info
      setUserInfo(null);
    } else {
      setUserInfo(authState.idToken.claims);
      // get user information from `/userinfo` endpoint
      /*oktaAuth.getUser().then((info) => {
        setUserInfo(info);
      });*/
    }
  }, [authState, oktaAuth]); // Update if authState changes

  const userEmail = userInfo?.email;
  const { data: oktaUserData, isLoading: oktaLoading, error: oktaError } = useProtectedApiGet(
    '/buckokta/category/att/comparison/match',
    {
      queryParams: {
        _category: 'users',
        _att: 'email',
        _comparison: 'eq',
        _match: userEmail
      },
      queryConfig: {
        enabled: !!userEmail
      }
    }
  );

  if (!userInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log(userInfo ? userInfo : '');

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid xs={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BadgeIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h4" color="primary">
                User Profile (ID Token Claims)
              </Typography>
            </Box>
            
            <TableContainer component={Card} variant="outlined">
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Claim</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(userInfo).map((claimEntry) => {
                    const claimName = claimEntry[0];
                    const claimValue = claimEntry[1];
                    const claimId = `claim-${claimName}`;
                    
                    return (
                      <TableRow key={claimName} hover>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                          {claimName}
                        </TableCell>
                        <TableCell id={claimId}>
                          {typeof claimValue === 'object' 
                            ? JSON.stringify(claimValue) 
                            : claimValue.toString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid xs={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AccountCircle color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h4" color="primary">
                Okta Information
              </Typography>
            </Box>
            
            {oktaLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {oktaError && (
              <Typography color="error" variant="body1">
                Error loading Okta information: {oktaError.message}
              </Typography>
            )}

            {oktaUserData && (
              <TableContainer component={Card} variant="outlined">
                <Table sx={{ minWidth: 650 }} size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(oktaUserData) && oktaUserData.length > 0 ? (
                      Object.entries(oktaUserData[0]).map((entry) => {
                        const fieldName = entry[0];
                        const fieldValue = entry[1];
                        const fieldId = `okta-field-${fieldName}`;
                        
                        return (
                          <TableRow key={fieldName} hover>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                              {fieldName}
                            </TableCell>
                            <TableCell id={fieldId}>
                              {typeof fieldValue === 'object' 
                                ? JSON.stringify(fieldValue) 
                                : (fieldValue?.toString() || '')}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No Okta user data found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
