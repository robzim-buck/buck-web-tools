"use client";

import { useState, useEffect } from "react";
import { UsersList } from "./UsersList";
import { WorkstationsList } from "./WorkstationsList";
import { AssignmentPanel } from "./AssignmentPanel";
import { WorkstationDetail } from "./WorkstationDetail";
import { UserProjectsList } from "./UserProjectsList";
import { User, Workstation } from "@/app/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { useToast } from "@/app/hooks/use-toast";
import { DataSourceToggle } from "@/app/components/ui/data-source-toggle";
import { FEATURES, isFeatureEnabled } from "@/app/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Monitor, 
  History,
  Activity,
  PieChart,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Search,
  CornerRightDown,
  Server,
  Briefcase,
  RefreshCcw,
  Laptop
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

// Import services
import { workstationService, enableJamfData, forceRefreshJamfData } from "@/app/services/workstation-service";
import { userService } from "@/app/services/user-service";

// Import mock data
import { auditLogEntries, utilizationMetrics, mockWorkstations } from "@/app/mock/data";

export function DashboardLayout() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);
  const [userFilters, setUserFilters] = useState({});
  
  // Debug helper - log when filters are changed
  useEffect(() => {
    console.log('DashboardLayout - User filters updated:', JSON.stringify(userFilters, null, 2));
  }, [userFilters]);
  const [workstationFilters, setWorkstationFilters] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [useOktaData, setUseOktaData] = useState(FEATURES.USE_OKTA_DATA === true);
  const [useRzTestApi, setUseRzTestApi] = useState(FEATURES.USE_RZTEST_API === true);
  const [useJamfData, setUseJamfData] = useState(FEATURES.USE_JAMF_DATA === true);
  
  // Ensure feature flags are set to boolean values
  useEffect(() => {
    FEATURES.USE_OKTA_DATA = useOktaData;
    FEATURES.USE_RZTEST_API = useRzTestApi;
    FEATURES.USE_JAMF_DATA = useJamfData;
    
    console.log('DashboardLayout - Feature flags initialized:', {
      USE_OKTA_DATA: FEATURES.USE_OKTA_DATA,
      USE_RZTEST_API: FEATURES.USE_RZTEST_API,
      USE_JAMF_DATA: FEATURES.USE_JAMF_DATA,
      useRzTestApiState: useRzTestApi,
      useJamfDataState: useJamfData
    });
  }, []);
  
  // Debug the initial feature flag states
  useEffect(() => {
    console.log('Initial feature flags state:', {
      FEATURES_USE_RZTEST_API: FEATURES.USE_RZTEST_API,
      FEATURES_TYPE: typeof FEATURES.USE_RZTEST_API,
      useRzTestApi,
      useRzTestApiType: typeof useRzTestApi
    });
  }, []);
  
  // Handle Okta data source toggle
  const handleOktaDataToggle = (useReal: boolean) => {
    // Update the global feature toggle
    FEATURES.USE_OKTA_DATA = useReal === true; // Force boolean conversion
    setUseOktaData(useReal);
    
    // Log the change for debugging
    console.log('Okta API toggle changed:', { 
      useReal,
      useRealType: typeof useReal,
      FEATURES_VALUE: FEATURES.USE_OKTA_DATA,
      FEATURES_VALUE_TYPE: typeof FEATURES.USE_OKTA_DATA,
      IS_TRUE: FEATURES.USE_OKTA_DATA === true 
    });
    
    // Show toast notification
    toast({
      title: `Using ${useReal ? 'Okta' : 'Mock'} User Data`,
      description: `Switched to ${useReal ? 'real Okta API' : 'local mock'} data source for users`,
      variant: useReal ? "success" : "info",
    });
    
    // Reset selections
    setSelectedUser(null);
    
    // Trigger refresh by updating filters
    const newUserFilters = { ...userFilters };
    setUserFilters(newUserFilters);
  };
  
  
  // Handle RZTest API toggle
  const handleRzTestApiToggle = (useReal: boolean) => {
    // Force boolean value
    const useRealBoolean = useReal === true;
    
    // Update feature flag directly with boolean value
    FEATURES.USE_RZTEST_API = useRealBoolean;
    
    // Update local state
    setUseRzTestApi(useRealBoolean);
    
    // Force a console log of all FEATURES for debugging
    console.log('RZTest API toggle changed:', { 
      useReal,
      useRealBoolean,
      useRealType: typeof useReal,
      FEATURES_VALUE: FEATURES.USE_RZTEST_API,
      FEATURES_VALUE_TYPE: typeof FEATURES.USE_RZTEST_API,
      IS_TRUE: FEATURES.USE_RZTEST_API === true 
    });
    
    // Show toast notification
    toast({
      title: `Using ${useRealBoolean ? 'Salt' : 'Mock'} API`,
      description: `Switched to ${useRealBoolean ? 'Salt API' : 'local mock'} data source for workstations`,
      variant: useRealBoolean ? "success" : "info",
    });
    
    // Reset selections
    setSelectedWorkstation(null);
  };
  
  // Handle JAMF API toggle
  const handleJamfDataToggle = async (useReal: boolean) => {
    // Force boolean value and update feature flag using utility function
    const useRealBoolean = enableJamfData(useReal === true);
    
    // Update local state
    setUseJamfData(useRealBoolean);
    
    // Log the change for debugging
    console.log('JAMF API toggle changed:', { 
      useReal,
      useRealBoolean,
      useRealType: typeof useReal,
      FEATURES_VALUE: FEATURES.USE_JAMF_DATA,
      FEATURES_VALUE_TYPE: typeof FEATURES.USE_JAMF_DATA,
      IS_TRUE: FEATURES.USE_JAMF_DATA === true 
    });
    
    // Force a direct check of the updated feature flag status
    console.log('JAMF integration immediately after toggle:', {
      raw: FEATURES.USE_JAMF_DATA,
      isEnabled: FEATURES.USE_JAMF_DATA === true,
      isEnabledFn: isFeatureEnabled(FEATURES.USE_JAMF_DATA)
    });
    
    // Test JAMF feature directly (when enabling)
    if (useRealBoolean) {
      try {
        // Make a direct test call to our test endpoint
        console.log('Testing JAMF integration directly...');
        const response = await fetch('/api/jamf/test');
        const data = await response.json();
        console.log('JAMF test response:', data);
        
        // Show the test result
        toast({
          title: 'JAMF Test Result',
          description: data.status === 'success' 
            ? `Found ${data.direct.computers} computers` 
            : `Test failed: ${data.message || 'Unknown error'}`,
          variant: data.status === 'success' ? 'success' : 'warning',
        });
      } catch (error) {
        console.error('Error testing JAMF integration:', error);
      }
    }
    
    // Show toast notification
    toast({
      title: `${useRealBoolean ? 'Including' : 'Excluding'} Mac Computers`,
      description: `${useRealBoolean ? 'Added' : 'Removed'} Mac computers from JAMF in workstation list`,
      variant: useRealBoolean ? "success" : "info",
    });
    
    // Reset workstation selection
    setSelectedWorkstation(null);
    
    // Trigger refresh by updating filters
    const newWorkstationFilters = { ...workstationFilters };
    setWorkstationFilters(newWorkstationFilters);
  };
  
  // Additional logging for debugging
  useEffect(() => {
    console.log('Feature flag status updated:', {
      "FEATURES.USE_RZTEST_API": FEATURES.USE_RZTEST_API,
      "FEATURES.USE_JAMF_DATA": FEATURES.USE_JAMF_DATA,
      "Type_RZTEST": typeof FEATURES.USE_RZTEST_API,
      "Type_JAMF": typeof FEATURES.USE_JAMF_DATA
    });
  }, [useRzTestApi, useJamfData]);

  // Handle successful assignment
  const handleAssignmentComplete = () => {
    // Reset workstation selection - it will be updated when the list reloads
    setSelectedWorkstation(null);
    
    // We're keeping the user selection to allow for multiple assignments
    
    // Add workstation status refresh indicator with toast
    toast({
      title: "Assignment Updated",
      description: "Refreshing workstation data...",
      variant: "info",
    });
    
    // Introduce a trigger for any components that need to refresh data
    const newFilters = { ...workstationFilters };
    setWorkstationFilters(newFilters);
  };
  
  // Handle user selection to also select their assigned workstation if available
  const handleUserSelect = async (user: User) => {
    // Store the user selection immediately
    setSelectedUser(user);
    
    // Find any workstation assigned to this user in mock data
    // In a real app, this would use the API service
    const assignedWorkstation = mockWorkstations.find(
      ws => ws.assignedTo?.username === user.username
    );
    
    if (assignedWorkstation) {
      setSelectedWorkstation(assignedWorkstation);
    }
    
    // Load Deltek project information if needed
    if (user && !user.projectAssignments && user.email && isFeatureEnabled(FEATURES.USE_BUCK_API)) {
      toast({
        title: "Loading Project Data",
        description: `Fetching project assignments for ${user.displayName || user.username}`,
        variant: "info",
      });
      
      try {
        // Project data should already be loaded by the UsersList component,
        // but this is a fallback to ensure it's loaded if not
        const userWithProjects = await userService.getUser(user.username, true, true);
        if (userWithProjects) {
          setSelectedUser(userWithProjects);
          
          if (userWithProjects.projectAssignments?.length) {
            toast({
              title: "Project Data Loaded",
              description: `Loaded ${userWithProjects.projectAssignments.length} project assignments`,
              variant: "success",
            });
          }
        }
      } catch (error) {
        console.error("Error loading project data:", error);
        toast({
          title: "Error Loading Projects",
          description: "Could not load project assignments",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle workstation selection to fetch machine output if needed
  const handleWorkstationSelect = async (workstation: Workstation) => {
    // If the workstation doesn't have machine output, fetch it
    if (!workstation.machineOutput && isFeatureEnabled(FEATURES.USE_RZTEST_API)) {
      try {
        console.log(`Fetching detailed machine info for ${workstation.machineName}`);
        
        // Get workstation with machine output
        const updatedWorkstation = await workstationService.getWorkstation(
          workstation.machineName,
          false, // Don't force refresh
          true // Include machine output
        );
        
        if (updatedWorkstation) {
          console.log(`Successfully fetched detailed info for ${workstation.machineName}`);
          setSelectedWorkstation(updatedWorkstation);
          
          // Notify the user
          toast({
            title: "Workstation Details Loaded",
            description: `Loaded machine data for ${workstation.machineName}`,
            variant: "success",
          });
          return;
        }
      } catch (error) {
        console.error(`Error fetching machine output for ${workstation.machineName}:`, error);
        // Continue with the workstation without machine output
        
        toast({
          title: "Error Loading Details",
          description: `Could not load detailed machine data for ${workstation.machineName}`,
          variant: "destructive",
        });
      }
    }
    
    // If we reach here, either we couldn't fetch machine output or it's already included
    setSelectedWorkstation(workstation);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">BUCK Resources</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Workstation Management System</p>
        </div>
        
        <nav className="flex-1 p-4">
          <Tabs 
            orientation="vertical"
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              const tabNames: Record<string, string> = {
                dashboard: "Dashboard",
                reports: "Reports",
                activity: "Activity Log",
                policies: "Policies"
              };
              toast({
                title: `Switched to ${tabNames[value]}`,
                variant: "info",
              });
            }}>
            <TabsList className="flex flex-col w-full space-y-1 bg-transparent p-0 h-auto">
              <TabsTrigger value="dashboard" className="flex items-center gap-3 justify-start w-full px-3 py-2">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-3 justify-start w-full px-3 py-2">
                <PieChart size={18} />
                <span>Reports</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-3 justify-start w-full px-3 py-2">
                <History size={18} />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-3 justify-start w-full px-3 py-2">
                <ShieldCheck size={18} />
                <span>Policies</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <Link 
              href="/details" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors duration-150 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
            >
              <Search size={18} />
              View Detailed Records
            </Link>
            
            <Link 
              href="/salt-workstations" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors duration-150 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
            >
              <Server size={18} />
              Salt Workstations View
            </Link>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Workstation Management</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activeTab === "dashboard" ? "Manage and assign workstations to users" : 
                activeTab === "reports" ? "View detailed usage reports and metrics" :
                activeTab === "activity" ? "Monitor recent workstation activities" :
                "Review and configure assignment policies"}
              </p>
            </div>
            
            {/* Data Source Toggles */}
            <div className="flex flex-col gap-2">
              <DataSourceToggle 
                type="okta"
                onToggle={handleOktaDataToggle}
                initialValue={isFeatureEnabled(FEATURES.USE_OKTA_DATA)}
                label="User Data:"
              />
              <DataSourceToggle 
                type="rztest"
                onToggle={handleRzTestApiToggle}
                initialValue={isFeatureEnabled(FEATURES.USE_RZTEST_API)}
                label="Windows/Linux Data:"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <DataSourceToggle 
                    type="jamf"
                    onToggle={handleJamfDataToggle}
                    initialValue={isFeatureEnabled(FEATURES.USE_JAMF_DATA)}
                    label="Mac Data:"
                  />
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast({
                        title: "Loading Mac Computers",
                        description: "Connecting to JAMF API...",
                        variant: "info",
                      });
                      
                      // First, ensure JAMF is enabled using the utility function
                      enableJamfData(true);
                      setUseJamfData(true);
                      
                      // Call the refresh endpoint
                      const response = await fetch('/api/jamf/refresh');
                      const data = await response.json();
                      
                      if (data.status === 'success') {
                        toast({
                          title: "Mac Computers Loaded",
                          description: `Found ${data.data.computerCount} Mac computers`,
                          variant: "success",
                        });
                        
                        // Trigger refresh of workstation list
                        const newWorkstationFilters = { ...workstationFilters };
                        setWorkstationFilters(newWorkstationFilters);
                      } else {
                        toast({
                          title: "Failed to Load Mac Data",
                          description: data.message || "Unknown error",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error('Error loading Mac data:', error);
                      toast({
                        title: "JAMF Error",
                        description: error instanceof Error ? error.message : "Failed to connect to JAMF",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="ml-2"
                >
                  <Laptop size={14} className="mr-1" />
                  Load Mac Computers
                </Button>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} className="hidden">
            <TabsContent value="dashboard" className="outline-none">
              {/* Main dashboard content */}
              <div className="flex flex-col gap-6 mb-8">
                {/* Top section with users and potential assignment panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Users Panel - Takes 2/3 of width on large screens */}
                  <Card variant="elevated" className="overflow-hidden lg:col-span-2">
                    <CardHeader withBorder className="bg-blue-50 dark:bg-blue-900/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 bg-blue-100 dark:bg-blue-800 p-2 rounded-md">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <CardTitle size="md">Users</CardTitle>
                        </div>
                        <Badge variant={selectedUser ? "info" : "secondary"} className="ml-auto">
                          {selectedUser ? "User Selected" : "No User Selected"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Browse and select users for workstation assignment
                      </CardDescription>
                    </CardHeader>
                    <CardContent padded={false}>
                      <UsersList 
                        onSelectUser={handleUserSelect} 
                        selectedUser={selectedUser}
                        filters={userFilters}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Assignment panel - shown when both a user and workstation are selected */}
                  {(selectedUser || selectedWorkstation) && (
                    <Card variant="elevated" className="lg:col-span-1 shadow-md border-2 border-blue-100 dark:border-blue-900/20">
                      <CardHeader withBorder className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                        <div className="flex items-center">
                          <div className="mr-2 bg-indigo-100 dark:bg-indigo-800 p-2 rounded-md">
                            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <CardTitle size="md">Assignment</CardTitle>
                        </div>
                        <CardDescription>
                          Manage workstation assignments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AssignmentPanel
                          selectedUser={selectedUser}
                          selectedWorkstation={selectedWorkstation}
                          onAssignmentComplete={handleAssignmentComplete}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Workstations section - full width */}
                <div className="grid grid-cols-1 gap-6">
                  <Card variant="elevated" className="overflow-hidden">
                    <CardHeader withBorder className="bg-purple-50 dark:bg-purple-900/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 bg-purple-100 dark:bg-purple-800 p-2 rounded-md">
                            <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <CardTitle size="md">Workstations</CardTitle>
                        </div>
                        <Badge variant={selectedWorkstation ? "info" : "secondary"} className="ml-auto">
                          {selectedWorkstation ? "Workstation Selected" : "No Workstation Selected"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Browse available workstations and view their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent padded={false}>
                      <WorkstationsList 
                        onSelectWorkstation={handleWorkstationSelect}
                        selectedWorkstation={selectedWorkstation}
                        filters={workstationFilters}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Workstation Detail section - shown when a workstation is selected */}
                  {selectedWorkstation && (
                    <Card variant="elevated" className="overflow-hidden shadow-md border-2 border-purple-100 dark:border-purple-900/20">
                      <CardHeader withBorder className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-2 bg-purple-100 dark:bg-purple-800 p-2 rounded-md">
                              <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                            </div>
                            <CardTitle size="md">Workstation Details</CardTitle>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedWorkstation(null)}
                            className="ml-auto"
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            Close
                          </Button>
                        </div>
                        <CardDescription>
                          Detailed information for the selected workstation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <WorkstationDetail workstation={selectedWorkstation} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card variant="elevated" className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2" withBorder>
                    <CardTitle size="sm">Utilization by Location</CardTitle>
                  </CardHeader>
                  <CardContent padded="md">
                    <div className="space-y-4">
                      {Object.entries(utilizationMetrics.byLocation).map(([location, percentage]) => (
                        <div key={location} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{location}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentage > 80 ? 'bg-green-500' : 
                                percentage > 50 ? 'bg-blue-500' : 
                                'bg-slate-400'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card variant="elevated" className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2" withBorder>
                    <CardTitle size="sm">Utilization by Tier</CardTitle>
                  </CardHeader>
                  <CardContent padded="md">
                    <div className="space-y-4">
                      {Object.entries(utilizationMetrics.byTier).map(([tier, percentage]) => (
                        <div key={tier} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{tier}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentage > 80 ? 'bg-red-500' : 
                                percentage > 50 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card variant="elevated" className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2" withBorder>
                    <CardTitle size="sm">Utilization by Department</CardTitle>
                  </CardHeader>
                  <CardContent padded="md">
                    <div className="space-y-3">
                      {Object.entries(utilizationMetrics.byDepartment).map(([dept, percentage]) => (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{dept}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-indigo-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card variant="elevated" className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2" withBorder>
                    <CardTitle size="sm">Utilization by Project</CardTitle>
                  </CardHeader>
                  <CardContent padded="md">
                    <div className="space-y-3">
                      {Object.entries(utilizationMetrics.byProject).map(([project, percentage]) => (
                        <div key={project} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{project}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-purple-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-4">
              <Card variant="elevated" className="shadow-lg">
                <CardHeader withBorder>
                  <div className="flex items-center">
                    <div className="mr-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                      <Activity className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <CardTitle size="md">Recent Activity</CardTitle>
                  </div>
                  <CardDescription>Recent workstation assignment activities and system events</CardDescription>
                </CardHeader>
                <CardContent padded="md">
                  <div className="space-y-6">
                    {auditLogEntries.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1.5 rounded-full 
                            ${entry.action === "Assigned" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" : 
                              entry.action === "Unassigned" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" : 
                              entry.action === "Status Change" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" : 
                              "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"}`}>
                            {entry.action === "Assigned" ? <Check className="h-3.5 w-3.5" /> : 
                              entry.action === "Unassigned" ? <X className="h-3.5 w-3.5" /> : 
                              entry.action === "Status Change" ? <Activity className="h-3.5 w-3.5" /> : 
                              <AlertTriangle className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-medium text-sm">{entry.action}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Intl.DateTimeFormat('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }).format(entry.timestamp)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm">{entry.details}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">by {entry.user}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="policies" className="mt-4">
              <Card variant="elevated" className="shadow-lg">
                <CardHeader withBorder>
                  <div className="flex items-center">
                    <div className="mr-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                      <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <CardTitle size="md">Workstation Policies</CardTitle>
                  </div>
                  <CardDescription>Active policies for workstation assignments</CardDescription>
                </CardHeader>
                <CardContent padded="md">
                  <div className="rounded-md border">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b">
                      <div className="grid grid-cols-4 font-medium text-sm">
                        <div>Policy Name</div>
                        <div>Type</div>
                        <div>Criteria</div>
                        <div>Applied To</div>
                      </div>
                    </div>
                    <div className="divide-y">
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="grid grid-cols-4 text-sm">
                          <div className="font-medium">NY_Security_Policy</div>
                          <div className="text-green-600 dark:text-green-400">Allowed</div>
                          <div>Location: NY, Clearance: Secret</div>
                          <div>OU=VFX,OU=Workstations,DC=studio,DC=local</div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="grid grid-cols-4 text-sm">
                          <div className="font-medium">LA_Security_Policy</div>
                          <div className="text-green-600 dark:text-green-400">Allowed</div>
                          <div>Location: LA, Clearance: Confidential</div>
                          <div>OU=Animation,OU=Workstations,DC=studio,DC=local</div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="grid grid-cols-4 text-sm">
                          <div className="font-medium">London_Hardware_Policy</div>
                          <div className="text-green-600 dark:text-green-400">Allowed</div>
                          <div>Location: London, Tier: high-end</div>
                          <div>OU=VFX,OU=Workstations,DC=studio,DC=local</div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="grid grid-cols-4 text-sm">
                          <div className="font-medium">Freelancer_Restriction</div>
                          <div className="text-red-600 dark:text-red-400">Disallowed</div>
                          <div>Role: Freelancer, Tier: high-end</div>
                          <div>All workstations</div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="grid grid-cols-4 text-sm">
                          <div className="font-medium">Executive_Access</div>
                          <div className="text-green-600 dark:text-green-400">Allowed</div>
                          <div>Role: Executive</div>
                          <div>OU=Executive,OU=Workstations,DC=studio,DC=local</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Dynamic content - reflects the active tab */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 mb-8">
              {/* Top section with users and potential assignment panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users Panel - Takes 2/3 of width on large screens */}
                <Card variant="elevated" className="overflow-hidden lg:col-span-2">
                  <CardHeader withBorder className="bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-2 bg-blue-100 dark:bg-blue-800 p-2 rounded-md">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <CardTitle size="md">Users</CardTitle>
                      </div>
                      <Badge variant={selectedUser ? "info" : "secondary"} className="ml-auto">
                        {selectedUser ? "User Selected" : "No User Selected"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Browse and select users for workstation assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent padded={false}>
                    <UsersList 
                      onSelectUser={handleUserSelect} 
                      selectedUser={selectedUser}
                      filters={userFilters}
                    />
                  </CardContent>
                </Card>
                
                {/* Assignment panel - shown when both a user and workstation are selected */}
                {(selectedUser || selectedWorkstation) && (
                  <Card variant="elevated" className="lg:col-span-1 shadow-md border-2 border-blue-100 dark:border-blue-900/20">
                    <CardHeader withBorder className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                      <div className="flex items-center">
                        <div className="mr-2 bg-indigo-100 dark:bg-indigo-800 p-2 rounded-md">
                          <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <CardTitle size="md">Assignment</CardTitle>
                      </div>
                      <CardDescription>
                        Manage workstation assignments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AssignmentPanel
                        selectedUser={selectedUser}
                        selectedWorkstation={selectedWorkstation}
                        onAssignmentComplete={handleAssignmentComplete}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Project Assignments section - shown when a user is selected */}
                {selectedUser && (
                  <div className="lg:col-span-3 mt-6">
                    <Card variant="elevated" className="overflow-hidden shadow-md border-2 border-indigo-100 dark:border-indigo-900/20">
                      <CardHeader withBorder className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-2 bg-indigo-100 dark:bg-indigo-800 p-2 rounded-md">
                              <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                              <CardTitle size="md">Deltek Project Assignments</CardTitle>
                              <CardDescription>
                                Project assignments for {selectedUser.displayName || selectedUser.username}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {selectedUser.projectAssignments?.length || 0} Projects
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <UserProjectsList user={selectedUser} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              
              {/* Workstations section - full width */}
              <div className="grid grid-cols-1 gap-6">
                <Card variant="elevated" className="overflow-hidden">
                  <CardHeader withBorder className="bg-purple-50 dark:bg-purple-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-2 bg-purple-100 dark:bg-purple-800 p-2 rounded-md">
                          <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                        </div>
                        <CardTitle size="md">Workstations</CardTitle>
                      </div>
                      <Badge variant={selectedWorkstation ? "info" : "secondary"} className="ml-auto">
                        {selectedWorkstation ? "Workstation Selected" : "No Workstation Selected"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Browse available workstations and view their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent padded={false}>
                    <WorkstationsList 
                      onSelectWorkstation={handleWorkstationSelect}
                      selectedWorkstation={selectedWorkstation}
                      filters={workstationFilters}
                    />
                  </CardContent>
                </Card>
                
                {/* Workstation Detail section - shown when a workstation is selected */}
                {selectedWorkstation && (
                  <Card variant="elevated" className="overflow-hidden shadow-md border-2 border-purple-100 dark:border-purple-900/20">
                    <CardHeader withBorder className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 bg-purple-100 dark:bg-purple-800 p-2 rounded-md">
                            <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <CardTitle size="md">Workstation Details</CardTitle>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedWorkstation(null)}
                          className="ml-auto"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Close
                        </Button>
                      </div>
                      <CardDescription>
                        Detailed information for the selected workstation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WorkstationDetail workstation={selectedWorkstation} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "reports" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card variant="elevated" className="shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2" withBorder>
                  <CardTitle size="sm">Utilization by Location</CardTitle>
                </CardHeader>
                <CardContent padded="md">
                  <div className="space-y-4">
                    {Object.entries(utilizationMetrics.byLocation).map(([location, percentage]) => (
                      <div key={location} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{location}</span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage > 80 ? 'bg-green-500' : 
                              percentage > 50 ? 'bg-blue-500' : 
                              'bg-slate-400'
                            }`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* More report cards */}
              {/* Add other report cards here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}