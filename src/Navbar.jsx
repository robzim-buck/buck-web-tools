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

import { useOktaAuth } from '@okta/okta-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProtectedApiGet } from './hooks/useApi';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Collapse,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
  ContactMail as ContactMailIcon,
  Badge as BadgeIcon,
  Groups as GroupsIcon,
  GroupWork as GroupWorkIcon,
  Computer as ComputerIcon,
  List as ListIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Storage as ServerIcon,
  Apple as AppleIcon,
  Laptop as LaptopIcon,
  AccountTree as AccountTreeIcon,
  Dns as StorageIcon,
  Flag as FlagIcon, // Safe option that definitely exists
  Share as ShareIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Wifi as WifiIcon,
  BarChart as BarChartIcon,
  ConfirmationNumber as TicketIcon,
  Terminal as TerminalIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
  FindInPage as FindInPageIcon,
  Archive as ArchiveIcon,
  RestartAlt as RestartAltIcon,
  CalendarToday as CalendarTodayIcon,
  TableChart as TableChartIcon,
  Lock as LockIcon,
  CloudQueue as CloudQueueIcon
} from '@mui/icons-material';

// Email lists from Routes.jsx
const allowedEmails = "rob.zimmelman@buck.co,john.kleber@buck.co,gautam.sinha@buck.co";
const ITEmails = "harry.youngjones@buck.co,mj.hilomen@buck.co,daniel.hernandez@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,gautam.sinha@buck.co,miranda.summar@buck.co,rizzo.islam@buck.co,carlo.suozzo@buck.co,jonathan.brazier@buck.co,sasha.nater@buck.co,mike.villasana@buck.co";

const Navbar = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const [collapsed, setCollapsed] = useState({
    userManagement: true,
    licenseManagement: true,
    infrastructure: true,
    storage: true,
    storageManagement: true,
    finance: true,
    monitoring: true,
    account: true
  });

  const userEmail = authState?.idToken?.claims?.email;
  const { data: oktaUserData } = useProtectedApiGet(
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

  const toggleCollapse = (section) => {
    setCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Function to check if user has access to a route based on email restrictions
  const hasAccess = (emailRestriction) => {
    if (!emailRestriction) return true; // No email restriction means everyone has access
    if (!authState?.idToken?.claims?.email) return false; // No user email means no access
    
    const emailList = emailRestriction.split(',');
    return emailList.includes(authState.idToken.claims.email);
  };


  // Function to check if user is in IT department based on Okta data
  const isITDepartment = () => {
    if (!oktaUserData || !Array.isArray(oktaUserData) || oktaUserData.length === 0) {
      return false;
    }
    
    const userData = oktaUserData[0];
    const department = userData?.profile?.department;
    
    // If no department field exists, return false
    if (!department) {
      return false;
    }
    
    return department === 'IT';
  };

  const login = async () => oktaAuth.signInWithRedirect();
  const logout = async () => oktaAuth.signOut();

  if (!authState) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 0, overflow: 'hidden', height: '100%', boxShadow: 'none', backgroundColor: 'white' }}>
      <Box sx={{ pt: 2, pb: 1, display: 'flex', justifyContent: 'center' }}>
        <Box 
          component="img" 
          src="/Buck Square Logo.png" 
          alt="Buck Logo" 
          sx={{ width: '90%', maxHeight: 60, objectFit: 'contain' }}
        />
      </Box>
      <Divider />
      
      <List component="nav" dense sx={{ width: '100%', pt: 1 }}>
        {authState.isAuthenticated && (
          <>
            {/* Department Display */}
            {oktaUserData && Array.isArray(oktaUserData) && oktaUserData.length > 0 && oktaUserData[0]?.profile?.department && (
              <Box sx={{ px: 2, py: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  Department: {oktaUserData[0].profile.department}
                </Typography>
              </Box>
            )}
            
            {/* User Management */}
            <ListItemButton
              onClick={() => toggleCollapse('userManagement')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="User Management"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.userManagement ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.userManagement} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Alphabetically sorted user management items */}
                <ListItemButton component={Link} to="/adobegroups" id="adobe-groups-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Adobe Groups" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/adobeusers" id="adobe-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><BadgeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Adobe Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/docusignusers" id="docusign-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Docusign Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/googlecalendars" id="google-calendars-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Google Calendars" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/googleusers" id="google-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Google Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/ldapusers" id="ldap-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ContactMailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="LDAP Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/oktagroups" id="okta-groups-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Okta Groups" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {hasAccess(allowedEmails) && (
                  <ListItemButton component={Link} to="/oktalocations" id="okta-locations-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><LocationOnIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Okta Locations" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                <ListItemButton component={Link} to="/oktausers" id="okta-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Okta Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/parsecusers" id="parsecusers-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ComputerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Parsec Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/zoomusers" id="zoom-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Zoom Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>

                {/* Keep Add Okta User at the end, after all the display items */}
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/onboardnewuser" id="onboard-user-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="OnBoard New User" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
              </List>
            </Collapse>

            {/* License Management */}
            <ListItemButton
              onClick={() => toggleCollapse('licenseManagement')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <BadgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="License Management"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.licenseManagement ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.licenseManagement} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/activeselfservelicenses" id="active-licenses-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Active Self Serve Licenses" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/grantselfservelicenses" id="grant-licenses-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Grant Licenses" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                <ListItemButton component={Link} to="/returnselfservelicenses" id="return-licenses-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><RemoveIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Return Licenses" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/rlmlicenseinfo" id="rlm-license-info-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="RLM License Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Infrastructure */}
            <ListItemButton
              onClick={() => toggleCollapse('infrastructure')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <ServerIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Infrastructure"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.infrastructure ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.infrastructure} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/dashboard" id="dashboard-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Assignment Dashboard" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                <ListItemButton component={Link} to="/vmwarehosts" id="vmwarehosts-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ServerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="VMWare Hosts" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/jamfmachineinfo" id="jamfmachineinfo-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><AppleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="JAMF Machine Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/rendermanagement" id="render-management-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><CloudQueueIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Render Management" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/assignworkstations" id="assign-workstations-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><ComputerIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Assign Workstations" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                <ListItemButton component={Link} to="/ldapmachineinfo" id="ldapmachineinfo-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><LaptopIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="LDAP Machine Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/compositemachineinfo" id="compositemachineinfo-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><AccountTreeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Composite Machine Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/physicaldrives" id="physicaldrives-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><StorageIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Physical Drives" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {isITDepartment() && (
                  <ListItemButton component={Link} to="/reboot" id="reboot-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Reboot Machines" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
              </List>
            </Collapse>

            {/* Storage */}
            <ListItemButton
              onClick={() => toggleCollapse('storage')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <StorageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Storage Information"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.storage ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.storage} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/awscounts" id="aws-counts-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><CloudQueueIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="AWS File Counts" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspaceobjectives" id="hammerspace-objectives-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Objectives" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspaceshares" id="hammerspace-shares-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Shares" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspacesites" id="hammerspace-sites-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><LocationOnIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Sites" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspacetasks" id="hammerspace-tasks-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PlaylistAddCheckIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Tasks" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspacesystemhealth" id="hammerspace-system-health-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><HealthAndSafetyIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace System Health" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspacedataportals" id="hammerspace-data-portals-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Data Portals" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {/* <ListItemButton component={Link} to="/hammerspaceencrypt" id="hammerspace-encrypt-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Encryption" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton> */}
                <ListItemButton component={Link} to="/hammerspacesysteminfo" id="hammerspace-system-info-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ComputerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace System Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/hammerspacevolumegroups" id="hammerspace-volume-groups-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><GroupWorkIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace Volume Groups" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/projectsizes" id="project-sizes-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Project Sizes" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Storage Management */}
            <ListItemButton
              onClick={() => toggleCollapse('storageManagement')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <FolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Project Backups"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.storageManagement ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.storageManagement} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/hammerspaceprojects" id="hammerspace-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hammerspace -> S3" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/s3copystatus" id="s3-copy-status-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><CloudQueueIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="S3 Copy Status" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/nasprojects" id="nas-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><StorageIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="NAS -> S3" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/awsrestore" id="aws-restore-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="AWS Restore" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Finance */}
            {hasAccess(allowedEmails) && (
              <>
                <ListItemButton
                  onClick={() => toggleCollapse('finance')}
                  sx={{
                    py: 0.5,
                    minHeight: 36,
                    fontSize: '0.875rem',
                    '& .MuiListItemIcon-root': { minWidth: 32 }
                  }}
                >
                  <ListItemIcon>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Finance"
                    slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                  />
                  {collapsed.finance ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </ListItemButton>
                <Collapse in={!collapsed.finance} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton component={Link} to="/invoices" id="invoices-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Invoices" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                    <ListItemButton component={Link} to="/salesorders" id="salesorders-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><ShoppingCartIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Sales Orders" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* Monitoring & Tools */}
            <ListItemButton
              onClick={() => toggleCollapse('monitoring')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <BarChartIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Monitoring & Tools"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.monitoring ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.monitoring} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/ptocalendar" id="pto-calendar-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="PTO Calendar" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/saltping" id="salt-ping-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><WifiIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Salt Ping" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/saltcommand" id="salt-command-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><TerminalIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Salt Command" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {hasAccess(ITEmails) && (
                  <ListItemButton component={Link} to="/windowscommand" id="windows-command-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><TerminalIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Windows Command" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                {/* <ListItemButton component={Link} to="/parsecleoreport" id="parsecleoreport-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Parsec Leo Report" primaryTypographyProps={{ fontSize: '0.875rem' }} />
                </ListItemButton> */}
                <ListItemButton component={Link} to="/zendesktickets" id="zendesktickets-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><TicketIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Zendesk Tickets" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/zendeskarchivetickets" id="zendesk-archive-tickets-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Zendesk Archive Tickets" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/apilogs" id="logs-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><TerminalIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logs" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/rapid7jobs" id="rapid7-jobs-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Rapid7 Jobs" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/rapid7investigations" id="rapid7-investigations-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><FindInPageIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Rapid7 Investigations" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Account */}
            <ListItemButton
              onClick={() => toggleCollapse('account')}
              sx={{
                py: 0.5,
                minHeight: 36,
                fontSize: '0.875rem',
                '& .MuiListItemIcon-root': { minWidth: 32 }
              }}
            >
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Account"
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
              />
              {collapsed.account ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemButton>
            <Collapse in={!collapsed.account} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/profile" id="profile-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Profile" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton onClick={logout} id="logout-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logout" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}
        {!authState.isAuthenticated && (
          <ListItemButton
            onClick={login}
            sx={{
              py: 0.5,
              minHeight: 36,
              fontSize: '0.875rem',
              '& .MuiListItemIcon-root': { minWidth: 32 }
            }}
          >
            <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary="Login"
              slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
            />
          </ListItemButton>
        )}
      </List>
    </Paper>
  );
};
export default Navbar;