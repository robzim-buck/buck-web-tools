import {
    Typography, Box, Container, Alert, Paper, Chip, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails, Grid, LinearProgress,
    Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQuery } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerspaceObjectivesChecker(props) {
    const objectivesReviewQuery = useQuery({
        queryKey: ["hammerspaceObjectivesReview"],
        queryFn: async () => {
            const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace/objectives_review", {
                method: "GET",
                mode: "cors",
                headers: {
                    "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                    "Content-type": "application/json"
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch objectives review: ${response.statusText}`);
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2
    });

    const getSeverityIcon = (severity) => {
        switch (severity?.toUpperCase()) {
            case 'ERROR': return <ErrorIcon color="error" fontSize="small" />;
            case 'WARNING': return <WarningIcon color="warning" fontSize="small" />;
            case 'INFO': return <InfoIcon color="info" fontSize="small" />;
            default: return <CheckCircleIcon color="success" fontSize="small" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toUpperCase()) {
            case 'ERROR': return 'error';
            case 'WARNING': return 'warning';
            case 'INFO': return 'info';
            default: return 'success';
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'info';
        if (score >= 40) return 'warning';
        return 'error';
    };

    if (objectivesReviewQuery.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (objectivesReviewQuery.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace Objectives Review</Typography>
                    <Typography variant="body2">{objectivesReviewQuery.error.message}</Typography>
                </Alert>
            </Container>
        );
    }

    if (objectivesReviewQuery.data) {
        const data = objectivesReviewQuery.data;
        const summary = data.summary || {};
        const shares = data.shares || [];
        const healthScores = data.health_scores || [];
        const lifecycles = data.lifecycles || [];
        const workloads = data.workloads || [];
        const replicationConsistency = data.replication_consistency || {};
        const versioningAnalysis = data.versioning_undelete_analysis || [];
        const unusedObjectives = data.unused_objectives || {};
        const allIssues = data.all_issues || [];
        const complexity = data.complexity || [];
        const exportAudits = data.export_audits || [];
        const shareComparison = data.share_comparison || {};
        const blockDenySafety = data.block_deny_safety || [];
        const coverageGaps = data.coverage_gaps || [];
        const performanceTradeoffs = data.performance_tradeoffs || [];
        const crossShareConsistency = data.cross_share_consistency || {};

        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Objectives Checker'}
                    </Typography>
                </Box>

                {/* Summary Cards - Row 1 */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.total_shares || 0}</Typography>
                                <Typography variant="body2">Total Shares</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.total_issues || 0}</Typography>
                                <Typography variant="body2">Total Issues</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.errors || 0}</Typography>
                                <Typography variant="body2">Errors</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.warnings || 0}</Typography>
                                <Typography variant="body2">Warnings</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'grey.200' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.info || 0}</Typography>
                                <Typography variant="body2">Info</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: getHealthColor(summary.avg_health_score) + '.light' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.avg_health_score?.toFixed(1) || 'N/A'}</Typography>
                                <Typography variant="body2">Avg Health Score</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Summary Cards - Row 2 */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.total_recommendations || 0}</Typography>
                                <Typography variant="body2">Recommendations</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: summary.compliance_issues > 0 ? 'warning.light' : 'success.light', color: summary.compliance_issues > 0 ? 'warning.contrastText' : 'success.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.compliance_issues || 0}</Typography>
                                <Typography variant="body2">Compliance Issues</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: summary.replication_issues > 0 ? 'warning.light' : 'success.light', color: summary.replication_issues > 0 ? 'warning.contrastText' : 'success.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.replication_issues || 0}</Typography>
                                <Typography variant="body2">Replication Issues</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: summary.versioning_alignment_issues > 0 ? 'warning.light' : 'success.light', color: summary.versioning_alignment_issues > 0 ? 'warning.contrastText' : 'success.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.versioning_alignment_issues || 0}</Typography>
                                <Typography variant="body2">Versioning Issues</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: summary.block_deny_high_risk_shares > 0 ? 'error.light' : 'success.light', color: summary.block_deny_high_risk_shares > 0 ? 'error.contrastText' : 'success.contrastText' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.block_deny_high_risk_shares || 0}</Typography>
                                <Typography variant="body2">High Risk Shares</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: getHealthColor(summary.cross_share_consistency_score) + '.light' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight="bold">{summary.cross_share_consistency_score?.toFixed(0) || 'N/A'}%</Typography>
                                <Typography variant="body2">Consistency Score</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Health Scores Table */}
                {healthScores.length > 0 && (
                    <Accordion defaultExpanded sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Health Scores by Share</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Health</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Issues</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Objectives</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {healthScores.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.health_score?.toFixed(0)}
                                                        size="small"
                                                        color={getHealthColor(item.health_score)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={item.health_score || 0}
                                                        color={getHealthColor(item.health_score)}
                                                        sx={{ height: 8, borderRadius: 4 }}
                                                    />
                                                </TableCell>
                                                <TableCell>{item.issue_count || 0}</TableCell>
                                                <TableCell>{item.total_objectives || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Issues by Share */}
                <Accordion defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Issues by Share</Typography>
                        <Chip label={`${shares.filter(s => s.issues?.length > 0).length} shares with issues`} size="small" sx={{ ml: 2 }} />
                    </AccordionSummary>
                    <AccordionDetails>
                        {shares.filter(share => share.issues?.length > 0).map((share, shareIndex) => (
                            <Accordion key={shareIndex} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Typography fontWeight="medium">{share.share_name}</Typography>
                                        <Chip
                                            label={`${share.issues?.length || 0} issues`}
                                            size="small"
                                            color={share.issues?.some(i => i.severity === 'ERROR') ? 'error' :
                                                   share.issues?.some(i => i.severity === 'WARNING') ? 'warning' : 'info'}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {share.total_objectives} objectives
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Severity</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Category</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Objective</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {share.issues?.map((issue, issueIndex) => (
                                                    <TableRow key={issueIndex}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {getSeverityIcon(issue.severity)}
                                                                <Chip
                                                                    label={issue.severity}
                                                                    size="small"
                                                                    color={getSeverityColor(issue.severity)}
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                                {issue.category}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{issue.message}</Typography>
                                                            {issue.condition && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                                                                    Condition: {issue.condition}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                                {issue.objective_name}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </AccordionDetails>
                </Accordion>

                {/* Workloads */}
                {workloads.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Detected Workloads</Typography>
                            <Chip label={`${workloads.length} shares`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Workload Type</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Confidence</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Expected Objectives</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Missing</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Appropriate</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {workloads.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.workload_type}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.confidence}
                                                        size="small"
                                                        color={item.confidence === 'HIGH' ? 'success' : item.confidence === 'MEDIUM' ? 'warning' : 'default'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.description}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {item.expected_objectives?.length > 0 ? (
                                                        item.expected_objectives.map((obj, idx) => (
                                                            <Chip key={idx} label={obj} size="small" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.missing_objectives?.length > 0 ? (
                                                        item.missing_objectives.map((obj, idx) => (
                                                            <Chip key={idx} label={obj} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {item.appropriate ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <CancelIcon color="error" fontSize="small" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Lifecycles */}
                {lifecycles.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Lifecycle Policies</Typography>
                            <Chip label={`${lifecycles.filter(l => l.has_lifecycle_policy).length} with policies`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Versioning</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Undelete</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Log Transfer</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Has Policy</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {lifecycles.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {item.versioning ? (
                                                        <Tooltip title={item.versioning_condition || 'No condition'}>
                                                            <Chip label={item.versioning} size="small" color="info" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.undelete ? (
                                                        <Tooltip title={item.undelete_condition || 'No condition'}>
                                                            <Chip label={item.undelete} size="small" color="success" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.log_xfer ? (
                                                        <Tooltip title={item.log_xfer_condition || 'No condition'}>
                                                            <Chip label={item.log_xfer} size="small" color="warning" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {item.has_lifecycle_policy ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <CancelIcon color="error" fontSize="small" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Versioning & Undelete Analysis */}
                {versioningAnalysis.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Versioning & Undelete Analysis</Typography>
                            <Chip label={`${versioningAnalysis.filter(v => v.has_issues).length} with issues`} size="small" color={versioningAnalysis.some(v => v.has_issues) ? 'warning' : 'success'} sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Versioning</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Undelete</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Findings</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Recommendations</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {versioningAnalysis.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {item.versioning_config?.enabled ? (
                                                        <Box>
                                                            <Chip label={item.versioning_config.period || 'Enabled'} size="small" color="info" />
                                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                                {item.versioning_config.hours}h retention
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Disabled</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.undelete_config?.enabled ? (
                                                        <Box>
                                                            <Chip label={item.undelete_config.period || 'Enabled'} size="small" color="success" />
                                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                                {item.undelete_config.hours}h retention
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Disabled</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.alignment_status}
                                                        size="small"
                                                        color={item.alignment_status === 'OK' ? 'success' : 'warning'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {item.findings?.length > 0 ? (
                                                        item.findings.map((finding, idx) => (
                                                            <Box key={idx} sx={{ mb: 0.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    {getSeverityIcon(finding.severity)}
                                                                    <Typography variant="body2">{finding.message}</Typography>
                                                                </Box>
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.recommendations?.length > 0 ? (
                                                        item.recommendations.map((rec, idx) => (
                                                            <Typography key={idx} variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                                                {rec}
                                                            </Typography>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Replication Consistency */}
                {replicationConsistency.findings?.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Replication Consistency</Typography>
                            <Chip label={`${replicationConsistency.findings.length} findings`} size="small" color="warning" sx={{ ml: 2 }} />
                            <Chip label={`${replicationConsistency.total_sites} sites`} size="small" sx={{ ml: 1 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Site Distribution:</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {Object.entries(replicationConsistency.site_distribution || {}).map(([site, count]) => (
                                        <Chip key={site} label={`${site}: ${count}`} size="small" variant="outlined" />
                                    ))}
                                </Box>
                            </Box>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Issue Type</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Sites</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Recommendation</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {replicationConsistency.findings.map((finding, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{finding.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {finding.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {finding.issue_type}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {getSeverityIcon(finding.severity)}
                                                        <Chip label={finding.severity} size="small" color={getSeverityColor(finding.severity)} variant="outlined" />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{finding.message}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {finding.sites?.map((site, idx) => (
                                                        <Chip key={idx} label={site} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{finding.recommendation}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Recommendations */}
                {data.recommendations?.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Recommendations</Typography>
                            <Chip label={`${data.recommendations.length} total`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Priority</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Suggested Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.recommendations.slice(0, 100).map((rec, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{rec.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={rec.priority}
                                                        size="small"
                                                        color={rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {rec.category}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{rec.title}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{rec.description}</Typography>
                                                    {rec.current_state && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                            Current: {rec.current_state}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{rec.suggested_action}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {data.recommendations.length > 100 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Showing first 100 of {data.recommendations.length} recommendations
                                </Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Security & Compliance */}
                {data.security_compliance?.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Security & Compliance</Typography>
                            <Chip label={`${data.security_compliance.length} shares`} size="small" sx={{ ml: 2 }} />
                            <Chip
                                label={`${data.security_compliance.filter(s => s.has_issues).length} with issues`}
                                size="small"
                                color={data.security_compliance.some(s => s.has_issues) ? 'warning' : 'success'}
                                sx={{ ml: 1 }}
                            />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Virus Scan</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>WORM</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Findings</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.security_compliance.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <Chip
                                                        label={item.compliance_status}
                                                        size="small"
                                                        color={item.compliance_status === 'COMPLIANT' ? 'success' :
                                                               item.compliance_status === 'NON_COMPLIANT' ? 'error' : 'warning'}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {item.has_virus_scan ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {item.has_worm ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.findings?.length > 0 ? (
                                                        item.findings.map((finding, idx) => (
                                                            <Box key={idx} sx={{ mb: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    {getSeverityIcon(finding.severity)}
                                                                    <Typography variant="body2" fontWeight="medium">{finding.issue_type}</Typography>
                                                                </Box>
                                                                <Typography variant="body2">{finding.message}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                    {finding.recommendation}
                                                                </Typography>
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Unused Objectives */}
                {unusedObjectives.unused_objectives?.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Unused Objectives</Typography>
                            <Chip label={`${unusedObjectives.unused_count || 0} unused`} size="small" sx={{ ml: 2 }} />
                            <Chip label={`${unusedObjectives.used_objectives || 0} used / ${unusedObjectives.total_objectives || 0} total`} size="small" color="info" sx={{ ml: 1 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {unusedObjectives.unused_objectives.map((obj, index) => (
                                    <Chip key={index} label={obj} size="small" variant="outlined" color="default" />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* All Issues - Consolidated View */}
                {allIssues.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">All Issues (Consolidated)</Typography>
                            <Chip label={`${allIssues.length} total`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Objective</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {allIssues.map((issue, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{issue.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {issue.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {getSeverityIcon(issue.severity)}
                                                        <Chip label={issue.severity} size="small" color={getSeverityColor(issue.severity)} variant="outlined" />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {issue.category}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{issue.message}</Typography>
                                                    {issue.condition && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                                                            Condition: {issue.condition}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {issue.objective_name}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Export Audits - NFS Export Security */}
                {exportAudits.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Export Audits (NFS Security)</Typography>
                            <Chip label={`${exportAudits.filter(e => e.has_issues).length} with issues`} size="small" color={exportAudits.some(e => e.has_issues) ? 'warning' : 'success'} sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Exports</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Warnings</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {exportAudits.map((audit, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{audit.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {audit.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {audit.exports?.map((exp, idx) => (
                                                        <Box key={idx} sx={{ mb: 0.5 }}>
                                                            <Chip label={`${exp.subnet} (${exp.access})`} size="small" sx={{ mr: 0.5 }} />
                                                            {!exp.root_squash && <Chip label="No Root Squash" size="small" color="warning" variant="outlined" sx={{ mr: 0.5 }} />}
                                                            {exp.insecure && <Chip label="Insecure" size="small" color="error" variant="outlined" />}
                                                        </Box>
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {audit.warnings?.length > 0 ? (
                                                        audit.warnings.map((warn, idx) => (
                                                            <Box key={idx} sx={{ mb: 0.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <WarningIcon color="warning" fontSize="small" />
                                                                    <Typography variant="body2" fontWeight="medium">{warn.type}</Typography>
                                                                </Box>
                                                                <Typography variant="body2">{warn.message}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{warn.recommendation}</Typography>
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Complexity Analysis */}
                {complexity.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Condition Complexity Analysis</Typography>
                            <Chip label={`${complexity.length} conditions`} size="small" sx={{ ml: 2 }} />
                            <Chip label={`${complexity.filter(c => c.complexity_level === 'HIGH' || c.complexity_level === 'VERY_HIGH').length} complex`} size="small" color={complexity.some(c => c.complexity_level === 'HIGH' || c.complexity_level === 'VERY_HIGH') ? 'warning' : 'success'} sx={{ ml: 1 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Objective</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Condition</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Operators</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Depth</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {complexity.map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        {item.objective}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={item.condition}>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.condition}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={item.complexity_score} size="small" color={item.complexity_score > 10 ? 'error' : item.complexity_score > 5 ? 'warning' : 'success'} />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.complexity_level}
                                                        size="small"
                                                        color={item.complexity_level === 'VERY_HIGH' ? 'error' : item.complexity_level === 'HIGH' ? 'warning' : item.complexity_level === 'MEDIUM' ? 'info' : 'success'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                        AND:{item.operators?.AND || 0} OR:{item.operators?.OR || 0} NOT:{item.operators?.NOT || 0}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.nesting_depth}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Share Comparison */}
                {shareComparison.unique_configurations > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Share Configuration Comparison</Typography>
                            <Chip label={`${shareComparison.unique_configurations} unique configs`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom>Common Objectives (all shares)</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                        {shareComparison.common_objectives?.map((obj, idx) => (
                                            <Chip key={idx} label={obj} size="small" color="success" variant="outlined" />
                                        ))}
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom>Rare Objectives (few shares)</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                        {shareComparison.rare_objectives?.map((obj, idx) => (
                                            <Chip key={idx} label={obj} size="small" color="info" variant="outlined" />
                                        ))}
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" gutterBottom>Objective Coverage</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Objective</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Coverage</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {shareComparison.objective_coverage && Object.entries(shareComparison.objective_coverage).map(([obj, stats], index) => (
                                                    <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{obj}</Typography>
                                                        </TableCell>
                                                        <TableCell>{stats.count}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={stats.percentage}
                                                                    sx={{ width: 100, height: 8, borderRadius: 4 }}
                                                                    color={stats.percentage === 100 ? 'success' : stats.percentage > 50 ? 'info' : 'warning'}
                                                                />
                                                                <Typography variant="body2">{stats.percentage?.toFixed(1)}%</Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Block/Deny Safety */}
                {blockDenySafety.length > 0 && blockDenySafety.some(b => b.has_issues || b.total_restrictions > 0) && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Block/Deny Safety Analysis</Typography>
                            <Chip label={`${blockDenySafety.filter(b => b.risk_level === 'HIGH').length} high risk`} size="small" color={blockDenySafety.some(b => b.risk_level === 'HIGH') ? 'error' : 'success'} sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Risk Level</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Block Objectives</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Deny Objectives</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Findings</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {blockDenySafety.filter(b => b.has_issues || b.total_restrictions > 0).map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.risk_level}
                                                        size="small"
                                                        color={item.risk_level === 'HIGH' ? 'error' : item.risk_level === 'MEDIUM' ? 'warning' : 'success'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {item.block_objectives?.length > 0 ? (
                                                        item.block_objectives.map((obj, idx) => (
                                                            <Chip key={idx} label={obj} size="small" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.deny_objectives?.length > 0 ? (
                                                        item.deny_objectives.map((obj, idx) => (
                                                            <Chip key={idx} label={obj} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.findings?.length > 0 ? (
                                                        item.findings.map((finding, idx) => (
                                                            <Box key={idx} sx={{ mb: 0.5 }}>
                                                                <Typography variant="body2">{finding.message || finding}</Typography>
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Coverage Gaps */}
                {coverageGaps.length > 0 && coverageGaps.some(c => c.has_issues) && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Coverage Gaps</Typography>
                            <Chip label={`${coverageGaps.filter(c => c.has_issues).length} with gaps`} size="small" color="warning" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Time Conditions</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Size Conditions</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Pattern Conditions</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Has Catch-All</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Findings</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {coverageGaps.filter(c => c.has_issues).map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.time_conditions_count || 0}</Typography>
                                                    {item.time_gaps?.length > 0 && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {item.time_gaps.map((gap, idx) => (
                                                                <Chip key={idx} label={gap} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.size_conditions_count || 0}</Typography>
                                                    {item.size_gaps?.length > 0 && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {item.size_gaps.map((gap, idx) => (
                                                                <Chip key={idx} label={gap} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.pattern_conditions_count || 0}</Typography>
                                                    {item.pattern_gaps?.length > 0 && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {item.pattern_gaps.map((gap, idx) => (
                                                                <Chip key={idx} label={gap} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {item.has_catch_all ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <CancelIcon color="error" fontSize="small" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.findings?.length > 0 ? (
                                                        item.findings.map((finding, idx) => (
                                                            <Typography key={idx} variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                                                {finding.message || finding}
                                                            </Typography>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Performance Tradeoffs */}
                {performanceTradeoffs.length > 0 && performanceTradeoffs.some(p => p.tradeoffs?.length > 0) && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Performance Tradeoffs</Typography>
                            <Chip label={`${performanceTradeoffs.filter(p => p.tradeoffs?.length > 0).length} shares with tradeoffs`} size="small" sx={{ ml: 2 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Share</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Performance Objectives</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Protection Objectives</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Tradeoffs</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Suggestions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {performanceTradeoffs.filter(p => p.tradeoffs?.length > 0).map((item, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.share_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                        {item.share_path}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {item.performance_objectives?.map((obj, idx) => (
                                                        <Chip key={idx} label={obj} size="small" color="info" variant="outlined" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {item.protection_objectives?.map((obj, idx) => (
                                                        <Chip key={idx} label={obj} size="small" color="success" variant="outlined" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {item.tradeoffs?.map((tradeoff, idx) => (
                                                        <Box key={idx} sx={{ mb: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {getSeverityIcon(tradeoff.severity)}
                                                                <Typography variant="body2" fontWeight="medium">{tradeoff.type}</Typography>
                                                            </Box>
                                                            <Typography variant="body2">{tradeoff.message}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{tradeoff.impact}</Typography>
                                                        </Box>
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {item.suggestions?.map((sug, idx) => (
                                                        <Typography key={idx} variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                                            • {sug}
                                                        </Typography>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Cross-Share Consistency */}
                {crossShareConsistency.has_issues && (
                    <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Cross-Share Consistency</Typography>
                            <Chip label={`Score: ${crossShareConsistency.consistency_score?.toFixed(0)}%`} size="small" color={crossShareConsistency.consistency_score >= 80 ? 'success' : crossShareConsistency.consistency_score >= 50 ? 'warning' : 'error'} sx={{ ml: 2 }} />
                            <Chip label={`${crossShareConsistency.findings?.length || 0} findings`} size="small" sx={{ ml: 1 }} />
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Share Groups: {crossShareConsistency.group_count}</Typography>
                            </Box>
                            {crossShareConsistency.findings?.length > 0 && (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Group</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Issue Type</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Shares</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {crossShareConsistency.findings.map((finding, index) => (
                                                <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">{finding.group}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                            {finding.issue_type}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {getSeverityIcon(finding.severity)}
                                                            <Chip label={finding.severity} size="small" color={getSeverityColor(finding.severity)} variant="outlined" />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {finding.shares?.map((share, idx) => (
                                                            <Chip key={idx} label={share} size="small" sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} />
                                                        ))}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{finding.message}</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            {crossShareConsistency.recommendations?.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
                                    {crossShareConsistency.recommendations.map((rec, idx) => (
                                        <Typography key={idx} variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                            • {rec}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
            </Container>
        );
    }

    return null;
}
