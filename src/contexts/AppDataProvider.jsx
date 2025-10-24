import React, { createContext, useContext } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import { useQueries } from "@tanstack/react-query";

// Create context
const AppDataContext = createContext(null);

/**
 * Custom hook to use the AppDataContext
 * @returns {Object} Context value with all app data
 */
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

/**
 * AppDataProvider component that fetches and provides all common application data
 * This component pre-fetches data in the background when the application loads
 */
export const AppDataProvider = ({ children }) => {
  // Common query configuration
  const commonQueryConfig = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  };

  // ========== GOOGLE USERS ==========
  const googleStaffUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Staff' },
    queryConfig: commonQueryConfig,
    dependencies: ['staff']
  });

  const googleFreelanceUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Freelance' },
    queryConfig: commonQueryConfig,
    dependencies: ['freelance']
  });

  // ========== LDAP USERS ========== (NOT PRE-FETCHED - endpoint may not exist)
  // LDAP users are not pre-fetched - components should fetch directly if needed

  // ========== LDAP GROUPS ========== (NOT PRE-FETCHED - endpoint may not exist)
  // LDAP groups are not pre-fetched - components should fetch directly if needed

  // ========== PARSEC USERS ==========
  const [parsecUsersQuery] = useQueries({
    queries: [
      {
        queryKey: ["parsecUsers"],
        queryFn: () => fetch("https://laxcoresrv.buck.local:8000/parsec/parsecinfo/category?_category=members", {
          headers: {
            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
            "Content-type": "application/json"
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // ========== JAMF MACHINE INFO ==========
  const [jamfMachineInfoQuery] = useQueries({
    queries: [
      {
        queryKey: ["jamf_machine_info"],
        queryFn: () => fetch("https://laxcoresrv.buck.local:8000/mongo/jamf_computers_from_mongo?count=999", {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // ========== ADOBE USERS ========== (NOT PRE-FETCHED)
  // Adobe data is not pre-fetched - components should fetch directly

  // ========== OKTA GROUPS ==========
  const oktaGroupsQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'groups', _att: 'type', _comparison: 'eq', _match: 'OKTA_GROUP' },
    queryConfig: commonQueryConfig
  });

  // ========== OKTA USERS ========== (ACTIVE ONLY)
  const oktaUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: {
      _category: 'users',
      _att: 'status',
      _comparison: 'eq',
      _match: 'ACTIVE'
    },
    queryConfig: commonQueryConfig
  });

  // ========== OKTA LOCATIONS ========== (NOT PRE-FETCHED - causes 422 errors)
  // Okta locations are not pre-fetched - components should fetch directly if needed

  // ========== VMWARE HOSTS ========== (NOT PRE-FETCHED - 404 error)
  // VMware hosts are not pre-fetched - components should fetch directly if needed

  // ========== NAS PROJECTS ========== (NOT PRE-FETCHED - 404 error)
  // NAS projects are not pre-fetched - components should fetch directly if needed

  // ========== COMPOSITE MACHINE INFO ========== (NOT PRE-FETCHED - 404 error)
  // Composite machine info is not pre-fetched - components should fetch directly if needed

  // ========== LDAP RAW MACHINE INFO ==========
  const ldapRawMachineInfoQuery = useProtectedApiGet('/buckldap_raw_machineinfo', {
    queryConfig: commonQueryConfig
  });

  // ========== LDAP MACHINE INFO (for LDAPMachineInfo component) ==========
  const ldapBasicMachineInfoQuery = useProtectedApiGet('/buckldap_machineinfo', {
    queryConfig: commonQueryConfig
  });

  // ========== COMPOSITE MACHINE INFO DATA SOURCES ==========
  // These are needed for CompositeMachineInfo component

  // Parsec Report
  const [parsecReportQuery] = useQueries({
    queries: [
      {
        queryKey: ["parsecReport"],
        queryFn: () => fetch("https://laxcoresrv.buck.local:8000/parsec/parsecreport", {
          headers: {
            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
            "Content-type": "application/json"
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // LDAP Machine Info (for CompositeMachineInfo)
  const [ldapMachineInfoQuery] = useQueries({
    queries: [
      {
        queryKey: ["ldapMachineInfo"],
        queryFn: () => fetch('https://laxcoresrv.buck.local:8000/buckldap/category/att/match/attributes?_category=computer', {
          headers: {
            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo"
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // Salt Machine Info
  const [saltMachineInfoQuery] = useQueries({
    queries: [
      {
        queryKey: ["saltMachineInfo"],
        queryFn: () => fetch('https://laxcoresrv.buck.local:8000/salt/machine_info', {
          headers: {
            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo"
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // Salt Ping Info
  const [saltPingInfoQuery] = useQueries({
    queries: [
      {
        queryKey: ["saltPingInfo"],
        queryFn: () => fetch('https://laxcoresrv.buck.local:8000/salt/ping', {
          method: 'GET',
          headers: {
            "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo"
          }
        }).then((res) => res.json()),
        ...commonQueryConfig
      }
    ]
  });

  // ========== ADOBE GROUPS ========== (NOT PRE-FETCHED)
  // Adobe data is not pre-fetched - components should fetch directly

  // ========== GOOGLE USERS (COMBINED) ==========
  // Combine Google staff and freelance users into a single dataset
  const googleUsers = React.useMemo(() => {
    if (googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading) {
      return [];
    }

    if (googleStaffUsersQuery.error || googleFreelanceUsersQuery.error) {
      console.error("Error fetching Google users");
      return [];
    }

    const staffData = Array.isArray(googleStaffUsersQuery.data) ? googleStaffUsersQuery.data : [];
    const freelanceData = Array.isArray(googleFreelanceUsersQuery.data) ? googleFreelanceUsersQuery.data : [];

    return [...staffData, ...freelanceData];
  }, [googleStaffUsersQuery.data, googleFreelanceUsersQuery.data, googleStaffUsersQuery.isLoading,
      googleFreelanceUsersQuery.isLoading, googleStaffUsersQuery.error, googleFreelanceUsersQuery.error]);

  // Create Google user lookup by email (for cross-referencing with other services)
  const googleUsersByEmail = React.useMemo(() => {
    if (!googleUsers.length) return {};

    const emailMap = {};
    googleUsers.forEach(user => {
      if (user?.primaryEmail) {
        emailMap[user.primaryEmail.toLowerCase()] = user;

        // Also store by username for flexible matching
        const username = user.primaryEmail.split('@')[0].toLowerCase();
        if (username) {
          emailMap[username] = user;
        }
      }
    });

    return emailMap;
  }, [googleUsers]);

  // Determine overall loading state
  const isLoading = googleStaffUsersQuery.isLoading ||
                    googleFreelanceUsersQuery.isLoading ||
                    parsecUsersQuery.isLoading ||
                    jamfMachineInfoQuery.isLoading ||
                    oktaGroupsQuery.isLoading ||
                    oktaUsersQuery.isLoading ||
                    ldapRawMachineInfoQuery.isLoading ||
                    ldapBasicMachineInfoQuery.isLoading ||
                    parsecReportQuery.isLoading ||
                    ldapMachineInfoQuery.isLoading ||
                    saltMachineInfoQuery.isLoading ||
                    saltPingInfoQuery.isLoading;

  // Context value - provide all data and loading states
  const contextValue = {
    // Raw query objects (for refetching, error states, etc.)
    queries: {
      googleStaff: googleStaffUsersQuery,
      googleFreelance: googleFreelanceUsersQuery,
      parsecUsers: parsecUsersQuery,
      jamfMachineInfo: jamfMachineInfoQuery,
      oktaGroups: oktaGroupsQuery,
      oktaUsers: oktaUsersQuery,
      ldapRawMachineInfo: ldapRawMachineInfoQuery,
      ldapBasicMachineInfo: ldapBasicMachineInfoQuery,
      parsecReport: parsecReportQuery,
      ldapMachineInfo: ldapMachineInfoQuery,
      saltMachineInfo: saltMachineInfoQuery,
      saltPingInfo: saltPingInfoQuery,
    },

    // Processed data
    data: {
      googleUsers,
      googleUsersByEmail,
      parsecUsers: parsecUsersQuery.data,
      jamfMachineInfo: jamfMachineInfoQuery.data,
      oktaGroups: oktaGroupsQuery.data,
      oktaUsers: oktaUsersQuery.data,
      ldapRawMachineInfo: ldapRawMachineInfoQuery.data,
      ldapBasicMachineInfo: ldapBasicMachineInfoQuery.data,
      parsecReport: parsecReportQuery.data,
      ldapMachineInfo: ldapMachineInfoQuery.data,
      saltMachineInfo: saltMachineInfoQuery.data,
      saltPingInfo: saltPingInfoQuery.data,
    },

    // Loading states
    isLoading,

    // Helper to check if specific data is loading
    isDataLoading: (dataKey) => {
      const queryMap = {
        'googleUsers': googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading,
        'parsecUsers': parsecUsersQuery.isLoading,
        'jamfMachineInfo': jamfMachineInfoQuery.isLoading,
        'oktaGroups': oktaGroupsQuery.isLoading,
        'oktaUsers': oktaUsersQuery.isLoading,
        'ldapRawMachineInfo': ldapRawMachineInfoQuery.isLoading,
        'ldapBasicMachineInfo': ldapBasicMachineInfoQuery.isLoading,
        'parsecReport': parsecReportQuery.isLoading,
        'ldapMachineInfo': ldapMachineInfoQuery.isLoading,
        'saltMachineInfo': saltMachineInfoQuery.isLoading,
        'saltPingInfo': saltPingInfoQuery.isLoading,
      };
      return queryMap[dataKey] || false;
    }
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataProvider;
