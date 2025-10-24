import { useState, useMemo } from 'react';
// Import specific components for better tree shaking
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import Pagination from '@mui/material/Pagination';
import TablePagination from '@mui/material/TablePagination';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useOktaAuth } from '@okta/okta-react';
import { useProtectedApiGet, useProtectedApiMutation } from '../hooks/useApi';

export default function OnboardNewUser() {
  const { authState } = useOktaAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    login: '',
    mobilePhone: '',
    personalEmail: '',
    manager: '',
    jobTitle: '',
    status: 'STAGED',
    department: '',
    subsidiary: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [userExists, setUserExists] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle', 'checking', 'valid', 'invalid'
  const [showGoogleUsers, setShowGoogleUsers] = useState(false);
  const [showOktaUsers, setShowOktaUsers] = useState(false);
  const [googleSearchTerm, setGoogleSearchTerm] = useState('');
  const [oktaSearchTerm, setOktaSearchTerm] = useState('');
  const [googlePage, setGooglePage] = useState(0);
  const [oktaPage, setOktaPage] = useState(0);
  const [googleRowsPerPage, setGoogleRowsPerPage] = useState(25);
  const [oktaRowsPerPage, setOktaRowsPerPage] = useState(25);

  const steps = ['Personal Info', 'Contact Details', 'Organization Details', 'Review & Submit'];

  // Fetch Okta users for email validation
  const oktaUsersQuery = useProtectedApiGet('/buckokta/category/att/comparison/match', {
    queryParams: { _category: 'users' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch Google staff users
  const googleStaffUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Staff' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch Google freelance users
  const googleFreelanceUsersQuery = useProtectedApiGet('/google/buckgoogleusers', {
    queryParams: { status: 'active', emp_type: 'Freelance' },
    queryConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch NetSuite departments
  const departmentsQuery = useProtectedApiGet('/netsuite/departments', {
    queryConfig: {
      staleTime: 10 * 60 * 1000, // 10 minutes - departments don't change often
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch NetSuite subsidiaries
  const subsidiariesQuery = useProtectedApiGet('/netsuite/subsidiaries', {
    queryConfig: {
      staleTime: 10 * 60 * 1000, // 10 minutes - subsidiaries don't change often
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Fetch NetSuite locations
  const locationsQuery = useProtectedApiGet('/netsuite/locations', {
    queryConfig: {
      staleTime: 10 * 60 * 1000, // 10 minutes - locations don't change often
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000
    }
  });

  // Combine and process Google users data
  const googleUsers = useMemo(() => {
    if (googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading) {
      return [];
    }

    if (googleStaffUsersQuery.error || googleFreelanceUsersQuery.error) {
      return [];
    }

    const staffData = Array.isArray(googleStaffUsersQuery.data) ? googleStaffUsersQuery.data : [];
    const freelanceData = Array.isArray(googleFreelanceUsersQuery.data) ? googleFreelanceUsersQuery.data : [];

    return [...staffData, ...freelanceData];
  }, [googleStaffUsersQuery.data, googleFreelanceUsersQuery.data,
      googleStaffUsersQuery.isLoading, googleFreelanceUsersQuery.isLoading,
      googleStaffUsersQuery.error, googleFreelanceUsersQuery.error]);

  // Create an email lookup map for fast validation
  const emailLookup = useMemo(() => {
    if (!oktaUsersQuery.data || !Array.isArray(oktaUsersQuery.data)) {
      return {};
    }

    const emailMap = {};
    oktaUsersQuery.data.forEach(user => {
      // Check both email and login fields since either could be what we need to validate against
      if (user.profile?.email) {
        emailMap[user.profile.email.toLowerCase()] = user;
      }
      if (user.profile?.login) {
        emailMap[user.profile.login.toLowerCase()] = user;
      }
    });

    return emailMap;
  }, [oktaUsersQuery.data]);

  // Get user initials for avatar fallback
  const getUserInitials = (user) => {
    if (user.profile) {
      // Okta user format
      const firstName = user.profile.firstName || '';
      const lastName = user.profile.lastName || '';
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      } else if (firstName) {
        return firstName[0].toUpperCase();
      } else if (lastName) {
        return lastName[0].toUpperCase();
      }
    } else if (user.name) {
      // Google user format
      const firstName = user.name.givenName || '';
      const lastName = user.name.familyName || '';
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      } else if (firstName) {
        return firstName[0].toUpperCase();
      } else if (lastName) {
        return lastName[0].toUpperCase();
      }
    }
    return 'U';
  };

  // Filter functions for user lists
  const filteredGoogleUsers = useMemo(() => {
    if (!googleSearchTerm) return googleUsers;
    const filtered = googleUsers.filter(user => {
      const searchableFields = [
        user.name?.fullName,
        user.name?.givenName,
        user.name?.familyName,
        user.primaryEmail,
        user.organizations?.[0]?.title,
        user.organizations?.[0]?.department
      ];
      return searchableFields.some(field =>
        field && field.toLowerCase().includes(googleSearchTerm.toLowerCase())
      );
    });
    // Reset to page 0 when search term changes
    setGooglePage(0);
    return filtered;
  }, [googleUsers, googleSearchTerm]);

  const filteredOktaUsers = useMemo(() => {
    if (!Array.isArray(oktaUsersQuery.data)) return [];
    const users = oktaUsersQuery.data;
    if (!oktaSearchTerm) return users;
    const filtered = users.filter(user => {
      const searchableFields = [
        user.profile?.firstName,
        user.profile?.lastName,
        user.profile?.email,
        user.profile?.login,
        user.profile?.title
      ];
      return searchableFields.some(field =>
        field && field.toLowerCase().includes(oktaSearchTerm.toLowerCase())
      );
    });
    // Reset to page 0 when search term changes
    setOktaPage(0);
    return filtered;
  }, [oktaUsersQuery.data, oktaSearchTerm]);

  // Function to find Google photo for Okta user
  const getGooglePhotoForOktaUser = (oktaUser) => {
    if (!oktaUser.profile?.email) return null;
    
    // Find matching Google user by email
    const matchingGoogleUser = googleUsers.find(googleUser => {
      return googleUser.primaryEmail && 
             googleUser.primaryEmail.toLowerCase() === oktaUser.profile.email.toLowerCase();
    });
    
    return matchingGoogleUser?.thumbnailPhotoUrl || null;
  };
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Function to check if a user exists by login
  const checkUserExists = async (login) => {
    if (!login || !login.trim()) {
      setEmailStatus('idle');
      setEmailValidated(false);
      setUserExists(false);
      return false; // Don't check if login is empty
    }

    setCheckingUser(true);
    setEmailStatus('checking');
    setEmailValidated(false);

    try {
      // For testing/demonstration purposes, simulate checking against a server
      // In a real app, this would be a real API call to check if the user exists
      // Mock response for demonstration - assume user doesn't exist for now
      // This lets the Create User button become active when a valid email is entered

      // If Okta users are still loading, wait a moment
      if (oktaUsersQuery.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (oktaUsersQuery.isLoading) {
          throw new Error("Still loading Okta users");
        }
      }

      // Check if the email exists in the lookup map
      const normalizedEmail = login.toLowerCase();
      const exists = !!emailLookup[normalizedEmail];

      // For debugging
      console.log(`Checking email ${normalizedEmail}: ${exists ? 'EXISTS' : 'does not exist'}`);

      setUserExists(exists);
      setEmailStatus(exists ? 'invalid' : 'valid');
      setEmailValidated(true);
      return exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      setEmailStatus('idle');
      setEmailValidated(false);
      return false;
    } finally {
      setCheckingUser(false);
    }
  };

  // Create user mutation using protected API
  const createUserMutation = useProtectedApiMutation('/buckokta/create_user', {
    method: 'POST',
    mutationConfig: {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'User created successfully!',
          severity: 'success'
        });
        // Reset form after successful creation
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          login: '',
          mobilePhone: '',
          personalEmail: '',
          manager: '',
          jobTitle: '',
          status: 'STAGED',
          department: '',
          subsidiary: '',
          location: ''
        });
        setErrors({});
        setActiveStep(0);
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Error creating user: ${error.message}`,
          severity: 'error'
        });
      }
    }
  });

  // Add debounce to prevent too many API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced version of checkUserExists
  const debouncedCheckUser = debounce(async (login) => {
    await checkUserExists(login);
  }, 500);

  // Helper function to get email domain based on subsidiary
  const getEmailDomain = (subsidiary) => {
    if (!subsidiary) return 'buck.co';

    const sub = subsidiary.toLowerCase();
    if (sub.includes('buck')) return 'buck.co';
    if (sub.includes('vtpro')) return 'vtprodesign.com';
    if (sub.includes('wild')) return 'wild.co';
    if (sub.includes('anyways')) return 'anyways.co';

    return 'buck.co'; // default
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Trim spaces from first name and last name fields
    const trimmedValue = (name === 'firstName' || name === 'lastName') ? value.trim() : value;

    let updatedFormData = {
      ...formData,
      [name]: trimmedValue
    };

    // Automatically construct email and login when first name, last name, or subsidiary changes
    if (name === 'firstName' || name === 'lastName' || name === 'subsidiary') {
      // Use the updated form data to get the current values (including the field being changed)
      const firstName = name === 'firstName' ? trimmedValue : (formData.firstName ? formData.firstName.trim() : '');
      const lastName = name === 'lastName' ? trimmedValue : (formData.lastName ? formData.lastName.trim() : '');
      const subsidiary = name === 'subsidiary' ? value : formData.subsidiary;

      console.log('Debug clearing:', {
        name,
        originalValue: value,
        trimmedValue,
        firstName,
        lastName,
        subsidiary,
        firstNameEmpty: !firstName,
        lastNameEmpty: !lastName,
        shouldClear: !firstName || !lastName
      });

      // Update email and login based on name and subsidiary availability
      if (firstName && lastName) {
        // Create lowercase versions for email and login
        const firstNameLower = firstName.toLowerCase();
        const lastNameLower = lastName.toLowerCase();

        // Get email domain based on subsidiary
        const emailDomain = getEmailDomain(subsidiary);

        // Construct email and login
        const email = `${firstNameLower}.${lastNameLower}@${emailDomain}`;
        const login = `${firstNameLower}.${lastNameLower}`;

        console.log('Setting email and login:', { email, login, emailDomain });

        updatedFormData = {
          ...updatedFormData,
          email: email,
          login: login
        };
      } else {
        // Clear email and login if either first or last name is empty
        console.log('Clearing email and login');
        updatedFormData = {
          ...updatedFormData,
          email: '',
          login: ''
        };
      }
    }

    setFormData(updatedFormData);

    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check if user exists when email field changes
    if ((name === 'email' && value.trim() !== '') ||
        (name === 'firstName' || name === 'lastName' || name === 'subsidiary')) {
      if (updatedFormData.email && updatedFormData.email.trim() !== '') {
        debouncedCheckUser(updatedFormData.email);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    } else if (userExists) {
      newErrors.email = 'This user already exists. Please use a different name.';
    }

    if (!formData.login.trim()) {
      newErrors.login = 'Login is required';
    }

    if (!formData.mobilePhone.trim()) {
      newErrors.mobilePhone = 'Mobile phone is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobilePhone.replace(/[^0-9]/g, ''))) {
      newErrors.mobilePhone = 'Mobile phone must contain 10 digits';
    }

    if (formData.personalEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Invalid personal email address';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.subsidiary.trim()) {
      newErrors.subsidiary = 'Subsidiary is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    // Only allow form submission if there are no errors and email is either empty or validated as unique
    return Object.keys(newErrors).length === 0 &&
           (formData.email.trim() === '' || (emailValidated && emailStatus === 'valid')) &&
           !checkingUser;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Format phone number to only include digits
    const formattedPhone = formData.mobilePhone.replace(/[^0-9]/g, '');

    // Call mutation with query parameters
    createUserMutation.mutate({
      params: {
        login: formData.login,
        first_name: formData.firstName,
        last_name: formData.lastName,
        mobile_phone: formattedPhone
      }
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    switch (activeStep) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.subsidiary.trim()) newErrors.subsidiary = 'Subsidiary is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
          newErrors.email = 'Invalid email address';
        } else if (userExists) {
          newErrors.email = 'This user already exists. Please use a different name.';
        }
        if (!formData.login.trim()) newErrors.login = 'Login is required';
        break;

      case 1: // Contact Details
        if (!formData.mobilePhone.trim()) {
          newErrors.mobilePhone = 'Mobile phone is required';
        } else if (!/^[0-9]{10}$/.test(formData.mobilePhone.replace(/[^0-9]/g, ''))) {
          newErrors.mobilePhone = 'Mobile phone must contain 10 digits';
        }
        if (formData.personalEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.personalEmail)) {
          newErrors.personalEmail = 'Invalid personal email address';
        }
        break;

      case 2: // Organization Details
        if (!formData.department.trim()) newErrors.department = 'Department is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 &&
           (activeStep !== 0 || formData.email.trim() === '' || (emailValidated && emailStatus === 'valid')) &&
           (activeStep !== 0 || !checkingUser);
  };

  if (createUserMutation.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            overflow: 'visible'
          }}
        >
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
            <Typography variant='h4' fontWeight="bold" gutterBottom>
              Creating Your New User
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9 }}>
              Please wait while we set up the account...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const getStepProgress = () => {
    return ((activeStep + 1) / steps.length) * 100;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Header */}
      <Card
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 4,
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonAddIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant='h4' fontWeight="bold" gutterBottom sx={{ mb: 0.5 }}>
                Onboard New Resident
              </Typography>
              <Typography variant='h6' sx={{ opacity: 0.9 }}>
                Create a new user account in just a few steps
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getStepProgress()}
            sx={{
              height: 8,
              borderRadius: 4,
              mt: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
                borderRadius: 4
              }
            }}
          />
          <Typography variant='body2' sx={{ mt: 1, opacity: 0.8 }}>
            Step {activeStep + 1} of {steps.length} - {Math.round(getStepProgress())}% Complete
          </Typography>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      fontSize: '2rem',
                      '&.Mui-completed': {
                        color: 'success.main'
                      },
                      '&.Mui-active': {
                        color: 'primary.main',
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s'
                      }
                    }
                  }}
                >
                  <Typography variant="body2" fontWeight={activeStep === index ? 'bold' : 'normal'}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Main Form Card */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          mb: 4,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Step 0: Personal Info */}
            {activeStep === 0 && (
              <Box sx={{ animation: 'fadeIn 0.5s' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    <BadgeIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                      Personal Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Let's start with the basics
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={3}>
                  <Grid item size={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      required
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      required
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={12}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email || emailStatus === 'invalid'}
                        helperText={
                          emailStatus === 'invalid'
                            ? "This user already exists. Please use a different name."
                            : emailStatus === 'valid'
                              ? "Email is available!"
                              : (errors.email || "Email will be auto-generated from first.last@buck.co")
                        }
                        required
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: checkingUser ? (
                              <CircularProgress size={20} sx={{ marginRight: 1 }} />
                            ) : emailStatus === 'valid' ? (
                              <CheckCircleIcon color="success" />
                            ) : null,
                            sx: {
                              ...(emailStatus === 'valid' && {
                                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                borderColor: 'success.main'
                              }),
                              ...(emailStatus === 'invalid' && {
                                backgroundColor: 'rgba(211, 47, 47, 0.08)'
                              })
                            }
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: 2
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item size={12}>
                    <TextField
                      fullWidth
                      label="Login (Username)"
                      name="login"
                      value={formData.login}
                      onChange={handleChange}
                      error={!!errors.login}
                      helperText={errors.login || "Username will be auto-generated from first.last"}
                      required
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonAddIcon color="action" />
                            </InputAdornment>
                          ),
                          sx: {
                            ...(emailStatus === 'valid' && {
                              backgroundColor: 'rgba(46, 125, 50, 0.08)'
                            })
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={12}>
                    <FormControl fullWidth required error={!!errors.subsidiary}>
                      <InputLabel id="subsidiary-label">Subsidiary</InputLabel>
                      <Select
                        labelId="subsidiary-label"
                        name="subsidiary"
                        value={formData.subsidiary}
                        label="Subsidiary"
                        onChange={handleChange}
                        disabled={subsidiariesQuery.isLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white',
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        {subsidiariesQuery.isLoading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              Loading subsidiaries...
                            </Box>
                          </MenuItem>
                        ) : subsidiariesQuery.data && Array.isArray(subsidiariesQuery.data) ? (
                          subsidiariesQuery.data.map((sub) => (
                            <MenuItem key={sub.id || sub.name} value={sub.name || sub.id}>
                              {sub.name || sub.id}
                            </MenuItem>
                          ))
                        ) : null}
                      </Select>
                      <FormHelperText>
                        {errors.subsidiary || 'Select subsidiary to determine email domain'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 1: Contact Details */}
            {activeStep === 1 && (
              <Box sx={{ animation: 'fadeIn 0.5s' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }}
                  >
                    <PhoneAndroidIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                      Contact Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      How can we reach them?
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={3}>
                  <Grid item size={12}>
                    <TextField
                      fullWidth
                      label="Mobile Phone"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      error={!!errors.mobilePhone}
                      helperText={errors.mobilePhone || "Format: 10 digits (e.g., 1234567890)"}
                      required
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneAndroidIcon color="action" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'secondary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={12}>
                    <TextField
                      fullWidth
                      label="Personal Email (Optional)"
                      name="personalEmail"
                      type="email"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      error={!!errors.personalEmail}
                      helperText={errors.personalEmail || "Optional: Personal email address for the user"}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'secondary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item size={12}>
                    <FormControl fullWidth>
                      <InputLabel id="manager-label">Manager (Optional)</InputLabel>
                      <Select
                        labelId="manager-label"
                        name="manager"
                        value={formData.manager}
                        label="Manager (Optional)"
                        onChange={handleChange}
                        disabled={oktaUsersQuery.isLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <WorkIcon color="action" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white',
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>No Manager</em>
                        </MenuItem>
                        {oktaUsersQuery.isLoading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              Loading users...
                            </Box>
                          </MenuItem>
                        ) : oktaUsersQuery.data && Array.isArray(oktaUsersQuery.data) ? (
                          oktaUsersQuery.data
                            .filter(user => user.status === 'ACTIVE')
                            .sort((a, b) => {
                              const nameA = `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`;
                              const nameB = `${b.profile?.firstName || ''} ${b.profile?.lastName || ''}`;
                              return nameA.localeCompare(nameB);
                            })
                            .map((user) => (
                              <MenuItem key={user.id || user.profile?.email} value={user.profile?.email || user.profile?.login}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                                    {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
                                  </Avatar>
                                  {`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
                                </Box>
                              </MenuItem>
                            ))
                        ) : null}
                      </Select>
                      <FormHelperText>Select the user's manager from active Okta users</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item size={12}>
                    <TextField
                      fullWidth
                      label="Job Title (Optional)"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      helperText="Enter the user's job title/position"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkIcon color="action" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'secondary.main',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 2: Organization Details */}
            {activeStep === 2 && (
              <Box sx={{ animation: 'fadeIn 0.5s' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'success.main',
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                      Organization Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Where will they be working?
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={3}>
                  <Grid item size={12}>
                    <FormControl fullWidth required error={!!errors.department}>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        labelId="department-label"
                        name="department"
                        value={formData.department}
                        label="Department"
                        onChange={handleChange}
                        disabled={departmentsQuery.isLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white',
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        {departmentsQuery.isLoading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              Loading departments...
                            </Box>
                          </MenuItem>
                        ) : departmentsQuery.data && Array.isArray(departmentsQuery.data) ? (
                          departmentsQuery.data.map((dept) => (
                            <MenuItem key={dept.id || dept.name} value={dept.name || dept.id}>
                              {dept.name || dept.id}
                            </MenuItem>
                          ))
                        ) : null}
                      </Select>
                      <FormHelperText>
                        {errors.department || 'Select the user\'s department'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item size={12}>
                    <FormControl fullWidth required error={!!errors.subsidiary}>
                      <InputLabel id="subsidiary-label">Subsidiary</InputLabel>
                      <Select
                        labelId="subsidiary-label"
                        name="subsidiary"
                        value={formData.subsidiary}
                        label="Subsidiary"
                        onChange={handleChange}
                        disabled={subsidiariesQuery.isLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white',
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        {subsidiariesQuery.isLoading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              Loading subsidiaries...
                            </Box>
                          </MenuItem>
                        ) : subsidiariesQuery.data && Array.isArray(subsidiariesQuery.data) ? (
                          subsidiariesQuery.data.map((sub) => (
                            <MenuItem key={sub.id || sub.name} value={sub.name || sub.id}>
                              {sub.name || sub.id}
                            </MenuItem>
                          ))
                        ) : null}
                      </Select>
                      <FormHelperText>
                        {errors.subsidiary || 'Select the user\'s subsidiary'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item size={12}>
                    <FormControl fullWidth required error={!!errors.location}>
                      <InputLabel id="location-label">Location</InputLabel>
                      <Select
                        labelId="location-label"
                        name="location"
                        value={formData.location}
                        label="Location"
                        onChange={handleChange}
                        disabled={locationsQuery.isLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <LocationOnIcon color="action" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white',
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        {locationsQuery.isLoading ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              Loading locations...
                            </Box>
                          </MenuItem>
                        ) : locationsQuery.data && Array.isArray(locationsQuery.data) ? (
                          locationsQuery.data.map((loc) => (
                            <MenuItem key={loc.id || loc.name} value={loc.name || loc.id}>
                              {loc.name || loc.id}
                            </MenuItem>
                          ))
                        ) : null}
                      </Select>
                      <FormHelperText>
                        {errors.location || 'Select the user\'s location'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item size={12}>
                    <FormControl fullWidth required>
                      <InputLabel id="status-label">Initial Status</InputLabel>
                      <Select
                        labelId="status-label"
                        name="status"
                        value={formData.status}
                        label="Initial Status"
                        onChange={handleChange}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              backgroundColor: 'white'
                            }
                          }
                        }}
                      >
                        <MenuItem value="STAGED">Staged</MenuItem>
                        <MenuItem value="PROVISIONED">Provisioned</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                      </Select>
                      <FormHelperText>Initial status for the new user</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 3: Review & Submit */}
            {activeStep === 3 && (
              <Box sx={{ animation: 'fadeIn 0.5s' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'warning.main',
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                      Review & Submit
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please review the information before creating the user
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item size={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                          Personal Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">First Name</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.firstName || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Last Name</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.lastName || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.email || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Login</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.login || '-'}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item size={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="secondary" gutterBottom fontWeight="bold">
                          Contact Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Mobile Phone</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.mobilePhone || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Personal Email</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.personalEmail || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Manager</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.manager || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Job Title</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.jobTitle || '-'}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item size={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="success.main" gutterBottom fontWeight="bold">
                          Organization Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Department</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.department || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Subsidiary</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.subsidiary || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Location</Typography>
                            <Typography variant="body1" fontWeight="medium">{formData.location || '-'}</Typography>
                          </Grid>
                          <Grid item size={6}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Chip
                              label={formData.status}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                size="large"
                variant="outlined"
                sx={{ minWidth: 120 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={
                    createUserMutation.isLoading ||
                    emailStatus === 'invalid' ||
                    checkingUser ||
                    oktaUsersQuery.isLoading ||
                    departmentsQuery.isLoading ||
                    subsidiariesQuery.isLoading ||
                    locationsQuery.isLoading
                  }
                  sx={{
                    minWidth: 160,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #66358c 100%)'
                    }
                  }}
                  startIcon={<PersonAddIcon />}
                >
                  Create User
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  sx={{ minWidth: 120 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Google Users Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <SearchIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Google Users
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {googleUsers.length} users available
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setShowGoogleUsers(!showGoogleUsers)}
              aria-label={showGoogleUsers ? 'collapse' : 'expand'}
              sx={{
                transition: 'transform 0.3s',
                transform: showGoogleUsers ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        
        <Collapse in={showGoogleUsers}>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search Google users..."
              size="small"
              fullWidth
              value={googleSearchTerm}
              onChange={(e) => setGoogleSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>
          
          {googleStaffUsersQuery.isLoading || googleFreelanceUsersQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Email</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Title</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredGoogleUsers
                      .slice(googlePage * googleRowsPerPage, googlePage * googleRowsPerPage + googleRowsPerPage)
                      .map((user) => {
                      const isFreelancer = user.organizations &&
                                          user.organizations[0]?.costCenter &&
                                          user.organizations[0].costCenter.toLowerCase() === 'freelance';

                      return (
                        <TableRow key={user.id || user.primaryEmail}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={user.thumbnailPhotoUrl || undefined}
                                alt={getUserInitials(user)}
                                slotProps={{
                                  img: {
                                    loading: "lazy",
                                    referrerPolicy: "no-referrer",
                                    onError: (e) => {
                                      e.target.style.display = 'none';
                                    }
                                  }
                                }}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: isFreelancer
                                    ? '2px solid #f50057'
                                    : '2px solid #8c9eff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  bgcolor: isFreelancer ? '#f50057' : 'primary.main',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {!user.thumbnailPhotoUrl && getUserInitials(user)}
                              </Avatar>
                              <Box>
                                {user.name?.fullName ||
                                  `${user.name?.givenName || ''} ${user.name?.familyName || ''}`}
                                {isFreelancer && (
                                  <Chip
                                    label="Freelance"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{user.primaryEmail || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{user.organizations?.[0]?.title || 'N/A'}</TableCell>
                          <TableCell>
                            {user.organizations?.[0]?.department ? (
                              <Chip
                                label={user.organizations[0].department}
                                color="primary"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 20 }}
                              />
                            ) : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredGoogleUsers.length}
                rowsPerPage={googleRowsPerPage}
                page={googlePage}
                onPageChange={(event, newPage) => setGooglePage(newPage)}
                onRowsPerPageChange={(event) => {
                  setGoogleRowsPerPage(parseInt(event.target.value, 10));
                  setGooglePage(0);
                }}
              />
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>

      {/* Okta Users Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SearchIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Okta Users
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Array.isArray(oktaUsersQuery.data) ? oktaUsersQuery.data.length : 0} users available
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setShowOktaUsers(!showOktaUsers)}
              aria-label={showOktaUsers ? 'collapse' : 'expand'}
              sx={{
                transition: 'transform 0.3s',
                transform: showOktaUsers ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        
        <Collapse in={showOktaUsers}>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search Okta users..."
              size="small"
              fullWidth
              value={oktaSearchTerm}
              onChange={(e) => setOktaSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>
          
          {oktaUsersQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Email/Login</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Status</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>Title</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOktaUsers
                      .slice(oktaPage * oktaRowsPerPage, oktaPage * oktaRowsPerPage + oktaRowsPerPage)
                      .map((user) => (
                      <TableRow key={user.id || user.profile?.email}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={getGooglePhotoForOktaUser(user) || user.profile?.photo || undefined}
                              alt={getUserInitials(user)}
                              slotProps={{
                                img: {
                                  loading: "lazy",
                                  referrerPolicy: "no-referrer",
                                  onError: (e) => {
                                    e.target.style.display = 'none';
                                  }
                                }
                              }}
                              sx={{
                                bgcolor: 'secondary.main',
                                width: 32,
                                height: 32,
                                fontSize: '0.75rem',
                                border: getGooglePhotoForOktaUser(user)
                                  ? '2px solid #8c9eff' // Blue border if Google photo found
                                  : '2px solid #9c27b0', // Purple border for Okta-only
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            >
                              {!(getGooglePhotoForOktaUser(user) || user.profile?.photo) && getUserInitials(user)}
                            </Avatar>
                            {`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {user.profile?.email || user.profile?.login || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status || 'Unknown'}
                            color={user.status === 'ACTIVE' ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {user.profile?.title || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredOktaUsers.length}
                rowsPerPage={oktaRowsPerPage}
                page={oktaPage}
                onPageChange={(event, newPage) => setOktaPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setOktaRowsPerPage(parseInt(event.target.value, 10));
                  setOktaPage(0);
                }}
              />
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
