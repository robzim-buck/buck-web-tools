import { useState, useMemo } from 'react';
import { useProtectedApiGet } from '../hooks/useApi';
import {
  Typography,
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Code as CodeIcon
} from '@mui/icons-material';

export default function LansweeperAssets(props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [rawDataDialogOpen, setRawDataDialogOpen] = useState(false);
  const [selectedRawData, setSelectedRawData] = useState(null);

  const handleShowRawData = (item) => {
    setSelectedRawData(item);
    setRawDataDialogOpen(true);
  };

  const handleCloseRawDataDialog = () => {
    setRawDataDialogOpen(false);
    setSelectedRawData(null);
  };

  const { data, isLoading, error, refetch } = useProtectedApiGet('/lansweeper/assets', {
    queryParams: {
      page: page + 1,
      size: rowsPerPage
    },
    dependencies: [page, rowsPerPage]
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Define specific columns to display
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'scannerType', label: 'Scanner Type' },
    { key: 'userDomain', label: 'User Domain' },
    { key: 'url', label: 'URL', isTopLevel: true, isLink: true }
  ];

  // Helper to get value from item (handles nested assetBasicInfo)
  const getValue = (item, col) => {
    if (col.isTopLevel) {
      return item[col.key];
    }
    return item?.assetBasicInfo?.[col.key];
  };

  // Memoize filtered data
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!searchTerm) return data.items;

    const lowerSearch = searchTerm.toLowerCase();
    return data.items.filter(item =>
      columns.some(col =>
        String(getValue(item, col) || '').toLowerCase().includes(lowerSearch)
      )
    );
  }, [data?.items, searchTerm]);

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading Lansweeper assets...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Failed to load Lansweeper assets</Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  const totalItems = data?.total || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight="medium">
          {props.name || 'Lansweeper Assets'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ width: 250 }}
          />
          <IconButton color="primary" onClick={handleRefresh} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {totalItems} total assets
          </Typography>
        </Box>
      </Box>

      {/* Table */}
      <Paper variant="outlined">
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100', width: 80 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item, index) => (
                <TableRow key={item.uuid || item.key || index} hover>
                  {columns.map((col) => {
                    const value = getValue(item, col);
                    return (
                      <TableCell key={col.key}>
                        {value !== null && value !== undefined
                          ? col.isLink
                            ? <Link href={value} target="_blank" rel="noopener noreferrer">{value}</Link>
                            : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)
                          : ''}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleShowRawData(item)}
                      title="View Raw Data"
                    >
                      <CodeIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No assets found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Raw Data Dialog */}
      <Dialog
        open={rawDataDialogOpen}
        onClose={handleCloseRawDataDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Raw Asset Data</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              backgroundColor: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '60vh',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}
          >
            {selectedRawData ? JSON.stringify(selectedRawData, null, 2) : ''}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRawDataDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
