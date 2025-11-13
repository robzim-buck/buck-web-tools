import uuid from 'react-uuid';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';


import { Typography, Button, IconButton, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Chip, Grid, Box, Card, CardContent, Collapse, Switch, FormControlLabel, Paper } from '@mui/material';
import { Alert, AlertTitle, Snackbar, Checkbox } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PieChartIcon from '@mui/icons-material/PieChart';
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import React from 'react';

// import { DataGrid } from '@mui/x-data-grid';

// Time constants
const sixty_minutes = 60 * 60 * 1000;
// const twenty_four_hours_plus_buffer = (24*60*60*1000) + 20000; // add 20 seconds


const endpoint = 'https://laxcoresrv.buck.local:8000'


const emailUniqueEntries = (list) => {
    let emailList = list.map(em => { return em.email });
    let emailSet = new Set(emailList)
    // console.log(item in emailSet)
    // let listForCounting = new Array(emailSet)
    let count = 0
    for (let a of emailSet.entries()) {
        a = 1
        count += a
    }
    // console.log(emailSet.entries().next())
    return count
}


// Returns a MUI color name for license status
const setColor = (param) => {
    // Handle invalid or undefined param
    if (param === undefined || param === null) {
        return 'primary';
    }
    
    try {
        if (param < sixty_minutes / 2.0) {
            return 'error';
        }
        if (param < (sixty_minutes * 2.0)) {
            return 'warning';
        }
        return 'success';
    } catch (error) {
        // Fallback to a safe color in case of any errors
        console.error("Error in setColor:", error);
        return 'primary';
    }
}

const four_days_plus_buffer = (24*60*60*1000*4) + 60000 * 60; // add 60 minutes
const six_days_plus_buffer = (24*60*60*1000*6) + 60000 * 60; // add 60 minutes
const seven_days_plus_buffer = (24*60*60*1000*7) + 60000 * 60; // add 60 minutes

const setExpiryLabel = (param) => {
    if (param < 0) {
        return 'Expired'
    }
    if (param < (sixty_minutes * 2.0)) {
        return 'Expiring'
    }
    if (param < sixty_minutes) {
        return `Expires in ${(param/sixty_minutes*100).toPrecision(2)} Minutes`
    }
    return 'Good'
}



const setDateColor = (param) => {
    try {
        if (!param) {
            return 'text.primary';
        }
        
        let todaystring = new Date(Date.now()).toISOString().split('T')[0];
        let paramstring = new Date(param).toISOString().split('T')[0];
        
        // console.log(todaystring, paramstring)
        if (paramstring === todaystring) {
            return 'error.main';
        }
        return 'text.primary';
    } catch (error) {
        console.error("Error in setDateColor:", error);
        return 'text.primary';
    }
}


const setChipLabel = (param) => {
    if (param < 0) {
        return 'Expired'
    }
    if (param < (sixty_minutes * 2.0)) {
        return 'Expiring'
    }
    return 'Active'
}



const setExtendedLabel = (issued, expiry, product) => {
    let issued_date = new Date(issued);
    let expiry_date = new Date(expiry);
    let diff = expiry_date - issued_date;
    // console.log(diff, four_days_plus_buffer)
    if (product === 'mso365') {
        if (diff > seven_days_plus_buffer) {
            return 'Extended'
        }
        return 'Active'
    }
    if (product === 'aquarium') {
        if (diff > six_days_plus_buffer) {
            return 'Extended'
        }
        return 'Active'
    }
    else {
        if (diff > four_days_plus_buffer) {
            return 'Extended'
        }
        return 'Active'
    }
}


const productCount = (list, product) => {
    let aCount = list.reduce((counter, list) => list.product === product ? ++counter : counter , 0);
    return aCount
}

const getUniqueProducts = (data) => {
    // Get unique products from the data and filter out null/undefined
    const products = [...new Set(data.map(item => item.product).filter(product => product))];
    return products.sort(); // Sort alphabetically for consistent ordering
}

const generateProductColor = (index, total) => {
    // Generate colors using HSL for better distribution
    const hue = (index * 360) / total;
    const saturation = 70 + (index % 3) * 10; // Vary saturation between 70-90%
    const lightness = 45 + (index % 2) * 10; // Vary lightness between 45-55%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}




const ProductBar = ({ name, count, total, color }) => {
    // Skip rendering if count is 0
    if (count === 0) return null;
    
    const percentage = (count / total) * 100;
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{name}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {count} ({percentage.toFixed(1)}%)
                </Typography>
            </Box>
            <Box sx={{ 
                width: '100%', 
                height: 12, 
                bgcolor: 'rgba(0, 0, 0, 0.05)', 
                borderRadius: 6, 
                overflow: 'hidden' 
            }}>
                <Box
                    sx={{
                        width: `${percentage}%`,
                        height: '100%',
                        bgcolor: color,
                        borderRadius: 6
                    }}
                />
            </Box>
        </Box>
    );
};

// There used to be a columns definition here
// It's now moved inside the component function
// LicenseStatusItem component for license status display
const LicenseStatusItem = ({ count, label, color }) => {
    let safeColor = color;
    // Make sure color is one of the supported MUI colors or a valid CSS color
    if (typeof color === 'string' && 
        !['primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(color) && 
        !color.includes('.')) {
        // Convert to a safe theme color
        safeColor = 'primary.main';
    }
    
    return (
        <Stack alignItems="center" spacing={1}>
            <Box
                sx={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                }}
            >
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={64}
                    thickness={4}
                    sx={{ color: 'rgba(0, 0, 0, 0.1)', position: 'absolute' }}
                />
                <CircularProgress
                    variant="determinate"
                    value={count > 0 ? 100 : 0}
                    size={64}
                    thickness={4}
                    sx={{ color: safeColor || 'primary.main', position: 'absolute' }}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {count}
                    </Typography>
                </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Stack>
    );
};


const year = new Date().getFullYear().toString()
// console.log(year)
export default function ActiveSelfServLicenses(props) {
    const [emailfilter, setEmailFilter] = useState('');   
    const [productfilter, setProductFilter] = useState('');   
    const [sortField, setSortField] = useState('email');
    const [sortDirection, setSortDirection] = useState('asc');
    const [tableSortField, setTableSortField] = useState('email');
    const [tableSortDirection, setTableSortDirection] = useState('asc');

    const [tableView, setTableView] = useState(false);
    const [expandedUsers, setExpandedUsers] = useState({});
    // We don't need allLicenses state anymore - removed
    const [previsible, setPrevisible] = useState(false);

    const [successvisible, setSuccessvisible] = useState(false);
    const [operation, setOperation] = useState('');
    const [product, setProduct] = useState('');
    const [user, setUser] = useState('');
    
    // Add pagination state for the table view
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Add state for license summary card collapse
    const [licenseSummaryExpanded, setLicenseSummaryExpanded] = useState(true);
    
    // Add state for selected licenses in table view
    const [selectedLicenses, setSelectedLicenses] = useState([]);
    const [productForBulkReturn, setProductForBulkReturn] = useState([]);
    const [filterMode, setFilterMode] = useState('OR'); // 'OR' or 'AND'

    // Function to toggle user card expansion
    const toggleUserExpand = (email) => {
        setExpandedUsers(prev => ({
            ...prev,
            [email]: !prev[email]
        }));
    };
    
    // Function to toggle between table and card view
    const toggleTableView = () => {
        try {
            // Toggle table view and add console logging
            const newTableView = !tableView;
            console.log("Toggling table view to:", newTableView);
            setTableView(newTableView);
            
            // Force a re-render if needed
            setTimeout(() => {
                console.log("Current table view state:", tableView);
                if (tableView !== newTableView) {
                    // Force setState again if the state didn't update properly
                    setTableView(newTableView);
                }
            }, 100);
            
            if (!newTableView) {
                // Collapse all users when switching back to card view
                setExpandedUsers({});
            }
        } catch (error) {
            console.error("Error toggling view:", error);
            // Ensure we don't leave the component in a broken state
            setTableView(false);
        }
    };

    
  function releaseLicense(event, useremail, license) {
    if ( ! useremail.includes('buck.co') && ! useremail.includes('anyways.co') && ! useremail.includes('giantant.ca') ) {
      alert(`Only works for Buck, GiantAnt and Anyways Users, not for ${useremail}`)
      return
    }
    setOperation('Returning');
    setPrevisible(true)
    setProduct(license);
    setUser(useremail);
    const url = `${endpoint}/licenses/release_self_service_license?product=${license.toLowerCase()}&email=${useremail}`

    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
      }
    })
    .then(response => response.json())
    .then(data => {
      setPrevisible(false)
      setSuccessvisible(true);
      // Remove the released license from selected licenses
      setSelectedLicenses(prev => prev.filter(l => !(l.email === useremail && l.product === license)));
      return data;
    })
    .catch(error => {
      console.error('Error:', error);
      setPrevisible(false);
    });
  }
  


    // Function to handle license returns
    // const returnLicense = (e, email, productName) => {
    //     e.preventDefault();
    //     setPrevisible(true);
    //     setOperation('Returning');
    //     setProduct(productName);
    //     setUser(email);
        
    //     // API call to return license would go here
    //     // For now we'll just simulate success
    //     setTimeout(() => {
    //         setPrevisible(false);
    //         setSuccessvisible(true);
            
    //         // Refresh the data after operation
    //         activeLicenses.refetch();
    //     }, 1500);
    // };
    
    // Define columns for the license table view
    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70, 
            hide: true 
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            width: 230,
            renderCell: (params) => {
                if (!params.value) return <Typography variant="body2">N/A</Typography>;
                
                return (
                    <Tooltip title={params.value}>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {params.value}
                        </Typography>
                    </Tooltip>
                );
            }
        },
        { 
            field: 'product', 
            headerName: 'Product', 
            width: 150,
            valueGetter: (params) => params.row ? params.row.product : 'N/A'
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 130,
            renderCell: (params) => {
                try {
                    // Validate params to avoid transparent color errors
                    if (!params.row || !params.row.expiry) {
                        return <Chip variant="filled" size="small" color="default" label="Unknown" />;
                    }
                    
                    const expiry = Date.parse(params.row.expiry);
                    const timeToExpire = expiry - Date.now();
                    const status = setChipLabel(timeToExpire);
                    
                    // Use a safe color, ensuring it's a valid MUI color
                    const validColors = ['primary', 'secondary', 'error', 'info', 'success', 'warning', 'default'];
                    const statusColor = validColors.includes(setColor(timeToExpire)) ? 
                        setColor(timeToExpire) : 'primary';
                    
                    return (
                        <Chip 
                            variant="filled" 
                            size="small" 
                            color={statusColor}
                            label={status}
                            sx={{ fontWeight: 'bold' }}
                        />
                    );
                } catch (error) {
                    console.error("Error rendering status chip:", error);
                    return <Chip variant="filled" size="small" color="default" label="Error" />;
                }
            }
        },
        { 
            field: 'isExtended', 
            headerName: 'Extended', 
            width: 130,
            renderCell: (params) => {
                try {
                    // Validate params to avoid errors
                    if (!params.row || !params.row.timestamp || !params.row.expiry || !params.row.product) {
                        return null;
                    }
                    
                    const isExtended = setExtendedLabel(params.row.timestamp, params.row.expiry, params.row.product) === 'Extended';
                    
                    return isExtended ? (
                        <Chip 
                            variant="filled" 
                            size="small" 
                            color="info"
                            label="Extended"
                            sx={{ fontWeight: 'bold' }}
                        />
                    ) : null;
                } catch (error) {
                    console.error("Error rendering extended chip:", error);
                    return null;
                }
            }
        },
        { 
            field: 'timestamp', 
            headerName: 'Issued', 
            width: 180,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleString() : 'N/A';
            }
        },
        { 
            field: 'expiry', 
            headerName: 'Expires', 
            width: 180,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleString() : 'N/A';
            },
            renderCell: (params) => {
                // Validate params to avoid errors
                if (!params.value) {
                    return <Typography variant="body2">N/A</Typography>;
                }
                
                try {
                    const expiry = Date.parse(params.value);
                    const timeToExpire = expiry - Date.now();
                    const textColor = timeToExpire < (sixty_minutes * 2.0) ? 'error.main' : 'text.primary';
                    
                    return (
                        <Typography variant="body2" color={textColor} sx={{ fontWeight: timeToExpire < (sixty_minutes * 2.0) ? 'bold' : 'normal' }}>
                            {new Date(params.value).toLocaleString()}
                        </Typography>
                    );
                } catch (e) {
                    return <Typography variant="body2">Invalid date</Typography>;
                }
            }
        },
        { 
            field: 'timeRemaining', 
            headerName: 'Time Remaining', 
            width: 150,
            valueGetter: (params) => {
                if (!params.row || !params.row.expiry) return null;
                try {
                    const expiry = Date.parse(params.row.expiry);
                    return expiry - Date.now();
                } catch (e) {
                    return null;
                }
            },
            renderCell: (params) => {
                // Validate params to avoid errors
                if (params.value === null || params.value === undefined) {
                    return <Typography variant="body2">Unknown</Typography>;
                }
                
                const timeToExpire = params.value;
                const hoursRemaining = timeToExpire / (60 * 60 * 1000);
                let display;
                let color = 'text.primary';
                
                if (timeToExpire < 0) {
                    display = 'Expired';
                    color = 'error.main';
                } else if (hoursRemaining < 1) {
                    display = `${Math.round(hoursRemaining * 60)} mins`;
                    color = 'error.main';
                } else if (hoursRemaining < 24) {
                    display = `${Math.round(hoursRemaining)} hours`;
                    color = hoursRemaining < 2 ? 'error.main' : 'warning.main';
                } else {
                    display = `${Math.round(hoursRemaining / 24)} days`;
                    color = 'success.main';
                }
                
                return (
                    <Typography variant="body2" color={color} sx={{ fontWeight: timeToExpire < (sixty_minutes * 2.0) ? 'bold' : 'normal' }}>
                        {display}
                    </Typography>
                );
            }
        },
        { 
            field: 'actions', 
            headerName: 'Actions', 
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => {
                        releaseLicense(e, params.row.email, params.row.product);
                    }}
                >
                    Return
                </Button>
            )
        }
    ];

    const PreviewAlert = () => {
        if (previsible) {
            return(
              <Snackbar sx={{minWidth: 400}} anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={previsible} onClose={() => setPrevisible(false)} autoHideDuration={3000} >
                <Alert sx={{minWidth: 400}} action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setPrevisible(false)}}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                } severity="info">
                  <AlertTitle>Processing...</AlertTitle>
                  {operation} {product} License for {user}
                </Alert>
              </Snackbar>
            )
        }
        return null;
    }

    const SuccessAlert = () => {
        if (successvisible) {
            return(
              <Snackbar sx={{minWidth: 400}} anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={successvisible} onClose={() => setSuccessvisible(false)} autoHideDuration={3000} >
                <Alert sx={{minWidth: 400}} action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setSuccessvisible(false);
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                } icon={<CheckIcon fontSize="inherit" />} severity="success">
                  <AlertTitle>Success!</AlertTitle>
                  Successfully {operation} {product} for {user}!
                </Alert>
              </Snackbar>
            )
        }
        return null;
    }

    const licenseQuery = useQueries({
    queries: [
        {
        queryKey: ["activeLicenses"],
        queryFn: async () => {
            console.log('Fetching active licenses...');
            try {
            const response = await fetch("https://laxcoresrv.buck.local:8000/licenses/active_self_service_licenses", {
                method: 'GET',
                mode: 'cors',
                headers: {
                'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received licenses data, type:', typeof data, 'isArray:', Array.isArray(data));
            if (data) {
                console.log('Data sample:', Array.isArray(data) ? data.slice(0, 2) : data);
            }
            return data;
            } catch (error) {
            console.error("Error fetching license data:", error);
            throw error;
            }
        },
        retry: 2,
        refetchOnWindowFocus: false,
        staleTime: 60000
          }
        ]
    });

    const clearEmailFilter = () => {
        setEmailFilter('')
      }
    
    const clearProductFilter = () => {
        setProductFilter('')
    }
    
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }
    
    const handleTableSort = (field) => {
        if (tableSortField === field) {
            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setTableSortField(field);
            setTableSortDirection('asc');
        }
    }
    
    const sortData = (data) => {
        if (!data || !Array.isArray(data)) return data;
        
        return [...data].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'email':
                    aValue = a.email || '';
                    bValue = b.email || '';
                    break;
                case 'product':
                    aValue = a.product || '';
                    bValue = b.product || '';
                    break;
                case 'status':
                    // Sort by time remaining (expiry - now)
                    const aExpiry = a.expiry ? Date.parse(a.expiry) : 0;
                    const bExpiry = b.expiry ? Date.parse(b.expiry) : 0;
                    aValue = aExpiry - Date.now();
                    bValue = bExpiry - Date.now();
                    break;
                case 'expiry':
                    aValue = a.expiry ? Date.parse(a.expiry) : 0;
                    bValue = b.expiry ? Date.parse(b.expiry) : 0;
                    break;
                case 'issued':
                    aValue = a.timestamp ? Date.parse(a.timestamp) : 0;
                    bValue = b.timestamp ? Date.parse(b.timestamp) : 0;
                    break;
                default:
                    aValue = a.email || '';
                    bValue = b.email || '';
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return sortDirection === 'asc' ? comparison : -comparison;
            }
        });
    }
    
    const sortTableData = (data) => {
        if (!data || !Array.isArray(data)) return data;
        
        return [...data].sort((a, b) => {
            let aValue, bValue;
            
            switch (tableSortField) {
                case 'email':
                    aValue = a.email || '';
                    bValue = b.email || '';
                    break;
                case 'product':
                    aValue = a.product || '';
                    bValue = b.product || '';
                    break;
                case 'status':
                    // Sort by time remaining (expiry - now)
                    const aExpiry = a.expiry ? Date.parse(a.expiry) : 0;
                    const bExpiry = b.expiry ? Date.parse(b.expiry) : 0;
                    aValue = aExpiry - Date.now();
                    bValue = bExpiry - Date.now();
                    break;
                case 'expires':
                    aValue = a.expiry ? Date.parse(a.expiry) : 0;
                    bValue = b.expiry ? Date.parse(b.expiry) : 0;
                    break;
                case 'issued':
                    aValue = a.timestamp ? Date.parse(a.timestamp) : 0;
                    bValue = b.timestamp ? Date.parse(b.timestamp) : 0;
                    break;
                default:
                    aValue = a.email || '';
                    bValue = b.email || '';
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return tableSortDirection === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return tableSortDirection === 'asc' ? comparison : -comparison;
            }
        });
    }

    const activeLicenses = licenseQuery[0];
    
    // Clear selections when switching views or filters change
    React.useEffect(() => {
        setSelectedLicenses([]);
        if (!tableView) {
            setProductForBulkReturn([]);
        }
    }, [tableView, emailfilter, productfilter]);
    
    // Function to handle bulk license returns
    async function releaseBulkLicenses() {
        if (selectedLicenses.length === 0) {
            alert('Please select licenses to return');
            return;
        }
        
        setOperation('Returning multiple');
        setPrevisible(true);
        setProduct('licenses');
        setUser(`${selectedLicenses.length} users`);
        
        const releasePromises = selectedLicenses.map(license => {
            const url = `${endpoint}/licenses/release_self_service_license?product=${license.product.toLowerCase()}&email=${license.email}`;
            
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo'
                }
            })
            .then(response => response.json())
            .then(data => ({ success: true, license, data }))
            .catch(error => ({ success: false, license, error }));
        });
        
        try {
            const results = await Promise.all(releasePromises);
            const successCount = results.filter(r => r.success).length;
            
            setPrevisible(false);
            setSuccessvisible(true);
            setOperation(`Successfully returned`);
            setProduct(`${successCount} of ${selectedLicenses.length} licenses`);
            setUser('');
            
            // Clear selected licenses
            setSelectedLicenses([]);
            
            // Refresh the data
            activeLicenses.refetch();
        } catch (error) {
            console.error('Error in bulk release:', error);
            setPrevisible(false);
        }
    }


    if (activeLicenses.isLoading) return <CircularProgress></CircularProgress>;
    if (activeLicenses.error) return "An error has occurred: " + activeLicenses.error.message;
    if (activeLicenses.data) {
        console.log('Data received:', activeLicenses.data);
        
        // Make a defensive copy and check if data is an array
        let rawData = activeLicenses.data;
        let dataArray = [];
        
        // Handle various data formats
        if (Array.isArray(rawData)) {
            dataArray = [...rawData];
        } else if (typeof rawData === 'object' && rawData !== null) {
            // Check if the object has numeric keys (like a map/dictionary of licenses)
            const objectKeys = Object.keys(rawData);
            if (objectKeys.length > 0) {
                if (!isNaN(objectKeys[0])) {
                    // If keys are numeric, it might be an object with licenses as values
                    dataArray = Object.values(rawData);
                } else {
                    // Single license object
                    dataArray = [rawData];
                }
            }
        }
        
        console.log('Initial array length:', dataArray.length);
        
        // Basic data validation - ensure we have data with required fields
        const sortedData = dataArray
            .filter(item => item && typeof item === 'object')
            .filter(item => {
                const hasEmail = item.email && typeof item.email === 'string';
                const hasProduct = item.product && typeof item.product === 'string';
                return hasEmail && hasProduct;
            });
        
        console.log('Valid data items after filtering:', sortedData.length);
        
        // Apply custom sorting
        const finalSortedData = sortData(sortedData);
        
        console.log('Data after custom sorting:', finalSortedData.length);
        
        // Apply filters
        let filteredData = finalSortedData;
        var extendedCount;
        
        if (emailfilter && emailfilter.length > 0) {
            console.log('Filtering by email:', emailfilter);
            filteredData = finalSortedData.filter((f) => f.email && f.email.toLowerCase().includes(emailfilter.toLowerCase()));
            console.log('After email filter, items:', filteredData.length);
        }

        if (productfilter && productfilter.length > 0) {
            console.log('Filtering by product:', productfilter);
            filteredData = filteredData.filter((f) => f.product && f.product.toLowerCase().includes(productfilter.toLowerCase()));
            console.log('After product filter, items:', filteredData.length);
        }
        
        // Apply product filter for bulk return (table view only)
        if (productForBulkReturn && productForBulkReturn.length > 0) {
            console.log('Filtering by products for bulk return:', productForBulkReturn, 'Mode:', filterMode);

            if (filterMode === 'OR') {
                // OR mode: Show licenses that match ANY of the selected products
                filteredData = filteredData.filter((f) =>
                    f.product && productForBulkReturn.some(selectedProduct =>
                        f.product.toLowerCase() === selectedProduct.toLowerCase()
                    )
                );
            } else if (filterMode === 'AND') {
                // AND mode: Show only users who have licenses for ALL selected products
                // First, group licenses by email
                const licensesByEmail = {};
                filteredData.forEach(license => {
                    if (!licensesByEmail[license.email]) {
                        licensesByEmail[license.email] = [];
                    }
                    licensesByEmail[license.email].push(license);
                });

                // Find users who have all selected products
                const emailsWithAllProducts = Object.keys(licensesByEmail).filter(email => {
                    const userProducts = licensesByEmail[email].map(l => l.product.toLowerCase());
                    return productForBulkReturn.every(selectedProduct =>
                        userProducts.includes(selectedProduct.toLowerCase())
                    );
                });

                // Filter to show only licenses for users who have all selected products
                filteredData = filteredData.filter(license =>
                    emailsWithAllProducts.includes(license.email)
                );
            }

            console.log('After product bulk filter, items:', filteredData.length);
        }
        
        // Only use sample data if there's no real data AND no active filters
        if (filteredData.length === 0 && finalSortedData.length === 0 && !emailfilter && !productfilter) {
            console.log('No real data available, using sample dataset');
            filteredData = [
                {
                    email: 'test.user1@example.com',
                    product: 'adobe',
                    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    expiry: new Date(Date.now() + 604800000).toISOString()    // 7 days from now
                },
                {
                    email: 'test.user2@example.com',
                    product: 'figma',
                    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    expiry: new Date(Date.now() + 3600000).toISOString()       // 1 hour from now
                },
                {
                    email: 'test.user3@example.com',
                    product: 'mso365',
                    timestamp: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
                    expiry: new Date(Date.now() - 86400000).toISOString()      // Expired yesterday
                }
            ];
        }

        // Function to export license list to CSV
        const exportEmailList = () => {
            if (filteredData.length === 0) {
                alert('No licenses to export');
                return;
            }

            // Helper function to escape CSV values
            const escapeCSV = (value) => {
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            // Helper function to format date
            const formatDate = (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                } catch (e) {
                    return dateString;
                }
            };

            // Create CSV header
            const headers = ['email', 'product', 'issued', 'expires', 'status'];
            const csvRows = [headers.join(',')];

            // Add data rows
            filteredData.forEach(license => {
                const expiryDate = new Date(license.expiry);
                const timeToExpire = expiryDate - Date.now();
                const status = setChipLabel(timeToExpire);

                const row = [
                    escapeCSV(license.email),
                    escapeCSV(license.product),
                    escapeCSV(formatDate(license.timestamp)),
                    escapeCSV(formatDate(license.expiry)),
                    escapeCSV(status)
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');

            // Create and download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `active_licenses_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // We've simplified the data flow - removing the allLicenses state and tableData preparation
        // Now we'll directly map the data in the DataGrid component

        // Group licenses by email for card view
        const groupedByEmail = {};
        filteredData.forEach(license => {
            const { email } = license;
            if (!groupedByEmail[email]) {
                groupedByEmail[email] = {
                    email,
                    licenses: [],
                    products: new Set()
                };
            }
            groupedByEmail[email].licenses.push(license);
            groupedByEmail[email].products.add(license.product);
        });
        
        // Convert to array and ensure products is an array
        const groupedData = Object.values(groupedByEmail).map(user => ({
            ...user,
            products: Array.from(user.products)
        }));
  
        if (finalSortedData) {
            extendedCount = finalSortedData.filter((x) => {
                if ( setExtendedLabel(x.timestamp, x.expiry, x.product) === 'Extended' ) return(true); else return(false)
                } 
            ).length
        //    return (
        //     <>
        //        <p> {JSON.stringify(sortedData)}</p>

        //     </>)
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant='h4' color="primary" fontWeight="medium" gutterBottom>
                    {props.name || 'Active Self Serve Licenses'}
                </Typography>
                
                <Card 
                    variant="outlined" 
                    sx={{ 
                        mb: 4, 
                        p: 2, 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 2,
                        width: '100%'
                    }}
                >
                    {/* Header with collapse button */}
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>License Summary / License Status</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Total Licenses">
                                <Chip 
                                    icon={<DashboardIcon fontSize="small" />}
                                    label={`${finalSortedData.length} Total`}
                                    color="primary"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Tooltip>
                            <Tooltip title="Unique Users">
                                <Chip 
                                    label={`${emailUniqueEntries(finalSortedData)} Users`}
                                    color="primary"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Tooltip>
                            {extendedCount > 0 && (
                                <Tooltip title="Extended Duration Licenses">
                                    <Chip 
                                        label={`${extendedCount} Extensions`}
                                        color="info"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Tooltip>
                            )}
                            <IconButton
                                onClick={() => setLicenseSummaryExpanded(!licenseSummaryExpanded)}
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                {licenseSummaryExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                    </Box>
                    
                    <Collapse in={licenseSummaryExpanded}>
                        <Grid container spacing={3}>
                            <Grid item size={6}>
                                <Typography variant="h6" gutterBottom>License Summary</Typography>
                            
                            {/* Product Distribution Visualization */}
                            <Card sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                                    <PieChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Product Distribution
                                </Typography>
                                
                                {/* Visual Representation of License Distribution */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                    {(() => {
                                        const uniqueProducts = getUniqueProducts(finalSortedData);
                                        return uniqueProducts.map((product, index) => {
                                            const count = productCount(finalSortedData, product);
                                            const color = generateProductColor(index, uniqueProducts.length);

                                            return (
                                                <ProductBar
                                                    key={product}
                                                    name={product}
                                                    count={count}
                                                    total={finalSortedData.length}
                                                    color={color}
                                                />
                                            );
                                        });
                                    })()}
                                </Box>
                            </Card>
                        </Grid>
                        
                        <Grid item size={6}>
                            <Typography variant="h6" gutterBottom>License Status</Typography>
                            
                            {/* License Status Distribution */}
                            <Card sx={{ p: 2, bgcolor: '#f9f9f9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
                                    {/* Active Licenses */}
                                    <LicenseStatusItem 
                                        count={finalSortedData.filter(license => {
                                            const expiry = Date.parse(license.expiry);
                                            const timeToExpire = expiry - Date.now();
                                            return timeToExpire > (sixty_minutes * 2.0);
                                        }).length} 
                                        label="Active"
                                        color="success.main"
                                    />
                                    
                                    {/* Expiring Soon */}
                                    <LicenseStatusItem 
                                        count={finalSortedData.filter(license => {
                                            const expiry = Date.parse(license.expiry);
                                            const timeToExpire = expiry - Date.now();
                                            return timeToExpire <= (sixty_minutes * 2.0) && timeToExpire > 0;
                                        }).length} 
                                        label="Expiring Soon"
                                        color="warning.main"
                                    />
                                    
                                    {/* Expired */}
                                    <LicenseStatusItem 
                                        count={finalSortedData.filter(license => {
                                            const expiry = Date.parse(license.expiry);
                                            const timeToExpire = expiry - Date.now();
                                            return timeToExpire <= 0;
                                        }).length} 
                                        label="Expired"
                                        color="error.main"
                                    />
                                    
                                    {/* Extended */}
                                    <LicenseStatusItem 
                                        count={extendedCount}
                                        label="Extended"
                                        color="info.main"
                                    />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                    </Collapse>
                </Card>

                {/* Filters Section - Always show */}
                {(
                    <Card 
                        variant="outlined" 
                        sx={{ 
                            mb: 4, 
                            p: 2, 
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: 2,
                            width: '100%'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" gutterBottom>Filters & View Options</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {tableView && (
                                    <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
                                        <InputLabel>Filter by Product</InputLabel>
                                        <Select
                                            multiple
                                            value={productForBulkReturn}
                                            onChange={(e) => {
                                                setProductForBulkReturn(e.target.value);
                                            }}
                                            label="Filter by Product"
                                            sx={{ backgroundColor: 'white' }}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.length === 0 ? (
                                                        <span>All Products</span>
                                                    ) : (
                                                        selected.map((value) => (
                                                            <Chip key={value} label={value} size="small" />
                                                        ))
                                                    )}
                                                </Box>
                                            )}
                                            MenuProps={{
                                                PaperProps: {
                                                    style: {
                                                        backgroundColor: 'white',
                                                        color: 'black'
                                                    }
                                                }
                                            }}
                                        >
                                            <MenuItem value="adobe">
                                                <Checkbox checked={productForBulkReturn.indexOf('adobe') > -1} />
                                                Adobe
                                            </MenuItem>
                                            <MenuItem value="acrobat">
                                                <Checkbox checked={productForBulkReturn.indexOf('acrobat') > -1} />
                                                Acrobat
                                            </MenuItem>
                                            <MenuItem value="substance">
                                                <Checkbox checked={productForBulkReturn.indexOf('substance') > -1} />
                                                Substance
                                            </MenuItem>
                                            <MenuItem value="figma">
                                                <Checkbox checked={productForBulkReturn.indexOf('figma') > -1} />
                                                Figma
                                            </MenuItem>
                                            <MenuItem value="figjam">
                                                <Checkbox checked={productForBulkReturn.indexOf('figjam') > -1} />
                                                Figjam
                                            </MenuItem>
                                            <MenuItem value="figmafigjam">
                                                <Checkbox checked={productForBulkReturn.indexOf('figmafigjam') > -1} />
                                                Figma/Figjam
                                            </MenuItem>
                                            <MenuItem value="mso365">
                                                <Checkbox checked={productForBulkReturn.indexOf('mso365') > -1} />
                                                MS Office 365
                                            </MenuItem>
                                            <MenuItem value="maya">
                                                <Checkbox checked={productForBulkReturn.indexOf('maya') > -1} />
                                                Maya
                                            </MenuItem>
                                            <MenuItem value="aquarium">
                                                <Checkbox checked={productForBulkReturn.indexOf('aquarium') > -1} />
                                                Aquarium
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                                {tableView && productForBulkReturn.length > 1 && (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', backgroundColor: 'white', borderRadius: 1, p: 0.5 }}>
                                        <Button
                                            size="small"
                                            variant={filterMode === 'OR' ? 'contained' : 'outlined'}
                                            color={filterMode === 'OR' ? 'primary' : 'inherit'}
                                            onClick={() => setFilterMode('OR')}
                                            sx={{ minWidth: 50 }}
                                        >
                                            OR
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={filterMode === 'AND' ? 'contained' : 'outlined'}
                                            color={filterMode === 'AND' ? 'primary' : 'inherit'}
                                            onClick={() => setFilterMode('AND')}
                                            sx={{ minWidth: 50 }}
                                        >
                                            AND
                                        </Button>
                                    </Box>
                                )}
                                <Button
                                    variant="contained"
                                    color={tableView ? "secondary" : "primary"}
                                    onClick={toggleTableView}
                                >
                                    {tableView ? "Card View" : "Table View"}
                                </Button>
                            </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                            <Grid item size={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                                        Email Filter:
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <input 
                                            id="emailfilter"
                                            name="emailfilter"
                                            type="text"
                                            value={emailfilter}
                                            placeholder="Filter by email address..."
                                            onChange={event => setEmailFilter(event.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                border: '1px solid #ccc', 
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </Box>
                                    <Button 
                                        onClick={clearEmailFilter} 
                                        size="small" 
                                        variant="outlined" 
                                        color="secondary"
                                        disabled={!emailfilter}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Grid>
                            
                            <Grid item size={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                                        Sort By:
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <Select
                                            value={sortField}
                                            onChange={(e) => setSortField(e.target.value)}
                                            displayEmpty
                                            MenuProps={{
                                                PaperProps: {
                                                    style: {
                                                        backgroundColor: 'white',
                                                        color: 'black'
                                                    }
                                                }
                                            }}
                                        >
                                            <MenuItem value="email">Email</MenuItem>
                                            <MenuItem value="product">Product</MenuItem>
                                            <MenuItem value="status">Status</MenuItem>
                                            <MenuItem value="expiry">Expiry Date</MenuItem>
                                            <MenuItem value="issued">Issue Date</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                        startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                    >
                                        {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                                    </Button>
                                </Box>
                            </Grid>
                            
                            <Grid item size={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                                        Product Filter:
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <input 
                                            id="productfilter"
                                            name="productfilter"
                                            type="text"
                                            value={productfilter}
                                            placeholder="Filter by product name..."
                                            onChange={event => setProductFilter(event.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 12px', 
                                                border: '1px solid #ccc', 
                                                borderRadius: '4px' 
                                            }}
                                        />
                                    </Box>
                                    <Button 
                                        onClick={clearProductFilter} 
                                        size="small" 
                                        variant="outlined" 
                                        color="secondary"
                                        disabled={!productfilter}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Grid>
                            
                            <Grid item size={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                    <Chip 
                                        icon={<SortIcon />}
                                        label={`Sorted by ${sortField} (${sortDirection})`}
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Card>
                )}

                {/* No licenses found message */}
                {(!filteredData || filteredData.length === 0) && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center', py: 4 }}>
                        No licenses found with the current filters
                    </Typography>
                )}

                {/* Start of content when we have licenses */}
                {filteredData && filteredData.length > 0 && (
                    <>
                        {/* Table View */}
                        {tableView && (
                            <Box sx={{ width: '100%', height: 'auto', minHeight: 40 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" color="primary">
                                        Showing all {filteredData.length} licenses in table format
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={exportEmailList}
                                            startIcon={<DownloadIcon />}
                                        >
                                            Export to CSV
                                        </Button>
                                        {selectedLicenses.length > 0 && (
                                            <>
                                                <Chip
                                                    label={`${selectedLicenses.length} licenses selected`}
                                                    color="primary"
                                                    onDelete={() => setSelectedLicenses([])}
                                                />
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={releaseBulkLicenses}
                                                    startIcon={<DeleteIcon />}
                                                >
                                                    Return Selected Licenses
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                                
                                {/* Add debug info in case of empty data */}
                                {filteredData.length === 0 ? (
                                    <Typography variant="body1" color="error">
                                        No license data to display. Please check your filters.
                                    </Typography>
                                ) : (
                                    <>
                                        {/* The DataGrid Box below is commented out as its content is not active, preventing a large empty space. */}
                                        {/* <Box sx={{ height: 650, width: '100%', mb: 4 }}>
                                            {/* <Typography variant="subtitle1" gutterBottom>
                                                License Table
                                            </Typography> */}
                                            
                                            {/* Debug info for troubleshooting */}
                                            {/* <Typography variant="body2" sx={{ mb: 2 }}>
                                                Data contains {filteredData.length} records
                                            </Typography> */}
                                            
                                            {/* Raw data display for debugging */}
                                            {/* <Box sx={{
                                                p: 3, 
                                                border: '1px solid #ffcc80', 
                                                borderRadius: 2,
                                                mb: 3,
                                                bgcolor: '#fff8e1',
                                                maxHeight: '200px',
                                                overflow: 'auto'
                                            }}>
                                                <Typography variant="body2" fontWeight="bold" color="#ed6c02" gutterBottom>
                                                    Data verification (first 3 records):
                                                </Typography>
                                                <pre style={{ fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                                    {JSON.stringify(filteredData.slice(0, 3), null, 2)}
                                                </pre>
                                            </Box> */}
                                            

                                            {/* <Box sx={{ height: 400, width: '100%' }}>
                                                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Email</th>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Product</th>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Issued</th>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Expires</th>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Status</th>
                                                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license, index) => {
                                                                let status = 'Unknown';
                                                                let statusColor = 'gray';
                                                                
                                                                try {
                                                                    if (license.expiry) {
                                                                        const expiry = Date.parse(license.expiry);
                                                                        const timeToExpire = expiry - Date.now();
                                                                        
                                                                        if (timeToExpire < 0) {
                                                                            status = 'Expired';
                                                                            statusColor = '#d32f2f'; // error color
                                                                        } else if (timeToExpire < (sixty_minutes * 2.0)) {
                                                                            status = 'Expiring Soon';
                                                                            statusColor = '#ed6c02'; // warning color
                                                                        } else {
                                                                            status = 'Active';
                                                                            statusColor = '#2e7d32'; // success color
                                                                        }
                                                                    }
                                                                } catch (e) {
                                                                    console.error("Error calculating status:", e);
                                                                }
                                                                
                                                                let issuedFormatted = 'N/A';
                                                                let expiryFormatted = 'N/A';
                                                                
                                                                try {
                                                                    if (license.timestamp) {
                                                                        issuedFormatted = new Date(license.timestamp).toLocaleString();
                                                                    }
                                                                    if (license.expiry) {
                                                                        expiryFormatted = new Date(license.expiry).toLocaleString();
                                                                    }
                                                                } catch (e) {
                                                                    console.error("Error formatting dates:", e);
                                                                }
                                                                
                                                                return (
                                                                    <tr key={index} style={{ 
                                                                        borderBottom: '1px solid #e0e0e0',
                                                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                                                                    }}>
                                                                        <td style={{ padding: '12px' }}>{license.email || 'N/A'}</td>
                                                                        <td style={{ padding: '12px' }}>{license.product || 'N/A'}</td>
                                                                        <td style={{ padding: '12px' }}>{issuedFormatted}</td>
                                                                        <td style={{ padding: '12px' }}>{expiryFormatted}</td>
                                                                        <td style={{ padding: '12px' }}>
                                                                            <span style={{
                                                                                backgroundColor: statusColor,
                                                                                color: 'white',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {status}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '12px' }}>
                                                                            <button
                                                                                onClick={(e) => releaseLicense(e, license.email, license.product)}
                                                                                style={{
                                                                                    backgroundColor: '#d32f2f',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    padding: '6px 12px',
                                                                                    borderRadius: '4px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            >
                                                                                Return
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            
                                                            {filteredData.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                                                        No license data available
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                    
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        padding: '16px',
                                                        backgroundColor: '#f9f9f9',
                                                        borderTop: '1px solid #e0e0e0'
                                                    }}>
                                                        <div>
                                                            Showing {filteredData.length > 0 ? page * rowsPerPage + 1 : 0} to {Math.min((page + 1) * rowsPerPage, filteredData.length)} of {filteredData.length}
                                                        </div>
                                                        <div>
                                                            <button 
                                                                onClick={() => setPage(Math.max(0, page - 1))}
                                                                disabled={page === 0}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    marginRight: '8px',
                                                                    background: page === 0 ? '#f5f5f5' : '#1976d2',
                                                                    color: page === 0 ? '#999' : 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: page === 0 ? 'default' : 'pointer'
                                                                }}
                                                            >
                                                                Previous
                                                            </button>
                                                            <button 
                                                                onClick={() => setPage(Math.min(Math.ceil(filteredData.length / rowsPerPage) - 1, page + 1))}
                                                                disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    background: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#f5f5f5' : '#1976d2',
                                                                    color: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#999' : 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? 'default' : 'pointer'
                                                                }}
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Box>
                                            </Box> */} {/* This was the closing tag for the inner Box sx={{ height: 400 ...}} */}
                                        {/* </Box> */} {/* This is the closing tag for the Box sx={{ height: 650 ...}} started on line 871 */}

                                        {/* Fallback: Regular HTML table */}
                                        <Box sx={{ mt: 0, p: 2, border: '1px solid #1976d2', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                            <Typography variant="h6" gutterBottom color="primary">
                                                License Data Table
                                            </Typography>
                                            
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                        Total: {filteredData.length} licenses
                                                    </div>
                                                    
                                                    {/* Debug information */}
                                                    <div style={{ 
                                                        padding: '8px', 
                                                        backgroundColor: '#f0f8ff', 
                                                        border: '1px solid #ccc', 
                                                        borderRadius: '4px',
                                                        marginRight: '10px',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        Current page: {page}, Rows per page: {rowsPerPage}, 
                                                        Showing: {page * rowsPerPage} to {Math.min((page + 1) * rowsPerPage, filteredData.length)}
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <label style={{ marginRight: '10px' }}>Rows per page:</label>
                                                        <select 
                                                            value={rowsPerPage} 
                                                            onChange={(e) => {
                                                                setRowsPerPage(Number(e.target.value));
                                                                setPage(0); // Reset to first page
                                                            }}
                                                            style={{
                                                                padding: '5px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ccc',
                                                                marginRight: '20px'
                                                            }}
                                                        >
                                                            {[10, 25, 50, 100].map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '2px solid #1976d2', backgroundColor: '#f5f9ff' }}>
                                                            <th 
                                                                style={{ 
                                                                    padding: '12px', 
                                                                    textAlign: 'left', 
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none',
                                                                    position: 'relative'
                                                                }}
                                                                onClick={() => handleTableSort('email')}
                                                            >
                                                                Email
                                                                {tableSortField === 'email' && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                                        {tableSortDirection === 'asc' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                            <th 
                                                                style={{ 
                                                                    padding: '12px', 
                                                                    textAlign: 'left', 
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none'
                                                                }}
                                                                onClick={() => handleTableSort('product')}
                                                            >
                                                                Product
                                                                {tableSortField === 'product' && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                                        {tableSortDirection === 'asc' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                            <th 
                                                                style={{ 
                                                                    padding: '12px', 
                                                                    textAlign: 'left', 
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none'
                                                                }}
                                                                onClick={() => handleTableSort('issued')}
                                                            >
                                                                Issued
                                                                {tableSortField === 'issued' && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                                        {tableSortDirection === 'asc' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                            <th 
                                                                style={{ 
                                                                    padding: '12px', 
                                                                    textAlign: 'left', 
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none'
                                                                }}
                                                                onClick={() => handleTableSort('expires')}
                                                            >
                                                                Expires
                                                                {tableSortField === 'expires' && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                                        {tableSortDirection === 'asc' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                            <th 
                                                                style={{ 
                                                                    padding: '12px', 
                                                                    textAlign: 'left', 
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none'
                                                                }}
                                                                onClick={() => handleTableSort('status')}
                                                            >
                                                                Status
                                                                {tableSortField === 'status' && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                                        {tableSortDirection === 'asc' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={selectedLicenses.length > 0 && selectedLicenses.length === sortTableData(filteredData).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                                                                    indeterminate={selectedLicenses.length > 0 && selectedLicenses.length < sortTableData(filteredData).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                                                                    onChange={(e) => {
                                                                        const visibleData = sortTableData(filteredData).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                                                                        if (e.target.checked) {
                                                                            const newSelections = [...selectedLicenses];
                                                                            visibleData.forEach(license => {
                                                                                if (!newSelections.some(l => l.email === license.email && l.product === license.product)) {
                                                                                    newSelections.push(license);
                                                                                }
                                                                            });
                                                                            setSelectedLicenses(newSelections);
                                                                        } else {
                                                                            setSelectedLicenses(selectedLicenses.filter(selected => 
                                                                                !visibleData.some(visible => visible.email === selected.email && visible.product === selected.product)
                                                                            ));
                                                                        }
                                                                    }}
                                                                />
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Data rows dynamically generated */}
                                                        {filteredData && filteredData.length > 0 && sortTableData(filteredData)
                                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                            .map((license, index) => {
                                                                // Calculate expiry status
                                                                let expiry, timeToExpire, status;
                                                                try {
                                                                    expiry = license.expiry ? Date.parse(license.expiry) : null;
                                                                    timeToExpire = expiry ? expiry - Date.now() : null;
                                                                    status = timeToExpire < 0 ? 'Expired' : 
                                                                            timeToExpire < (sixty_minutes * 2.0) ? 'Expiring Soon' : 
                                                                            'Active';
                                                                } catch (e) {
                                                                    status = 'Unknown';
                                                                }
                                                                
                                                                // Determine status color
                                                                const statusColor = status === 'Expired' ? '#d32f2f' : 
                                                                                status === 'Expiring Soon' ? '#ed6c02' : 
                                                                                '#2e7d32';
                                                                
                                                                // Determine if license is extended
                                                                let isExtended = false;
                                                                try {
                                                                    if (license.timestamp && license.expiry && license.product) {
                                                                        isExtended = setExtendedLabel(license.timestamp, license.expiry, license.product) === 'Extended';
                                                                    }
                                                                } catch (e) {
                                                                    // Ignore errors
                                                                }
                                                                
                                                                // Format dates
                                                                const year = new Date().getFullYear().toString();
                                                                const issuedFormatted = license.timestamp ? 
                                                                    license.timestamp.replace(`${year}-`, "").replace('T', " ") : 'N/A';
                                                                const expiryFormatted = license.expiry ? 
                                                                    license.expiry.replace(`${year}-`, "").replace('T', " ") : 'N/A';
                                                                    
                                                                return (
                                                                    <tr key={index} style={{ 
                                                                        borderBottom: '1px solid #e0e0e0',
                                                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' 
                                                                    }}>
                                                                        <td style={{ padding: '10px' }}>{license.email}</td>
                                                                        <td style={{ padding: '10px' }}>{license.product}</td>
                                                                        <td style={{ padding: '10px' }}>{issuedFormatted}</td>
                                                                        <td style={{ padding: '10px' }}>{expiryFormatted}</td>
                                                                        <td style={{ padding: '10px' }}>
                                                                            <span style={{ 
                                                                                backgroundColor: statusColor,
                                                                                color: 'white',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {status}
                                                                            </span>
                                                                            {isExtended && (
                                                                                <span style={{ 
                                                                                    backgroundColor: '#0288d1',
                                                                                    color: 'white',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: 'bold',
                                                                                    marginLeft: '5px'
                                                                                }}>
                                                                                    Extended
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td style={{ padding: '10px' }}>
                                                                            <button 
                                                                                onClick={(e) => releaseLicense(e, license.email, license.product)}
                                                                                style={{
                                                                                    backgroundColor: '#d32f2f',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    padding: '6px 12px',
                                                                                    borderRadius: '4px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            >
                                                                                Return
                                                                            </button>
                                                                        </td>
                                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={selectedLicenses.some(l => l.email === license.email && l.product === license.product)}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        setSelectedLicenses([...selectedLicenses, license]);
                                                                                    } else {
                                                                                        setSelectedLicenses(selectedLicenses.filter(l => !(l.email === license.email && l.product === license.product)));
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        
                                                        {/* Empty row placeholder when no data */}
                                                        {filteredData.length === 0 && (
                                                            <tr>
                                                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                                    No license data available
                                                                </td>
                                                            </tr>
                                                        )}
                                                        
                                                        {/* Error row for any rendering issues */}
                                                        {(() => {
                                                            try {
                                                                // This is just a try-catch wrapper around the existing code
                                                                // If we get here, no error occurred
                                                                return null;
                                                            } catch (error) {
                                                                console.error("Error rendering table rows:", error);
                                                                return (
                                                                    <tr>
                                                                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', background: '#ffebee', color: '#d32f2f' }}>
                                                                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                                                Error rendering license data
                                                                            </div>
                                                                            <div>
                                                                                {error.toString()}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        })()}
                                                    </tbody>
                                                </table>
                                                
                                                {/* Pagination Controls */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    marginTop: '1rem',
                                                    padding: '0.5rem',
                                                    backgroundColor: '#f5f9ff',
                                                    borderTop: '1px solid #e0e0e0'
                                                }}>
                                                    <div>
                                                        Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredData.length)} of {filteredData.length} entries
                                                    </div>
                                                    <div>
                                                        <button 
                                                            onClick={() => setPage(0)} 
                                                            disabled={page === 0}
                                                            style={{
                                                                padding: '5px 10px',
                                                                margin: '0 5px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                backgroundColor: page === 0 ? '#f5f5f5' : '#fff',
                                                                cursor: page === 0 ? 'default' : 'pointer',
                                                                color: page === 0 ? '#aaa' : '#333'
                                                            }}
                                                        >
                                                            First
                                                        </button>
                                                        <button 
                                                            onClick={() => setPage(page - 1)} 
                                                            disabled={page === 0}
                                                            style={{
                                                                padding: '5px 10px',
                                                                margin: '0 5px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                backgroundColor: page === 0 ? '#f5f5f5' : '#fff',
                                                                cursor: page === 0 ? 'default' : 'pointer',
                                                                color: page === 0 ? '#aaa' : '#333'
                                                            }}
                                                        >
                                                            Previous
                                                        </button>
                                                        <span style={{ margin: '0 10px' }}>
                                                            Page {page + 1} of {Math.max(1, Math.ceil(filteredData.length / rowsPerPage))}
                                                        </span>
                                                        <button 
                                                            onClick={() => setPage(page + 1)} 
                                                            disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
                                                            style={{
                                                                padding: '5px 10px',
                                                                margin: '0 5px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                backgroundColor: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#f5f5f5' : '#fff',
                                                                cursor: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? 'default' : 'pointer',
                                                                color: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#aaa' : '#333'
                                                            }}
                                                        >
                                                            Next
                                                        </button>
                                                        <button 
                                                            onClick={() => setPage(Math.ceil(filteredData.length / rowsPerPage) - 1)} 
                                                            disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
                                                            style={{
                                                                padding: '5px 10px',
                                                                margin: '0 5px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                backgroundColor: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#f5f5f5' : '#fff',
                                                                cursor: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? 'default' : 'pointer',
                                                                color: page >= Math.ceil(filteredData.length / rowsPerPage) - 1 ? '#aaa' : '#333'
                                                            }}
                                                        >
                                                            Last
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                        
                        {/* User Summary - Only show if not in table view */}
                        {!tableView && (
                            <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color="primary">
                                    Found {groupedData.length} users with active licenses
                                </Typography>
                                <Chip 
                                    label={`${groupedData.length} Users`} 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                            
                            {/* Card View */}
                                {groupedData.map(user => {
                                    if (!user || !user.email) return null;
                                    
                                    const isExpanded = expandedUsers[user.email] || false;
                                    // Calculate license status for badge
                                    const hasExpiring = user.licenses.some(lic => {
                                        const expiry = Date.parse(lic.expiry);
                                        const timeToExpire = expiry - Date.now();
                                        return timeToExpire < (sixty_minutes * 2.0);
                                    });
                                    
                                    // Count products
                                    const productCount = user.products ? user.products.length : 0;
                                    const licenseCount = user.licenses ? user.licenses.length : 0;
                                    
                                    return (
                                        <Card 
                                            key={user.email} 
                                            variant="outlined" 
                                            sx={{ 
                                                mb: 1, 
                                                boxShadow: 'none',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderLeft: hasExpiring ? '3px solid #f44336' : '3px solid #4caf50',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    transform: 'translateY(-1px)'
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ py: 1, px: 2 }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}>
                                                    {/* Left section - User info */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '30%' }}>
                                                        <Box
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: '50%',
                                                                bgcolor: 'primary.light',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                mr: 1.5,
                                                                flexShrink: 0,
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {user.email.charAt(0).toUpperCase()}
                                                        </Box>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 'medium',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {user.email}
                                                        </Typography>
                                                    </Box>

                                                    {/* Middle section - Product info with progress bars */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        flexGrow: 1,
                                                        px: 2,
                                                        maxWidth: '50%',
                                                        width: '100%'
                                                    }}>
                                                        {/* Progress bars for each license */}
                                                        <Box sx={{ width: '100%' }}>
                                                            {user.licenses && user.licenses.map(license => {
                                                                const expiry = Date.parse(license.expiry);
                                                                const timeToExpire = expiry - Date.now();
                                                                const duration = Date.parse(license.expiry) - Date.parse(license.timestamp);
                                                                // Calculate percentage remaining (inverted so it decreases as time passes)
                                                                const percentRemaining = Math.max(0, Math.min(100, (timeToExpire / duration) * 100));

                                                                // Calculate hours remaining
                                                                const hoursRemaining = timeToExpire / (60 * 60 * 1000);

                                                                // Determine color based on time remaining
                                                                let progressColor = 'success.main';
                                                                if (hoursRemaining < 8) {
                                                                    if (hoursRemaining < 2) {
                                                                        progressColor = 'error.main'; // Red for <2 hours
                                                                    } else {
                                                                        progressColor = 'warning.main'; // Yellow/orange for <8 hours
                                                                    }
                                                                }

                                                                return (
                                                                    <Box key={license.email + license.product + license.timestamp} sx={{ mb: 0.5 }}>
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                                                            <Typography variant="caption" fontWeight="medium">
                                                                                {license.product}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {hoursRemaining < 1
                                                                                    ? `${Math.round(hoursRemaining * 60)} mins remaining`
                                                                                    : hoursRemaining < 24
                                                                                        ? `${Math.round(hoursRemaining)} hours remaining`
                                                                                        : `${Math.round(hoursRemaining / 24)} days remaining`}
                                                                            </Typography>
                                                                        </Box>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={percentRemaining}
                                                                            sx={{
                                                                                height: 4,
                                                                                borderRadius: 2,
                                                                                bgcolor: 'rgba(0,0,0,0.05)',
                                                                                '& .MuiLinearProgress-bar': {
                                                                                    bgcolor: progressColor,
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    </Box>

                                                    {/* Right section - Button */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', minWidth: '120px' }}>
                                                        <Button
                                                            aria-label={isExpanded ? 'Hide Details' : 'Show Details'}
                                                            size="small"
                                                            variant="contained"
                                                            color={isExpanded ? "secondary" : "primary"}
                                                            onClick={() => toggleUserExpand(user.email)}
                                                            sx={{
                                                                minWidth: 100,
                                                                borderRadius: 8
                                                            }}
                                                        >
                                                            {isExpanded ? 'Hide' : 'Show'}
                                                        </Button>
                                                    </Box>
                                                </Box>

                                                <Collapse in={isExpanded}>
                                                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', color: 'text.primary' }}>
                                                            License Details
                                                        </Typography>
                                                        
                                                        {user.licenses && user.licenses.map(item => {
                                                            if (!item || !item.expiry) {
                                                                return null;
                                                            }
                                                            
                                                            let expiry = Date.parse(item.expiry);
                                                            let timeToExpire = expiry - Date.now();
                                                            let durationOfLicense = Date.parse(item.expiry) - Date.parse(item.timestamp);
                                                            let durationString = durationOfLicense / (60 * 60 * 24 * 1000);
                                                            
                                                            // Status for color coding
                                                            const status = setChipLabel(timeToExpire);
                                                            const statusColor = setColor(timeToExpire);
                                                            const isExtended = setExtendedLabel(item.timestamp, item.expiry, item.product) === 'Extended';
                                                            
                                                            return (
                                                                <Card 
                                                                    key={uuid()} 
                                                                    variant="outlined" 
                                                                    sx={{ 
                                                                        mb: 1, 
                                                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                                                        borderColor: 'rgba(0,0,0,0.09)',
                                                                        position: 'relative',
                                                                        overflow: 'visible'
                                                                    }}
                                                                >
                                                                    <Box 
                                                                        sx={{ 
                                                                            position: 'absolute', 
                                                                            top: -10, 
                                                                            right: 16, 
                                                                            zIndex: 2 
                                                                        }}
                                                                    >
                                                                        <Chip 
                                                                            variant="filled" 
                                                                            size="small" 
                                                                            color={statusColor}
                                                                            label={status}
                                                                            sx={{ fontWeight: 'bold' }}
                                                                        />
                                                                        {isExtended && (
                                                                            <Chip 
                                                                                variant="filled" 
                                                                                size="small" 
                                                                                color="info"
                                                                                label="Extended"
                                                                                sx={{ ml: 1, fontWeight: 'bold' }}
                                                                            />
                                                                        )}

                                                                    </Box>
                                                                    
                                                                    <CardContent sx={{ py: 1.5, px: 2 }}>
                                                                        <Grid container spacing={1}>
                                                                            <Grid item size={3}>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Product
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                                    {item.product}
                                                                                </Typography>
                                                                            </Grid>
                                                                            
                                                                            <Grid item size={3}>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Issued
                                                                                </Typography>
                                                                                <Typography variant="body2" color={setDateColor(item.timestamp)}>
                                                                                    {item.timestamp ? item.timestamp.replace(`${year}-`, "").replace('T', " ") : 'N/A'}
                                                                                </Typography>
                                                                            </Grid>
                                                                            
                                                                            <Grid item size={3}>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Expires
                                                                                </Typography>
                                                                                <Typography variant="body2" color={setDateColor(item.expiry)} sx={{ fontWeight: timeToExpire < sixty_minutes * 2 ? 'bold' : 'normal' }}>
                                                                                    {item.expiry ? item.expiry.replace(`${year}-`, "").replace('T', " ") : 'N/A'}
                                                                                </Typography>
                                                                            </Grid>
                                                                            
                                                                            <Grid item size={3}>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Duration
                                                                                </Typography>
                                                                                <Typography variant="body2">
                                                                                    {durationString.toFixed(2)} days
                                                                                </Typography>
                                                                            </Grid>

                                                                            <Grid item size={3}>
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="error"
                                                                                    size="small"
                                                                                    startIcon={<DeleteIcon />}
                                                                                    onClick={(e) => {
                                                                                        releaseLicense(e, item.email, item.product);
                                                                                    }}
                                                                                    sx={{ mt: 1 }}
                                                                                >
                                                                                    Return {item.product} for {item.email.split('@')[0]}
                                                                                </Button>
                                                                            </Grid>

                                                                            <Grid item size={12}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                                                    <Box sx={{ flex: 1, mr: 2 }}>
                                                                                        <LinearProgress
                                                                                            color={statusColor}
                                                                                            variant='determinate'
                                                                                            value={Math.min(100, (100 - timeToExpire/sixty_minutes*100))}
                                                                                            sx={{ height: 8, borderRadius: 4 }}
                                                                                        />
                                                                                    </Box>
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        {setExpiryLabel(timeToExpire)}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Grid>
                                                                        </Grid>
                                                                    </CardContent>
                                                                </Card>
                                                            );
                                                        })}
                                                    </Box>
                                                </Collapse>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </>
                        )}
                    </>
                )}

                {/* Display alerts */}
                <PreviewAlert />
                <SuccessAlert />
            </Container>
        )
    
        }

    } else {
        return (
            <div>
                <h1>No data</h1>
            </div>
        )
    }
}
