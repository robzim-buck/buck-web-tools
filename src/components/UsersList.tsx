"use client";

import { useState, useEffect } from "react";
import { User, UserFilters } from "@/app/types";
import { userService } from "@/app/services/user-service";
import { oktaService } from "@/app/services/okta-service";
import { buckApiService } from "@/app/services/buck-api-service";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import { isFeatureEnabled, FEATURES } from "@/app/lib/utils";
import { filterOptions } from "@/app/lib/filter-options";
import {
  User as UserIcon,
  Users,
  AlertCircle,
  Search,
  Filter,
  RefreshCcw,
  Building2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Shield,
  UserPlus,
  UserMinus,
  Edit,
  MoreHorizontal,
  Info,
  X
} from "lucide-react";
import { FilterDropdown } from "@/app/components/ui/filter-dropdown";
import {
  QuickActions,
  QuickActionsContent,
  QuickActionsItem,
  QuickActionsSeparator,
  QuickActionsTrigger,
} from "@/app/components/ui/quick-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

// Import mock data
import { mockUsers } from "@/app/mock/data";

interface UsersListProps {
  onSelectUser: (user: User) => void;
  selectedUser?: User | null;
  filters?: UserFilters;
}

export function UsersList({
  onSelectUser,
  selectedUser,
  filters = {},
}: UsersListProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(filters);
  const pageSize = 10; // Define pageSize at component level for reuse

  // Debug function to dump the current applied filters
  const dumpFilterState = () => {
    console.log('Current filters state:');
    console.log('- department:', appliedFilters.department || '(none)');
    console.log('- location:', appliedFilters.location || '(none)');
    console.log('- status:', appliedFilters.status || '(none)');
    console.log('- role:', appliedFilters.role || '(none)');
    
    // Look for users matching these exact criteria
    const exactMatches = mockUsers.filter(user => {
      let departmentMatch = !appliedFilters.department || user.department === appliedFilters.department;
      
      let locationMatch = !appliedFilters.location || user.location === appliedFilters.location;
      if (appliedFilters.location === 'BGA') {
        locationMatch = user.location === 'BGA' || user.location === 'YVR' || user.location === 'Giant Ant (Vancouver)';
      }
      
      let statusMatch = !appliedFilters.status || user.status.toUpperCase() === appliedFilters.status.toUpperCase();
      let roleMatch = !appliedFilters.role || user.role === appliedFilters.role;
      
      return departmentMatch && locationMatch && statusMatch && roleMatch;
    });
    
    console.log(`Users matching ALL current filters: ${exactMatches.length}`);
    if (exactMatches.length > 0) {
      exactMatches.forEach(user => {
        console.log(` - ${user.username}: department=${user.department}, location=${user.location}, status=${user.status}, role=${user.role}`);
      });
    }
  };
  
  // Function to load users data
  const loadUsers = async () => {
    setLoading(true);
    
    // Log for debugging - more detailed information
    console.log('=====================================================');
    console.log('UsersList: Loading users - DEBUG LOGS');
    console.log('Applied filters (detailed):', JSON.stringify(appliedFilters, null, 2));
    console.log('Filters have values:', Object.values(appliedFilters).some(v => v));
    console.log('UsersList: Raw mock data available:', mockUsers.length > 0);
    console.log('UsersList: Sample mock users with these filters:');
    
    if (mockUsers.length > 0) {
      // Get relevant sample users based on active filters
      const relevantUsers = mockUsers.filter(user => {
        if (appliedFilters.department && user.department === appliedFilters.department) return true;
        if (appliedFilters.location && 
           (user.location === appliedFilters.location || 
            (appliedFilters.location === 'BGA' && 
             (user.location === 'YVR' || user.location === 'Giant Ant (Vancouver)')))) return true;
        if (appliedFilters.status && user.status.toUpperCase() === appliedFilters.status.toUpperCase()) return true;
        return false;
      }).slice(0, 3);
      
      console.log('Sample users matching at least one filter criterion:');
      relevantUsers.forEach(user => {
        console.log(` - ${user.username}: department=${user.department}, location=${user.location}, status=${user.status}`);
      });
    }
    
    try {
      // Determine data source
      const useOkta = isFeatureEnabled('USE_OKTA_DATA');
      console.log('UsersList: Using Okta:', useOkta);
      
      let usersData: User[] = [];
      
      // Log applied filters for debugging
      console.log('Applied filters:', JSON.stringify(appliedFilters));
      
      if (useOkta) {
        // Use Okta data
        try {
          // Pass true for includeProjects to get project assignments from Deltek
          const result = await userService.getUsers(page, pageSize, appliedFilters, true, true);
          usersData = result.data;
          
          // Log project assignment information for debugging
          const usersWithProjects = usersData.filter(u => u.projectAssignments && u.projectAssignments.length > 0);
          console.log(`UsersList: Loaded ${usersData.length} users, ${usersWithProjects.length} with project assignments`);
          if (usersWithProjects.length > 0) {
            console.log('UsersList: Sample project data:', usersWithProjects[0].projectAssignments?.slice(0, 2));
          }
          
          console.log('UsersList: Okta data loaded:', usersData.length);
          console.log('UsersList: Okta pagination info:', {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total
          });
          
          // Make sure we're not applying pagination twice
          if (result.total > 0) {
            // If we already have paginated data from the service,
            // update the total pages without additional pagination
            setTotalPages(Math.ceil(result.total / pageSize));
            setUsers(usersData);
            setError(null);
            
            toast({
              title: "Okta Users Loaded",
              description: `Loaded ${usersData.length} users (page ${page} of ${Math.ceil(result.total / pageSize)})`,
              variant: "info",
            });
            
            setLoading(false);
            return; // Skip additional filtering and pagination
          }
        } catch (oktaError) {
          console.error('Error loading Okta data:', oktaError);
          toast({
            title: "Okta Data Failed",
            description: "Failed to load from Okta API, using mock data instead",
            variant: "destructive",
          });
          // Fall back to mock data on Okta error
          usersData = [...mockUsers];
        }
      } else {
        // Use mock data directly
        usersData = [...mockUsers];
        console.log('UsersList: Using mock data directly, initial count:', usersData.length);
        
        // Log sample data for debugging
        if (usersData.length > 0) {
          console.log('Sample user data:', JSON.stringify(usersData[0]));
        }
      }
      
      // Apply search filter if present
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        usersData = usersData.filter(
          user => 
            user.username.toLowerCase().includes(term) ||
            (user.displayName?.toLowerCase().includes(term) ?? false) ||
            user.department.toLowerCase().includes(term) ||
            user.role.toLowerCase().includes(term) ||
            user.location.toLowerCase().includes(term) ||
            (user.projectAssignment?.toLowerCase().includes(term) ?? false) ||
            // Search in project assignments too
            (user.projectAssignments?.some(project => 
              project.projectName.toLowerCase().includes(term) || 
              project.client.toLowerCase().includes(term) ||
              project.role.toLowerCase().includes(term)
            ) ?? false)
        );
      }
      
      // Dump the filter state before applying filters
      dumpFilterState();
      
      // Apply all filters in a single pass to see the actual dataset
      console.log('Starting to apply all filters to', usersData.length, 'users');
      
      const originalCount = usersData.length;
      usersData = usersData.filter(user => {
        // Log filter application for debugging
        if (FEATURES.DEBUG_MODE && Object.keys(appliedFilters).some(k => appliedFilters[k as keyof typeof appliedFilters])) {
          console.log(`Filtering user: ${user.username}, department: ${user.department}, location: ${user.location}, role: ${user.role}, status: ${user.status}`);
        }
        
        // Department filter
        if (appliedFilters.department && user.department !== appliedFilters.department) {
          if (FEATURES.DEBUG_MODE) console.log(`  Failed department filter: ${user.department} !== ${appliedFilters.department}`);
          return false;
        }
        
        // Location filter - with special handling for Giant Ant locations
        if (appliedFilters.location) {
          if (appliedFilters.location === "BGA") {
            // For Giant Ant, match any of the Giant Ant location codes
            if (user.location !== "BGA" && 
                user.location !== "YVR" && 
                user.location !== "Giant Ant (Vancouver)") {
              if (FEATURES.DEBUG_MODE) console.log(`  Failed Giant Ant location filter: ${user.location} not in [BGA, YVR, Giant Ant (Vancouver)]`);
              return false;
            }
          } else if (user.location !== appliedFilters.location) {
            if (FEATURES.DEBUG_MODE) console.log(`  Failed location filter: ${user.location} !== ${appliedFilters.location}`);
            return false;
          }
        }
        
        // Role filter
        if (appliedFilters.role && user.role !== appliedFilters.role) {
          if (FEATURES.DEBUG_MODE) console.log(`  Failed role filter: ${user.role} !== ${appliedFilters.role}`);
          return false;
        }
        
        // Status filter - case insensitive and handle special cases
        if (appliedFilters.status) {
          // Special case mapping - add very detailed debug logging
          const normalizedUserStatus = user.status.toUpperCase();
          const normalizedFilterStatus = appliedFilters.status.toUpperCase();
          
          // Log the exact values for debugging
          if (FEATURES.DEBUG_MODE) {
            console.log(`  Status comparison (exact values):`);
            console.log(`    User status: "${user.status}" (type: ${typeof user.status})`);
            console.log(`    Filter status: "${appliedFilters.status}" (type: ${typeof appliedFilters.status})`);
            console.log(`    After normalization: "${normalizedUserStatus}" vs "${normalizedFilterStatus}"`);
            console.log(`    Character codes for user status: ${Array.from(user.status).map(c => c.charCodeAt(0)).join(', ')}`);
            console.log(`    Character codes for filter status: ${Array.from(appliedFilters.status).map(c => c.charCodeAt(0)).join(', ')}`);
            console.log(`    Equality check: ${normalizedUserStatus === normalizedFilterStatus}`);
          }
          
          const matchResult = normalizedUserStatus === normalizedFilterStatus;
          if (!matchResult) {
            if (FEATURES.DEBUG_MODE) console.log(`  Failed status filter: "${user.status}" !== "${appliedFilters.status}"`);
            return false;
          }
        }
        
        // If we got here, this user passes all filters
        if (FEATURES.DEBUG_MODE && Object.keys(appliedFilters).some(k => appliedFilters[k as keyof typeof appliedFilters])) {
          console.log(`  PASSED all filters!`);
        }
        return true;
      });
      
      // Log detailed filter results
      console.log(`Applied all filters: ${originalCount} → ${usersData.length} users`);
      
      // Log what filters were actually applied
      const appliedFilterNames = Object.entries(appliedFilters)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}:${value}`)
        .join(', ');
      
      console.log('Active filters:', appliedFilterNames || 'None');
      
      // Log the remaining users for debugging
      if (usersData.length > 0 && usersData.length <= 10) {
        console.log('Matching users:', usersData.map(u => 
          `${u.username} (${u.location}, ${u.status})`).join(', '));
      }
      
      // Paginate
      const startIndex = (page - 1) * pageSize;
      const paginatedUsers = usersData.slice(startIndex, startIndex + pageSize);
      
      console.log(`UsersList: Final data set size: ${usersData.length}, paginated: ${paginatedUsers.length}`);
      
      // Calculate total pages and add debug info
      const calculatedTotalPages = Math.ceil(usersData.length / pageSize);
      console.log('Pagination calculation:', 
        `${usersData.length} total users / ${pageSize} per page = ${calculatedTotalPages} pages`);
      
      // Update state
      setUsers(paginatedUsers);
      setTotalPages(calculatedTotalPages);
      setError(null);
      
      // Show toast notification
      toast({
        title: useOkta ? "Okta Users Loaded" : "Mock Users Loaded",
        description: `Loaded ${paginatedUsers.length} users (page ${page} of ${Math.ceil(usersData.length / pageSize)})`,
        variant: "info",
      });
    } catch (err) {
      console.error('Failed to load any user data:', err);
      setError("Failed to load users");
      setUsers([]);
      
      toast({
        title: "Error",
        description: "Failed to load any user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when page, search term, or filters change
  useEffect(() => {
    loadUsers();
  }, [page, searchTerm, appliedFilters]);

  // Update filters when prop changes
  useEffect(() => {
    console.log('=====================================================');
    console.log('Filters changed from props:', JSON.stringify(filters, null, 2));
    setAppliedFilters(filters);
    
    // Run the filter analysis immediately
    setTimeout(() => {
      console.log('Running filter state dump after filter update');
      dumpFilterState();
    }, 0);
    
    // Analyze available users matching each filter
    if (Object.keys(filters).some(k => filters[k as keyof typeof filters])) {
      Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;
        
        if (key === 'department') {
          const matchingUsers = mockUsers.filter(u => u.department === value);
          console.log(`Users with department=${value}:`, matchingUsers.length);
          console.log('Department matching users:', matchingUsers.map(u => u.username).join(', '));
        }
        
        if (key === 'location') {
          let matchingUsers;
          if (value === 'BGA') {
            matchingUsers = mockUsers.filter(u => 
              u.location === 'BGA' || 
              u.location === 'YVR' || 
              u.location === 'Giant Ant (Vancouver)');
          } else {
            matchingUsers = mockUsers.filter(u => u.location === value);
          }
          console.log(`Users with location=${value}:`, matchingUsers.length);
          console.log('Location matching users:', matchingUsers.map(u => u.username).join(', '));
        }
        
        if (key === 'status') {
          const matchingUsers = mockUsers.filter(u => u.status.toUpperCase() === value.toUpperCase());
          console.log(`Users with status=${value}:`, matchingUsers.length);
          console.log('Status matching users:', matchingUsers.map(u => u.username).join(', '));
        }
      });
    }
  }, [filters]);
  

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "on-project":
        return "info";
      default:
        return "secondary";
    }
  };

  // Get security clearance badge
  const getClearanceBadge = (clearance: string) => {
    switch (clearance) {
      case "Top Secret":
        return <Badge variant="destructive">{clearance}</Badge>;
      case "Secret":
        return <Badge variant="warning">{clearance}</Badge>;
      case "Confidential":
        return <Badge variant="secondary">{clearance}</Badge>;
      default:
        return <Badge variant="outline">{clearance}</Badge>;
    }
  };

  return (
    <div className="rounded-lg border shadow-sm bg-white dark:bg-slate-900">
      <div className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-slate-50 dark:bg-slate-800 border-b">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Users</h2>
            {/* Data source indicator */}
            {FEATURES.USE_OKTA_DATA ? (
              <Badge variant="success" className="text-xs">Okta API</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Mock Data</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Browse and select users for workstation assignment</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="h-10 rounded-md border border-slate-300 bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => loadUsers()}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500 mr-1">
          <Filter size={16} className="text-slate-400" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <FilterDropdown
            label="Department"
            options={filterOptions.departments}
            value={appliedFilters.department || ""}
            onChange={(value) => {
              console.log('Department filter changed:', value);
              
              // Create a new filter object
              const newFilters = {...appliedFilters};
              if (value === '') {
                delete newFilters.department; // Remove the property entirely if empty
              } else {
                newFilters.department = value;
              }
              
              setAppliedFilters(newFilters);
            }}
            placeholder="All Departments"
            className="w-44"
          />
          
          <FilterDropdown
            label="Location"
            options={filterOptions.locations}
            value={appliedFilters.location || ""}
            onChange={(value) => {
              console.log('Location filter changed:', value);
              
              // Create a new filter object
              const newFilters = {...appliedFilters};
              if (value === '') {
                delete newFilters.location; // Remove the property entirely if empty
              } else {
                newFilters.location = value;
              }
              
              setAppliedFilters(newFilters);
            }}
            placeholder="All Locations"
            className="w-44"
          />
          
          <FilterDropdown
            label="Status"
            options={filterOptions.statuses}
            value={appliedFilters.status || ""}
            onChange={(value) => {
              // Log the change in detail
              console.log('Status filter changed:');
              console.log('  Old value:', JSON.stringify(appliedFilters.status));
              console.log('  New value:', JSON.stringify(value));
              console.log('  Value type:', typeof value);
              console.log('  Empty check:', value === '');
              console.log('  Character codes:', Array.from(value || '').map(c => c.charCodeAt(0)).join(', '));
              
              // Create a new filter object instead of modifying existing
              const newFilters = {...appliedFilters};
              if (value === '') {
                delete newFilters.status; // Remove the property entirely if empty
              } else {
                newFilters.status = value;
              }
              
              console.log('  New filters object:', JSON.stringify(newFilters, null, 2));
              setAppliedFilters(newFilters);
            }}
            placeholder="All Status"
            className="w-40"
          />
          
          <FilterDropdown
            label="Role"
            options={filterOptions.roles}
            value={appliedFilters.role || ""}
            onChange={(value) => {
              console.log('Role filter changed:', value);
              
              // Create a new filter object
              const newFilters = {...appliedFilters};
              if (value === '') {
                delete newFilters.role; // Remove the property entirely if empty
              } else {
                newFilters.role = value;
              }
              
              setAppliedFilters(newFilters);
            }}
            placeholder="All Roles"
            className="w-44"
          />
        </div>
        
        {Object.keys(appliedFilters).some(k => appliedFilters[k as keyof typeof appliedFilters]) && (
          <Button
            variant="outline"
            size="sm"
            className="text-slate-500 ml-auto"
            onClick={() => {
              console.log('Clearing all filters');
              // Create a completely new empty object
              setAppliedFilters({});
              dumpFilterState(); // Log the current state after clearing
              
              toast({
                title: "Filters Cleared",
                description: "All user filters have been reset",
                variant: "info",
              });
            }}
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear All
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 flex items-center gap-2 border-b">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clearance</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow
                      key={user.username}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedUser?.username === user.username ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                      onClick={() => {
                        onSelectUser(user);
                        toast({
                          title: "User Selected",
                          description: `${user.displayName || user.username} (${user.department})`,
                          variant: user.status.toLowerCase() === "active" ? "success" : 
                                   user.status.toLowerCase() === "on-project" ? "info" : "default",
                        });
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-full">
                            <UserIcon size={16} className="text-blue-600 dark:text-blue-200" />
                          </div>
                          {user.displayName || user.username}
                        </div>
                        {user.displayName && (
                          <div className="text-xs text-slate-500 mt-0.5 ml-8">
                            {user.username}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-1.5">
                        <Building2 size={16} className="text-slate-400" />
                        {user.department}
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        {user.location}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {getClearanceBadge(user.securityClearance)}
                      </TableCell>
                      <TableCell>
                        {user.projectAssignments && user.projectAssignments.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Briefcase size={16} className="text-slate-400" />
                            <div>
                              <div className="flex items-center gap-1">
                                {user.projectAssignments[0].projectName}
                                {user.projectAssignments.length > 1 && (
                                  <Badge variant="outline" className="ml-1 text-xs" title={user.projectAssignments.map(p => p.projectName).join(", ")}>
                                    +{user.projectAssignments.length - 1}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                {user.projectAssignments[0].client}
                                {/* Show if the project has multiple Deltek IDs */}
                                {user.projectAssignments.some(p => p.deltekId !== user.projectAssignments[0].deltekId) && (
                                  <Badge variant="secondary" className="text-xs py-0 h-4" title="User has multiple Deltek identities">
                                    Multiple IDs
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : user.projectAssignment ? (
                          <div className="flex items-center gap-1.5">
                            <Briefcase size={16} className="text-slate-400" />
                            {user.projectAssignment}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <QuickActions>
                          <QuickActionsTrigger>
                            <MoreHorizontal className="h-4 w-4" />
                          </QuickActionsTrigger>
                          <QuickActionsContent align="end">
                            <QuickActionsItem 
                              onClick={() => {
                                toast({
                                  title: "View User Details",
                                  description: `Viewing details for ${user.username}`,
                                  variant: "info",
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Info className="h-4 w-4" />
                              <span>View Details</span>
                            </QuickActionsItem>
                            
                            <QuickActionsItem 
                              onClick={() => {
                                toast({
                                  title: "Edit User",
                                  description: `Editing user ${user.username}`,
                                  variant: "info",
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit User</span>
                            </QuickActionsItem>
                            
                            <QuickActionsItem 
                              onClick={() => {
                                toast({
                                  title: "Contact User",
                                  description: `Contact info for ${user.username}`,
                                  variant: "info",
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              <span>Contact User</span>
                            </QuickActionsItem>
                            
                            {user.projectAssignments && user.projectAssignments.length > 0 && (
                              <QuickActionsItem 
                                onClick={() => {
                                  // Group projects by Deltek ID to show multiple identities clearly
                                  const deltekIds = [...new Set(user.projectAssignments?.map(p => p.deltekId))];
                                  const hasMultipleIds = deltekIds.length > 1;
                                  
                                  let message = "";
                                  
                                  if (hasMultipleIds) {
                                    message = deltekIds.map(id => {
                                      const idProjects = user.projectAssignments?.filter(p => p.deltekId === id);
                                      return `Deltek ID ${id}: ${idProjects?.map(p => p.projectName).join(", ")}`;
                                    }).join("\n");
                                  } else {
                                    message = `Projects: ${user.projectAssignments?.map(p => p.projectName).join(", ")}`;
                                  }
                                  
                                  toast({
                                    title: hasMultipleIds ? 
                                      `Project Assignments (${deltekIds.length} Deltek IDs)` : 
                                      "Project Assignments",
                                    description: message,
                                    variant: "info",
                                  });
                                }}
                                className="flex items-center gap-2"
                              >
                                <Briefcase className="h-4 w-4" />
                                <span>View Project Details</span>
                              </QuickActionsItem>
                            )}
                            
                            <QuickActionsSeparator />
                            
                            {user.status.toLowerCase() === "active" ? (
                              <QuickActionsItem 
                                onClick={() => {
                                  toast({
                                    title: "Assign to Project",
                                    description: `${user.username} is now ready to be assigned to a project`,
                                    variant: "success",
                                  });
                                }}
                                className="flex items-center gap-2"
                              >
                                <Briefcase className="h-4 w-4" />
                                <span>Assign to Project</span>
                              </QuickActionsItem>
                            ) : (
                              <QuickActionsItem 
                                onClick={() => {
                                  toast({
                                    title: "Mark as Active",
                                    description: `${user.username} status changed to Active`,
                                    variant: "success",
                                  });
                                }}
                                className="flex items-center gap-2"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span>Mark as Active</span>
                              </QuickActionsItem>
                            )}
                            
                            <QuickActionsItem 
                              onClick={() => {
                                toast({
                                  title: "Update Security Clearance",
                                  description: `Security clearance for ${user.username} updated`,
                                  variant: "warning",
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Update Clearance</span>
                            </QuickActionsItem>
                          </QuickActionsContent>
                        </QuickActions>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t">
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages > 0 ? totalPages : 1}
              {FEATURES.DEBUG_MODE && (
                <span className="ml-2 text-xs text-slate-400">
                  ({users.length} shown of {totalPages * pageSize} total)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={page > 1 ? "default" : "outline"}
                size="sm"
                className={page > 1 ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                onClick={() => {
                  console.log('Going to previous page:', page, '->', Math.max(1, page - 1));
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant={page < totalPages ? "default" : "outline"}
                size="sm"
                className={page < totalPages ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                onClick={() => {
                  console.log('Going to next page:', page, '->', (page < totalPages ? page + 1 : page));
                  console.log('Total pages:', totalPages);
                  setPage((p) => (p < totalPages ? p + 1 : p));
                }}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}