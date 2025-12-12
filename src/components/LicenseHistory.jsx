import { useState, useMemo } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField, InputAdornment,
  Button, Chip, Card, CardContent, CircularProgress, Alert, ToggleButton,
  ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, Divider, Autocomplete, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import TimelineIcon from '@mui/icons-material/Timeline';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ExtensionIcon from '@mui/icons-material/Extension';
import UpdateIcon from '@mui/icons-material/Update';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area,
  PieChart, Pie, Cell, ComposedChart, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useProtectedApiGet } from '../hooks/useApi';

export default function LicenseHistory({ name = "License History" }) {
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('analytics');
  const [productFilter, setProductFilter] = useState('all');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('active'); // 'active' or 'issued'
  const [issuanceGranularity, setIssuanceGranularity] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  const [activeGranularity, setActiveGranularity] = useState('monthly'); // 'monthly', 'weekly', 'daily'

  // User activity explorer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivityGranularity, setUserActivityGranularity] = useState('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState(null); // For clicking on chart to see licenses

  // Product distribution table sorting
  const [productSortField, setProductSortField] = useState('count');
  const [productSortDirection, setProductSortDirection] = useState('desc');

  // Active users by date state
  const [activeUsersDate, setActiveUsersDate] = useState(new Date().toISOString().split('T')[0]);

  // Chart point click dialog state
  const [chartPointDialogOpen, setChartPointDialogOpen] = useState(false);
  const [selectedChartPoint, setSelectedChartPoint] = useState(null); // { type: 'issuance' | 'active', period: string, granularity: string }

  // Expiring license detail dialog state
  const [expiringLicenseDialogOpen, setExpiringLicenseDialogOpen] = useState(false);
  const [selectedExpiringLicense, setSelectedExpiringLicense] = useState(null);

  // Extension behavior dialog state
  const [behaviorDialogOpen, setBehaviorDialogOpen] = useState(false);
  const [selectedBehaviorUser, setSelectedBehaviorUser] = useState(null);

  // Get behavior records for a specific user
  const getUserBehaviorRecords = (email) => {
    if (!analyticsData?.extensionBehavior) return { extensions: [], renewals: [] };

    const extensions = analyticsData.extensionBehavior.extensionInstances
      .filter(e => e.email === email)
      .sort((a, b) => b.currLicense.startDate - a.currLicense.startDate);

    const renewals = analyticsData.extensionBehavior.renewalInstances
      .filter(r => r.email === email)
      .sort((a, b) => b.currLicense.startDate - a.currLicense.startDate);

    return { extensions, renewals };
  };

  const handleViewBehaviorRecords = (user) => {
    setSelectedBehaviorUser(user);
    setBehaviorDialogOpen(true);
  };

  // Use date range endpoint for full history (from 2020 to end of next year)
  const startDate = '2020-01-01';
  const endDate = '2026-12-31';

  const licenseHistoryQuery = useProtectedApiGet(`/licenses/self_service_license_info/${startDate}/${endDate}`, {
    queryConfig: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  const licenseHistory = useMemo(() => {
    const rawData = licenseHistoryQuery.data;
    let dataArray = [];

    if (rawData) {
      if (Array.isArray(rawData)) {
        dataArray = rawData;
      } else if (rawData.self_service_licenses && Array.isArray(rawData.self_service_licenses)) {
        dataArray = rawData.self_service_licenses;
      }
    }

    return {
      isLoading: licenseHistoryQuery.isLoading,
      error: licenseHistoryQuery.error,
      data: dataArray
    };
  }, [licenseHistoryQuery.isLoading, licenseHistoryQuery.error, licenseHistoryQuery.data]);

  const uniqueProducts = useMemo(() => {
    if (!licenseHistory.data || !Array.isArray(licenseHistory.data)) return [];
    const products = [...new Set(licenseHistory.data.map(item => item.product).filter(Boolean))];
    return products.sort();
  }, [licenseHistory.data]);

  const filteredData = useMemo(() => {
    if (!licenseHistory.data || !Array.isArray(licenseHistory.data)) return [];

    let filtered = licenseHistory.data;

    if (productFilter !== 'all') {
      filtered = filtered.filter(item => item.product === productFilter);
    }

    if (filter.length > 0) {
      const lowerFilter = filter.toLowerCase();
      filtered = filtered.filter(item =>
        (item.email && item.email.toLowerCase().includes(lowerFilter)) ||
        (item.product && item.product.toLowerCase().includes(lowerFilter))
      );
    }

    return filtered;
  }, [licenseHistory.data, filter, productFilter]);

  const clearFilter = () => {
    setFilter('');
    setProductFilter('all');
  };

  // Calendar helper functions
  const getMonthDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateInRange = (checkDate, startDate, endDate) => {
    if (!checkDate || !startDate || !endDate) return false;
    const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return check >= start && check <= end;
  };

  // Calendar data calculation
  const calendarData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const { daysInMonth } = getMonthDays(year, month);
    const data = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const currentDate = new Date(year, month, day);

      // Deduplicate active licenses by user+product - only count ONE per user+product combo
      const activeUserProductMap = new Map();
      filteredData.forEach(item => {
        const issuedDate = parseDate(item.timestamp);
        const expiryDate = parseDate(item.expiry);
        if (isDateInRange(currentDate, issuedDate, expiryDate)) {
          const key = `${item.email}|||${item.product}`;
          const existing = activeUserProductMap.get(key);
          // Keep the license with the latest expiry date for this user+product
          if (!existing || new Date(existing.expiry) < new Date(item.expiry)) {
            activeUserProductMap.set(key, item);
          }
        }
      });
      const activeLicenses = Array.from(activeUserProductMap.values());

      // Count licenses expiring on this day (from the deduplicated active set)
      const expiringLicenses = activeLicenses.filter(item => {
        const expiryDate = parseDate(item.expiry);
        return isSameDay(currentDate, expiryDate);
      });

      const issuedLicenses = filteredData.filter(item => {
        const issuedDate = parseDate(item.timestamp);
        return isSameDay(currentDate, issuedDate);
      });

      data[dateKey] = {
        active: activeLicenses,
        issued: issuedLicenses,
        expiring: expiringLicenses
      };
    }

    return data;
  }, [filteredData, calendarDate]);

  // Analytics calculations
  const analyticsData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        monthlyIssuance: [],
        weeklyIssuance: [],
        dailyIssuance: [],
        topUsers: [],
        productDistribution: [],
        anomalies: [],
        statistics: {},
        activeLicensesOverTime: [],
        activeLicensesWeekly: [],
        activeLicensesDaily: [],
        licenseDurationStats: {}
      };
    }

    // Group by month for issuance trends
    const monthlyMap = {};
    const weeklyMap = {};
    const dailyMap = {};
    const userCounts = {};
    const productCounts = {};
    const licenseDurations = [];

    filteredData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const expiry = new Date(item.expiry);

      // Monthly grouping
      const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;

      // Weekly grouping (ISO week)
      const weekStart = new Date(timestamp);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + 1;

      // Daily grouping
      const dayKey = timestamp.toISOString().split('T')[0];
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;

      // User counts
      if (item.email) {
        userCounts[item.email] = (userCounts[item.email] || 0) + 1;
      }

      // Product counts
      if (item.product) {
        productCounts[item.product] = (productCounts[item.product] || 0) + 1;
      }

      // License duration
      if (timestamp && expiry && !isNaN(timestamp) && !isNaN(expiry)) {
        const durationDays = Math.round((expiry - timestamp) / (1000 * 60 * 60 * 24));
        if (durationDays > 0) licenseDurations.push(durationDays);
      }
    });

    // Convert to arrays sorted by date
    const monthlyIssuance = Object.entries(monthlyMap)
      .map(([month, count]) => ({ month, count, label: month }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const weeklyIssuance = Object.entries(weeklyMap)
      .map(([week, count]) => ({ week, count, label: week }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const dailyIssuance = Object.entries(dailyMap)
      .map(([day, count]) => ({ day, count, label: day }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Top users (limit to 10)
    const topUsers = Object.entries(userCounts)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // All users (sorted alphabetically for autocomplete)
    const allUsers = Object.keys(userCounts).sort((a, b) => a.localeCompare(b));

    // Product distribution
    const productDistribution = Object.entries(productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate anomalies using standard deviation
    const monthlyValues = monthlyIssuance.map(m => m.count);
    const mean = monthlyValues.length > 0
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
      : 0;
    const stdDev = monthlyValues.length > 0
      ? Math.sqrt(monthlyValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / monthlyValues.length)
      : 0;

    const anomalies = monthlyIssuance
      .filter(m => Math.abs(m.count - mean) > 2 * stdDev)
      .map(m => ({
        ...m,
        type: m.count > mean ? 'spike' : 'dip',
        deviation: ((m.count - mean) / (stdDev || 1)).toFixed(1)
      }));

    // Helper function to count active licenses for a given date, deduplicated by user+product
    // Each user can only have ONE active license per product at any point in time
    const countActiveLicensesForDate = (checkDate) => {
      const activeUserProductMap = new Map();
      filteredData.forEach(item => {
        const issued = new Date(item.timestamp);
        const expiry = new Date(item.expiry);
        if (issued <= checkDate && expiry >= checkDate) {
          const key = `${item.email}|||${item.product}`;
          const existing = activeUserProductMap.get(key);
          // Keep the license with the latest expiry date for this user+product
          if (!existing || new Date(existing.expiry) < expiry) {
            activeUserProductMap.set(key, item);
          }
        }
      });
      return activeUserProductMap.size;
    };

    // Active licenses over time (sample monthly)
    const activeLicensesOverTime = monthlyIssuance.map(({ month }) => {
      const [year, monthNum] = month.split('-').map(Number);
      const checkDate = new Date(year, monthNum - 1, 15); // Mid-month
      const activeCount = countActiveLicensesForDate(checkDate);
      return { month, activeCount };
    });

    // Active licenses over time (sample weekly)
    const activeLicensesWeekly = weeklyIssuance.map(({ week }) => {
      const checkDate = new Date(week);
      checkDate.setDate(checkDate.getDate() + 3); // Mid-week
      const activeCount = countActiveLicensesForDate(checkDate);
      return { week, activeCount };
    });

    // Active licenses over time (sample daily)
    const activeLicensesDaily = dailyIssuance.map(({ day }) => {
      const checkDate = new Date(day);
      const activeCount = countActiveLicensesForDate(checkDate);
      return { day, activeCount };
    });

    // Statistics
    const now = new Date();

    // Use the helper function to count active licenses for today (deduplicated by user+product)
    const activeLicenses = countActiveLicensesForDate(now);

    const expiredLicenses = filteredData.length - activeLicenses;

    // This month's issuance
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`;
    const thisMonthCount = monthlyMap[thisMonth] || 0;
    const lastMonthCount = monthlyMap[lastMonth] || 0;
    const monthOverMonthChange = lastMonthCount > 0
      ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
      : 0;

    // License duration stats
    const avgDuration = licenseDurations.length > 0
      ? Math.round(licenseDurations.reduce((a, b) => a + b, 0) / licenseDurations.length)
      : 0;
    const maxDuration = licenseDurations.length > 0 ? Math.max(...licenseDurations) : 0;
    const minDuration = licenseDurations.length > 0 ? Math.min(...licenseDurations) : 0;

    // Expiring soon (within 30 days)
    const expiringSoon = filteredData.filter(item => {
      const expiry = new Date(item.expiry);
      const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    // Day of week distribution
    const dayOfWeekMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    const dayOfWeekCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    filteredData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const dayName = dayOfWeekMap[timestamp.getDay()];
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
    });
    const dayOfWeekData = Object.entries(dayOfWeekCounts).map(([day, count]) => ({
      day,
      count,
      fullDay: { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[day]
    }));

    // Quarterly comparison
    const quarterlyMap = {};
    filteredData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const quarter = Math.floor(timestamp.getMonth() / 3) + 1;
      const quarterKey = `${timestamp.getFullYear()} Q${quarter}`;
      quarterlyMap[quarterKey] = (quarterlyMap[quarterKey] || 0) + 1;
    });
    const quarterlyData = Object.entries(quarterlyMap)
      .map(([quarter, count]) => ({ quarter, count }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    // Product trends over time (monthly breakdown by product)
    const productTrendsMap = {};
    filteredData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
      if (!productTrendsMap[monthKey]) {
        productTrendsMap[monthKey] = {};
      }
      productTrendsMap[monthKey][item.product] = (productTrendsMap[monthKey][item.product] || 0) + 1;
    });
    const allProducts = [...new Set(filteredData.map(item => item.product).filter(Boolean))];
    const productTrends = Object.entries(productTrendsMap)
      .map(([month, products]) => {
        const entry = { month };
        allProducts.forEach(product => {
          entry[product] = products[product] || 0;
        });
        return entry;
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // User retention - users with multiple licenses
    const userLicenseHistory = {};
    filteredData.forEach(item => {
      if (!item.email) return;
      if (!userLicenseHistory[item.email]) {
        userLicenseHistory[item.email] = [];
      }
      userLicenseHistory[item.email].push(new Date(item.timestamp));
    });
    const repeatUsers = Object.entries(userLicenseHistory)
      .filter(([email, dates]) => dates.length > 1)
      .map(([email, dates]) => ({
        email,
        licenseCount: dates.length,
        firstLicense: new Date(Math.min(...dates)),
        lastLicense: new Date(Math.max(...dates))
      }))
      .sort((a, b) => b.licenseCount - a.licenseCount)
      .slice(0, 10);

    const repeatUserCount = Object.values(userLicenseHistory).filter(dates => dates.length > 1).length;
    const singleUserCount = Object.values(userLicenseHistory).filter(dates => dates.length === 1).length;
    const retentionRate = Object.keys(userLicenseHistory).length > 0
      ? ((repeatUserCount / Object.keys(userLicenseHistory).length) * 100).toFixed(1)
      : 0;

    // Upcoming expirations (next 90 days, grouped by week)
    const upcomingExpirations = [];
    const nowTime = now.getTime();
    const ninetyDaysFromNow = nowTime + (90 * 24 * 60 * 60 * 1000);

    filteredData.forEach(item => {
      const expiry = new Date(item.expiry);
      if (expiry.getTime() > nowTime && expiry.getTime() <= ninetyDaysFromNow) {
        upcomingExpirations.push({
          ...item,
          expiryDate: expiry,
          daysUntilExpiry: Math.ceil((expiry.getTime() - nowTime) / (1000 * 60 * 60 * 24))
        });
      }
    });
    upcomingExpirations.sort((a, b) => a.expiryDate - b.expiryDate);

    // Group expirations by week
    const expirationsByWeek = {};
    upcomingExpirations.forEach(item => {
      const weekNum = Math.ceil(item.daysUntilExpiry / 7);
      const weekLabel = weekNum === 1 ? 'This Week' : weekNum === 2 ? 'Next Week' : `Week ${weekNum}`;
      if (!expirationsByWeek[weekLabel]) {
        expirationsByWeek[weekLabel] = { week: weekLabel, weekNum, count: 0, licenses: [] };
      }
      expirationsByWeek[weekLabel].count++;
      expirationsByWeek[weekLabel].licenses.push(item);
    });
    const expirationTimeline = Object.values(expirationsByWeek)
      .sort((a, b) => a.weekNum - b.weekNum);

    // Peak hours analysis
    const hourCounts = Array(24).fill(0);
    filteredData.forEach(item => {
      const timestamp = new Date(item.timestamp);
      hourCounts[timestamp.getHours()]++;
    });
    const hourlyData = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
      label: hour < 12 ? `${hour === 0 ? 12 : hour} AM` : `${hour === 12 ? 12 : hour - 12} PM`
    }));
    const peakHour = hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyData[0]);

    // Year over year comparison
    const yearlyMap = {};
    filteredData.forEach(item => {
      const year = new Date(item.timestamp).getFullYear();
      yearlyMap[year] = (yearlyMap[year] || 0) + 1;
    });
    const yearlyData = Object.entries(yearlyMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // License Extension Behavior Analysis
    // Group licenses by user and product, then analyze renewal patterns
    const userProductLicenses = {};
    const seenLicenses = new Set(); // Track unique licenses to avoid duplicates
    filteredData.forEach(item => {
      if (!item.email || !item.product) return;
      const key = `${item.email}|||${item.product}`;
      // Create unique identifier for this specific license to avoid duplicates
      const licenseKey = `${key}|||${item.timestamp}|||${item.expiry}`;
      if (seenLicenses.has(licenseKey)) return; // Skip duplicates
      seenLicenses.add(licenseKey);

      if (!userProductLicenses[key]) {
        userProductLicenses[key] = [];
      }
      userProductLicenses[key].push({
        ...item,
        startDate: new Date(item.timestamp),
        endDate: new Date(item.expiry)
      });
    });

    // Analyze each user-product pair for extension vs renewal behavior
    const extensionBehavior = {
      extenders: [], // Users who extend before expiry
      renewers: [],  // Users who renew after expiry
      extensionInstances: [], // Individual extension events
      renewalInstances: [],   // Individual renewal events
      stats: {
        totalExtensions: 0,
        totalRenewals: 0,
        avgExtensionOverlapDays: 0,
        avgRenewalGapDays: 0
      }
    };

    const userBehaviorMap = {}; // Track each user's overall behavior

    Object.entries(userProductLicenses).forEach(([key, licenses]) => {
      if (licenses.length < 2) return; // Need at least 2 licenses to analyze

      const [email, product] = key.split('|||');

      // Sort by start date
      licenses.sort((a, b) => a.startDate - b.startDate);

      let extensions = 0;
      let renewals = 0;
      let totalOverlapDays = 0;
      let totalGapDays = 0;

      for (let i = 1; i < licenses.length; i++) {
        const prevLicense = licenses[i - 1];
        const currLicense = licenses[i];

        // Skip if licenses have the same start date (likely duplicates or same license)
        if (currLicense.startDate.getTime() === prevLicense.startDate.getTime()) continue;

        // Check if current license starts before previous expires (extension)
        if (currLicense.startDate < prevLicense.endDate) {
          extensions++;
          const overlapDays = Math.ceil((prevLicense.endDate - currLicense.startDate) / (1000 * 60 * 60 * 24));
          totalOverlapDays += overlapDays;

          extensionBehavior.extensionInstances.push({
            email,
            product,
            prevExpiry: prevLicense.endDate,
            newStart: currLicense.startDate,
            overlapDays,
            prevLicense,
            currLicense
          });
        } else {
          // Renewal - new license starts after previous expires
          renewals++;
          const gapDays = Math.ceil((currLicense.startDate - prevLicense.endDate) / (1000 * 60 * 60 * 24));
          totalGapDays += gapDays;

          extensionBehavior.renewalInstances.push({
            email,
            product,
            prevExpiry: prevLicense.endDate,
            newStart: currLicense.startDate,
            gapDays,
            prevLicense,
            currLicense
          });
        }
      }

      // Track user behavior
      if (!userBehaviorMap[email]) {
        userBehaviorMap[email] = {
          email,
          extensions: 0,
          renewals: 0,
          products: new Set(),
          totalOverlapDays: 0,
          totalGapDays: 0
        };
      }
      userBehaviorMap[email].extensions += extensions;
      userBehaviorMap[email].renewals += renewals;
      userBehaviorMap[email].products.add(product);
      userBehaviorMap[email].totalOverlapDays += totalOverlapDays;
      userBehaviorMap[email].totalGapDays += totalGapDays;
    });

    // Categorize users as extenders or renewers based on their dominant behavior
    Object.values(userBehaviorMap).forEach(user => {
      const total = user.extensions + user.renewals;
      if (total === 0) return;

      const extensionRate = (user.extensions / total) * 100;
      const userData = {
        email: user.email,
        extensions: user.extensions,
        renewals: user.renewals,
        extensionRate: extensionRate.toFixed(1),
        products: Array.from(user.products),
        avgOverlapDays: user.extensions > 0 ? Math.round(user.totalOverlapDays / user.extensions) : 0,
        avgGapDays: user.renewals > 0 ? Math.round(user.totalGapDays / user.renewals) : 0,
        behavior: extensionRate >= 50 ? 'extender' : 'renewer'
      };

      if (extensionRate >= 50) {
        extensionBehavior.extenders.push(userData);
      } else {
        extensionBehavior.renewers.push(userData);
      }
    });

    // Sort by extension/renewal count
    extensionBehavior.extenders.sort((a, b) => b.extensions - a.extensions);
    extensionBehavior.renewers.sort((a, b) => b.renewals - a.renewals);

    // Calculate overall stats
    extensionBehavior.stats.totalExtensions = extensionBehavior.extensionInstances.length;
    extensionBehavior.stats.totalRenewals = extensionBehavior.renewalInstances.length;

    if (extensionBehavior.extensionInstances.length > 0) {
      extensionBehavior.stats.avgExtensionOverlapDays = Math.round(
        extensionBehavior.extensionInstances.reduce((sum, e) => sum + e.overlapDays, 0) /
        extensionBehavior.extensionInstances.length
      );
    }

    if (extensionBehavior.renewalInstances.length > 0) {
      extensionBehavior.stats.avgRenewalGapDays = Math.round(
        extensionBehavior.renewalInstances.reduce((sum, r) => sum + r.gapDays, 0) /
        extensionBehavior.renewalInstances.length
      );
    }

    // Forecast (simple linear regression for next 3 months)
    const recentMonths = monthlyIssuance.slice(-6);
    let forecast = [];
    if (recentMonths.length >= 3) {
      const n = recentMonths.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = recentMonths.reduce((sum, m) => sum + m.count, 0);
      const sumXY = recentMonths.reduce((sum, m, i) => sum + i * m.count, 0);
      const sumX2 = recentMonths.reduce((sum, m, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const lastMonth = recentMonths[recentMonths.length - 1].month;
      const [lastYear, lastMonthNum] = lastMonth.split('-').map(Number);

      for (let i = 1; i <= 3; i++) {
        let forecastMonth = lastMonthNum + i;
        let forecastYear = lastYear;
        if (forecastMonth > 12) {
          forecastMonth -= 12;
          forecastYear++;
        }
        const forecastValue = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
        forecast.push({
          month: `${forecastYear}-${String(forecastMonth).padStart(2, '0')}`,
          count: forecastValue,
          isForecast: true
        });
      }
    }

    return {
      monthlyIssuance,
      weeklyIssuance,
      dailyIssuance,
      topUsers,
      allUsers,
      productDistribution,
      anomalies,
      activeLicensesOverTime,
      activeLicensesWeekly,
      activeLicensesDaily,
      dayOfWeekData,
      quarterlyData,
      productTrends,
      allProducts,
      repeatUsers,
      userRetention: {
        repeatUserCount,
        singleUserCount,
        retentionRate
      },
      upcomingExpirations,
      expirationTimeline,
      hourlyData,
      peakHour,
      yearlyData,
      forecast,
      extensionBehavior,
      statistics: {
        totalLicenses: filteredData.length,
        activeLicenses,
        expiredLicenses,
        expiringSoon,
        thisMonthCount,
        lastMonthCount,
        monthOverMonthChange,
        avgDuration,
        maxDuration,
        minDuration,
        uniqueUsers: Object.keys(userCounts).length,
        uniqueProducts: Object.keys(productCounts).length,
        mean: Math.round(mean),
        stdDev: Math.round(stdDev)
      },
      licenseDurationStats: {
        avgDuration,
        maxDuration,
        minDuration
      }
    };
  }, [filteredData]);

  // Active users by selected date
  const activeUsersByDate = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || !activeUsersDate) {
      return { users: [], totalActive: 0, byProduct: {} };
    }

    const checkDate = new Date(activeUsersDate);
    checkDate.setHours(12, 0, 0, 0); // Mid-day to avoid timezone issues

    const activeUsers = new Map();
    const byProduct = {};

    filteredData.forEach(item => {
      const issued = new Date(item.timestamp);
      const expiry = new Date(item.expiry);

      // Check if license is active on the selected date
      if (issued <= checkDate && expiry >= checkDate) {
        const email = item.email || 'Unknown';
        const product = item.product || 'Unknown';

        if (!activeUsers.has(email)) {
          activeUsers.set(email, {
            email,
            products: new Set(),
            licenses: []
          });
        }

        activeUsers.get(email).products.add(product);
        activeUsers.get(email).licenses.push(item);

        // Track by product
        if (!byProduct[product]) {
          byProduct[product] = new Set();
        }
        byProduct[product].add(email);
      }
    });

    // Convert to array and format
    const usersArray = Array.from(activeUsers.values())
      .map(user => ({
        email: user.email,
        products: Array.from(user.products),
        productCount: user.products.size,
        licenseCount: user.licenses.length,
        licenses: user.licenses
      }))
      .sort((a, b) => b.productCount - a.productCount || a.email.localeCompare(b.email));

    // Convert byProduct sets to counts
    const byProductCounts = Object.entries(byProduct)
      .map(([product, users]) => ({
        product,
        userCount: users.size,
        users: Array.from(users)
      }))
      .sort((a, b) => b.userCount - a.userCount);

    return {
      users: usersArray,
      totalActive: usersArray.length,
      byProduct: byProductCounts
    };
  }, [filteredData, activeUsersDate]);

  // Licenses for selected chart point
  const chartPointLicenses = useMemo(() => {
    if (!selectedChartPoint || !filteredData || filteredData.length === 0) {
      return { licenses: [], byProduct: [], totalCount: 0 };
    }

    const { type, period, granularity } = selectedChartPoint;
    let matchingLicenses = [];

    if (type === 'issuance') {
      // Find licenses issued in the selected period
      matchingLicenses = filteredData.filter(item => {
        const timestamp = new Date(item.timestamp);
        if (granularity === 'monthly') {
          const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === period;
        } else if (granularity === 'weekly') {
          const weekStart = new Date(timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          return weekKey === period;
        } else {
          const dayKey = timestamp.toISOString().split('T')[0];
          return dayKey === period;
        }
      });
    } else if (type === 'active') {
      // Find licenses active during the selected period
      let checkDate;
      if (granularity === 'monthly') {
        const [year, month] = period.split('-').map(Number);
        checkDate = new Date(year, month - 1, 15); // Mid-month
      } else if (granularity === 'weekly') {
        checkDate = new Date(period);
        checkDate.setDate(checkDate.getDate() + 3); // Mid-week
      } else {
        checkDate = new Date(period);
      }

      matchingLicenses = filteredData.filter(item => {
        const issued = new Date(item.timestamp);
        const expiry = new Date(item.expiry);
        return issued <= checkDate && expiry >= checkDate;
      });
    }

    // Group by product for summary
    const productCounts = {};
    matchingLicenses.forEach(item => {
      const product = item.product || 'Unknown';
      productCounts[product] = (productCounts[product] || 0) + 1;
    });

    const byProduct = Object.entries(productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count);

    // Sort licenses by timestamp (most recent first)
    matchingLicenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      licenses: matchingLicenses,
      byProduct,
      totalCount: matchingLicenses.length
    };
  }, [selectedChartPoint, filteredData]);

  // User-specific activity data
  const userActivityData = useMemo(() => {
    if (!selectedUser || !filteredData || filteredData.length === 0) {
      return {
        monthlyActivity: [],
        weeklyActivity: [],
        dailyActivity: [],
        allLicenses: [],
        totalLicenses: 0
      };
    }

    const userLicenses = filteredData.filter(item => item.email === selectedUser);

    // Group by month
    const monthlyMap = {};
    const weeklyMap = {};
    const dailyMap = {};

    userLicenses.forEach(item => {
      const timestamp = new Date(item.timestamp);

      // Monthly grouping
      const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { count: 0, licenses: [] };
      }
      monthlyMap[monthKey].count++;
      monthlyMap[monthKey].licenses.push(item);

      // Weekly grouping
      const weekStart = new Date(timestamp);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { count: 0, licenses: [] };
      }
      weeklyMap[weekKey].count++;
      weeklyMap[weekKey].licenses.push(item);

      // Daily grouping
      const dayKey = timestamp.toISOString().split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { count: 0, licenses: [] };
      }
      dailyMap[dayKey].count++;
      dailyMap[dayKey].licenses.push(item);
    });

    const monthlyActivity = Object.entries(monthlyMap)
      .map(([period, data]) => ({ period, count: data.count, licenses: data.licenses }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const weeklyActivity = Object.entries(weeklyMap)
      .map(([period, data]) => ({ period, count: data.count, licenses: data.licenses }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const dailyActivity = Object.entries(dailyMap)
      .map(([period, data]) => ({ period, count: data.count, licenses: data.licenses }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      monthlyActivity,
      weeklyActivity,
      dailyActivity,
      allLicenses: userLicenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      totalLicenses: userLicenses.length
    };
  }, [selectedUser, filteredData]);

  // Get licenses for selected period
  const selectedPeriodLicenses = useMemo(() => {
    if (!selectedPeriod || !userActivityData) return [];

    const activityData = userActivityGranularity === 'monthly'
      ? userActivityData.monthlyActivity
      : userActivityGranularity === 'weekly'
        ? userActivityData.weeklyActivity
        : userActivityData.dailyActivity;

    const periodData = activityData.find(d => d.period === selectedPeriod);
    return periodData ? periodData.licenses : [];
  }, [selectedPeriod, userActivityData, userActivityGranularity]);

  // Color palette for charts
  const chartColors = ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#e53e3e', '#38b2ac', '#9f7aea', '#ed64a6'];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day, type) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    setSelectedDay(new Date(year, month, day));
    setDialogType(type);
    setDialogOpen(true);
  };

  const getSelectedDayLicenses = () => {
    if (!selectedDay) return [];
    const dateKey = formatDateKey(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
    const dayData = calendarData[dateKey];
    if (!dayData) return [];
    return dialogType === 'active' ? dayData.active : dialogType === 'expiring' ? dayData.expiring : dayData.issued;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 220
    },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        />
      )
    },
    {
      field: 'expiry',
      headerName: 'Expiry',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const expired = isExpired(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: expired ? 'error.main' : 'text.primary' }}
            >
              {formatDate(params.value)}
            </Typography>
            {expired && <Chip label="Expired" size="small" color="error" sx={{ height: 20 }} />}
          </Box>
        );
      }
    },
    {
      field: 'timestamp',
      headerName: 'Issued',
      flex: 1,
      minWidth: 180,
      valueGetter: (value) => formatDate(value)
    }
  ];

  if (licenseHistory.isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          py: 8,
          gap: 3
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
        <Typography variant="h6" sx={{ color: '#666' }}>Loading License History...</Typography>
      </Box>
    );
  }

  if (licenseHistory.error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Typography variant="h6" gutterBottom>Failed to load license history</Typography>
          <Typography variant="body2">{licenseHistory.error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
            }}
          >
            <HistoryIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 700, color: '#2d3748' }}>
              {name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
              View all license activity and history
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <Tooltip title="Table View"><ViewListIcon /></Tooltip>
            </ToggleButton>
            <ToggleButton value="card">
              <Tooltip title="Card View"><ViewModuleIcon /></Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar">
              <Tooltip title="Calendar View"><CalendarMonthIcon /></Tooltip>
            </ToggleButton>
            <ToggleButton value="analytics">
              <Tooltip title="Analytics & Insights"><InsightsIcon /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Chip
            label={`${filteredData.length} Records`}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 2,
              py: 2.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          />
        </Box>
      </Box>

      {/* Filter */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          background: 'white'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Search by email or product..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="product-filter-label">Product</InputLabel>
              <Select
                labelId="product-filter-label"
                value={productFilter}
                label="Product"
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <MenuItem value="all">All Products</MenuItem>
                {uniqueProducts.map(product => (
                  <MenuItem key={product} value={product}>{product}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              onClick={clearFilter}
              variant="outlined"
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {viewMode === 'table' && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            background: 'white'
          }}
        >
          <DataGrid
            rows={filteredData.map((item, index) => ({ id: item.uuid || index, ...item }))}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 }
              },
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }]
              }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                fontWeight: 700
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          />
        </Paper>
      )}

      {viewMode === 'card' && (
        <Grid container spacing={2}>
          {filteredData.slice(0, 100).map((item, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.uuid || index}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                    borderColor: '#667eea'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', wordBreak: 'break-word' }}>
                      {item.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={item.product || 'N/A'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}
                    />
                    {isExpired(item.expiry) && (
                      <Chip label="Expired" size="small" color="error" />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                      <strong>Issued:</strong> {formatDate(item.timestamp)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: isExpired(item.expiry) ? 'error.main' : '#718096' }}
                    >
                      <strong>Expiry:</strong> {formatDate(item.expiry)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredData.length > 100 && (
            <Grid size={12}>
              <Alert severity="info">
                Showing first 100 of {filteredData.length.toLocaleString()} records in card view. Use table view for full data or apply filters.
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {viewMode === 'calendar' && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            background: 'white',
            p: 3
          }}
        >
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={handlePrevMonth} sx={{ color: '#667eea' }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
              {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </Typography>
            <IconButton onClick={handleNextMonth} sx={{ color: '#667eea' }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
              <Typography variant="body2" sx={{ color: '#718096' }}>Active Licenses</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#48bb78' }} />
              <Typography variant="body2" sx={{ color: '#718096' }}>Licenses Issued</Typography>
            </Box>
          </Box>

          {/* Day Headers */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {dayNames.map(day => (
              <Grid size={12/7} key={day}>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#718096' }}>
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Grid */}
          <Grid container spacing={1}>
            {(() => {
              const { daysInMonth, startingDay } = getMonthDays(calendarDate.getFullYear(), calendarDate.getMonth());
              const cells = [];

              // Empty cells for days before the first of the month
              for (let i = 0; i < startingDay; i++) {
                cells.push(
                  <Grid size={12/7} key={`empty-${i}`}>
                    <Box sx={{ minHeight: 100 }} />
                  </Grid>
                );
              }

              // Day cells
              for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = formatDateKey(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                const dayData = calendarData[dateKey] || { active: [], issued: [] };
                const isToday = isSameDay(new Date(), new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));

                cells.push(
                  <Grid size={12/7} key={day}>
                    <Box
                      sx={{
                        minHeight: 100,
                        border: isToday ? '2px solid #667eea' : '1px solid #e2e8f0',
                        borderRadius: 2,
                        p: 1,
                        bgcolor: isToday ? 'rgba(102, 126, 234, 0.05)' : 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday ? 700 : 600,
                          color: isToday ? '#667eea' : '#2d3748',
                          mb: 1
                        }}
                      >
                        {day}
                      </Typography>

                      {dayData.active.length > 0 && (
                        <Tooltip title="Click to view active licenses">
                          <Chip
                            label={`${dayData.active.length} Active`}
                            size="small"
                            onClick={() => handleDayClick(day, 'active')}
                            sx={{
                              mb: 0.5,
                              width: '100%',
                              fontSize: '0.7rem',
                              height: 24,
                              cursor: 'pointer',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              '&:hover': { opacity: 0.9 }
                            }}
                          />
                        </Tooltip>
                      )}

                      {dayData.issued.length > 0 && (
                        <Tooltip title="Click to view issued licenses">
                          <Chip
                            label={`${dayData.issued.length} Issued`}
                            size="small"
                            onClick={() => handleDayClick(day, 'issued')}
                            sx={{
                              width: '100%',
                              fontSize: '0.7rem',
                              height: 24,
                              cursor: 'pointer',
                              bgcolor: '#48bb78',
                              color: 'white',
                              '&:hover': { opacity: 0.9 }
                            }}
                          />
                        </Tooltip>
                      )}

                      {dayData.expiring && dayData.expiring.length > 0 && (
                        <Tooltip title="Click to view expiring licenses">
                          <Chip
                            label={`${dayData.expiring.length} Expiring`}
                            size="small"
                            onClick={() => handleDayClick(day, 'expiring')}
                            sx={{
                              mt: 0.5,
                              width: '100%',
                              fontSize: '0.7rem',
                              height: 24,
                              cursor: 'pointer',
                              bgcolor: '#e53e3e',
                              color: 'white',
                              '&:hover': { opacity: 0.9 }
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Grid>
                );
              }

              return cells;
            })()}
          </Grid>
        </Paper>
      )}

      {viewMode === 'analytics' && (
        <Box>
          {/* Statistics Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimelineIcon sx={{ color: '#667eea' }} />
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Total Licenses
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {analyticsData.statistics.totalLicenses?.toLocaleString() || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`${analyticsData.statistics.activeLicenses || 0} Active`}
                      size="small"
                      sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
                    />
                    <Chip
                      label={`${analyticsData.statistics.expiredLicenses || 0} Expired`}
                      size="small"
                      sx={{ bgcolor: '#e53e3e', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  background: analyticsData.statistics.monthOverMonthChange >= 0
                    ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(56, 178, 172, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(229, 62, 62, 0.1) 0%, rgba(237, 100, 166, 0.1) 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {analyticsData.statistics.monthOverMonthChange >= 0
                      ? <TrendingUpIcon sx={{ color: '#48bb78' }} />
                      : <TrendingDownIcon sx={{ color: '#e53e3e' }} />
                    }
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      This Month
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {analyticsData.statistics.thisMonthCount || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: analyticsData.statistics.monthOverMonthChange >= 0 ? '#48bb78' : '#e53e3e',
                      fontWeight: 600,
                      mt: 1
                    }}
                  >
                    {analyticsData.statistics.monthOverMonthChange >= 0 ? '+' : ''}
                    {analyticsData.statistics.monthOverMonthChange}% vs last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(221, 107, 32, 0.1) 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningAmberIcon sx={{ color: '#ed8936' }} />
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Expiring Soon
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {analyticsData.statistics.expiringSoon || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mt: 1 }}>
                    Within 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(159, 122, 234, 0.1) 0%, rgba(237, 100, 166, 0.1) 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: '#9f7aea' }} />
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Unique Users
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {analyticsData.statistics.uniqueUsers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mt: 1 }}>
                    Avg {((analyticsData.statistics.totalLicenses || 0) / (analyticsData.statistics.uniqueUsers || 1)).toFixed(1)} licenses/user
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Anomalies Alert */}
          {analyticsData.anomalies.length > 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{
                mb: 4,
                background: 'linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(221, 107, 32, 0.1) 100%)',
                border: '1px solid #ed8936',
                '& .MuiAlert-icon': { color: '#ed8936' }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Anomalies Detected
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analyticsData.anomalies.map((anomaly, idx) => (
                  <Chip
                    key={idx}
                    label={`${anomaly.month}: ${anomaly.count} licenses (${anomaly.type === 'spike' ? '+' : ''}${anomaly.deviation}σ)`}
                    size="small"
                    sx={{
                      bgcolor: anomaly.type === 'spike' ? '#48bb78' : '#e53e3e',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                ))}
              </Box>
            </Alert>
          )}

          {/* License Issuance Over Time Chart */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  License Issuance Over Time
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Click on a point to view license details
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={issuanceGranularity}
                exclusive
                onChange={(e, value) => value && setIssuanceGranularity(value)}
                size="small"
              >
                <ToggleButton value="monthly" sx={{ textTransform: 'none', px: 2 }}>
                  Monthly
                </ToggleButton>
                <ToggleButton value="weekly" sx={{ textTransform: 'none', px: 2 }}>
                  Weekly
                </ToggleButton>
                <ToggleButton value="daily" sx={{ textTransform: 'none', px: 2 }}>
                  Daily
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={
                  issuanceGranularity === 'monthly'
                    ? analyticsData.monthlyIssuance
                    : issuanceGranularity === 'weekly'
                      ? analyticsData.weeklyIssuance
                      : analyticsData.dailyIssuance
                }>
                  <defs>
                    <linearGradient id="colorIssuance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={issuanceGranularity === 'monthly' ? 'month' : issuanceGranularity === 'weekly' ? 'week' : 'day'}
                    tick={{ fontSize: 12, fill: '#718096' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#718096' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Licenses Issued"
                    stroke="#667eea"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIssuance)"
                    activeDot={{
                      r: 8,
                      fill: '#667eea',
                      stroke: '#fff',
                      strokeWidth: 2,
                      cursor: 'pointer',
                      onClick: (e, payload) => {
                        const periodKey = issuanceGranularity === 'monthly' ? 'month' : issuanceGranularity === 'weekly' ? 'week' : 'day';
                        setSelectedChartPoint({
                          type: 'issuance',
                          period: payload.payload[periodKey],
                          granularity: issuanceGranularity
                        });
                        setChartPointDialogOpen(true);
                      }
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Active Licenses Over Time */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Active Licenses Over Time
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Click on a point to view active licenses
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={activeGranularity}
                exclusive
                onChange={(e, value) => value && setActiveGranularity(value)}
                size="small"
              >
                <ToggleButton value="monthly" sx={{ textTransform: 'none', px: 2 }}>
                  Monthly
                </ToggleButton>
                <ToggleButton value="weekly" sx={{ textTransform: 'none', px: 2 }}>
                  Weekly
                </ToggleButton>
                <ToggleButton value="daily" sx={{ textTransform: 'none', px: 2 }}>
                  Daily
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={
                  activeGranularity === 'monthly'
                    ? analyticsData.activeLicensesOverTime
                    : activeGranularity === 'weekly'
                      ? analyticsData.activeLicensesWeekly
                      : analyticsData.activeLicensesDaily
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={activeGranularity === 'monthly' ? 'month' : activeGranularity === 'weekly' ? 'week' : 'day'}
                    tick={{ fontSize: 12, fill: '#718096' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#718096' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeCount"
                    name="Active Licenses"
                    stroke="#48bb78"
                    strokeWidth={3}
                    dot={{ fill: '#48bb78', strokeWidth: 2 }}
                    activeDot={{
                      r: 8,
                      fill: '#48bb78',
                      stroke: '#fff',
                      strokeWidth: 2,
                      cursor: 'pointer',
                      onClick: (e, payload) => {
                        const periodKey = activeGranularity === 'monthly' ? 'month' : activeGranularity === 'weekly' ? 'week' : 'day';
                        setSelectedChartPoint({
                          type: 'active',
                          period: payload.payload[periodKey],
                          granularity: activeGranularity
                        });
                        setChartPointDialogOpen(true);
                      }
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Active Users by Date */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Who Is Active by Date
                </Typography>
              </Box>
              <TextField
                type="date"
                value={activeUsersDate}
                onChange={(e) => setActiveUsersDate(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon sx={{ color: '#718096', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 180 }}
              />
            </Box>

            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <GroupIcon sx={{ color: '#667eea', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                        Active Users
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      {activeUsersByDate.totalActive}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: 'linear-gradient(135deg, rgba(72, 187, 120, 0.05) 0%, rgba(56, 178, 172, 0.05) 100%)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CategoryIcon sx={{ color: '#48bb78', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                        Products in Use
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      {activeUsersByDate.byProduct.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: 'linear-gradient(135deg, rgba(159, 122, 234, 0.05) 0%, rgba(237, 100, 166, 0.05) 100%)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <EventIcon sx={{ color: '#9f7aea', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                        Selected Date
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                      {new Date(activeUsersDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Users by Product Chart */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 2 }}>
                  Users by Product
                </Typography>
                {activeUsersByDate.byProduct.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={activeUsersByDate.byProduct.slice(0, 10)}
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#718096' }} />
                        <YAxis
                          dataKey="product"
                          type="category"
                          tick={{ fontSize: 11, fill: '#718096' }}
                          width={100}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value} user(s)`, 'Active']}
                        />
                        <Bar
                          dataKey="userCount"
                          fill="#667eea"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, color: '#718096' }}>
                    <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2">No active licenses on this date</Typography>
                  </Box>
                )}
              </Grid>

              {/* Active Users List */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 2 }}>
                  Active Users ({activeUsersByDate.users.length})
                </Typography>
                {activeUsersByDate.users.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 300, border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>User</TableCell>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Products</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Licenses</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeUsersByDate.users.map((user, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontSize: '0.85rem' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ fontSize: 16, color: '#718096' }} />
                                {user.email}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {user.products.slice(0, 3).map((product, pIdx) => (
                                  <Chip
                                    key={pIdx}
                                    label={product}
                                    size="small"
                                    sx={{
                                      bgcolor: chartColors[pIdx % chartColors.length] + '20',
                                      color: chartColors[pIdx % chartColors.length],
                                      fontSize: '0.7rem',
                                      height: 22,
                                      fontWeight: 600
                                    }}
                                  />
                                ))}
                                {user.products.length > 3 && (
                                  <Chip
                                    label={`+${user.products.length - 3}`}
                                    size="small"
                                    sx={{ bgcolor: '#edf2f7', fontSize: '0.7rem', height: 22 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={user.licenseCount}
                                size="small"
                                sx={{
                                  bgcolor: '#667eea',
                                  color: 'white',
                                  fontWeight: 600,
                                  minWidth: 32
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, color: '#718096', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    <GroupIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2">No users with active licenses on this date</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* User Activity Explorer */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                User Activity Explorer
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Autocomplete
                  value={selectedUser}
                  onChange={(e, newValue) => {
                    setSelectedUser(newValue);
                    setSelectedPeriod(null);
                  }}
                  options={analyticsData?.allUsers || []}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      size="small"
                      sx={{ minWidth: 280 }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: '#718096', fontSize: 20 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  sx={{ minWidth: 280 }}
                />
                {selectedUser && (
                  <ToggleButtonGroup
                    value={userActivityGranularity}
                    exclusive
                    onChange={(e, value) => {
                      if (value) {
                        setUserActivityGranularity(value);
                        setSelectedPeriod(null);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton value="monthly" sx={{ textTransform: 'none', px: 2 }}>
                      Monthly
                    </ToggleButton>
                    <ToggleButton value="weekly" sx={{ textTransform: 'none', px: 2 }}>
                      Weekly
                    </ToggleButton>
                    <ToggleButton value="daily" sx={{ textTransform: 'none', px: 2 }}>
                      Daily
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>
            </Box>

            {!selectedUser ? (
              <Box sx={{ textAlign: 'center', py: 6, color: '#718096' }}>
                <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body1">
                  Select a user to explore their license activity over time
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* User Stats Summary */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<PersonIcon />}
                      label={selectedUser}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${userActivityData.totalLicenses} Total Licenses`}
                      sx={{ bgcolor: '#edf2f7' }}
                    />
                    {selectedPeriod && (
                      <Chip
                        label={`Viewing: ${selectedPeriod}`}
                        color="secondary"
                        onDelete={() => setSelectedPeriod(null)}
                      />
                    )}
                  </Box>
                </Grid>

                {/* Activity Chart */}
                <Grid size={{ xs: 12, md: selectedPeriod ? 6 : 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 2 }}>
                    License Requests Over Time (Click bar to see details)
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={
                          userActivityGranularity === 'monthly'
                            ? userActivityData.monthlyActivity
                            : userActivityGranularity === 'weekly'
                              ? userActivityData.weeklyActivity
                              : userActivityData.dailyActivity
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: '#718096' }}
                          tickLine={{ stroke: '#e2e8f0' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#718096' }}
                          tickLine={{ stroke: '#e2e8f0' }}
                          allowDecimals={false}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value} license(s)`, 'Requests']}
                        />
                        <Bar
                          dataKey="count"
                          name="License Requests"
                          fill="#667eea"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(data) => {
                            if (data && data.period) {
                              setSelectedPeriod(data.period);
                            }
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* License List for Selected Period */}
                {selectedPeriod && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568' }}>
                        Licenses in {selectedPeriod} ({selectedPeriodLicenses.length})
                      </Typography>
                      <IconButton size="small" onClick={() => setSelectedPeriod(null)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                      {selectedPeriodLicenses.map((license, idx) => {
                        const issued = new Date(license.timestamp);
                        const expiry = new Date(license.expiry);
                        const now = new Date();
                        const isActive = expiry >= now;
                        const durationDays = Math.round((expiry - issued) / (1000 * 60 * 60 * 24));

                        return (
                          <Card
                            key={idx}
                            variant="outlined"
                            sx={{
                              mb: 1.5,
                              border: '1px solid',
                              borderColor: isActive ? '#c6f6d5' : '#fed7d7',
                              bgcolor: isActive ? '#f0fff4' : '#fff5f5',
                              '&:last-child': { mb: 0 }
                            }}
                          >
                            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Chip
                                  label={license.product}
                                  size="small"
                                  sx={{
                                    bgcolor: '#667eea',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <Chip
                                  label={isActive ? 'Active' : 'Expired'}
                                  size="small"
                                  sx={{
                                    bgcolor: isActive ? '#48bb78' : '#e53e3e',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20
                                  }}
                                />
                              </Box>
                              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                                    Issued
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    {issued.toLocaleDateString()} {issued.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                                    Expiry
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    {expiry.toLocaleDateString()} {expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="caption" sx={{ color: '#718096' }}>
                                    Duration: <strong>{durationDays} days</strong>
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  </Grid>
                )}

                {/* All User Licenses (when no period selected) */}
                {!selectedPeriod && userActivityData.allLicenses.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 2 }}>
                      All Licenses ({userActivityData.allLicenses.length})
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300, border: '1px solid #e2e8f0', borderRadius: 1 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Issued</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Expiry</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Duration</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userActivityData.allLicenses.slice(0, 50).map((license, idx) => {
                            const issued = new Date(license.timestamp);
                            const expiry = new Date(license.expiry);
                            const durationDays = Math.round((expiry - issued) / (1000 * 60 * 60 * 24));
                            return (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  <Chip
                                    label={license.product}
                                    size="small"
                                    sx={{ bgcolor: '#edf2f7', fontSize: '0.75rem' }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                  {issued.toLocaleDateString()}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                  {expiry.toLocaleDateString()}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                  {durationDays} days
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {userActivityData.allLicenses.length > 50 && (
                      <Typography variant="caption" sx={{ color: '#718096', mt: 1, display: 'block' }}>
                        Showing first 50 of {userActivityData.allLicenses.length} licenses
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>

          {/* Product Distribution and Top Users */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Product Distribution Pie Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CategoryIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Product Distribution
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.productDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="product"
                      >
                        {analyticsData.productDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                        formatter={(value, name, props) => {
                          const total = analyticsData.productDistribution.reduce((sum, item) => sum + item.count, 0);
                          const percent = ((value / total) * 100).toFixed(1);
                          return [`${value} licenses (${percent}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Divider sx={{ my: 2 }} />
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc', width: 50 }}></TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>
                          <TableSortLabel
                            active={productSortField === 'product'}
                            direction={productSortField === 'product' ? productSortDirection : 'asc'}
                            onClick={() => {
                              if (productSortField === 'product') {
                                setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setProductSortField('product');
                                setProductSortDirection('asc');
                              }
                            }}
                          >
                            Product
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }} align="right">
                          <TableSortLabel
                            active={productSortField === 'count'}
                            direction={productSortField === 'count' ? productSortDirection : 'desc'}
                            onClick={() => {
                              if (productSortField === 'count') {
                                setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setProductSortField('count');
                                setProductSortDirection('desc');
                              }
                            }}
                          >
                            Count
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }} align="right">
                          <TableSortLabel
                            active={productSortField === 'percent'}
                            direction={productSortField === 'percent' ? productSortDirection : 'desc'}
                            onClick={() => {
                              if (productSortField === 'percent') {
                                setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setProductSortField('percent');
                                setProductSortDirection('desc');
                              }
                            }}
                          >
                            %
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const total = analyticsData.productDistribution.reduce((sum, item) => sum + item.count, 0);
                        const dataWithIndex = analyticsData.productDistribution.map((item, idx) => ({
                          ...item,
                          originalIndex: idx,
                          percent: (item.count / total) * 100
                        }));
                        const sorted = [...dataWithIndex].sort((a, b) => {
                          const multiplier = productSortDirection === 'asc' ? 1 : -1;
                          if (productSortField === 'product') {
                            return multiplier * a.product.localeCompare(b.product);
                          } else if (productSortField === 'count') {
                            return multiplier * (a.count - b.count);
                          } else {
                            return multiplier * (a.percent - b.percent);
                          }
                        });
                        return sorted.map((item) => (
                          <TableRow key={item.product} hover>
                            <TableCell>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '4px',
                                  bgcolor: chartColors[item.originalIndex % chartColors.length]
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{item.product}</TableCell>
                            <TableCell align="right">{item.count.toLocaleString()}</TableCell>
                            <TableCell align="right">{item.percent.toFixed(1)}%</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Top Users Bar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Top License Users
                  </Typography>
                </Box>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.topUsers}
                      layout="vertical"
                      margin={{ left: 100, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#718096' }} />
                      <YAxis
                        type="category"
                        dataKey="email"
                        tick={{ fontSize: 11, fill: '#718096' }}
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Licenses"
                        fill="#667eea"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Additional Insights */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 3 }}>
              License Duration Insights
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.1)'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                    {analyticsData.licenseDurationStats.avgDuration || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                    Avg Duration (days)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(72, 187, 120, 0.1)'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#48bb78' }}>
                    {analyticsData.licenseDurationStats.maxDuration || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                    Max Duration (days)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(237, 137, 54, 0.1)'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#ed8936' }}>
                    {analyticsData.licenseDurationStats.minDuration || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                    Min Duration (days)
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
              Statistical Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" sx={{ color: '#718096' }}>Monthly Average</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  {analyticsData.statistics.mean || 0} licenses
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" sx={{ color: '#718096' }}>Std Deviation</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  {analyticsData.statistics.stdDev || 0}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" sx={{ color: '#718096' }}>Products</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  {analyticsData.statistics.uniqueProducts || 0}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" sx={{ color: '#718096' }}>Anomalies Found</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: analyticsData.anomalies.length > 0 ? '#ed8936' : '#2d3748' }}>
                  {analyticsData.anomalies.length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Day of Week & Peak Hours Analysis */}
          <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
            {/* Day of Week Radar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <DateRangeIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Day of Week Distribution
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analyticsData.dayOfWeekData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="day" tick={{ fontSize: 12, fill: '#718096' }} />
                      <PolarRadiusAxis tick={{ fontSize: 10, fill: '#718096' }} />
                      <Radar
                        name="Licenses"
                        dataKey="count"
                        stroke="#667eea"
                        fill="#667eea"
                        fillOpacity={0.4}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                        formatter={(value, name, props) => [`${value} licenses`, props.payload.fullDay]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Peak Hours Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ color: '#667eea' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                      Peak Usage Hours
                    </Typography>
                  </Box>
                  {analyticsData.peakHour && (
                    <Chip
                      label={`Peak: ${analyticsData.peakHour.label}`}
                      size="small"
                      sx={{
                        bgcolor: '#667eea',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#718096' }}
                        interval={2}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Licenses"
                        fill="#38b2ac"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Product Trends Over Time */}
          {analyticsData.productTrends.length > 0 && analyticsData.allProducts.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 3,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AutoGraphIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Product Trends Over Time
                </Typography>
              </Box>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.productTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8
                      }}
                    />
                    <Legend />
                    {analyticsData.allProducts.map((product, idx) => (
                      <Area
                        key={product}
                        type="monotone"
                        dataKey={product}
                        stackId="1"
                        stroke={chartColors[idx % chartColors.length]}
                        fill={chartColors[idx % chartColors.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}

          {/* Quarterly Comparison & Year over Year */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Quarterly Comparison */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <EventIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Quarterly Comparison
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.quarterlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fontSize: 11, fill: '#718096' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Licenses"
                        fill="#764ba2"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Year over Year */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 3,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TimelineIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Year over Year
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#718096' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Licenses"
                        fill="#48bb78"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* User Retention Analysis */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <RepeatIcon sx={{ color: '#667eea' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                User Retention Analysis
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Retention Stats */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea' }}>
                    {analyticsData.userRetention.retentionRate}%
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#718096', fontWeight: 600, mt: 1 }}>
                    Repeat User Rate
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#48bb78' }}>
                        {analyticsData.userRetention.repeatUserCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Repeat Users
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed8936' }}>
                        {analyticsData.userRetention.singleUserCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        One-time Users
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Top Repeat Users */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                  Top Repeat Users
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 250, overflow: 'auto' }}>
                  {analyticsData.repeatUsers.map((user, idx) => (
                    <Box
                      key={user.email}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: idx % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'white',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={`#${idx + 1}`}
                          size="small"
                          sx={{ bgcolor: chartColors[idx % chartColors.length], color: 'white', fontWeight: 600 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={`${user.licenseCount} licenses`}
                          size="small"
                          sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
                        />
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          {user.firstLicense.toLocaleDateString()} - {user.lastLicense.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {analyticsData.repeatUsers.length === 0 && (
                    <Typography variant="body2" sx={{ color: '#718096', textAlign: 'center', py: 2 }}>
                      No repeat users found
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* License Extension Behavior Analysis */}
          {(analyticsData.extensionBehavior.extenders.length > 0 || analyticsData.extensionBehavior.renewers.length > 0) && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 3,
                mb: 4,
                background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.03) 0%, rgba(56, 178, 172, 0.03) 100%)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CompareArrowsIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  License Extension vs Renewal Behavior
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                Compares users who <strong>extend</strong> licenses (request new license before current expires) vs users who <strong>renew</strong> (request after expiry).
              </Typography>

              {/* Summary Stats */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(72, 187, 120, 0.1)',
                      border: '1px solid rgba(72, 187, 120, 0.3)'
                    }}
                  >
                    <UpdateIcon sx={{ fontSize: 32, color: '#48bb78', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#48bb78' }}>
                      {analyticsData.extensionBehavior.stats.totalExtensions}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Extensions
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Avg {analyticsData.extensionBehavior.stats.avgExtensionOverlapDays} days overlap
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(237, 137, 54, 0.1)',
                      border: '1px solid rgba(237, 137, 54, 0.3)'
                    }}
                  >
                    <TimerOffIcon sx={{ fontSize: 32, color: '#ed8936', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed8936' }}>
                      {analyticsData.extensionBehavior.stats.totalRenewals}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Renewals
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Avg {analyticsData.extensionBehavior.stats.avgRenewalGapDays} days gap
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                      {analyticsData.extensionBehavior.extenders.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Extender Users
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Proactive behavior
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(159, 122, 234, 0.1)',
                      border: '1px solid rgba(159, 122, 234, 0.3)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 32, color: '#9f7aea', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#9f7aea' }}>
                      {analyticsData.extensionBehavior.renewers.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                      Renewer Users
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Reactive behavior
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Behavior Distribution Chart */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Extensions', value: analyticsData.extensionBehavior.stats.totalExtensions, color: '#48bb78' },
                            { name: 'Renewals', value: analyticsData.extensionBehavior.stats.totalRenewals, color: '#ed8936' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#48bb78" />
                          <Cell fill="#ed8936" />
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                    Behavior Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert
                      severity="success"
                      icon={<UpdateIcon />}
                      sx={{
                        bgcolor: 'rgba(72, 187, 120, 0.1)',
                        border: '1px solid rgba(72, 187, 120, 0.3)',
                        '& .MuiAlert-icon': { color: '#48bb78' }
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Extenders</strong> request new licenses an average of <strong>{analyticsData.extensionBehavior.stats.avgExtensionOverlapDays} days</strong> before their current license expires, ensuring continuous coverage.
                      </Typography>
                    </Alert>
                    <Alert
                      severity="warning"
                      icon={<TimerOffIcon />}
                      sx={{
                        bgcolor: 'rgba(237, 137, 54, 0.1)',
                        border: '1px solid rgba(237, 137, 54, 0.3)',
                        '& .MuiAlert-icon': { color: '#ed8936' }
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Renewers</strong> wait an average of <strong>{analyticsData.extensionBehavior.stats.avgRenewalGapDays} days</strong> after expiry before requesting a new license, resulting in coverage gaps.
                      </Typography>
                    </Alert>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Two-column layout for extenders and renewers */}
              <Grid container spacing={3}>
                {/* Extenders List */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <UpdateIcon sx={{ color: '#48bb78' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                      Top Extenders (Proactive)
                    </Typography>
                    <Chip
                      label={`${analyticsData.extensionBehavior.extenders.length} users`}
                      size="small"
                      sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {analyticsData.extensionBehavior.extenders.slice(0, 10).map((user, idx) => (
                      <Box
                        key={user.email}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'rgba(72, 187, 120, 0.05)',
                          border: '1px solid rgba(72, 187, 120, 0.2)',
                          '&:hover': { bgcolor: 'rgba(72, 187, 120, 0.1)' }
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {user.products.slice(0, 3).map(product => (
                              <Chip
                                key={product}
                                label={product}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }}
                              />
                            ))}
                            {user.products.length > 3 && (
                              <Chip
                                label={`+${user.products.length - 3}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                          <Tooltip title={`${user.extensionRate}% extension rate, avg ${user.avgOverlapDays} days overlap`}>
                            <Chip
                              label={`${user.extensions} ext`}
                              size="small"
                              sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
                            />
                          </Tooltip>
                          <Tooltip title="View raw records">
                            <IconButton
                              size="small"
                              onClick={() => handleViewBehaviorRecords(user)}
                              sx={{
                                bgcolor: 'rgba(72, 187, 120, 0.1)',
                                '&:hover': { bgcolor: 'rgba(72, 187, 120, 0.2)' }
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 16, color: '#48bb78' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {analyticsData.extensionBehavior.extenders.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#718096', textAlign: 'center', py: 2 }}>
                        No extenders found
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Renewers List */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TimerOffIcon sx={{ color: '#ed8936' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                      Top Renewers (Reactive)
                    </Typography>
                    <Chip
                      label={`${analyticsData.extensionBehavior.renewers.length} users`}
                      size="small"
                      sx={{ bgcolor: '#ed8936', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {analyticsData.extensionBehavior.renewers.slice(0, 10).map((user, idx) => (
                      <Box
                        key={user.email}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'rgba(237, 137, 54, 0.05)',
                          border: '1px solid rgba(237, 137, 54, 0.2)',
                          '&:hover': { bgcolor: 'rgba(237, 137, 54, 0.1)' }
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {user.products.slice(0, 3).map(product => (
                              <Chip
                                key={product}
                                label={product}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }}
                              />
                            ))}
                            {user.products.length > 3 && (
                              <Chip
                                label={`+${user.products.length - 3}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                          <Tooltip title={`${100 - parseFloat(user.extensionRate)}% renewal rate, avg ${user.avgGapDays} days gap`}>
                            <Chip
                              label={`${user.renewals} ren`}
                              size="small"
                              sx={{ bgcolor: '#ed8936', color: 'white', fontWeight: 600 }}
                            />
                          </Tooltip>
                          <Tooltip title="View raw records">
                            <IconButton
                              size="small"
                              onClick={() => handleViewBehaviorRecords(user)}
                              sx={{
                                bgcolor: 'rgba(237, 137, 54, 0.1)',
                                '&:hover': { bgcolor: 'rgba(237, 137, 54, 0.2)' }
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 16, color: '#ed8936' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {analyticsData.extensionBehavior.renewers.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#718096', textAlign: 'center', py: 2 }}>
                        No renewers found
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Recent Extension/Renewal Events */}
              {(analyticsData.extensionBehavior.extensionInstances.length > 0 || analyticsData.extensionBehavior.renewalInstances.length > 0) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                    Recent Activity
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[...analyticsData.extensionBehavior.extensionInstances, ...analyticsData.extensionBehavior.renewalInstances]
                      .sort((a, b) => (b.currLicense?.startDate || 0) - (a.currLicense?.startDate || 0))
                      .slice(0, 15)
                      .map((event, idx) => {
                        const isExtension = 'overlapDays' in event;
                        return (
                          <Tooltip
                            key={idx}
                            title={
                              isExtension
                                ? `Extended ${event.product}: ${event.overlapDays} days before expiry`
                                : `Renewed ${event.product}: ${event.gapDays} days after expiry`
                            }
                          >
                            <Chip
                              icon={isExtension ? <UpdateIcon sx={{ fontSize: 16 }} /> : <TimerOffIcon sx={{ fontSize: 16 }} />}
                              label={`${event.email.split('@')[0]} - ${event.product}`}
                              size="small"
                              sx={{
                                bgcolor: isExtension ? 'rgba(72, 187, 120, 0.15)' : 'rgba(237, 137, 54, 0.15)',
                                color: isExtension ? '#2f855a' : '#c05621',
                                fontWeight: 500,
                                '& .MuiChip-icon': {
                                  color: isExtension ? '#48bb78' : '#ed8936'
                                }
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                  </Box>
                </>
              )}
            </Paper>
          )}

          {/* Upcoming Expirations Timeline */}
          {analyticsData.expirationTimeline.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 3,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningAmberIcon sx={{ color: '#ed8936' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Upcoming Expirations (Next 90 Days)
                  </Typography>
                </Box>
                <Chip
                  label={`${analyticsData.upcomingExpirations.length} total`}
                  size="small"
                  sx={{ bgcolor: '#ed8936', color: 'white', fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.expirationTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Expiring Licenses"
                      fill="#ed8936"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                Immediate Attention Required
                <Typography component="span" variant="caption" sx={{ color: '#718096', ml: 1 }}>
                  (click for details)
                </Typography>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analyticsData.upcomingExpirations.slice(0, 10).map((item, idx) => (
                  <Tooltip
                    key={idx}
                    title={`${item.product} - Expires ${item.expiryDate.toLocaleDateString()} - Click for details`}
                  >
                    <Chip
                      label={`${item.email.split('@')[0]} (${item.daysUntilExpiry}d)`}
                      size="small"
                      onClick={() => {
                        setSelectedExpiringLicense(item);
                        setExpiringLicenseDialogOpen(true);
                      }}
                      sx={{
                        bgcolor: item.daysUntilExpiry <= 7 ? '#e53e3e' : item.daysUntilExpiry <= 14 ? '#ed8936' : '#38b2ac',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.85,
                          transform: 'scale(1.02)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </Tooltip>
                ))}
                {analyticsData.upcomingExpirations.length > 10 && (
                  <Chip
                    label={`+${analyticsData.upcomingExpirations.length - 10} more`}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#718096', color: '#718096' }}
                  />
                )}
              </Box>
            </Paper>
          )}

          {/* Forecast */}
          {analyticsData.forecast.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUpIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Forecast (Next 3 Months)
                </Typography>
                <Chip
                  label="Based on recent trends"
                  size="small"
                  sx={{ bgcolor: 'rgba(102, 126, 234, 0.2)', color: '#667eea', fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[...analyticsData.monthlyIssuance.slice(-6), ...analyticsData.forecast]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8
                      }}
                      formatter={(value, name, props) => [
                        `${value} licenses`,
                        props.payload.isForecast ? 'Forecast' : 'Actual'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Licenses"
                      fill={(entry) => entry.isForecast ? '#9f7aea' : '#667eea'}
                      radius={[4, 4, 0, 0]}
                    >
                      {[...analyticsData.monthlyIssuance.slice(-6), ...analyticsData.forecast].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isForecast ? '#9f7aea' : '#667eea'}
                          fillOpacity={entry.isForecast ? 0.6 : 1}
                        />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ed64a6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {analyticsData.forecast.map((item, idx) => (
                  <Grid size={{ xs: 4 }} key={item.month}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(159, 122, 234, 0.1)',
                        border: '1px dashed #9f7aea'
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#9f7aea' }}>
                        {item.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                        {item.month}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>
      )}

      {/* Dialog for showing users */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dialogType === 'active' ? 'Active Licenses' : 'Licenses Issued'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={getSelectedDayLicenses().map((license, index) => ({
                id: license.uuid || index,
                email: license.email,
                product: license.product,
                issued: license.timestamp,
                expiry: license.expiry
              }))}
              columns={[
                {
                  field: 'email',
                  headerName: 'User',
                  flex: 1,
                  minWidth: 200,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: '#718096' }} />
                      <Typography variant="body2">{params.value}</Typography>
                    </Box>
                  )
                },
                {
                  field: 'product',
                  headerName: 'Product',
                  width: 120,
                  renderCell: (params) => (
                    <Chip
                      label={params.value}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}
                    />
                  )
                },
                {
                  field: 'issued',
                  headerName: 'Issued',
                  width: 160,
                  valueFormatter: (value) => formatDate(value)
                },
                {
                  field: 'expiry',
                  headerName: 'Expiry',
                  width: 160,
                  valueFormatter: (value) => formatDate(value)
                }
              ]}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'email', sort: 'asc' }]
                }
              }}
              pageSizeOptions={[10, 25, 50]}
              density="compact"
              disableRowSelectionOnClick
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#f7fafc',
                  fontWeight: 600
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.05)'
                }
              }}
              localeText={{
                noRowsLabel: 'No licenses found for this day.'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#667eea' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chart Point Details Dialog */}
      <Dialog
        open={chartPointDialogOpen}
        onClose={() => {
          setChartPointDialogOpen(false);
          setSelectedChartPoint(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedChartPoint?.type === 'issuance' ? 'Licenses Issued' : 'Active Licenses'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              {selectedChartPoint?.granularity === 'monthly' ? 'Month: ' : selectedChartPoint?.granularity === 'weekly' ? 'Week of: ' : 'Date: '}
              {selectedChartPoint?.period}
              {' • '}{chartPointLicenses.totalCount} license{chartPointLicenses.totalCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <IconButton onClick={() => {
            setChartPointDialogOpen(false);
            setSelectedChartPoint(null);
          }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Product Summary Table */}
          {chartPointLicenses.byProduct.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 1.5 }}>
                Summary by Product
              </Typography>
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f7fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chartPointLicenses.byProduct.map((item, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            label={item.product}
                            size="small"
                            sx={{
                              bgcolor: chartColors[idx % chartColors.length] + '20',
                              color: chartColors[idx % chartColors.length],
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {item.count}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#718096' }}>
                          {((item.count / chartPointLicenses.totalCount) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* License Details List */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', mb: 1.5 }}>
            License Details ({chartPointLicenses.licenses.length})
          </Typography>
          <Box sx={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
            {chartPointLicenses.licenses.length > 0 ? (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Issued</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Expiry</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f7fafc' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chartPointLicenses.licenses.map((license, idx) => {
                    const issued = new Date(license.timestamp);
                    const expiry = new Date(license.expiry);
                    const now = new Date();
                    const isActive = expiry >= now;

                    return (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#718096' }} />
                            {license.email}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={license.product}
                            size="small"
                            sx={{
                              bgcolor: '#edf2f7',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#4a5568' }}>
                          {issued.toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#4a5568' }}>
                          {expiry.toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={isActive ? 'Active' : 'Expired'}
                            size="small"
                            sx={{
                              bgcolor: isActive ? '#48bb78' : '#e53e3e',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 20
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: '#718096' }}>
                <Typography variant="body2">No licenses found for this period</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setChartPointDialogOpen(false);
              setSelectedChartPoint(null);
            }}
            sx={{ color: '#667eea' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expiring License Detail Dialog */}
      <Dialog
        open={expiringLicenseDialogOpen}
        onClose={() => {
          setExpiringLicenseDialogOpen(false);
          setSelectedExpiringLicense(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              License Expiring Soon
            </Typography>
            {selectedExpiringLicense && (
              <Chip
                label={`${selectedExpiringLicense.daysUntilExpiry} day${selectedExpiringLicense.daysUntilExpiry !== 1 ? 's' : ''} remaining`}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: selectedExpiringLicense.daysUntilExpiry <= 7 ? '#e53e3e' : selectedExpiringLicense.daysUntilExpiry <= 14 ? '#ed8936' : '#38b2ac',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          <IconButton onClick={() => {
            setExpiringLicenseDialogOpen(false);
            setSelectedExpiringLicense(null);
          }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedExpiringLicense && (
            <Box>
              {/* User Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  User
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <PersonIcon sx={{ color: '#667eea' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedExpiringLicense.email}
                  </Typography>
                </Box>
              </Box>

              {/* Product Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Product
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedExpiringLicense.product}
                    sx={{
                      bgcolor: '#667eea',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>

              {/* Date Details */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ p: 2, bgcolor: '#f7fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Issued
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {new Date(selectedExpiringLicense.timestamp).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      {new Date(selectedExpiringLicense.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2,
                    bgcolor: selectedExpiringLicense.daysUntilExpiry <= 7 ? '#fff5f5' : selectedExpiringLicense.daysUntilExpiry <= 14 ? '#fffaf0' : '#f0fff4',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: selectedExpiringLicense.daysUntilExpiry <= 7 ? '#fed7d7' : selectedExpiringLicense.daysUntilExpiry <= 14 ? '#feebc8' : '#c6f6d5'
                  }}>
                    <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Expiry
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedExpiringLicense.expiryDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: selectedExpiringLicense.daysUntilExpiry <= 7 ? '#e53e3e' : selectedExpiringLicense.daysUntilExpiry <= 14 ? '#dd6b20' : '#38a169',
                      fontWeight: 600
                    }}>
                      {selectedExpiringLicense.daysUntilExpiry} day{selectedExpiringLicense.daysUntilExpiry !== 1 ? 's' : ''} left
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* License Duration */}
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f7fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  License Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {Math.round((selectedExpiringLicense.expiryDate - new Date(selectedExpiringLicense.timestamp)) / (1000 * 60 * 60 * 24))} days
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setExpiringLicenseDialogOpen(false);
              setSelectedExpiringLicense(null);
            }}
            sx={{ color: '#667eea' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Behavior Records Dialog */}
      <Dialog
        open={behaviorDialogOpen}
        onClose={() => setBehaviorDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedBehaviorUser?.behavior === 'extender' ? (
                <UpdateIcon sx={{ color: '#48bb78' }} />
              ) : (
                <TimerOffIcon sx={{ color: '#ed8936' }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                License Records: {selectedBehaviorUser?.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={`${selectedBehaviorUser?.extensions || 0} Extensions`}
                size="small"
                sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
              />
              <Chip
                label={`${selectedBehaviorUser?.renewals || 0} Renewals`}
                size="small"
                sx={{ bgcolor: '#ed8936', color: 'white', fontWeight: 600 }}
              />
              <Chip
                label={selectedBehaviorUser?.behavior === 'extender' ? 'Proactive User' : 'Reactive User'}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: selectedBehaviorUser?.behavior === 'extender' ? '#48bb78' : '#ed8936',
                  color: selectedBehaviorUser?.behavior === 'extender' ? '#48bb78' : '#ed8936',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
          <IconButton onClick={() => setBehaviorDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBehaviorUser && (() => {
            const records = getUserBehaviorRecords(selectedBehaviorUser.email);
            return (
              <Box>
                {/* Extensions Section */}
                {records.extensions.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <UpdateIcon sx={{ color: '#48bb78' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                        Extensions (Proactive - Before Expiry)
                      </Typography>
                      <Chip
                        label={`${records.extensions.length} records`}
                        size="small"
                        sx={{ bgcolor: '#48bb78', color: 'white' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {records.extensions.map((record, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid rgba(72, 187, 120, 0.3)',
                            borderRadius: 2,
                            bgcolor: 'rgba(72, 187, 120, 0.05)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              label={record.product}
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                            <Chip
                              label={`${record.overlapDays} days overlap`}
                              size="small"
                              sx={{ bgcolor: '#48bb78', color: 'white', fontWeight: 600 }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            {/* Previous License */}
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                                Previous License
                              </Typography>
                              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Start:</strong> {record.prevLicense.startDate.toLocaleDateString()} {record.prevLicense.startDate.toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e53e3e' }}>
                                  <strong>Expiry:</strong> {record.prevLicense.endDate.toLocaleDateString()} {record.prevLicense.endDate.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Grid>
                            {/* Arrow */}
                            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ArrowForwardIcon sx={{ color: '#48bb78', fontSize: 32 }} />
                            </Grid>
                            {/* New License */}
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                                Extended License
                              </Typography>
                              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #48bb78' }}>
                                <Typography variant="body2" sx={{ mb: 0.5, color: '#48bb78' }}>
                                  <strong>Start:</strong> {record.currLicense.startDate.toLocaleDateString()} {record.currLicense.startDate.toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Expiry:</strong> {record.currLicense.endDate.toLocaleDateString()} {record.currLicense.endDate.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Renewals Section */}
                {records.renewals.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TimerOffIcon sx={{ color: '#ed8936' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                        Renewals (Reactive - After Expiry)
                      </Typography>
                      <Chip
                        label={`${records.renewals.length} records`}
                        size="small"
                        sx={{ bgcolor: '#ed8936', color: 'white' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {records.renewals.map((record, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid rgba(237, 137, 54, 0.3)',
                            borderRadius: 2,
                            bgcolor: 'rgba(237, 137, 54, 0.05)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              label={record.product}
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                            <Chip
                              label={`${record.gapDays} days gap`}
                              size="small"
                              sx={{ bgcolor: '#ed8936', color: 'white', fontWeight: 600 }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            {/* Previous License */}
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                                Expired License
                              </Typography>
                              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e53e3e' }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Start:</strong> {record.prevLicense.startDate.toLocaleDateString()} {record.prevLicense.startDate.toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e53e3e' }}>
                                  <strong>Expired:</strong> {record.prevLicense.endDate.toLocaleDateString()} {record.prevLicense.endDate.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Grid>
                            {/* Arrow with gap indicator */}
                            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#ed8936', fontWeight: 600, mb: 0.5 }}>
                                {record.gapDays}d gap
                              </Typography>
                              <ArrowForwardIcon sx={{ color: '#ed8936', fontSize: 32 }} />
                            </Grid>
                            {/* New License */}
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                                Renewed License
                              </Typography>
                              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #ed8936' }}>
                                <Typography variant="body2" sx={{ mb: 0.5, color: '#ed8936' }}>
                                  <strong>Start:</strong> {record.currLicense.startDate.toLocaleDateString()} {record.currLicense.startDate.toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Expiry:</strong> {record.currLicense.endDate.toLocaleDateString()} {record.currLicense.endDate.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                {records.extensions.length === 0 && records.renewals.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#718096', textAlign: 'center', py: 4 }}>
                    No extension or renewal records found for this user.
                  </Typography>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBehaviorDialogOpen(false)} sx={{ color: '#667eea' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
