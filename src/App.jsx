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

import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { Security } from '@okta/okta-react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import config from './config';
import Navbar from './Navbar';
import AppRoutes from './components/Routes';
import { AppDataProvider } from './contexts/AppDataProvider';
import DataLoadingStatus from './components/DataLoadingStatus';

const oktaAuth = new OktaAuth(config.oidc);

const App = () => {
  const navigate = useNavigate();
  const restoreOriginalUri = (_oktaAuth, originalUri) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  // Manage sidebar width state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('navbarWidth');
    return saved ? parseInt(saved, 10) : 240;
  });

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <AppDataProvider>
        <DataLoadingStatus />
        <Box sx={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
          <Box sx={{
            width: `${sidebarWidth}px`,
            flexShrink: 0,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            backgroundColor: 'white',
            transition: 'width 0.1s ease'
          }}>
            <Box sx={{ height: '100vh', overflowY: 'auto' }}>
              <Navbar sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth} />
            </Box>
          </Box>

          <Box sx={{
            marginLeft: `${sidebarWidth}px`,
            flexGrow: 1,
            p: 3,
            height: '100vh',
            overflowY: 'auto',
            backgroundColor: 'white',
            transition: 'margin-left 0.1s ease'
          }}>
            <AppRoutes />
          </Box>
        </Box>
      </AppDataProvider>
    </Security>
  );
};
export default App;
