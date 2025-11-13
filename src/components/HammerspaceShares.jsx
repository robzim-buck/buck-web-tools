import { 
  Chip, Typography, Box, Container, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Collapse, Tooltip, Card
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import StorageIcon from '@mui/icons-material/Storage';
import { useState } from 'react';
import { useQueries } from "@tanstack/react-query";
import CircularProgress from '@mui/material/CircularProgress';

export default function HammerspaceShares(props) {
    const [expanded, setExpanded] = useState({});
    
    // Toggle expansion state for a specific share
    const handleToggle = (shareId) => {
        setExpanded(prev => ({
            ...prev,
            [shareId]: !prev[shareId]
        }));
    };
    
    const [hammerspaceShares] = useQueries({
        queries: [
          {
            queryKey: ["hammerspaceShares"],
            queryFn: async () => {
                const response = await fetch("https://laxcoresrv.buck.local:8000/hammerspace?item=shares", {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "x-token": "a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo",
                        "Content-type": "application/json"
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch shares: ${response.statusText}`);
                }
                return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2
        },
        ]
    });

    if (hammerspaceShares.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }
    
    if (hammerspaceShares.error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Failed to load Hammerspace shares</Typography>
                    <Typography variant="body2">{hammerspaceShares.error.message}</Typography>
                </Alert>
            </Container>
        );
    }
    
    if (hammerspaceShares.data) {
        // Debug: Log the structure to understand the data format
        console.log('HammerspaceShares raw data:', hammerspaceShares.data);
        
        // Check if data is wrapped in a 'results' field
        const rawData = hammerspaceShares.data.results || hammerspaceShares.data;
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const sortedData = dataArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        if (!sortedData || sortedData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">No Hammerspace shares found</Typography>
                </Box>
            );
        }

        // Calculate statistics
        const totalObjectives = sortedData.reduce((sum, share) => 
            sum + (share.shareObjectives ? share.shareObjectives.length : 0), 0
        );
        
        const shareStates = [...new Set(sortedData.map(share => share.shareState).filter(Boolean))];
        const activeShares = sortedData.filter(share => 
            share.shareState && share.shareState.toLowerCase().includes('active')
        ).length;

        // Determine status color based on share state
        const getStatusColor = (state) => {
            const stateLower = state ? state.toLowerCase() : '';
            if (stateLower.includes('active') || stateLower.includes('online')) return '#4caf50';
            if (stateLower.includes('warn') || stateLower.includes('partial')) return '#ff9800';
            if (stateLower.includes('error') || stateLower.includes('offline')) return '#f44336';
            return '#2196f3'; // default blue
        };

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' color="primary" fontWeight="medium">
                        {props.name || 'Hammerspace Shares'}
                    </Typography>
                    <Chip 
                        label={`${sortedData.length} Shares`} 
                        color="primary" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                {/* Summary Statistics */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {sortedData.length}
                            </Typography>
                            <Typography variant="body2">
                                Total Shares
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {activeShares}
                            </Typography>
                            <Typography variant="body2">
                                Active Shares
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {totalObjectives}
                            </Typography>
                            <Typography variant="body2">
                                Total Objectives
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {shareStates.length}
                            </Typography>
                            <Typography variant="body2">
                                Unique States
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '40px' }}>
                                    {/* Expand column */}
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FolderSharedIcon fontSize="small" />
                                        Name
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    Path
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    State
                                </TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon fontSize="small" />
                                        Objectives
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((shareItem) => {
                                const objectiveCount = shareItem.shareObjectives ? shareItem.shareObjectives.length : 0;
                                const statusColor = getStatusColor(shareItem.shareState);
                                const shareKey = shareItem.name || shareItem.id;
                                const isActive = shareItem.shareState && shareItem.shareState.toLowerCase().includes('active');
                                
                                return (
                                    <>
                                        <TableRow 
                                            key={shareKey}
                                            sx={{ 
                                                '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                '&:hover': { bgcolor: 'action.selected' },
                                                borderLeft: `4px solid ${statusColor}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggle(shareKey)}
                                        >
                                            <TableCell>
                                                <IconButton size="small">
                                                    {expanded[shareKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {shareItem.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={shareItem.path}>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                                        {shareItem.path}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    variant="filled" 
                                                    color={isActive ? "success" : "default"}
                                                    size="small"
                                                    label={shareItem.shareState} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {objectiveCount > 0 ? (
                                                    <Chip 
                                                        variant="outlined" 
                                                        color="secondary" 
                                                        size="small"
                                                        label={`${objectiveCount} objectives`} 
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Collapsible Details Row */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                <Collapse in={expanded[shareKey]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Full Path
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                    {shareItem.path}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            <Grid item xs={12} md={6}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Share State
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    {shareItem.shareState}
                                                                </Typography>
                                                            </Grid>
                                                            
                                                            {shareItem.shareObjectives && shareItem.shareObjectives.length > 0 && (
                                                                <Grid item xs={12} sx={{ overflow: 'visible' }}>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Associated Objectives
                                                                    </Typography>
                                                                    <Box sx={{ 
                                                                        display: 'flex', 
                                                                        flexDirection: 'column',
                                                                        gap: 1,
                                                                        width: '100%',
                                                                        overflow: 'visible'
                                                                    }}>
                                                                        {shareItem.shareObjectives
                                                                            .sort((a, b) => {
                                                                                const nameA = a.objective?.name || `Objective ${shareItem.shareObjectives.indexOf(a) + 1}`;
                                                                                const nameB = b.objective?.name || `Objective ${shareItem.shareObjectives.indexOf(b) + 1}`;
                                                                                return nameA.localeCompare(nameB);
                                                                            })
                                                                            .map((objective, index) => {
                                                                                // Get objective details for tooltip
                                                                                const objData = objective.objective || {};
                                                                                const objName = objData.name || `Objective ${index + 1}`;

                                                                                // Get objective explanation based on objective name
                                                                                const getObjectiveExplanation = (name) => {
                                                                                    const nameLower = (name || '').toLowerCase();

                                                                                    // Durability objectives
                                                                                    if (nameLower.includes('durability_1_nine') || nameLower === 'durability-1-nine') {
                                                                                        return "A singular, pristine instance of your data resides safely within the storage fabric—one faithful copy preserved with care.";
                                                                                    } else if (nameLower.includes('durability_3_nine') || nameLower === 'durability-3-nine' || nameLower.includes('durability_3_nines')) {
                                                                                        return "Your data is lovingly duplicated, with two complete copies standing sentinel across the storage landscape, ensuring continued access should one copy falter.";
                                                                                    } else if (nameLower.includes('durability_2_nine') || nameLower === 'durability-2-nine' || nameLower.includes('durability_2_nines')) {
                                                                                        return "This durability tier maintains your data with enhanced reliability, employing advanced error correction and consistency checks to preserve file integrity. While keeping a single copy, the system applies rigorous validation protocols to detect and repair potential corruption, providing a higher assurance of data availability than standard storage while optimizing capacity efficiency.";
                                                                                    } else if (nameLower.includes('durability_4_nine') || nameLower === 'durability-4-nine' || nameLower.includes('durability_4_nines')) {
                                                                                        return "This durability level creates three synchronized replicas of your data, strategically distributed to maximize resilience. By maintaining triple redundancy, the system ensures that even if two copies become unavailable, your data remains accessible. This approach provides exceptional protection against concurrent failures while enabling seamless failover and recovery operations across the storage infrastructure.";
                                                                                    } else if (nameLower.includes('durability_5_nine') || nameLower === 'durability-5-nine' || nameLower.includes('durability_5_nines')) {
                                                                                        return "Achieving five nines of durability represents a premium tier of data protection, employing four or more intelligently distributed replicas across the storage infrastructure. This configuration can withstand multiple simultaneous failures while maintaining data accessibility. The system continuously monitors replica health, automatically repairing degraded copies and rebalancing data placement to sustain the highest levels of availability and fault tolerance. Future enhancements may include erasure coding techniques for even greater storage efficiency.";
                                                                                    } else if (nameLower.includes('durability_6_nine') || nameLower === 'durability-6-nine' || nameLower.includes('durability_6_nines')) {
                                                                                        return "This represents enterprise-grade durability with extensive data protection mechanisms. The system maintains five or more redundant copies intelligently distributed across multiple failure domains and geographic locations. Through continuous integrity verification, automated healing processes, and strategic replica placement, your data survives catastrophic events while maintaining constant availability for mission-critical applications. Advanced erasure coding capabilities are planned for future releases to optimize storage efficiency while maintaining this exceptional level of protection.";
                                                                                    } else if (nameLower.includes('durability') && (nameLower.includes('nine') || nameLower.includes('9'))) {
                                                                                        return "This durability objective implements comprehensive data protection strategies designed to minimize the risk of data loss. Through intelligent replication and strategic copy placement, the system maintains multiple complete representations of your data across the storage infrastructure, ensuring resilience against hardware failures, network disruptions, and other adverse conditions.";
                                                                                    }

                                                                                    // Performance tier objectives
                                                                                    else if (nameLower.includes('hot') || nameLower.includes('performance') || nameLower.includes('fast')) {
                                                                                        return "This performance-optimized objective prioritizes your most frequently accessed data by placing it on high-speed storage media such as NVMe or SSD devices. Files assigned to this tier benefit from minimal latency and maximum throughput, ensuring rapid response times for demanding workloads. The system intelligently maintains data on premium storage resources to deliver exceptional performance for active datasets and latency-sensitive applications.";
                                                                                    } else if (nameLower.includes('warm') || nameLower.includes('balanced')) {
                                                                                        return "This balanced objective provides a middle ground between performance and capacity, ideal for data that is accessed regularly but not continuously. By placing files on hybrid storage tiers, the system delivers good performance characteristics while optimizing cost efficiency. This tier is perfect for datasets that need reasonable access speeds without requiring the premium performance of hot storage or the deep archival nature of cold storage.";
                                                                                    } else if (nameLower.includes('cold') || nameLower.includes('archive') || nameLower.includes('capacity')) {
                                                                                        return "This capacity-optimized objective is designed for infrequently accessed data that must be retained for compliance, reference, or long-term preservation. Files are stored on high-capacity, cost-efficient media that prioritizes storage density over access speed. While retrieval times may be longer than hot or warm tiers, this objective provides economical storage for vast datasets, historical records, and archival content that rarely requires immediate access.";
                                                                                    }

                                                                                    // Site/Location objectives
                                                                                    else if (nameLower.includes('site') || nameLower.includes('location') || nameLower.includes('_dc') || nameLower.includes('_lax') || nameLower.includes('datacenter')) {
                                                                                        return "This site-specific objective controls data placement based on geographic location or datacenter proximity. By directing data to specific storage sites, it enables compliance with data sovereignty requirements, reduces network latency for localized access patterns, and supports disaster recovery strategies. The system ensures that data resides at designated locations while maintaining availability and durability guarantees, supporting multi-site architectures and edge computing scenarios.";
                                                                                    }

                                                                                    // Backup and protection objectives
                                                                                    else if (nameLower.includes('backup') || nameLower.includes('snapshot') || nameLower.includes('protect')) {
                                                                                        return "This protection-focused objective creates point-in-time copies of your data to guard against accidental deletion, corruption, or ransomware attacks. Backup copies are maintained separately from primary data, often on different storage systems or sites, providing an additional layer of defense. The system can rapidly restore files to previous versions, enabling quick recovery from data loss events while maintaining operational continuity and meeting regulatory retention requirements.";
                                                                                    }

                                                                                    // Lifecycle and age-based objectives
                                                                                    else if (nameLower.includes('lifecycle') || nameLower.includes('aging') || nameLower.includes('migration') || nameLower.includes('tiering')) {
                                                                                        return "This automated lifecycle objective manages data placement based on age, access patterns, or business rules. As files mature or usage patterns change, the system automatically migrates data between performance tiers to optimize costs while maintaining accessibility. This intelligent data movement ensures that frequently accessed files remain on fast storage, while aging data gracefully transitions to more economical tiers, all without requiring manual intervention or disrupting user access.";
                                                                                    }

                                                                                    // Replication objectives
                                                                                    else if (nameLower.includes('replicate') || nameLower.includes('mirror') || nameLower.includes('sync')) {
                                                                                        return "This replication objective maintains synchronized copies of your data across multiple storage locations or systems. By continuously propagating changes between sites, it enables high availability, disaster recovery, and geographic distribution of data. Users at different locations can access local copies with minimal latency, while the system ensures consistency across all replicas. This approach supports business continuity, load distribution, and failover capabilities for mission-critical data.";
                                                                                    }

                                                                                    // Retention and compliance objectives
                                                                                    else if (nameLower.includes('retention') || nameLower.includes('compliance') || nameLower.includes('immutable') || nameLower.includes('worm')) {
                                                                                        return "This compliance-oriented objective enforces data retention policies and immutability requirements to meet regulatory and legal obligations. Files governed by this objective cannot be modified or deleted until retention periods expire, protecting against tampering and ensuring audit trail integrity. The system maintains detailed metadata about retention schedules, legal holds, and compliance status, supporting frameworks such as HIPAA, GDPR, SOX, and industry-specific regulations.";
                                                                                    }

                                                                                    // Compression and deduplication objectives
                                                                                    else if (nameLower.includes('compress') || nameLower.includes('dedupe') || nameLower.includes('optimize')) {
                                                                                        return "This storage optimization objective employs compression and deduplication techniques to reduce the physical capacity consumed by your data. By identifying redundant data blocks and applying efficient compression algorithms, the system can significantly decrease storage requirements while maintaining full data accessibility. This approach is particularly effective for datasets with high redundancy such as backups, virtual machine images, and repetitive file collections, delivering substantial cost savings without sacrificing data integrity.";
                                                                                    }

                                                                                    // Encryption objectives
                                                                                    else if (nameLower.includes('encrypt') || nameLower.includes('secure') || nameLower.includes('cipher')) {
                                                                                        return "This security-focused objective ensures that data is encrypted both at rest and in transit, protecting sensitive information from unauthorized access. Using industry-standard encryption algorithms, the system safeguards your files while maintaining transparent access for authorized users. This objective is essential for protecting confidential data, meeting security compliance requirements, and defending against data breaches, particularly for regulated industries and privacy-sensitive workloads.";
                                                                                    }

                                                                                    // QoS and bandwidth objectives
                                                                                    else if (nameLower.includes('qos') || nameLower.includes('bandwidth') || nameLower.includes('throttle') || nameLower.includes('priority')) {
                                                                                        return "This quality-of-service objective manages network bandwidth allocation and I/O prioritization to ensure fair resource distribution and predictable performance. By controlling data transfer rates and request priorities, the system prevents any single workload from monopolizing resources while guaranteeing minimum performance levels for critical applications. This approach enables multiple workloads to coexist efficiently, ensuring that high-priority operations receive necessary resources while background tasks proceed without causing disruption.";
                                                                                    }

                                                                                    // Media type objectives
                                                                                    else if (nameLower.includes('ssd') || nameLower.includes('nvme') || nameLower.includes('hdd') || nameLower.includes('flash')) {
                                                                                        return "This media-specific objective directs data placement to particular storage device types, optimizing performance and cost based on workload requirements. By targeting specific media classes—whether high-performance NVMe, balanced SSD, or capacity-oriented HDD—the system ensures that data resides on storage resources that best match its access patterns and performance needs. This granular control enables precise tuning of the storage infrastructure to meet diverse application requirements.";
                                                                                    }

                                                                                    // Capacity and space management objectives
                                                                                    else if (nameLower.includes('capacity') || nameLower.includes('space') || nameLower.includes('quota')) {
                                                                                        return "This capacity management objective governs storage space allocation and utilization policies, ensuring efficient use of available resources. The system monitors consumption patterns, enforces quotas when appropriate, and balances data distribution across storage pools to prevent capacity exhaustion. This objective helps maintain operational headroom, prevents storage overcommitment, and enables proactive capacity planning to ensure continuous service availability as data volumes grow.";
                                                                                    }

                                                                                    // Access pattern and caching objectives
                                                                                    else if (nameLower.includes('cache') || nameLower.includes('prefetch') || nameLower.includes('read') || nameLower.includes('write')) {
                                                                                        return "This access optimization objective tunes data placement and caching strategies based on read/write patterns and access frequency. By analyzing how data is consumed, the system can position frequently accessed content closer to compute resources, implement intelligent prefetching, or optimize for write-heavy workloads. These optimizations reduce latency, improve throughput, and enhance overall application performance by aligning storage behavior with actual usage patterns.";
                                                                                    }

                                                                                    // Disaster recovery and business continuity objectives
                                                                                    else if (nameLower.includes('dr') || nameLower.includes('disaster') || nameLower.includes('recovery') || nameLower.includes('failover') || nameLower.includes('continuity')) {
                                                                                        return "This business continuity objective establishes disaster recovery capabilities by maintaining data copies at geographically dispersed locations with automated failover mechanisms. In the event of site failures, natural disasters, or catastrophic events, the system can rapidly redirect operations to surviving locations, minimizing downtime and data loss. This objective includes recovery time objectives (RTO) and recovery point objectives (RPO) to ensure that business operations can resume quickly with minimal impact.";
                                                                                    }

                                                                                    // Migration and data movement objectives
                                                                                    else if (nameLower.includes('move') || nameLower.includes('transfer') || nameLower.includes('evacuate') || nameLower.includes('drain')) {
                                                                                        return "This data movement objective orchestrates the transfer of files between storage systems, sites, or tiers according to operational requirements. Whether migrating data to new infrastructure, evacuating storage nodes for maintenance, or rebalancing capacity across pools, the system moves data efficiently while maintaining continuous availability. These operations proceed transparently to users, with no disruption to file access, enabling seamless infrastructure changes and capacity optimization.";
                                                                                    }

                                                                                    // Default/Generic objective explanation
                                                                                    else {
                                                                                        return "This Hammerspace objective defines policies that govern how data is stored, protected, and accessed within the global namespace. Objectives provide intelligent data management by automatically applying placement rules, performance optimizations, and protection strategies based on file characteristics, access patterns, and business requirements. The system continuously evaluates and enforces objective policies to ensure data resides on appropriate storage resources while meeting availability, durability, and performance targets throughout the data lifecycle.";
                                                                                    }
                                                                                };

                                                                                const durabilityExplanation = getObjectiveExplanation(objName);

                                                                                // Build tooltip content
                                                                                const tooltipContent = (
                                                                                    <Box>
                                                                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                                                                                            {objName}
                                                                                        </Typography>

                                                                                        {durabilityExplanation && (
                                                                                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, lineHeight: 1.4 }}>
                                                                                                {durabilityExplanation}
                                                                                            </Typography>
                                                                                        )}

                                                                                        {objData.description && (
                                                                                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                                                                                {objData.description}
                                                                                            </Typography>
                                                                                        )}
                                                                                        {objData.objectiveType && (
                                                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.9 }}>
                                                                                                Type: {objData.objectiveType}
                                                                                            </Typography>
                                                                                        )}
                                                                                        {objData.targetSiteNames && objData.targetSiteNames.length > 0 && (
                                                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.9 }}>
                                                                                                Sites: {objData.targetSiteNames.join(', ')}
                                                                                            </Typography>
                                                                                        )}
                                                                                        {!objData.description && !objData.objectiveType && !durabilityExplanation && (
                                                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8 }}>
                                                                                                Hammerspace data placement objective
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Box>
                                                                                );

                                                                                return (
                                                                                    <Tooltip
                                                                                        key={`${shareKey}-obj-${index}`}
                                                                                        title={tooltipContent}
                                                                                        arrow
                                                                                        placement="top"
                                                                                        enterDelay={300}
                                                                                        sx={{
                                                                                            '& .MuiTooltip-tooltip': {
                                                                                                bgcolor: 'rgba(0, 0, 0, 0.9)',
                                                                                                maxWidth: 350,
                                                                                                p: 1.5
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Chip
                                                                                            variant="outlined"
                                                                                            color="secondary"
                                                                                            size="small"
                                                                                            label={objName}
                                                                                            sx={{
                                                                                                whiteSpace: 'normal',
                                                                                                height: 'auto',
                                                                                                maxWidth: '250px',
                                                                                                flexShrink: 0,
                                                                                                cursor: 'help',
                                                                                                '& .MuiChip-label': {
                                                                                                    whiteSpace: 'normal',
                                                                                                    wordWrap: 'break-word'
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </Tooltip>
                                                                                );
                                                                            })}
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {/* Raw Data */}
                                                            {Object.keys(shareItem).length > 4 && (
                                                                <Grid item xs={12}>
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
                                                                            {JSON.stringify(shareItem, null, 2)}
                                                                        </pre>
                                                                    </Box>
                                                                </Grid>
                                                            )}
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
            </Container>
        );
    }
    
    // Fallback
    return null;
}