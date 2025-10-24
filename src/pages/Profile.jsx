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
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Container,
  Stack
} from '@mui/material';
import {
  AccountCircle,
  Email,
  Person,
  Work,
  BusinessCenter,
  Phone,
  LocationOn,
  CalendarToday,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Verified
} from '@mui/icons-material';
import { useProtectedApiGet } from '../hooks/useApi';

const Profile = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      setUserInfo(null);
    } else {
      setUserInfo(authState.idToken.claims);
    }
  }, [authState, oktaAuth]);

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

  const oktaUser = Array.isArray(oktaUserData) && oktaUserData.length > 0 ? oktaUserData[0] : null;
  const profile = oktaUser?.profile || {};

  if (!userInfo) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (userInfo.name) {
      const parts = userInfo.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return userInfo.email ? userInfo.email[0].toUpperCase() : 'U';
  };

  const getUserName = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return userInfo.name || userInfo.email || 'User';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Card with User Avatar and Key Info */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              fontSize: '3rem',
              fontWeight: 'bold',
              border: '4px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {getInitials()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {getUserName()}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Chip
                icon={<Email sx={{ color: 'white !important' }} />}
                label={userInfo.email}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'medium',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              {profile.department && (
                <Chip
                  icon={<Work sx={{ color: 'white !important' }} />}
                  label={profile.department}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'medium'
                  }}
                />
              )}
              {oktaUser?.status === 'ACTIVE' && (
                <Chip
                  icon={<Verified sx={{ color: 'white !important' }} />}
                  label="Active"
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.8)',
                    color: 'white',
                    fontWeight: 'medium'
                  }}
                />
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="primary">
                  Personal Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {oktaLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : oktaError ? (
                <Typography color="error">Error loading profile data</Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {profile.firstName && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            First Name
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.firstName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.lastName && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Last Name
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.lastName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.displayName && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Display Name
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.displayName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.login && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Login
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.login}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.mobilePhone && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Mobile Phone
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.mobilePhone}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Work Information Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessCenter sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="primary">
                  Work Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {oktaLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : oktaError ? (
                <Typography color="error">Error loading work information</Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {profile.department && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Work fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Department
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.department}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.title && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <BadgeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Title
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.title}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.manager && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Manager
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.manager}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.primaryPhone && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Work Phone
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.primaryPhone}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {profile.city && (
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Location
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body1" fontWeight="medium">
                            {profile.city}
                            {profile.state && `, ${profile.state}`}
                            {profile.countryCode && ` (${profile.countryCode})`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Account Details Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountCircle sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="primary">
                  Account Details
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <List sx={{ py: 0 }}>
                {oktaUser?.id && (
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          User ID
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                          {oktaUser.id}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                {oktaUser?.status && (
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Status
                        </Typography>
                      }
                      secondary={
                        <Chip
                          label={oktaUser.status}
                          color={oktaUser.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                )}
                {oktaUser?.created && (
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Created
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(oktaUser.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                {oktaUser?.lastLogin && (
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Last Login
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(oktaUser.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Groups Card */}
        {oktaUser?._embedded?.groups && oktaUser._embedded.groups.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <GroupIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    Groups
                  </Typography>
                  <Chip
                    label={oktaUser._embedded.groups.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 2 }}
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {oktaUser._embedded.groups.map((group, idx) => (
                    <Chip
                      key={idx}
                      label={group.profile?.name || group.name || 'Unknown Group'}
                      variant="outlined"
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Profile;
