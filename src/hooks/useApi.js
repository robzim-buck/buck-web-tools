import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for API fetching using React Query
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Optional configuration
 * @param {Object} options.queryConfig - React Query config options
 * @param {boolean} options.baseUrl - Override default base URL
 * @param {Array} options.queryParams - Query parameters to append to URL
 * @param {Array} options.dependencies - Additional dependencies for the query key
 * @returns {Object} React Query result object
 */
export const useApiGet = (endpoint, options = {}) => {
  const {
    queryConfig = {},
    baseUrl = 'https://laxcoresrv.buck.local:8000',
    queryParams = {},
    dependencies = []
  } = options;

  // Build query string from params
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams).toString()
    : '';

  // Construct the URL
  const url = `${baseUrl}${endpoint}${queryString}`;

  // Create a stable query key from the endpoint and dependencies
  const queryKey = [endpoint, ...dependencies];
  if (Object.keys(queryParams).length > 0) {
    queryKey.push(queryParams);
  }

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
      }
    },
    ...queryConfig
  });
};

/**
 * Custom hook for protected API fetching using React Query
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} options - Optional configuration
 * @param {Object} options.queryConfig - React Query config options
 * @param {boolean} options.baseUrl - Override default base URL
 * @param {Array} options.queryParams - Query parameters to append to URL
 * @param {Array} options.dependencies - Additional dependencies for the query key
 * @returns {Object} React Query result object
 */
export const useProtectedApiGet = (endpoint, options = {}) => {
  const {
    queryConfig = {},
    baseUrl = 'https://laxcoresrv.buck.local:8000',
    queryParams = {},
    dependencies = []
  } = options;
  
  // Build query string from params
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams).toString()
    : '';

  // Construct the URL
  const url = `${baseUrl}${endpoint}${queryString}`;

  // Create a stable query key from the endpoint and dependencies
  const queryKey = [endpoint, ...dependencies];
  if (Object.keys(queryParams).length > 0) {
    queryKey.push(queryParams);
  }

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        console.log(`Protected API request to: ${url}`);
        const response = await fetch(url, {
          headers: {
            'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
          }
        });
        if (!response.ok) {
          console.error(`Error response from ${url}: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Protected API response from ${url}:`, data);
        console.log(`Response data type: ${typeof data}, is array: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Sample item:', data[0]);
        }
        return data;
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
      }
    },
    ...queryConfig
  });
};

/**
 * Custom hook for POST/PUT/DELETE operations using React Query
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Optional configuration
 * @param {string} options.method - HTTP method (POST, PUT, DELETE)
 * @param {Object} options.mutationConfig - React Query useMutation config
 * @param {string} options.baseUrl - Override default base URL
 * @param {Array} options.invalidateQueries - Queries to invalidate on success
 * @returns {Object} React Query mutation result object
 */
export const useApiMutation = (endpoint, options = {}) => {
  const {
    method = 'POST',
    mutationConfig = {},
    baseUrl = 'https://laxcoresrv.buck.local:8000',
    invalidateQueries = []
  } = options;

  const queryClient = useQueryClient();
  const url = `${baseUrl}${endpoint}`;

  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Some APIs may not return JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: query });
      });
    },
    ...mutationConfig
  });
};

/**
 * Custom hook for protected POST/PUT/DELETE operations using React Query
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Optional configuration
 * @param {string} options.method - HTTP method (POST, PUT, DELETE)
 * @param {Object} options.mutationConfig - React Query useMutation config
 * @param {string} options.baseUrl - Override default base URL
 * @param {Array} options.invalidateQueries - Queries to invalidate on success
 * @returns {Object} React Query mutation result object
 */
export const useProtectedApiMutation = (endpoint, options = {}) => {
  const {
    method = 'POST',
    mutationConfig = {},
    baseUrl = 'https://laxcoresrv.buck.local:8000',
    invalidateQueries = []
  } = options;

  const queryClient = useQueryClient();
  const url = `${baseUrl}${endpoint}`;

  return useMutation({
    mutationFn: async (data) => {
      // Support dynamic endpoint from data.endpoint
      let finalUrl = data.endpoint ? `${baseUrl}${data.endpoint}` : url;
      
      // Support query parameters from data.params
      if (data.params) {
        const queryString = new URLSearchParams(data.params).toString();
        finalUrl = `${finalUrl}?${queryString}`;
      }
      
      // Prepare body - exclude endpoint, params, and other metadata
      const { endpoint: _, params: __, ...bodyData } = data || {};
      const hasBody = Object.keys(bodyData).length > 0;
      
      console.log(`Protected API ${method} request to: ${finalUrl}`, hasBody ? bodyData : 'no body');
      const response = await fetch(finalUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        },
        body: (method !== 'GET' && hasBody) ? JSON.stringify(bodyData) : undefined,
      });

      if (!response.ok) {
        console.error(`Error response from ${finalUrl}: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Some APIs may not return JSON
      const contentType = response.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      
      console.log(`Protected API ${method} response from ${finalUrl}:`, result);
      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: query });
      });
    },
    ...mutationConfig
  });
};