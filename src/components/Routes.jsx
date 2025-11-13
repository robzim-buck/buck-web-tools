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

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginCallback } from '@okta/okta-react';
import { RequiredAuth } from './SecureRoute';
import Loading from './Loading';

// Lazy loaded components
const Home = lazy(() => import('../pages/Home'));
const Profile = lazy(() => import('../pages/Profile'));
const APILogs = lazy(() => import('./APILogs'));
const SaltPing = lazy(() => import('./SaltPing'));
const SaltCommand = lazy(() => import('./SaltCommand'));
const ActiveSelfServLicenses = lazy(() => import('./ActiveSelfServLicenses'));
const GrantSelfServeLicenses = lazy(() => import('./GrantSelfServeLicenses'));
const ReturnSelfServeLicenses = lazy(() => import('./ReturnSelfServeLicenses'));
const RLMLicenseInfo = lazy(() => import('./RLMLicenseInfo'));
const Invoices = lazy(() => import('./Invoices'));
const SalesOrders = lazy(() => import('./SalesOrders'));
// const ParsecLeoReport = lazy(() => import('./ParsecLeoReport'));
const VMWareHosts = lazy(() => import('./VMWareHosts'));
const ZenDeskTickets = lazy(() => import('./ZenDeskTickets'));
const JAMFMachineInfo = lazy(() => import('./JAMFMachineInfo'));
const HammerspaceShares = lazy(() => import('./HammerspaceShares'));
const HammerSpaceNodes = lazy(() => import('./HammerSpaceNodes'));
const HammerSpaceGateways = lazy(() => import('./HammerSpaceGateways'));
const HammerspaceObjectives = lazy(() => import('./HammerspaceObjectives'));
const HammerspaceSites = lazy(() => import('./HammerspaceSites'));
const HammerSpaceTasks = lazy(() => import('./HammerSpaceTasks'));
const HammerSpaceSystemHealth = lazy(() => import('./HammerSpaceSystemHealth'));
const HammerSpaceDataPortals = lazy(() => import('./HammerSpaceDataPortals'));
const HammerSpaceSystemInfo = lazy(() => import('./HammerSpaceSystemInfo'));
const HammerSpaceProjects = lazy(() => import('./HammerSpaceProjects'));
const NASProjects = lazy(() => import('./NASProjects'));
const S3CopyStatus = lazy(() => import('./S3CopyStatus'));
const HammerSpaceVolumeGroups = lazy(() => import('./HammerSpaceVolumeGroups'));
// const HammerSpaceEncrypt = lazy(() => import('./HammerSpaceEncrypt'));
const PhysicalDrives = lazy(() => import('./PhysicalDrives'));
const LDAPMachineInfo = lazy(() => import('./LDAPMachineInfo'));
const OktaUsers = lazy(() => import('./OktaUsers'));
const OktaGroups = lazy(() => import('./OktaGroups'));
const LDAPUsers = lazy(() => import('./LDAPUsers'));
const LDAPGroups = lazy(() => import('./LDAPGroups'));
const CompositeMachineInfo = lazy(() => import('./CompositeMachineInfo'));
const AdobeUsers = lazy(() => import('./AdobeUsers'));
const AdobeGroups = lazy(() => import('./AdobeGroups'));
const ParsecUsers = lazy(() => import('./ParsecUsers'));
const GoogleUsers = lazy(() => import('./GoogleUsers'));
const GoogleCalendars = lazy(() => import('./GoogleCalendars'));
const ZoomUsers = lazy(() => import('./ZoomUsers'));
const DocusignUsers = lazy(() => import('./DocusignUsers'));
const SlackUsers = lazy(() => import('./SlackUsers'));
const OktaLocations = lazy(() => import('./OktaLocations'));
const OnboardNewUser = lazy(() => import('./OnboardNewUser'));
const ZenDeskArchiveTickets = lazy(() => import('./ZenDeskArchiveTickets'));
const Reboot = lazy(() => import('./Reboot'));
const PTOCalendar = lazy(() => import('./PTOCalendar'));
const ProjectSizes = lazy(() => import('./ProjectSizes'));
const WindowsCommand = lazy(() => import('./WindowsCommand'));
const AWSCounts = lazy(() => import('./AWSCounts'));
const AWSRestore = lazy(() => import('./AWSRestore'));
const QueryS3 = lazy(() => import('./QueryS3'));
const RenderManagement = lazy(() => import('./RenderManagement'));
const AssignWorkstations = lazy(() => import('./AssignWorkstations'));
const GlobalProjects = lazy(() => import('./GlobalProjects'));
const ResidenceProjects = lazy(() => import('./ResidenceProjects'));
const GlobalCapabilities = lazy(() => import('./GlobalCapabilities'));
const GiantAntProjects = lazy(() => import('./GiantAntProjects'));
const QueryGemini = lazy(() => import('./QueryGemini'));


const allowedEmails = "kevin@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,gautam.sinha@buck.co"
const ITEmails = "kevin@buck.co,harry.youngjones@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,mike.villasana@buck.co,gautam.sinha@buck.co,miranda.summar@buck.co,rizzo.islam@buck.co,carlo.suozzo@buck.co,jonathan.brazier@buck.co,sasha.nater@buck.co"
const PTOEmails = "kevin@buck.co,rob.zimmelman@buck.co,john.kleber@buck.co,nick@buck.co,ncarmen@buck.co,barrett.brown@buck.co,gautam.sinha@buck.co"


// Loading component for Suspense fallback
const LoadingFallback = () => <Loading />;

// Wrap component with Suspense
const SuspenseWrapper = ({ component: Component, ...props }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" exact={true} element={
        <Suspense fallback={<LoadingFallback />}><Home /></Suspense>
      }/>
      <Route path="login/callback" element={<LoginCallback loadingElement={<Loading/>}/>}/>
      {/* <Route path="/messages" element={<RequiredAuth/>}>
        <Route path="" element={<Messages/>}/>
      </Route> */}
      <Route path="/profile" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><Profile /></Suspense>
        }/>
      </Route>

      <Route path="/adobeusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><AdobeUsers /></Suspense>
        }/>
      </Route>
      <Route path="/adobegroups" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><AdobeGroups /></Suspense>
        }/>
      </Route>


      <Route path="/apilogs" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><APILogs /></Suspense>
        }/>
      </Route>
      <Route path="/saltping" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><SaltPing /></Suspense>
        }/>
      </Route>
      <Route path="/saltcommand" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <SaltCommand name="Salt Command" />
          </Suspense>
        }/>
      </Route>
      <Route path="/activeselfservelicenses" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ActiveSelfServLicenses name="Active Self Serve Licenses" />
          </Suspense>
        }/>
      </Route>
      <Route path="/grantselfservelicenses" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <GrantSelfServeLicenses name="Grant Licenses" />
          </Suspense>
        }/>
      </Route>
      <Route path="/returnselfservelicenses" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ReturnSelfServeLicenses name="Return Licenses" />
          </Suspense>
        }/>
      </Route>
      
      <Route path="/rlmlicenseinfo" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <RLMLicenseInfo />
          </Suspense>
        }/>
      </Route>

      <Route path="/physicaldrives" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><PhysicalDrives /></Suspense>
        }/>
      </Route>

      <Route path="/ldapmachineinfo" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><LDAPMachineInfo /></Suspense>
        }/>
      </Route>


      <Route path="/hammerspaceshares" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerspaceShares /></Suspense>
        }/>
      </Route>

      <Route path="/hammerspacenodes" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceNodes /></Suspense>
        }/>
      </Route>

      <Route path="/hammerspacegateways" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceGateways /></Suspense>
        }/>
      </Route>

      <Route path="/hammerspaceobjectives" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerspaceObjectives /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacesites" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerspaceSites /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacetasks" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceTasks /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacesystemhealth" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceSystemHealth /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacedataportals" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceDataPortals /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacesysteminfo" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceSystemInfo /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspaceprojects" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceProjects /></Suspense>
        }/>
      </Route>
      <Route path="/s3copystatus" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><S3CopyStatus /></Suspense>
        }/>
      </Route>
      <Route path="/nasprojects" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><NASProjects /></Suspense>
        }/>
      </Route>
      <Route path="/hammerspacevolumegroups" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceVolumeGroups /></Suspense>
        }/>
      </Route>
      {/* <Route path="/hammerspaceencrypt" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><HammerSpaceEncrypt /></Suspense>
        }/>
      </Route> */}

      <Route path="/awscounts" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><AWSCounts /></Suspense>
        }/>
      </Route>

      <Route path="/awsrestore" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><AWSRestore /></Suspense>
        }/>
      </Route>

      <Route path="/querys3" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><QueryS3 /></Suspense>
        }/>
      </Route>

      <Route path="/googlecalendars" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><GoogleCalendars /></Suspense>
        }/>
      </Route>

      <Route path="/googleusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><GoogleUsers /></Suspense>
        }/>
      </Route>

      <Route path="/zoomusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ZoomUsers name="Zoom Users"/>
          </Suspense>
        }/>
      </Route>

      <Route path="/slackusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <SlackUsers name="Slack Users"/>
          </Suspense>
        }/>
      </Route>

      <Route path="/docusignusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <DocusignUsers name="Docusign Users"/>
          </Suspense>
        }/>
      </Route>

      <Route path="/oktausers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><OktaUsers /></Suspense>
        }/>
      </Route>
      <Route path="/oktagroups" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><OktaGroups /></Suspense>
        }/>
      </Route>

      <Route path="/onboardnewuser" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <OnboardNewUser />
          </Suspense>
        }/>
      </Route>

      <Route path="/welcomenewresident" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <SlackUsers name="Welcome New Resident" />
          </Suspense>
        }/>
      </Route>

      <Route path="/querygemini" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <QueryGemini />
          </Suspense>
        }/>
      </Route>

      <Route path="/oktalocations" element={<RequiredAuth allowedEmail={allowedEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <OktaLocations />
          </Suspense>
        }/>
      </Route>



      <Route path="/jamfmachineinfo" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><JAMFMachineInfo /></Suspense>
        }/>
      </Route>

      <Route path="/zendesktickets" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><ZenDeskTickets /></Suspense>
        }/>
      </Route>


      <Route path="/ldapgroups" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><LDAPGroups /></Suspense>
        }/>
      </Route>

      <Route path="/ldapusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><LDAPUsers /></Suspense>
        }/>
      </Route>



      <Route path="/compositemachineinfo" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><CompositeMachineInfo /></Suspense>
        }/>
      </Route>

      <Route path="/assignworkstations" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><AssignWorkstations /></Suspense>
        }/>
      </Route>



      <Route path="/parsecusers" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ParsecUsers name="Parsec" />
          </Suspense>
        }/>
      </Route>


      {/* <Route path="/parsecleoreport" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><ParsecLeoReport /></Suspense>
        }/>
      </Route> */}

      <Route path="/vmwarehosts" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}><VMWareHosts /></Suspense>
        }/>
      </Route>


      <Route path="/invoices" element={<RequiredAuth allowedEmail={allowedEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <Invoices />
          </Suspense>
        }/>
      </Route>


      <Route path="/salesorders" element={<RequiredAuth allowedEmail={allowedEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <SalesOrders />
          </Suspense>
        }/>
      </Route>


      <Route path="/zendeskarchivetickets" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ZenDeskArchiveTickets />
          </Suspense>
        }/>
      </Route>

      <Route path="/reboot" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <Reboot />
          </Suspense>
        }/>
      </Route>

      <Route path="/ptocalendar" element={<RequiredAuth allowedEmail={PTOEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <PTOCalendar />
          </Suspense>
        }/>
      </Route>

      <Route path="/projectsizes" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ProjectSizes />
          </Suspense>
        }/>
      </Route>

      <Route path="/windowscommand" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <WindowsCommand name="Windows Command" />
          </Suspense>
        }/>
      </Route>

      <Route path="/rendermanagement" element={<RequiredAuth allowedEmail={ITEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <RenderManagement />
          </Suspense>
        }/>
      </Route>

      <Route path="/globalprojects" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <GlobalProjects />
          </Suspense>
        }/>
      </Route>

      <Route path="/residenceprojects" element={<RequiredAuth/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <ResidenceProjects />
          </Suspense>
        }/>
      </Route>

      <Route path="/globalcapabilities" element={<RequiredAuth allowedEmail={allowedEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <GlobalCapabilities />
          </Suspense>
        }/>
      </Route>

      <Route path="/giantantprojects" element={<RequiredAuth allowedEmail={allowedEmails}/>}>
        <Route path="" element={
          <Suspense fallback={<LoadingFallback />}>
            <GiantAntProjects />
          </Suspense>
        }/>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
