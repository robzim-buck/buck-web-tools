import { useState, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, TextField, InputAdornment,
  Chip, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQueryClient } from '@tanstack/react-query';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import PersonIcon from '@mui/icons-material/Person';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import DomainIcon from '@mui/icons-material/Domain';
import ShortTextIcon from '@mui/icons-material/ShortText';
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProtectedApiGet } from '../hooks/useApi';

export default function LicenseExploration({ name = "License Exploration" }) {
  // Filter states
  const [emailFilter, setEmailFilter] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // Anomaly dialogs state
  const [duplicatesDialogOpen, setDuplicatesDialogOpen] = useState(false);
  const [expiredActiveDialogOpen, setExpiredActiveDialogOpen] = useState(false);
  const [heavyUsersDialogOpen, setHeavyUsersDialogOpen] = useState(false);
  const [bulkIssuanceDialogOpen, setBulkIssuanceDialogOpen] = useState(false);
  const [frequentRenewersDialogOpen, setFrequentRenewersDialogOpen] = useState(false);
  const [unusualDomainsDialogOpen, setUnusualDomainsDialogOpen] = useState(false);
  const [shortDurationDialogOpen, setShortDurationDialogOpen] = useState(false);
  const [figmaRedundancyDialogOpen, setFigmaRedundancyDialogOpen] = useState(false);

  // License release states
  const [releasingLicenses, setReleasingLicenses] = useState(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [anomalyPaginationModel, setAnomalyPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const queryClient = useQueryClient();

  // Fetch historical license info which includes released licenses
  // Using a wide date range to get all historical data
  const allLicenseInfoQuery = useProtectedApiGet('/licenses/self_service_license_info/2024-01-01/2025-12-31', {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  });

  const { data: allLicenseData, isLoading, error } = allLicenseInfoQuery;

  // The endpoint returns an array directly
  const rawData = useMemo(() => {
    if (!allLicenseData || !Array.isArray(allLicenseData)) return [];
    return allLicenseData;
  }, [allLicenseData]);

  // Process and memoize data
  const processedData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];

    const now = new Date();
    return rawData.map((item, index) => {
      const expiryDate = new Date(item.expiry);
      const issuedDate = new Date(item.timestamp);

      // Active = released is null (not released)
      const isActive = item.released === null;
      // Expiring = active but expiry is within 7 days
      const isExpiringSoon = isActive && expiryDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Status based on whether license is active (not released)
      const status = isActive ? 'active' : 'released';

      return {
        id: item.uuid || index,
        email: item.email,
        product: item.product,
        expiry: item.expiry,
        timestamp: item.timestamp,
        released: item.released,
        uuid: item.uuid,
        status,
        isExpiringSoon,
        expiryDate,
        issuedDate
      };
    });
  }, [rawData]);

  // Get unique products for filter dropdown
  const uniqueProducts = useMemo(() => {
    if (!processedData.length) return [];
    const products = [...new Set(processedData.map(item => item.product).filter(Boolean))];
    return products.sort();
  }, [processedData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return processedData.filter(item => {
      // Email filter
      if (emailFilter && !(item.email || '').toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }

      // Product filter (case-insensitive)
      if (productFilter !== 'all' && (item.product || '').toLowerCase() !== productFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [processedData, emailFilter, productFilter, statusFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const total = filteredData.length;
    const active = filteredData.filter(item => item.status === 'active').length;
    const expiringSoon = filteredData.filter(item => item.isExpiringSoon).length;
    const released = filteredData.filter(item => item.status === 'released').length;
    const uniqueUsers = new Set(filteredData.map(item => item.email)).size;
    const uniqueProducts = new Set(filteredData.map(item => item.product)).size;

    return { total, active, expiringSoon, released, uniqueUsers, uniqueProducts };
  }, [filteredData]);

  // Find possible duplicates - active licenses where same user has multiple active licenses for same product
  const possibleDuplicates = useMemo(() => {
    // Only look at active licenses
    const activeLicenses = processedData.filter(item => item.status === 'active');

    // Group by email + product
    const groupedMap = new Map();
    activeLicenses.forEach(item => {
      const key = `${(item.email || '').toLowerCase()}|${(item.product || '').toLowerCase()}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key).push(item);
    });

    // Find groups with more than one license (duplicates)
    const duplicates = [];
    groupedMap.forEach((licenses) => {
      if (licenses.length > 1) {
        // Sort by timestamp descending (newest first)
        licenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        duplicates.push(...licenses);
      }
    });

    return duplicates;
  }, [processedData]);

  // Find expired but still active licenses (expiry passed but released is null)
  const expiredButActive = useMemo(() => {
    const now = new Date();
    return processedData.filter(item => {
      if (item.status !== 'active') return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate < now;
    }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry)); // Oldest expired first
  }, [processedData]);

  // Find heavy users - users with 3+ different active products
  const heavyUsers = useMemo(() => {
    const activeLicenses = processedData.filter(item => item.status === 'active');

    // Group by email
    const userProducts = new Map();
    activeLicenses.forEach(item => {
      const email = (item.email || '').toLowerCase();
      if (!userProducts.has(email)) {
        userProducts.set(email, new Set());
      }
      userProducts.get(email).add((item.product || '').toLowerCase());
    });

    // Find users with 3+ products
    const heavyUserEmails = new Set();
    userProducts.forEach((products, email) => {
      if (products.size >= 3) {
        heavyUserEmails.add(email);
      }
    });

    // Return all active licenses for heavy users
    return activeLicenses
      .filter(item => heavyUserEmails.has((item.email || '').toLowerCase()))
      .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [processedData]);

  // Find bulk issuance - many licenses issued within a short time window (same hour)
  const bulkIssuance = useMemo(() => {
    const activeLicenses = processedData.filter(item => item.status === 'active');

    // Group by hour of issuance
    const hourlyGroups = new Map();
    activeLicenses.forEach(item => {
      const timestamp = new Date(item.timestamp);
      // Round to hour
      const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
      if (!hourlyGroups.has(hourKey)) {
        hourlyGroups.set(hourKey, []);
      }
      hourlyGroups.get(hourKey).push(item);
    });

    // Find hours with 5+ licenses issued
    const bulkLicenses = [];
    hourlyGroups.forEach((licenses) => {
      if (licenses.length >= 5) {
        bulkLicenses.push(...licenses);
      }
    });

    return bulkLicenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [processedData]);

  // Find frequent renewers - users who have 5+ licenses (active or released) for the same product
  const frequentRenewers = useMemo(() => {
    // Group all licenses by email + product
    const userProductMap = new Map();
    processedData.forEach(item => {
      const key = `${(item.email || '').toLowerCase()}|${(item.product || '').toLowerCase()}`;
      if (!userProductMap.has(key)) {
        userProductMap.set(key, []);
      }
      userProductMap.get(key).push(item);
    });

    // Find user/product combinations with 5+ licenses
    const frequentLicenses = [];
    userProductMap.forEach((licenses) => {
      if (licenses.length >= 5) {
        // Sort by timestamp descending
        licenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        frequentLicenses.push(...licenses);
      }
    });

    return frequentLicenses;
  }, [processedData]);

  // Find unusual domains - licenses not from common company domains
  const unusualDomains = useMemo(() => {
    const commonDomains = ['buck.co', 'giantant.ca', 'buck.tv'];

    return processedData.filter(item => {
      if (!item.email) return false;
      const domain = item.email.split('@')[1]?.toLowerCase();
      return domain && !commonDomains.includes(domain);
    }).sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [processedData]);

  // Find short duration releases - licenses that were released within 1 hour of issuance
  const shortDuration = useMemo(() => {
    const oneHourMs = 60 * 60 * 1000;

    return processedData.filter(item => {
      // Only look at released licenses
      if (item.status !== 'released') return false;

      const issued = new Date(item.timestamp);
      const expiry = new Date(item.expiry);
      const duration = expiry - issued;

      // If duration is less than 1 hour, it was likely released early
      return duration < oneHourMs;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [processedData]);

  // Find Figma license redundancy - users with figma+figmafigjam or figjam+figmafigjam
  // figmafigjam includes both figma and figjam, so having separate licenses is redundant
  const figmaRedundancy = useMemo(() => {
    // Only look at active licenses
    const activeLicenses = processedData.filter(item => item.status === 'active');

    // Group by email
    const userProducts = new Map();
    activeLicenses.forEach(item => {
      const email = (item.email || '').toLowerCase();
      const product = (item.product || '').toLowerCase();
      if (!userProducts.has(email)) {
        userProducts.set(email, { licenses: [], products: new Set() });
      }
      userProducts.get(email).licenses.push(item);
      userProducts.get(email).products.add(product);
    });

    // Find users with redundant Figma licenses
    const redundantLicenses = [];
    userProducts.forEach(({ licenses, products }, email) => {
      const hasFigmaFigJam = products.has('figmafigjam');
      const hasFigma = products.has('figma');
      const hasFigJam = products.has('figjam');

      // If user has figmafigjam AND (figma OR figjam), those are redundant
      if (hasFigmaFigJam && (hasFigma || hasFigJam)) {
        // Add all relevant licenses for this user
        licenses.forEach(license => {
          const licenseProduct = (license.product || '').toLowerCase();
          if (licenseProduct === 'figmafigjam' || licenseProduct === 'figma' || licenseProduct === 'figjam') {
            redundantLicenses.push({
              ...license,
              redundancyType: licenseProduct === 'figmafigjam'
                ? 'Has FigmaFigJam (includes both)'
                : `Redundant ${license.product} (covered by FigmaFigJam)`
            });
          }
        });
      }
    });

    return redundantLicenses.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [processedData]);

  // Release a redundant license
  const releaseLicense = useCallback(async (email, product, uuid) => {
    const licenseKey = uuid;
    setReleasingLicenses(prev => new Set([...prev, licenseKey]));

    try {
      const url = `https://laxcoresrv.buck.local:8000/licenses/release_self_service_license?product=${product.toLowerCase()}&email=${email}`;
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSnackbarMessage(`Successfully released ${product} license for ${email}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/licenses/self_service_license_info/2024-01-01/2025-12-31'] });

      return data;
    } catch (error) {
      console.error('Error releasing license:', error);
      setSnackbarMessage(`Failed to release ${product} license for ${email}: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setReleasingLicenses(prev => {
        const newSet = new Set(prev);
        newSet.delete(licenseKey);
        return newSet;
      });
    }
  }, [queryClient]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setEmailFilter('');
    setProductFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = emailFilter || productFilter !== 'all' || statusFilter !== 'all';

  // DataGrid columns with sorting enabled
  const columns = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 220,
      sortable: true,
      filterable: true
    },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            textTransform: 'capitalize',
            bgcolor: 'rgba(102, 126, 234, 0.1)',
            color: '#667eea',
            fontWeight: 500
          }}
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const row = params.row;
        // Show "Expiring" for active licenses expiring within 7 days
        const displayStatus = row.isExpiringSoon ? 'expiring' : params.value;
        const statusColors = {
          active: { bgcolor: '#48bb78', label: 'Active' },
          expiring: { bgcolor: '#ed8936', label: 'Expiring' },
          released: { bgcolor: '#718096', label: 'Released' }
        };
        const config = statusColors[displayStatus] || statusColors.released;
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bgcolor,
              color: 'white',
              fontWeight: 500,
              height: 24
            }}
          />
        );
      }
    },
    {
      field: 'expiry',
      headerName: 'Expiry Date',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const isExpired = new Date(params.value) < new Date();
        return (
          <Typography
            variant="body2"
            sx={{ color: isExpired ? 'error.main' : 'text.primary' }}
          >
            {formatDate(params.value)}
          </Typography>
        );
      }
    },
    {
      field: 'timestamp',
      headerName: 'Issued Date',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filterable: true,
      renderCell: (params) => formatDate(params.value)
    },
    {
      field: 'released',
      headerName: 'Released',
      width: 100,
      sortable: true,
      filterable: true,
      renderCell: (params) => params.value ? 'Yes' : '—'
    },
    {
      field: 'uuid',
      headerName: 'UUID',
      flex: 1,
      minWidth: 280,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    }
  ];

  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading license data: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#2d3748',
            mb: 1
          }}
        >
          {name}
        </Typography>

        {/* Anomaly Summary - Quick Overview */}
        {(possibleDuplicates.length > 0 || expiredButActive.length > 0 || unusualDomains.length > 0) && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #fed7d7',
              borderRadius: 2,
              backgroundColor: '#fff5f5'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningAmberIcon sx={{ color: '#e53e3e' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#c53030' }}>
                Attention Required
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {expiredButActive.length > 0 && (
                <Chip
                  icon={<TimerOffIcon />}
                  label={`${expiredButActive.length} expired but active`}
                  size="small"
                  onClick={() => setExpiredActiveDialogOpen(true)}
                  sx={{
                    bgcolor: '#e53e3e',
                    color: 'white',
                    cursor: 'pointer',
                    '& .MuiChip-icon': { color: 'white' },
                    '&:hover': { bgcolor: '#c53030' }
                  }}
                />
              )}
              {possibleDuplicates.length > 0 && (
                <Chip
                  icon={<ContentCopyIcon />}
                  label={`${possibleDuplicates.length} possible duplicates`}
                  size="small"
                  onClick={() => setDuplicatesDialogOpen(true)}
                  sx={{
                    bgcolor: '#ed8936',
                    color: 'white',
                    cursor: 'pointer',
                    '& .MuiChip-icon': { color: 'white' },
                    '&:hover': { bgcolor: '#dd6b20' }
                  }}
                />
              )}
              {unusualDomains.length > 0 && (
                <Chip
                  icon={<DomainIcon />}
                  label={`${unusualDomains.length} unusual domains`}
                  size="small"
                  onClick={() => setUnusualDomainsDialogOpen(true)}
                  sx={{
                    bgcolor: '#d69e2e',
                    color: 'white',
                    cursor: 'pointer',
                    '& .MuiChip-icon': { color: 'white' },
                    '&:hover': { bgcolor: '#b7791f' }
                  }}
                />
              )}
              {shortDuration.length > 0 && (
                <Chip
                  icon={<ShortTextIcon />}
                  label={`${shortDuration.length} short duration`}
                  size="small"
                  onClick={() => setShortDurationDialogOpen(true)}
                  sx={{
                    bgcolor: '#ed64a6',
                    color: 'white',
                    cursor: 'pointer',
                    '& .MuiChip-icon': { color: 'white' },
                    '&:hover': { bgcolor: '#d53f8c' }
                  }}
                />
              )}
            </Box>
          </Paper>
        )}

        <Typography variant="body1" sx={{ color: '#718096' }}>
          Browse and search all license records with filtering and sorting
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
              {statistics.total.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Total Records
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#48bb78' }}>
              {statistics.active.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Active
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed8936' }}>
              {statistics.expiringSoon.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Expiring Soon
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#718096' }}>
              {statistics.released.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Released
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2' }}>
              {statistics.uniqueUsers.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Unique Users
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#38b2ac' }}>
              {statistics.uniqueProducts}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Products
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid #e2e8f0',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: '#718096' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
            Filters
          </Typography>
          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <IconButton size="small" onClick={clearFilters}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search by Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  endAdornment: emailFilter && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setEmailFilter('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Product</InputLabel>
              <Select
                value={productFilter}
                label="Product"
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <MenuItem value="all">All Products</MenuItem>
                {uniqueProducts.map(product => (
                  <MenuItem key={product} value={product} sx={{ textTransform: 'capitalize' }}>
                    {product}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="released">Released</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Anomaly Detection Buttons */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#718096', mb: 1 }}>
            Anomaly Detection
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Possible Duplicates */}
            <Tooltip title="Users with multiple active licenses for the same product">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => setDuplicatesDialogOpen(true)}
                  disabled={possibleDuplicates.length === 0}
                  sx={{
                    borderColor: possibleDuplicates.length > 0 ? '#ed8936' : '#e2e8f0',
                    color: possibleDuplicates.length > 0 ? '#ed8936' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#dd7826',
                      backgroundColor: 'rgba(237, 137, 54, 0.04)'
                    }
                  }}
                >
                  Duplicates ({possibleDuplicates.length})
                </Button>
              </span>
            </Tooltip>

            {/* Expired but Active */}
            <Tooltip title="Licenses past expiry date but not yet released">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TimerOffIcon />}
                  onClick={() => setExpiredActiveDialogOpen(true)}
                  disabled={expiredButActive.length === 0}
                  sx={{
                    borderColor: expiredButActive.length > 0 ? '#e53e3e' : '#e2e8f0',
                    color: expiredButActive.length > 0 ? '#e53e3e' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#c53030',
                      backgroundColor: 'rgba(229, 62, 62, 0.04)'
                    }
                  }}
                >
                  Expired Active ({expiredButActive.length})
                </Button>
              </span>
            </Tooltip>

            {/* Heavy Users */}
            <Tooltip title="Users with 3 or more different active products">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => setHeavyUsersDialogOpen(true)}
                  disabled={heavyUsers.length === 0}
                  sx={{
                    borderColor: heavyUsers.length > 0 ? '#667eea' : '#e2e8f0',
                    color: heavyUsers.length > 0 ? '#667eea' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)'
                    }
                  }}
                >
                  Heavy Users ({heavyUsers.length})
                </Button>
              </span>
            </Tooltip>

            {/* Bulk Issuance */}
            <Tooltip title="5+ licenses issued within the same hour">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SpeedIcon />}
                  onClick={() => setBulkIssuanceDialogOpen(true)}
                  disabled={bulkIssuance.length === 0}
                  sx={{
                    borderColor: bulkIssuance.length > 0 ? '#38b2ac' : '#e2e8f0',
                    color: bulkIssuance.length > 0 ? '#38b2ac' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#319795',
                      backgroundColor: 'rgba(56, 178, 172, 0.04)'
                    }
                  }}
                >
                  Bulk Issuance ({bulkIssuance.length})
                </Button>
              </span>
            </Tooltip>

            {/* Frequent Renewers */}
            <Tooltip title="Users with 5+ licenses (active or released) for the same product">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HistoryIcon />}
                  onClick={() => setFrequentRenewersDialogOpen(true)}
                  disabled={frequentRenewers.length === 0}
                  sx={{
                    borderColor: frequentRenewers.length > 0 ? '#9f7aea' : '#e2e8f0',
                    color: frequentRenewers.length > 0 ? '#9f7aea' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#805ad5',
                      backgroundColor: 'rgba(159, 122, 234, 0.04)'
                    }
                  }}
                >
                  Frequent Renewers ({frequentRenewers.length})
                </Button>
              </span>
            </Tooltip>

            {/* Unusual Domains */}
            <Tooltip title="Licenses from non-standard email domains">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DomainIcon />}
                  onClick={() => setUnusualDomainsDialogOpen(true)}
                  disabled={unusualDomains.length === 0}
                  sx={{
                    borderColor: unusualDomains.length > 0 ? '#d69e2e' : '#e2e8f0',
                    color: unusualDomains.length > 0 ? '#d69e2e' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#b7791f',
                      backgroundColor: 'rgba(214, 158, 46, 0.04)'
                    }
                  }}
                >
                  Unusual Domains ({unusualDomains.length})
                </Button>
              </span>
            </Tooltip>

            {/* Short Duration */}
            <Tooltip title="Licenses with very short duration (less than 1 hour)">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ShortTextIcon />}
                  onClick={() => setShortDurationDialogOpen(true)}
                  disabled={shortDuration.length === 0}
                  sx={{
                    borderColor: shortDuration.length > 0 ? '#ed64a6' : '#e2e8f0',
                    color: shortDuration.length > 0 ? '#ed64a6' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#d53f8c',
                      backgroundColor: 'rgba(237, 100, 166, 0.04)'
                    }
                  }}
                >
                  Short Duration ({shortDuration.length})
                </Button>
              </span>
            </Tooltip>

            {/* Figma Redundancy */}
            <Tooltip title="Users with FigmaFigJam plus separate Figma or FigJam licenses (redundant)">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LayersIcon />}
                  onClick={() => setFigmaRedundancyDialogOpen(true)}
                  disabled={figmaRedundancy.length === 0}
                  sx={{
                    borderColor: figmaRedundancy.length > 0 ? '#f56565' : '#e2e8f0',
                    color: figmaRedundancy.length > 0 ? '#f56565' : '#a0aec0',
                    '&:hover': {
                      borderColor: '#e53e3e',
                      backgroundColor: 'rgba(245, 101, 101, 0.04)'
                    }
                  }}
                >
                  Figma Redundancy ({figmaRedundancy.length})
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={filteredData}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          sortingOrder={['asc', 'desc']}
          initialState={{
            sorting: {
              sortModel: [{ field: 'timestamp', sort: 'desc' }],
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f7fafc',
              borderBottom: '2px solid #e2e8f0'
            },
            '& .MuiDataGrid-cell': {
              borderColor: '#e2e8f0'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f7fafc'
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid #e2e8f0'
            }
          }}
        />
      </Paper>

      {/* Possible Duplicates Dialog */}
      <Dialog
        open={duplicatesDialogOpen}
        onClose={() => setDuplicatesDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContentCopyIcon sx={{ color: '#ed8936' }} />
            <Typography variant="h6">
              Possible Duplicate Licenses ({possibleDuplicates.length})
            </Typography>
          </Box>
          <IconButton onClick={() => setDuplicatesDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            These are active licenses where the same user has multiple active licenses for the same product.
            Review these entries to determine if any should be released.
          </Alert>
          <DataGrid
            rows={possibleDuplicates}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'email', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicatesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Expired but Active Dialog */}
      <Dialog
        open={expiredActiveDialogOpen}
        onClose={() => setExpiredActiveDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerOffIcon sx={{ color: '#e53e3e' }} />
            <Typography variant="h6">
              Expired but Active Licenses ({expiredButActive.length})
            </Typography>
          </Box>
          <IconButton onClick={() => setExpiredActiveDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2 }}>
            These licenses have passed their expiry date but have not been released.
            They should be reviewed and likely released.
          </Alert>
          <DataGrid
            rows={expiredButActive}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'expiry', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpiredActiveDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Heavy Users Dialog */}
      <Dialog
        open={heavyUsersDialogOpen}
        onClose={() => setHeavyUsersDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6">
              Heavy Users - 3+ Products ({heavyUsers.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setHeavyUsersDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            These users have 3 or more different active product licenses.
            This may be normal for power users, but worth reviewing for optimization.
          </Alert>
          <DataGrid
            rows={heavyUsers}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'email', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeavyUsersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Issuance Dialog */}
      <Dialog
        open={bulkIssuanceDialogOpen}
        onClose={() => setBulkIssuanceDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon sx={{ color: '#38b2ac' }} />
            <Typography variant="h6">
              Bulk Issuance ({bulkIssuance.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setBulkIssuanceDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            These licenses were issued in bulk (5+ within the same hour).
            This may indicate automated processes or coordinated requests.
          </Alert>
          <DataGrid
            rows={bulkIssuance}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkIssuanceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Frequent Renewers Dialog */}
      <Dialog
        open={frequentRenewersDialogOpen}
        onClose={() => setFrequentRenewersDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#9f7aea' }} />
            <Typography variant="h6">
              Frequent Renewers ({frequentRenewers.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setFrequentRenewersDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            These users have obtained 5+ licenses for the same product over time.
            This pattern may indicate regular usage or potential process improvements needed.
          </Alert>
          <DataGrid
            rows={frequentRenewers}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'email', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFrequentRenewersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Unusual Domains Dialog */}
      <Dialog
        open={unusualDomainsDialogOpen}
        onClose={() => setUnusualDomainsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DomainIcon sx={{ color: '#d69e2e' }} />
            <Typography variant="h6">
              Unusual Email Domains ({unusualDomains.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setUnusualDomainsDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            These licenses were issued to email addresses outside the standard company domains
            (buck.co, giantant.ca, buck.tv). Verify these are legitimate users.
          </Alert>
          <DataGrid
            rows={unusualDomains}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'email', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnusualDomainsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Short Duration Dialog */}
      <Dialog
        open={shortDurationDialogOpen}
        onClose={() => setShortDurationDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShortTextIcon sx={{ color: '#ed64a6' }} />
            <Typography variant="h6">
              Short Duration Licenses ({shortDuration.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setShortDurationDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            These licenses had a very short duration (less than 1 hour between issuance and expiry).
            This may indicate licenses that were released immediately after being obtained, possibly by mistake.
          </Alert>
          <DataGrid
            rows={shortDuration}
            columns={columns}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortDurationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Figma Redundancy Dialog */}
      <Dialog
        open={figmaRedundancyDialogOpen}
        onClose={() => setFigmaRedundancyDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon sx={{ color: '#f56565' }} />
            <Typography variant="h6">
              Figma License Redundancy ({figmaRedundancy.length} licenses)
            </Typography>
          </Box>
          <IconButton onClick={() => setFigmaRedundancyDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            These users have a FigmaFigJam license along with separate Figma or FigJam licenses.
            Since FigmaFigJam includes both Figma and FigJam, the separate licenses are redundant
            and could be released to save costs.
          </Alert>
          <DataGrid
            rows={figmaRedundancy}
            columns={[
              {
                field: 'email',
                headerName: 'Email',
                flex: 1.5,
                minWidth: 220,
                sortable: true
              },
              {
                field: 'product',
                headerName: 'Product',
                flex: 1,
                minWidth: 120,
                sortable: true,
                renderCell: (params) => (
                  <Chip
                    label={params.value}
                    size="small"
                    sx={{
                      textTransform: 'capitalize',
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      fontWeight: 500
                    }}
                  />
                )
              },
              {
                field: 'redundancyType',
                headerName: 'Redundancy Note',
                flex: 1.5,
                minWidth: 250,
                sortable: true,
                renderCell: (params) => (
                  <Typography
                    variant="body2"
                    sx={{
                      color: params.value?.includes('Redundant') ? '#e53e3e' : '#38a169',
                      fontWeight: params.value?.includes('Redundant') ? 600 : 400
                    }}
                  >
                    {params.value}
                  </Typography>
                )
              },
              {
                field: 'status',
                headerName: 'Status',
                width: 100,
                sortable: true,
                renderCell: (params) => (
                  <Chip
                    label={params.value === 'active' ? 'Active' : 'Released'}
                    size="small"
                    sx={{
                      bgcolor: params.value === 'active' ? '#48bb78' : '#718096',
                      color: 'white',
                      fontWeight: 500,
                      height: 24
                    }}
                  />
                )
              },
              {
                field: 'expiry',
                headerName: 'Expiry Date',
                flex: 1,
                minWidth: 180,
                sortable: true,
                renderCell: (params) => formatDate(params.value)
              },
              {
                field: 'timestamp',
                headerName: 'Issued Date',
                flex: 1,
                minWidth: 180,
                sortable: true,
                renderCell: (params) => formatDate(params.value)
              },
              {
                field: 'actions',
                headerName: 'Action',
                width: 120,
                sortable: false,
                filterable: false,
                renderCell: (params) => {
                  const row = params.row;
                  const isRedundant = row.redundancyType?.includes('Redundant');
                  const isReleasing = releasingLicenses.has(row.uuid);

                  // Only show return button for redundant licenses (not the figmafigjam one)
                  if (!isRedundant) {
                    return null;
                  }

                  return (
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      startIcon={isReleasing ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
                      disabled={isReleasing}
                      onClick={() => releaseLicense(row.email, row.product, row.uuid)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.5
                      }}
                    >
                      {isReleasing ? 'Returning...' : 'Return'}
                    </Button>
                  );
                }
              }
            ]}
            paginationModel={anomalyPaginationModel}
            onPaginationModelChange={setAnomalyPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sortingOrder={['asc', 'desc']}
            initialState={{
              sorting: {
                sortModel: [{ field: 'email', sort: 'asc' }],
              },
            }}
            sx={{
              border: '1px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f7fafc',
                borderBottom: '2px solid #e2e8f0'
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#e2e8f0'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f7fafc'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFigmaRedundancyDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
