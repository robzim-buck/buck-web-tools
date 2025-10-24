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
import { useState, useEffect } from 'react';
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
  Divider,
  Tooltip
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
  CloudQueue as CloudQueueIcon,
  ArrowForward as ArrowForwardIcon,
  SwapHoriz as SwapHorizIcon,
  AttachMoney as AttachMoneyIcon,
  WorkOutline as WorkOutlineIcon,
  Slideshow as SlideshowIcon
} from '@mui/icons-material';

// Email lists from Routes.jsx
const restrictedEmails = "kevin@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,gautam.sinha@buck.co";
const ITEmails = "kevin@buck.co,andrew.burnett@buck.co,harry.youngjones@buck.co,mj.hilomen@buck.co,daniel.hernandez@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,gautam.sinha@buck.co,miranda.summar@buck.co,rizzo.islam@buck.co,carlo.suozzo@buck.co,jonathan.brazier@buck.co,sasha.nater@buck.co,mike.villasana@buck.co";

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
    onboarding: true,
    account: true,
    projects: true
  });
  const [logoSrc, setLogoSrc] = useState('/BUCK_B_Loop.gif');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoSrc('/Buck Square Logo.png');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
    <Paper elevation={0} sx={{ borderRadius: 0, height: '100%', boxShadow: 'none', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ pt: 2, pb: 1, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Box
          component="img"
          src={logoSrc}
          alt="Buck Logo"
          sx={{ width: '50%', maxHeight: 60, objectFit: 'contain' }}
        />
      </Box>
      <Divider sx={{ flexShrink: 0 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
            <Tooltip title="Manage users across all platforms including Okta, Google, Adobe, and more" placement="right" arrow>
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
                  primary="Users / Groups"
                  slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                />
                {collapsed.userManagement ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
            </Tooltip>
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
                <ListItemButton component={Link} to="/ldapgroups" id="ldap-groups-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="LDAP Groups" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/ldapusers" id="ldap-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ContactMailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="LDAP Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/oktagroups" id="okta-groups-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Okta Groups" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {hasAccess(restrictedEmails) && (
                  <ListItemButton component={Link} to="/oktalocations" id="okta-locations-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><LocationOnIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Okta Locations" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                <Tooltip title="View and search all Okta users in the organization" placement="right">
                  <ListItemButton component={Link} to="/oktausers" id="okta-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Okta Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                </Tooltip>
                <ListItemButton component={Link} to="/parsecusers" id="parsecusers-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ComputerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Parsec Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/zoomusers" id="zoom-users-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Zoom Users" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Onboarding */}
            {hasAccess(ITEmails) && (
              <>
                <Tooltip title="Onboard and manage new users in the system" placement="right" arrow>
                  <ListItemButton
                    onClick={() => toggleCollapse('onboarding')}
                    sx={{
                      py: 0.5,
                      minHeight: 36,
                      fontSize: '0.875rem',
                      '& .MuiListItemIcon-root': { minWidth: 32 }
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        component="img"
                        src="/residence-logo.png"
                        alt="Residence Logo"
                        sx={{ width: 20, height: 20, objectFit: 'contain' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary="Residence OnBoarding"
                      slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                    />
                    {collapsed.onboarding ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </ListItemButton>
                </Tooltip>
                <Collapse in={!collapsed.onboarding} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <Tooltip title="Create and onboard a new user to the system" placement="right">
                      <ListItemButton component={Link} to="/onboardnewuser" id="onboard-user-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                        <ListItemIcon>
                          <Box
                            component="img"
                            src="/residence-logo.png"
                            alt="Residence Logo"
                            sx={{ width: 20, height: 20, objectFit: 'contain' }}
                          />
                        </ListItemIcon>
                        <ListItemText primary="OnBoard New Resident" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                      </ListItemButton>
                    </Tooltip>
                  </List>
                </Collapse>
              </>
            )}

            {/* Projects */}
            {hasAccess(restrictedEmails) && (
              <>
                <Tooltip title="View and manage projects across the organization" placement="right" arrow>
                  <ListItemButton
                    onClick={() => toggleCollapse('projects')}
                    sx={{
                      py: 0.5,
                      minHeight: 36,
                      fontSize: '0.875rem',
                      '& .MuiListItemIcon-root': { minWidth: 32 }
                    }}
                  >
                    <ListItemIcon>
                      <WorkOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Projects from Coda"
                      slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                    />
                    {collapsed.projects ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </ListItemButton>
                </Tooltip>
                <Collapse in={!collapsed.projects} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton component={Link} to="/giantantprojects" id="giant-ant-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><WorkOutlineIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Giant Ant Projects" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                    <ListItemButton component={Link} to="/globalcapabilities" id="global-capabilities-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><SlideshowIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Global Capabilities" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                    <ListItemButton component={Link} to="/globalprojects" id="global-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><WorkOutlineIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Global Projects" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                    <ListItemButton component={Link} to="/residenceprojects" id="residence-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon>
                        <Box
                          component="img"
                          src="/residence-logo.png"
                          alt="Residence Logo"
                          sx={{ width: 20, height: 20, objectFit: 'contain' }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Residence Projects" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* License Management */}
            <Tooltip title="Manage software licenses, view active licenses, and grant or return licenses" placement="right" arrow>
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
            </Tooltip>
            <Collapse in={!collapsed.licenseManagement} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <Tooltip title="View all currently active self-service licenses" placement="right">
                  {hasAccess(ITEmails) && (<ListItemButton component={Link} to="/activeselfservelicenses" id="active-licenses-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Active Self Serve Licenses" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>)}
                </Tooltip>
                {hasAccess(ITEmails) && (
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
            <Tooltip title="View and manage IT infrastructure including VMware VDI hosts, workstations, and physical drives" placement="right" arrow>
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
            </Tooltip>
            <Collapse in={!collapsed.infrastructure} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hasAccess(ITEmails) && (
                  <Tooltip title="View workstation assignments and resource allocation dashboard" placement="right">
                    <ListItemButton component={Link} to="/assignworkstations" id="dashboard-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Assignment Dashboard" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </Tooltip>
                )}
                <ListItemButton component={Link} to="/vmwarehosts" id="vmwarehosts-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><ServerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="VMWare VDI Hosts" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <ListItemButton component={Link} to="/jamfmachineinfo" id="jamfmachineinfo-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><AppleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="JAMF Machine Info" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                {hasAccess(ITEmails) && (
                  <ListItemButton component={Link} to="/rendermanagement" id="render-management-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><CloudQueueIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Render Management" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                )}
                {/* {hasAccess(ITEmails) && (
                  <Tooltip title="Assign workstations to users" placement="right">
                    <ListItemButton component={Link} to="/assignworkstations" id="assign-workstations-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><ComputerIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Assign Workstations" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </Tooltip>
                )} */}
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
                {hasAccess(ITEmails) && (
                  <Tooltip title="Remotely reboot selected machines" placement="right">
                    <ListItemButton component={Link} to="/reboot" id="reboot-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Reboot Machines" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </Tooltip>
                )}
              </List>
            </Collapse>

            {/* Storage */}
            <Tooltip title="Monitor storage systems including AWS, Hammerspace, and view storage metrics" placement="right" arrow>
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
            </Tooltip>
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
            <Tooltip title="Manage project backups and transfers between storage systems" placement="right" arrow>
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
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Project</span>
                      <ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />
                      <span>S3</span>
                      <SwapHorizIcon sx={{ fontSize: '0.875rem' }} />
                      <span>Glacier</span>
                    </Box>
                  }
                  slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                />
                {collapsed.storageManagement ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
            </Tooltip>
            <Collapse in={!collapsed.storageManagement} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <Tooltip title="Backup projects from Hammerspace to AWS S3" placement="right">
                  <ListItemButton component={Link} to="/hammerspaceprojects" id="hammerspace-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Hammerspace -> S3" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                </Tooltip>
                <Tooltip title="Monitor the status of S3 backup operations" placement="right">
                  <ListItemButton component={Link} to="/s3copystatus" id="s3-copy-status-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><CloudQueueIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="S3 Copy Status" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                </Tooltip>
                <ListItemButton component={Link} to="/nasprojects" id="nas-projects-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><StorageIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="NAS -> S3" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                </ListItemButton>
                <Tooltip title="Restore archived projects from Glacier to S3" placement="right">
                  <ListItemButton component={Link} to="/awsrestore" id="aws-restore-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Glacier -> S3" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                </Tooltip>
              </List>
            </Collapse>

            {/* Finance */}
            {hasAccess(restrictedEmails) && (
              <>
                <Tooltip title="Access financial documents including invoices and sales orders" placement="right" arrow>
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
                      <AttachMoneyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Finance"
                      slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 'medium' } }}
                    />
                    {collapsed.finance ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </ListItemButton>
                </Tooltip>
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
            <Tooltip title="System monitoring tools, command execution, tickets, and security scanning" placement="right" arrow>
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
            </Tooltip>
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
                  <Tooltip title="Execute remote commands on Windows machines" placement="right">
                    <ListItemButton component={Link} to="/windowscommand" id="windows-command-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                      <ListItemIcon><TerminalIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Windows Command" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                    </ListItemButton>
                  </Tooltip>
                )}
                {/* <ListItemButton component={Link} to="/parsecleoreport" id="parsecleoreport-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                  <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Parsec Leo Report" primaryTypographyProps={{ fontSize: '0.875rem' }} />
                </ListItemButton> */}
                <Tooltip title="View and manage active support tickets" placement="right">
                  <ListItemButton component={Link} to="/zendesktickets" id="zendesktickets-button" sx={{ pl: 4, py: 0.5, minHeight: 32 }}>
                    <ListItemIcon><TicketIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Zendesk Tickets" slotProps={{ primary: { fontSize: '0.875rem' } }} />
                  </ListItemButton>
                </Tooltip>
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
            <Tooltip title="Manage your account profile and logout" placement="right" arrow>
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
            </Tooltip>
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
      </Box>
    </Paper>
  );
};
export default Navbar;