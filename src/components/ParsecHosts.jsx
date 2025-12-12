import {
  Chip, Typography, Paper, Grid, Box, TextField,
  CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  ToggleButton, ToggleButtonGroup, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Card, CardContent, Divider
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import { useProtectedApiGet } from '../hooks/useApi';
import { useAppData } from '../contexts/AppDataProvider';
import uuid from 'react-uuid';
import { useState, useMemo, useEffect } from 'react';

export default function ParsecHosts({ name = "Parsec Hosts" }) {
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [sortColumn, setSortColumn] = useState('name'); // Column to sort by
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [filterText, setFilterText] = useState(''); // Filter text

  // Get Parsec users data from context
  const { data: appData, queries, requestData } = useAppData();

  // Request the data this component needs
  useEffect(() => {
    requestData('parsecUsers');
  }, [requestData]);
  const parsecUsers = queries.parsecUsers;

  // Fetch Parsec machines data using the protected API
  const { data: parsecMachines, isLoading, error } = useProtectedApiGet(
    '/parsec/parsecinfo/category',
    {
      queryParams: {
        _category: 'machines'
      }
    }
  );

  // Create a lookup map for Parsec users by user_id
  const parsecUsersById = useMemo(() => {
    if (!parsecUsers.data || !Array.isArray(parsecUsers.data)) return {};

    const userMap = {};
    parsecUsers.data.forEach(user => {
      if (user?.user_id) {
        userMap[user.user_id] = user;
      }
    });
    return userMap;
  }, [parsecUsers.data]);

  // Helper function to get guest user info from user_id
  const getGuestUserInfo = (guestId) => {
    if (!guestId) return null;
    return parsecUsersById[guestId] || null;
  };

  // Enrich machines with guest user information and owner information
  const enrichedMachines = useMemo(() => {
    if (!parsecMachines || !Array.isArray(parsecMachines)) return [];

    return parsecMachines.map(machine => {
      // Get the current user/owner of this machine
      const ownerId = machine.user_id || machine.owner_id || machine.userId;
      const ownerInfo = getGuestUserInfo(ownerId);

      // If machine has guests array, enrich each guest with user info
      if (machine.guests && Array.isArray(machine.guests)) {
        const enrichedGuests = machine.guests.map(guest => {
          // Guest might be just an ID or an object with an id field
          const guestId = typeof guest === 'object' ? guest.id || guest.user_id : guest;
          const userInfo = getGuestUserInfo(guestId);

          return {
            id: guestId,
            name: userInfo?.name || guest.name || 'Unknown Guest',
            email: userInfo?.email || guest.email || null,
            user_id: guestId,
            ...guest
          };
        });

        return {
          ...machine,
          guests: enrichedGuests,
          owner: ownerInfo ? {
            user_id: ownerId,
            name: ownerInfo.name,
            email: ownerInfo.email
          } : null
        };
      }

      return {
        ...machine,
        owner: ownerInfo ? {
          user_id: ownerId,
          name: ownerInfo.name,
          email: ownerInfo.email
        } : null
      };
    });
  }, [parsecMachines, parsecUsersById]);

  // Handle column sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!enrichedMachines || !Array.isArray(enrichedMachines)) return [];

    // First, filter the data
    let filtered = enrichedMachines;
    if (filterText) {
      const lowercaseFilter = filterText.toLowerCase();
      filtered = enrichedMachines.filter((item) => {
        return (
          item.name?.toLowerCase().includes(lowercaseFilter) ||
          item.hostname?.toLowerCase().includes(lowercaseFilter) ||
          item.peer_id?.toLowerCase().includes(lowercaseFilter) ||
          item.status?.toLowerCase().includes(lowercaseFilter) ||
          item.owner?.name?.toLowerCase().includes(lowercaseFilter) ||
          item.owner?.email?.toLowerCase().includes(lowercaseFilter) ||
          item.guests?.some(guest =>
            guest.name?.toLowerCase().includes(lowercaseFilter) ||
            guest.email?.toLowerCase().includes(lowercaseFilter)
          )
        );
      });
    }

    // Then, sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'hostname':
          aValue = a.hostname?.toLowerCase() || '';
          bValue = b.hostname?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'guests':
          aValue = a.guests?.length || 0;
          bValue = b.guests?.length || 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [enrichedMachines, filterText, sortColumn, sortDirection]);

  if (isLoading || parsecUsers.isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">An error has occurred: {error.message}</Typography>;
  if (parsecUsers.error) return <Typography color="error">Error loading Parsec users: {parsecUsers.error.message}</Typography>;

  if (enrichedMachines && Array.isArray(enrichedMachines)) {
    const sortedData = filteredAndSortedData;

    return (
      <Box sx={{
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: '-1px'
            }}
          >
            {name}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Manage Parsec host machines and their assigned guests
          </Typography>
        </Box>

        {/* Stats Bar */}
        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#1e40af', fontWeight: 700 }}>
              {enrichedMachines.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Total Machines
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#047857', fontWeight: 700 }}>
              {enrichedMachines.filter(m => m.status?.toLowerCase() === 'online').length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Online
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#0891b2', fontWeight: 700 }}>
              {enrichedMachines.reduce((total, m) => total + (m.guests?.length || 0), 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Total Guests
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#dc2626', fontWeight: 700 }}>
              {enrichedMachines.filter(m => !m.guests || m.guests.length === 0).length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              No Guests
            </Typography>
          </Box>
        </Box>

        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            label="Filter Machines"
            variant="outlined"
            size="small"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by name, hostname, guest..."
            sx={{
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                '&:hover fieldset': {
                  borderColor: '#1e40af'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1e40af'
                }
              }
            }}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newView) => newView && setViewMode(newView)}
            aria-label="view mode"
            size="small"
            sx={{
              bgcolor: 'white',
              '& .MuiToggleButton-root': {
                '&.Mui-selected': {
                  bgcolor: '#1e40af',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1e3a8a'
                  }
                }
              }
            }}
          >
            <ToggleButton value="card" aria-label="card view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <TableRowsIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === 'card' ? (
          <Grid container spacing={2}>
            {sortedData.map((machine) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={uuid()}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-4px)',
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: machine.status?.toLowerCase() === 'online' ? '#047857' : '#dc2626'
                    }
                  }}
                >
                  <CardContent sx={{
                    p: 0,
                    '&:last-child': { pb: 0 },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}>
                    {/* Header Section with Gradient */}
                    <Box sx={{
                      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                      p: 2,
                      pb: 1.5
                    }}>
                      {/* Machine Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ComputerIcon sx={{
                          color: 'white',
                          fontSize: 36,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: 'white',
                              display: 'block',
                              lineHeight: 1.3,
                              fontSize: '0.95rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {machine.name || 'Unnamed Machine'}
                          </Typography>
                          {machine.hostname && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                display: 'block',
                                fontSize: '0.7rem',
                                opacity: 0.9,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {machine.hostname}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Current User/Owner */}
                      {machine.owner && (
                        <Box sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 1,
                          p: 0.75,
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            <PersonIcon sx={{ color: 'white', fontSize: 16 }} />
                            <Typography variant="caption" sx={{
                              color: 'rgba(255, 255, 255, 0.85)',
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Current User
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {machine.owner.name}
                          </Typography>
                          {machine.owner.email && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                display: 'block',
                                fontSize: '0.65rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {machine.owner.email}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Content Section - Guests */}
                    <Box sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {machine.guests && machine.guests.length > 0 ? (
                        <>
                          <Typography variant="caption" sx={{
                            color: '#64748b',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 1,
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <PersonIcon sx={{ fontSize: 14 }} />
                            Guests ({machine.guests.length})
                          </Typography>
                          <Box sx={{ flex: 1, overflow: 'auto', maxHeight: '160px' }}>
                            {machine.guests.map((guest, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  mb: 0.75,
                                  pb: 0.75,
                                  borderBottom: idx < machine.guests.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                                  '&:last-child': { mb: 0, pb: 0 }
                                }}
                              >
                                <Typography variant="body2" sx={{
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  color: '#1e40af',
                                  lineHeight: 1.4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {guest.name || 'Unknown Guest'}
                                </Typography>
                                {guest.email && (
                                  <Typography variant="caption" sx={{
                                    color: '#64748b',
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    lineHeight: 1.4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {guest.email}
                                  </Typography>
                                )}
                                {guest.user_id && (
                                  <Typography variant="caption" sx={{
                                    color: '#94a3b8',
                                    display: 'block',
                                    fontSize: '0.65rem',
                                    fontFamily: 'monospace',
                                    lineHeight: 1.4
                                  }}>
                                    ID: {guest.user_id}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Box sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '80px'
                        }}>
                          <Typography variant="caption" sx={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontStyle: 'italic'
                          }}>
                            No guests assigned
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper} sx={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  bgcolor: 'rgba(30, 64, 175, 0.04)',
                  '& .MuiTableCell-head': {
                    fontWeight: 600,
                    color: '#1e40af',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }
                }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Machine Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'hostname'}
                      direction={sortColumn === 'hostname' ? sortDirection : 'asc'}
                      onClick={() => handleSort('hostname')}
                    >
                      Hostname
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'status'}
                      direction={sortColumn === 'status' ? sortDirection : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Current User</TableCell>
                  <TableCell>Peer ID</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'guests'}
                      direction={sortColumn === 'guests' ? sortDirection : 'asc'}
                      onClick={() => handleSort('guests')}
                    >
                      Guests
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((machine) => (
                  <TableRow key={uuid()} hover sx={{
                    '&:hover': {
                      bgcolor: 'rgba(30, 64, 175, 0.02)'
                    },
                    '& .MuiTableCell-root': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                    }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ComputerIcon sx={{ color: '#1e40af', fontSize: 20 }} />
                        <Typography variant="body2" sx={{
                          fontWeight: 700,
                          color: '#2d3748',
                          fontSize: '0.85rem'
                        }}>
                          {machine.name || 'Unnamed Machine'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {machine.hostname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant="outlined"
                        color={machine.status?.toLowerCase() === 'online' ? 'success' : 'default'}
                        label={machine.status || 'Unknown'}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {machine.owner ? (
                        <Box>
                          <Typography variant="body2" sx={{
                            fontWeight: 700,
                            color: '#1e40af',
                            fontSize: '0.85rem'
                          }}>
                            {machine.owner.name}
                          </Typography>
                          {machine.owner.email && (
                            <Typography variant="caption" sx={{
                              color: '#64748b',
                              display: 'block',
                              fontSize: '0.7rem',
                              lineHeight: 1.4
                            }}>
                              {machine.owner.email}
                            </Typography>
                          )}
                          {machine.owner.user_id && (
                            <Typography variant="caption" sx={{
                              color: '#94a3b8',
                              display: 'block',
                              fontSize: '0.65rem',
                              fontFamily: 'monospace',
                              lineHeight: 1.4
                            }}>
                              ID: {machine.owner.user_id}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{
                          fontStyle: 'italic',
                          fontSize: '0.75rem',
                          color: '#94a3b8'
                        }}>
                          No owner
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#64748b'
                      }}>
                        {machine.peer_id || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {machine.guests && machine.guests.length > 0 ? (
                        <Box>
                          {machine.guests.map((guest, idx) => (
                            <Box key={idx} sx={{
                              mb: 0.75,
                              pb: 0.75,
                              borderBottom: idx < machine.guests.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none'
                            }}>
                              <Typography variant="body2" sx={{
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: '#1e40af'
                              }}>
                                {guest.name || 'Unknown'}
                              </Typography>
                              {guest.email && (
                                <Typography variant="caption" sx={{
                                  color: '#64748b',
                                  display: 'block',
                                  fontSize: '0.7rem',
                                  lineHeight: 1.4
                                }}>
                                  {guest.email}
                                </Typography>
                              )}
                              {guest.user_id && (
                                <Typography variant="caption" sx={{
                                  color: '#94a3b8',
                                  display: 'block',
                                  fontSize: '0.65rem',
                                  fontFamily: 'monospace',
                                  lineHeight: 1.4
                                }}>
                                  ID: {guest.user_id}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{
                          fontStyle: 'italic',
                          fontSize: '0.75rem',
                          color: '#94a3b8'
                        }}>
                          No guests
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  }

  return null;
}
