import { useState, useMemo } from 'react';
import { useProtectedApiMutation } from '../hooks/useApi';
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
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Button,
  Grid,
  Tooltip,
  TablePagination,
  Chip,
  InputAdornment,
  Link
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  TableChart as TableChartIcon,
  Numbers as NumbersIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export default function QueryS3({ name = 'Query S3 with Athena' }) {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(500);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [lastQuery, setLastQuery] = useState('');
  const [lastMaxResults, setLastMaxResults] = useState(500);

  const queryMutation = useProtectedApiMutation('', {
    method: 'POST',
    mutationConfig: {
      onSuccess: (responseData) => {
        setData(responseData);
        setError(null);
        setPage(0);
      },
      onError: (err) => {
        setError(err);
        setData(null);
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }

    // Validate maxResults
    const validMaxResults = Math.min(Math.max(1, maxResults), 5000);
    setMaxResults(validMaxResults);

    // Store the query parameters for refresh
    setLastQuery(query);
    setLastMaxResults(validMaxResults);

    // Make POST request
    await queryMutation.mutateAsync({
      endpoint: `/aws/athena_query/${encodeURIComponent(query)}/${validMaxResults}`
    });
  };

  const handleRefresh = async () => {
    if (lastQuery) {
      await queryMutation.mutateAsync({
        endpoint: `/aws/athena_query/${encodeURIComponent(lastQuery)}/${lastMaxResults}`
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Process data into rows
  const processedData = useMemo(() => {
    if (!data) return { columns: [], rows: [] };

    // Handle Athena ResultSet format
    if (data.ResultSet) {
      const resultSet = data.ResultSet;

      // Get columns from metadata
      const columns = resultSet.ResultSetMetadata?.ColumnInfo?.map(col => col.Name || col.Label) || [];

      if (columns.length === 0) return { columns: [], rows: [] };

      // Get rows (skip first row as it's the header in Athena format)
      const athenaRows = resultSet.Rows || [];
      if (athenaRows.length <= 1) return { columns, rows: [] }; // No data rows

      // Convert Athena row format to objects
      const rows = athenaRows.slice(1).map(row => {
        const rowObj = {};
        const dataArray = row.Data || [];

        columns.forEach((colName, index) => {
          const cellData = dataArray[index];
          rowObj[colName] = cellData?.VarCharValue || cellData?.BigIntValue || cellData?.IntegerValue || cellData?.DoubleValue || cellData?.BooleanValue || null;
        });

        return rowObj;
      });

      return { columns, rows };
    }

    // Handle array response (fallback)
    if (Array.isArray(data)) {
      if (data.length === 0) return { columns: [], rows: [] };

      // Get columns from first object
      const columns = Object.keys(data[0]);
      return { columns, rows: data };
    }

    // Handle object with results key (fallback)
    if (data.results && Array.isArray(data.results)) {
      if (data.results.length === 0) return { columns: [], rows: [] };
      const columns = Object.keys(data.results[0]);
      return { columns, rows: data.results };
    }

    // Handle object with data key (fallback)
    if (data.data && Array.isArray(data.data)) {
      if (data.data.length === 0) return { columns: [], rows: [] };
      const columns = Object.keys(data.data[0]);
      return { columns, rows: data.data };
    }

    return { columns: [], rows: [] };
  }, [data]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return processedData.rows.slice(startIndex, endIndex);
  }, [processedData.rows, page, rowsPerPage]);

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
            <StorageIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 700, color: '#2d3748' }}>
              {name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
              Search S3 inventory data using AWS Athena
            </Typography>
          </Box>
        </Box>
        {lastQuery && (
          <Tooltip title="Refresh last query">
            <IconButton
              onClick={handleRefresh}
              disabled={queryMutation.isPending}
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                },
                '&:disabled': {
                  background: '#cbd5e0',
                  color: '#a0aec0'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Info Alert */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #667eea',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InfoIcon sx={{ color: '#667eea', fontSize: 28 }} />
          <Typography variant="body2" sx={{ color: '#4a5568' }}>
            <Link
              href="https://docs.aws.amazon.com/athena/latest/ug/what-is.html"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontWeight: 600,
                color: '#667eea',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Introduction to Athena
            </Link>
            {' • '}Learn about AWS Athena and how to query S3 data
          </Typography>
        </Box>
      </Paper>

      {/* Query Form */}
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
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Search Query"
                placeholder="Enter a text string to search for files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                multiline
                rows={3}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#667eea', mt: -4 }} />
                      </InputAdornment>
                    )
                  }
                }}
                helperText="Enter a text string.  We will search for files matching %LIKE% pattern in the Global-Buck-Archive S3 Bucket.  
                For example to find objects in the archive that are from the 'doodlydoo' project (where you remember that some files had that name or string in their name),
                enter 'doodlydoo' above."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Results"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value, 10) || 500)}
                inputProps={{ min: 1, max: 5000 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    )
                  }
                }}
                helperText="1-5000"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                startIcon={queryMutation.isPending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SearchIcon />}
                disabled={queryMutation.isPending || !query.trim()}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                  },
                  '&:disabled': {
                    background: '#cbd5e0',
                    color: '#a0aec0'
                  }
                }}
              >
                {queryMutation.isPending ? 'Querying...' : 'Query'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Loading state */}
      {queryMutation.isPending && (
        <>
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #667eea',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={24} sx={{ color: '#667eea' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Searching...
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  Executing Athena query against S3 data
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: 4
            }}
          >
            <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
            <Typography variant="body1" sx={{ mt: 3, fontWeight: 500, color: '#4a5568' }}>
              Executing Athena query...
            </Typography>
          </Box>
        </>
      )}

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Failed to execute query
          </Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      )}

      {/* Results */}
      {!queryMutation.isPending && !error && data && processedData.rows.length > 0 && (
        <>
          <Box
            sx={{
              mb: 3,
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
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                <TableChartIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                Query Results
              </Typography>
            </Box>
            <Chip
              label={`${processedData.rows.length} ${processedData.rows.length === 1 ? 'row' : 'rows'}`}
              sx={{
                fontWeight: 600,
                fontSize: '0.85rem',
                px: 2,
                py: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    {processedData.columns.map((column) => (
                      <TableCell key={column} sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row, index) => {
                    const globalIndex = page * rowsPerPage + index;

                    return (
                      <TableRow
                        key={globalIndex}
                        sx={{
                          bgcolor: index % 2 === 0 ? 'white' : 'rgba(102, 126, 234, 0.03)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(102, 126, 234, 0.08)'
                          }
                        }}
                      >
                        {processedData.columns.map((column) => {
                          const cellValue = row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : 'N/A';

                          // Display full 'key' value without truncation
                          if (column.toLowerCase() === 'key') {
                            return (
                              <TableCell key={`${globalIndex}-${column}`}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordBreak: 'break-all',
                                    whiteSpace: 'normal',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    color: '#4a5568'
                                  }}
                                >
                                  {cellValue}
                                </Typography>
                              </TableCell>
                            );
                          }

                          // Other columns with tooltip and truncation
                          return (
                            <TableCell key={`${globalIndex}-${column}`}>
                              <Tooltip title={cellValue} arrow>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 300,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8rem',
                                    color: '#4a5568'
                                  }}
                                >
                                  {cellValue}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={processedData.rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              showFirstButton
              showLastButton
            />
          </Paper>
        </>
      )}

      {/* No results state */}
      {!queryMutation.isPending && !error && data && processedData.rows.length === 0 && (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: 4
          }}
        >
          <SearchIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your query returned no results. Try modifying your search string.
          </Typography>
        </Box>
      )}

      {/* Initial state */}
      {!data && !queryMutation.isPending && !error && (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: 4
          }}
        >
          <StorageIcon sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748', mb: 1 }}>
            Ready to query S3 data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a search query above to find files in Buck's AWS S3 Global-Buck-Archive using Athena.  We build an inventory of global-buck-archive nightly in AWS that is available within 2 days of creation in Athena.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
