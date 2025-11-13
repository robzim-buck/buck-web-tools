import { useState } from 'react';
import {
    Typography, Box, Card, CardContent, Grid, Chip,
    ToggleButtonGroup, ToggleButton, Paper
} from '@mui/material';
import MUIDataTable from "mui-datatables";
import CircularProgress from '@mui/material/CircularProgress';
import { ViewList as ViewListIcon, TableView as TableViewIcon } from '@mui/icons-material';
import { useAppData } from '../contexts/AppDataProvider';

export default function LDAPMachineInfo(props) {
    // Get pre-fetched data from context
    const { queries } = useAppData();
    const ldap_machine_info = queries.ldapBasicMachineInfo;

    // View mode state
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

    const columns = ['name', 'operatingSystem', 'operatingSystemVersion', 'isCriticalSystemObject',
                      'pwdLastSet','whenCreated',
                      'whenChanged','lastLogon','logonCount','lastLogonTimestamp',
                      'objectGUID']
    const options = {
        filterType: 'checkbox',
        rowsPerPageOptions: [10,25,50,250,500,1000],
        downloadOptions: {'filename': 'ldap_machine_info.csv'},
        selectableRows: 'none'
      };

      if (ldap_machine_info.isLoading) return <CircularProgress></CircularProgress>;
      if (ldap_machine_info.error) return "An error has occurred: " + ldap_machine_info.error.message;
      if (ldap_machine_info.data) {
        console.log(ldap_machine_info.data)
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant='h3'>{props.name}</Typography>

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                    >
                        <ToggleButton value="table" aria-label="table view">
                            <TableViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Table
                        </ToggleButton>
                        <ToggleButton value="card" aria-label="card view">
                            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Card
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {viewMode === 'table' ? (
                    /* Table View */
                    <MUIDataTable
                        title={"LDAP Machine Info"}
                        data={ldap_machine_info.data}
                        columns={columns}
                        options={options}
                    />
                ) : (
                    /* Card View */
                    <Grid container spacing={2}>
                        {ldap_machine_info.data.map((machine, index) => {
                            const formatDate = (dateStr) => {
                                if (!dateStr || dateStr === 'N/A') return 'N/A';
                                try {
                                    const date = new Date(dateStr);
                                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                                } catch {
                                    return dateStr;
                                }
                            };

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 24px rgba(102, 126, 234, 0.3)'
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            {/* Machine Name Header */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    mb: 2,
                                                    pb: 1,
                                                    borderBottom: '2px solid rgba(255, 255, 255, 0.3)'
                                                }}
                                            >
                                                {machine.name || 'Unknown'}
                                            </Typography>

                                            {/* Operating System */}
                                            <Box sx={{ mb: 1.5 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                                                    Operating System
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {machine.operatingSystem || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                    {machine.operatingSystemVersion || ''}
                                                </Typography>
                                            </Box>

                                            {/* Critical System Object Badge */}
                                            {machine.isCriticalSystemObject && (
                                                <Chip
                                                    label="Critical"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(255, 82, 82, 0.9)',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        mb: 1.5
                                                    }}
                                                />
                                            )}

                                            {/* Last Logon */}
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                                                    Last Logon
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                    {formatDate(machine.lastLogon)}
                                                </Typography>
                                            </Box>

                                            {/* Logon Count */}
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                                                    Logon Count
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                    {machine.logonCount || '0'}
                                                </Typography>
                                            </Box>

                                            {/* Creation Date */}
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                                                    Created
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                    {formatDate(machine.whenCreated)}
                                                </Typography>
                                            </Box>

                                            {/* Last Changed */}
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                                                    Last Modified
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                    {formatDate(machine.whenChanged)}
                                                </Typography>
                                            </Box>

                                            {/* Object GUID */}
                                            <Box
                                                sx={{
                                                    mt: 2,
                                                    pt: 1.5,
                                                    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>
                                                    GUID: {machine.objectGUID || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>
        );
    }
}
