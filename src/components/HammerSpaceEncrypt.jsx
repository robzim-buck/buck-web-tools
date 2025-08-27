import { 
  Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Chip, Card, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useMemo } from 'react';
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerSpaceEncrypt(props) {
    const [expanded, setExpanded] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [editingKms, setEditingKms] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'PASSPHRASE',
        endpoint: '',
        credentials: {
            clientIdentifier: '',
            clientSecret: '',
            serverIdentifier: ''
        },
        keyId: '',
        accessId: '',
        passphraseCount: 1
    });
    
    const queryClient = useQueryClient();
    
    const handleToggle = (kmsId) => {
        setExpanded(prev => ({
            ...prev,
            [kmsId]: !prev[kmsId]
        }));
    };
    
    const [hammerspaceKms] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceKms"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace/kmses", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch KMS configurations: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });
    
    const createKmsMutation = useMutation({
        mutationFn: async (kmsData) => {
            const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace/kmses", {
                method: "POST",
                mode: "cors",
                headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                },
                body: JSON.stringify(kmsData)
            });
            if (!response.ok) {
                throw new Error(`Failed to create KMS: ${response.statusText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['hammerspaceKms']);
            handleCloseDialog();
        }
    });
    
    const updateKmsMutation = useMutation({
        mutationFn: async ({ id, kmsData }) => {
            const response = await fetch(`https://laxcoresrv.buck.local:8000/hammerspace/kmses/${id}`, {
                method: "PUT",
                mode: "cors",
                headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                },
                body: JSON.stringify(kmsData)
            });
            if (!response.ok) {
                throw new Error(`Failed to update KMS: ${response.statusText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['hammerspaceKms']);
            handleCloseDialog();
        }
    });
    
    const deleteKmsMutation = useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`https://laxcoresrv.buck.local:8000/hammerspace?item=kmses/${id}`, {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to delete KMS: ${response.statusText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['hammerspaceKms']);
        }
    });
    
    const handleOpenDialog = (kms = null) => {
        if (kms) {
            setEditingKms(kms);
            setFormData({
                name: kms.name || '',
                type: kms.type || 'PASSPHRASE',
                endpoint: kms.endpoint || '',
                credentials: {
                    clientIdentifier: kms.credentials?.clientIdentifier || '',
                    clientSecret: kms.credentials?.clientSecret || '',
                    serverIdentifier: kms.credentials?.serverIdentifier || ''
                },
                keyId: kms.keyId || '',
                accessId: kms.accessId || '',
                passphraseCount: kms.passphraseCount || 1
            });
        } else {
            setEditingKms(null);
            setFormData({
                name: '',
                type: 'PASSPHRASE',
                endpoint: '',
                credentials: {
                    clientIdentifier: '',
                    clientSecret: '',
                    serverIdentifier: ''
                },
                keyId: '',
                accessId: '',
                passphraseCount: 1
            });
        }
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingKms(null);
    };
    
    const handleSubmit = () => {
        if (editingKms) {
            updateKmsMutation.mutate({ id: editingKms.internalId || editingKms.id, kmsData: formData });
        } else {
            createKmsMutation.mutate(formData);
        }
    };
    
    const handleDelete = (kms) => {
        if (window.confirm(`Are you sure you want to delete KMS "${kms.name}"?`)) {
            deleteKmsMutation.mutate(kms.internalId || kms.id);
        }
    };

    const kmsTypeColor = useMemo(() => ({
        'NCIPHER_WSOP': 'primary',
        'AWS_KMS': 'warning',
        'PASSPHRASE': 'success'
    }), []);

    if (hammerspaceKms.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceKms.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load KMS configurations</Typography>
                    <Typography variant="body2">{hammerspaceKms.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceKms.data) {
        const sortedData = Array.isArray(hammerspaceKms.data) 
            ? hammerspaceKms.data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            : [];

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Encryption at Rest'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add KMS
                        </Button>
                        <IconButton 
                            color="primary" 
                            onClick={() => queryClient.invalidateQueries(['hammerspaceKms'])}
                            sx={{ ml: 1 }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item size={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <LockIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Total KMS Configured
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item size={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.filter(k => k.type === 'PASSPHRASE').length}
                            </Typography>
                            <Typography variant="body2">
                                Passphrase KMS
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item size={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.filter(k => k.type === 'AWS_KMS').length}
                            </Typography>
                            <Typography variant="body2">
                                AWS KMS
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item size={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.filter(k => k.type === 'NCIPHER_WSOP').length}
                            </Typography>
                            <Typography variant="body2">
                                nCipher WSOP
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {sortedData.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h5" color="text.secondary">No KMS configurations found</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                            Add a Key Management System to enable encryption at rest
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '40px' }}>
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <KeyIcon fontSize="small" />
                                            Name
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Endpoint
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Created
                                    </TableCell>
                                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedData.map((kms) => {
                                    const kmsKey = kms.internalId || kms.id || kms.name || Math.random().toString();
                                    
                                    return (
                                        <>
                                            <TableRow 
                                                key={kmsKey}
                                                sx={{ 
                                                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                    '&:hover': { bgcolor: 'action.selected' },
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <TableCell>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleToggle(kmsKey)}
                                                    >
                                                        {expanded[kmsKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {kms.name || 'Unnamed KMS'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        variant="filled" 
                                                        color={kmsTypeColor[kms.type] || 'default'}
                                                        size="small"
                                                        label={kms.type || 'N/A'} 
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {kms.endpoint || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {kms.created ? (
                                                        <Tooltip title={new Date(kms.created).toLocaleString()}>
                                                            <Typography variant="body2">
                                                                {new Date(kms.created).toLocaleDateString()}
                                                            </Typography>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(kms)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(kms)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            
                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                    <Collapse in={expanded[kmsKey]} timeout="auto" unmountOnExit>
                                                        <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                            <Grid container spacing={3}>
                                                                <Grid item size={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Internal ID
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        {kms.internalId || 'N/A'}
                                                                    </Typography>
                                                                </Grid>
                                                                
                                                                <Grid item size={12} md={6}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Key ID
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        {kms.keyId || 'N/A'}
                                                                    </Typography>
                                                                </Grid>

                                                                {kms.accessId && (
                                                                    <Grid item size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Access ID
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                            {kms.accessId}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}

                                                                {kms.type === 'PASSPHRASE' && kms.passphraseCount && (
                                                                    <Grid item size={12} md={6}>
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Passphrase Count
                                                                        </Typography>
                                                                        <Typography variant="body2">
                                                                            {kms.passphraseCount}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}

                                                                <Grid item size={12}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Raw Data
                                                                    </Typography>
                                                                    <Box sx={{ 
                                                                        p: 1, 
                                                                        bgcolor: 'white', 
                                                                        borderRadius: 1, 
                                                                        maxHeight: 200, 
                                                                        overflow: 'auto',
                                                                        border: '1px solid',
                                                                        borderColor: 'grey.300'
                                                                    }}>
                                                                        <pre style={{ 
                                                                            margin: 0, 
                                                                            fontSize: '0.75rem', 
                                                                            whiteSpace: 'pre-wrap',
                                                                            fontFamily: 'monospace'
                                                                        }}>
                                                                            {JSON.stringify(kms, null, 2)}
                                                                        </pre>
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingKms ? 'Edit KMS Configuration' : 'Add KMS Configuration'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item size={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            
                            <Grid item size={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        label="Type"
                                    >
                                        <MenuItem value="PASSPHRASE">Passphrase</MenuItem>
                                        <MenuItem value="AWS_KMS">AWS KMS</MenuItem>
                                        <MenuItem value="NCIPHER_WSOP">nCipher WSOP</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {formData.type !== 'PASSPHRASE' && (
                                <Grid item size={12}>
                                    <TextField
                                        fullWidth
                                        label="Endpoint"
                                        value={formData.endpoint}
                                        onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                                    />
                                </Grid>
                            )}

                            {formData.type === 'AWS_KMS' && (
                                <>
                                    <Grid item size={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Access ID"
                                            value={formData.accessId}
                                            onChange={(e) => setFormData({ ...formData, accessId: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item size={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Key ID"
                                            value={formData.keyId}
                                            onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                                        />
                                    </Grid>
                                </>
                            )}

                            {formData.type === 'NCIPHER_WSOP' && (
                                <>
                                    <Grid item size={12}>
                                        <TextField
                                            fullWidth
                                            label="Client Identifier"
                                            value={formData.credentials.clientIdentifier}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, clientIdentifier: e.target.value }
                                            })}
                                        />
                                    </Grid>
                                    <Grid item size={12}>
                                        <TextField
                                            fullWidth
                                            label="Client Secret"
                                            type="password"
                                            value={formData.credentials.clientSecret}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, clientSecret: e.target.value }
                                            })}
                                        />
                                    </Grid>
                                    <Grid item size={12}>
                                        <TextField
                                            fullWidth
                                            label="Server Identifier"
                                            value={formData.credentials.serverIdentifier}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, serverIdentifier: e.target.value }
                                            })}
                                        />
                                    </Grid>
                                </>
                            )}

                            {formData.type === 'PASSPHRASE' && (
                                <Grid item size={12}>
                                    <TextField
                                        fullWidth
                                        label="Passphrase Count"
                                        type="number"
                                        value={formData.passphraseCount}
                                        onChange={(e) => setFormData({ ...formData, passphraseCount: parseInt(e.target.value) || 1 })}
                                        slotProps={{ input: { min: 1 } }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained"
                            disabled={!formData.name || createKmsMutation.isLoading || updateKmsMutation.isLoading}
                        >
                            {editingKms ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }
    
    return null;
}