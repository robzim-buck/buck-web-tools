import dayjs from 'dayjs';
import { useState, Component } from 'react';
import { Typography, Button, Select, MenuItem } from '@mui/material';
import { Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, TableSortLabel } from '@mui/material'
import uuid from 'react-uuid';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker, LocalizationProvider }  from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useProtectedApiGet } from '../hooks/useApi';
let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true };
    }
  
    componentDidCatch(error, errorInfo) {
      // You can also log the error to an error reporting service
      console.log(error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        alert("Something went Wrong !!!")
        return <h1>Something went wrong.</h1>;
      }
  
      return this.props.children; 
    }
  }


export default function Invoices(props) {
    let today = new Date();

    let todayString = dayjs(today.toISOString());

    console.log('today string = ', todayString);
    const [valueString, setValueString] = useState('')
    const [jobfilter, setJobfilter] = useState('');
    const [table, setTable] = useState('PRODUCTION');

    const [datePickerValue, setDatePickerValue] = useState(dayjs(''));
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');

    const handleTableChange = (event) => {
        setTable(event.target.value);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const createSortHandler = (property) => () => {
        handleRequestSort(property);
    };

    const { data: invoices, isLoading, error } = useProtectedApiGet(
        '/netsuite/invoices_for_day',
        {
            queryParams: { _system: table },
            dependencies: [table]
        }
    );
    

    if (invoices) {

        let filteredData = invoices;


        const clearJobFilter = () => {
            setJobfilter('')
        }


        const clearDateFilter = () => {
            setValueString('')
            setDatePickerValue(dayjs(''))
        }


        if (jobfilter.length > 0) {
          filteredData = invoices.filter((f) => f.jobcode.includes(jobfilter.toUpperCase()));
        }

        if (valueString.length > 0) {
            // console.log(valueString);
            filteredData = invoices.filter((f) => f.triggerdate.includes(valueString));
        }

        const sortedData = [...filteredData].sort((a, b) => {
            if (!orderBy) return 0;
            
            let aValue = a[orderBy];
            let bValue = b[orderBy];
            
            // Handle numeric sorting for amount
            if (orderBy === 'amount') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }
            
            if (bValue < aValue) {
                return order === 'asc' ? 1 : -1;
            }
            if (bValue > aValue) {
                return order === 'asc' ? -1 : 1;
            }
            return 0;
        });

        return (
            <>
            <ErrorBoundary>
            <Typography variant='h4' gutterBottom>{table} {props.name} INVOICES</Typography>
            <Select
                labelId="invoice-table-select-id"
                id="table-select"
                value={table}
                label="System"
                onChange={handleTableChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: 'white',
                      color: 'black'
                    }
                  }
                }}>
            <MenuItem value='SANDBOX'>Sandbox</MenuItem>
            <MenuItem value='PRODUCTION'>Production</MenuItem>
            </Select>
            <Box sx={{ my: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Typography variant="body1">Filter Job Codes:</Typography>
                    </Grid>
                    <Grid item>
                        <input id="filter"
                            name="filter"
                            type="text"
                            value={jobfilter}
                            onChange={event => setJobfilter(event.target.value)}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </Grid>
                    <Grid item>
                        <Button onClick={clearJobFilter} size="small" variant="outlined" disabled={!jobfilter}>Clear Job Filter</Button>
                    </Grid>
                    <Grid item>
                        <ErrorBoundary>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Filter on Trigger Date"
                                    value={datePickerValue}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setValueString(newValue.format('YYYY-MM-DD'));
                                            setDatePickerValue(newValue)
                                        } else {
                                            setValueString('');
                                            setDatePickerValue(null);
                                        }
                                    }}
                                    slotProps={{
                                        popper: {
                                            sx: {
                                                '& .MuiPaper-root': {
                                                    backgroundColor: 'white'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </ErrorBoundary>
                    </Grid>
                    <Grid item>
                        <Button onClick={clearDateFilter} size="small" variant="outlined" disabled={!valueString && !datePickerValue}>Clear Date Filter</Button>
                    </Grid>
                </Grid>
            </Box>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead sx={{ backgroundColor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'jobcode'}
                                    direction={orderBy === 'jobcode' ? order : 'asc'}
                                    onClick={createSortHandler('jobcode')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Job Code
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'jobid'}
                                    direction={orderBy === 'jobid' ? order : 'asc'}
                                    onClick={createSortHandler('jobid')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Job ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'salesorderid'}
                                    direction={orderBy === 'salesorderid' ? order : 'asc'}
                                    onClick={createSortHandler('salesorderid')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Sales Order ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'invoiceid'}
                                    direction={orderBy === 'invoiceid' ? order : 'asc'}
                                    onClick={createSortHandler('invoiceid')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Invoice ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'timestamp'}
                                    direction={orderBy === 'timestamp' ? order : 'asc'}
                                    onClick={createSortHandler('timestamp')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Processed At
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'triggerdate'}
                                    direction={orderBy === 'triggerdate' ? order : 'asc'}
                                    onClick={createSortHandler('triggerdate')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Trigger Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                <TableSortLabel
                                    active={orderBy === 'amount'}
                                    direction={orderBy === 'amount' ? order : 'asc'}
                                    onClick={createSortHandler('amount')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Amount
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'rowname'}
                                    direction={orderBy === 'rowname' ? order : 'asc'}
                                    onClick={createSortHandler('rowname')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    RowName
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={orderBy === 'created'}
                                    direction={orderBy === 'created' ? order : 'asc'}
                                    onClick={createSortHandler('created')}
                                    sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '&.MuiTableSortLabel-root:hover': { color: 'white' }, '&.Mui-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                    Created At
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((item) => (
                            <TableRow key={uuid()} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                                <TableCell component="th" scope="row">{item.jobcode}</TableCell>
                                <TableCell>{item.jobid}</TableCell>
                                <TableCell>{item.salesorderid}</TableCell>
                                <TableCell>{item.invoiceid}</TableCell>
                                <TableCell>{item.timestamp.replace('2024-','')}</TableCell>
                                <TableCell>{item.triggerdate.split('T')[0].replace('2024-','')}</TableCell>
                                <TableCell align="right">{USDollar.format(item.amount/100.0)}</TableCell>
                                <TableCell>{item.rowname}</TableCell>
                                <TableCell>{item.created.replace('/2024','')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </ErrorBoundary>
            </>
            )
    }
    if (isLoading) return <CircularProgress></CircularProgress>;
    if (error) return <Typography color="error">Error loading invoices: {error.message}</Typography>;
    if (!invoices) return <CircularProgress></CircularProgress>;
}
