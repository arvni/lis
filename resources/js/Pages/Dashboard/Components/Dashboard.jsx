import React, {useState, useMemo} from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid2 as Grid,
    Container,
    Skeleton,
    Alert,
    AlertTitle,
    Button,
    IconButton,
    Chip,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Fade,
    Badge,
    AppBar,
    Toolbar,
    Paper,
    Divider,
    Stack,
    Collapse,
    CircularProgress,
    Snackbar,
    useTheme,
    alpha,
    styled
} from '@mui/material';
import {
    TrendingUp,
    Assignment,
    CreditCard,
    AccessTime,
    CheckCircle,
    Warning,
    Description,
    AttachMoney,
    MonetizationOn,
    Refresh,
    Visibility,
    VisibilityOff,
    Info,
    Timeline,
    Dashboard as DashboardIcon,
    NotificationsActive,
    ExpandMore,
    ExpandLess,
    Error as ErrorIcon,
    CurrencyExchange,
    RequestQuote
} from '@mui/icons-material';
import {Link} from "@inertiajs/react";

// PropTypes for better documentation (optional)
import PropTypes from 'prop-types';
import TextField from "@mui/material/TextField";

// Styled components for enhanced UI
const StyledCard = styled(Card)(({theme, priority, isAlert}) => ({
    height: '100%',
    transition: 'all 0.3s ease-in-out',
    borderRadius: theme.spacing(2),
    position: 'relative',
    overflow: 'visible',
    borderLeft: `4px solid ${
        isAlert
            ? theme.palette.warning.main
            : priority === 'high'
                ? theme.palette.primary.main
                : theme.palette.grey[300]
    }`,
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    },
    ...(priority === 'high' && {
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
    })
}));

const MetricValue = styled(Typography)(({theme, isAlert}) => ({
    fontWeight: 'bold',
    fontSize: '2rem',
    background: isAlert
        ? `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`
        : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    transition: 'all 0.3s ease'
}));

const IconContainer = styled(Box)(({theme, color = 'primary'}) => ({
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette[color].main, 0.1),
    color: theme.palette[color].main,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
        backgroundColor: alpha(theme.palette[color].main, 0.2)
    }
}));

// Metric configuration
const getMetricConfig = (label) => {
    const configs = {
        'Total Acceptances': {
            icon: Assignment,
            color: 'primary',
            description: 'New patient acceptances registered today',
            priority: 'high',
            category: 'operations',
            unit: 'patients',
            route: "acceptances.index",
            filter: true
        },
        'Total Tests': {
            icon: Description,
            color: 'success',
            description: 'Laboratory tests completed and processed',
            priority: 'medium',
            category: 'operations',
            unit: 'tests',
            route: "acceptanceItems.index",
            filters: {"test.type": ["TEST", "PANEL"]},
            filter: true
        },
        'Total Consultation': {
            icon: CheckCircle,
            color: 'info',
            description: 'Patient consultations completed today',
            priority: 'high',
            category: 'medical',
            unit: 'consultations',
            route: "consultations.index",
            filter: true
        },
        'Total Payments': {
            icon: AttachMoney,
            color: 'success',
            description: 'Total revenue collected from all sources',
            priority: 'high',
            category: 'financial',
            unit: 'currency',
            route: 'payments.index',
            filter: true
        },
        'Total Cash Payments': {
            icon: MonetizationOn,
            color: 'success',
            description: 'Cash payments received at reception',
            priority: 'low',
            category: 'financial',
            unit: 'currency',
            route: 'payments.index',
            filters: {type: "cash"},
            filter: true
        },
        'Total Card Payments': {
            icon: CreditCard,
            color: 'success',
            description: 'Credit/debit card payments processed',
            priority: 'low',
            category: 'financial',
            unit: 'currency',
            route: 'payments.index',
            filters: {type: "card"},
            filter: true
        },
        'Total Transfer Payments': {
            icon: CurrencyExchange,
            color: 'success',
            description: 'transfer payments processed',
            priority: 'low',
            category: 'financial',
            unit: 'currency',
            route: 'payments.index',
            filters: {type: "transfer"},
            filter: true
        },
        'Total Credit Payments': {
            icon: RequestQuote,
            color: 'success',
            description: 'credit payments processed',
            priority: 'low',
            category: 'financial',
            unit: 'currency',
            route: 'payments.index',
            filters: {type: "credit"},
            filter: true
        },
        'Waiting For Sampling': {
            icon: AccessTime,
            color: 'warning',
            description: 'Patients awaiting sample collection',
            priority: 'high',
            category: 'alerts',
            unit: 'patients',
            isAlert: true,
            route: 'sampleCollection',
            filter: false,
        },
        'Waiting For Consultation': {
            icon: AccessTime,
            color: 'warning',
            description: 'Patients in consultation queue',
            priority: 'high',
            category: 'alerts',
            unit: 'patients',
            isAlert: true,
            route: 'consultations.waiting-list',
            filter: false,
        },
        'Reports Waiting For Approving': {
            icon: Warning,
            color: 'error',
            description: 'Laboratory reports pending approval',
            priority: 'high',
            category: 'alerts',
            unit: 'reports',
            isAlert: true,
            route: 'reports.approvingList',
            filter: false,
        }
    };
    return configs[label] || {
        icon: TrendingUp,
        color: 'primary',
        description: 'Metric description not available',
        priority: 'medium',
        category: 'general',
        unit: 'units'
    };
};

// Enhanced metric card component

const MetricCard = React.memo(({
                                   label,
                                   valueData,
                                   category,
                                   delay = 0,
                                   onToggleVisibility,
                                   isVisible = true,
                                   date
                               }) => {
    const [showDetails, setShowDetails] = useState(false);
    const config = getMetricConfig(label);
    const Icon = config.icon;
    const url = route(config.route, config.filter ? {filters: {...config.filters, date}} : null);

    const value = valueData?.value || valueData;
    const trend = valueData?.trend || 0;
    const previousValue = valueData?.previousValue;

    const numericValue = typeof value === 'string' ?
        parseFloat(value.replace(/[^\d.]/g, '')) || 0 : value;

    const formatValue = (val) => {
        if (typeof val === 'string' && val.includes('OMR')) {
            return val;
        }
        return typeof val === 'number' && val >= 1000 ?
            `${(val / 1000).toFixed(1)}k` : val;
    };

    const getTrendColor = (trend) => {
        if (trend > 0) return config.isAlert ? 'error' : 'success';
        if (trend < 0) return config.isAlert ? 'success' : 'error';
        return 'text.secondary';
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return '↗';
        if (trend < 0) return '↘';
        return '→';
    };

    return (
        <Fade in={isVisible} timeout={500} style={{transitionDelay: `${delay}ms`}}>
            <StyledCard
                priority={config.priority}
                isAlert={config.isAlert && numericValue > 0}
            >
                {config.priority === 'high' && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 16,
                            height: 16,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                        }}
                    >
                        <Box sx={{width: 8, height: 8, bgcolor: 'white', borderRadius: '50%'}}/>
                    </Box>
                )}

                {config.isAlert && numericValue > 0 && (
                    <Badge
                        badgeContent={<NotificationsActive sx={{fontSize: 12}}/>}
                        color="error"
                        sx={{position: 'absolute', top: 16, right: 16}}
                    />
                )}

                <CardContent sx={{p: 3}}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{fontWeight: 500}}
                                >
                                    {label}
                                </Typography>
                                <Tooltip title={config.description} arrow>
                                    <IconButton size="small" sx={{p: 0}}>
                                        <Info sx={{fontSize: 14}}/>
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <MetricValue
                                variant="h3"
                                component="div"
                                isAlert={config.isAlert && numericValue > 0}
                                sx={{mb: 1}}
                            >
                                {formatValue(value)}
                            </MetricValue>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                        label={category}
                                        size="small"
                                        color={config.color}
                                        variant="outlined"
                                        sx={{fontSize: '0.75rem'}}
                                    />

                                    {trend !== 0 && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: getTrendColor(trend),
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {getTrendIcon(trend)} {Math.abs(trend)}%
                                        </Typography>
                                    )}
                                </Stack>

                                {config.isAlert && numericValue > 0 && (
                                    <Chip
                                        label="Attention"
                                        size="small"
                                        color="warning"
                                        variant="filled"
                                        sx={{animation: 'pulse 2s infinite'}}
                                    />
                                )}
                            </Box>

                            <Collapse in={showDetails}>
                                <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                                    <Typography variant="caption" color="text.secondary">
                                        Category: {config.category} • Unit: {config.unit}
                                    </Typography>
                                    {previousValue && (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Previous: {formatValue(previousValue)}
                                        </Typography>
                                    )}
                                </Box>
                            </Collapse>

                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowDetails(!showDetails)}
                                    sx={{opacity: 0.7}}
                                >
                                    {showDetails ? <ExpandLess/> : <ExpandMore/>}
                                </IconButton>

                                {onToggleVisibility && (
                                    <IconButton
                                        size="small"
                                        onClick={() => onToggleVisibility(label)}
                                        sx={{opacity: 0.7}}
                                    >
                                        <VisibilityOff/>
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <IconContainer color={config.color}>
                            <Link href={url}><Icon sx={{fontSize: 28}}/></Link>
                        </IconContainer>
                    </Box>
                </CardContent>
            </StyledCard>
        </Fade>
    );
});

// Loading skeleton component
const MetricSkeleton = React.memo(() => (
    <Card sx={{height: '100%', borderRadius: 2}}>
        <CardContent sx={{p: 3}}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1} mr={2}>
                    <Skeleton variant="text" width="70%" height={24}/>
                    <Skeleton variant="text" width="50%" height={48} sx={{my: 1}}/>
                    <Box display="flex" gap={1}>
                        <Skeleton variant="rounded" width={80} height={24}/>
                        <Skeleton variant="rounded" width={60} height={24}/>
                    </Box>
                </Box>
                <Skeleton variant="circular" width={56} height={56}/>
            </Box>
        </CardContent>
    </Card>
));

// Main Dashboard component that accepts data as props
const Dashboard = ({
                       data = null,
                       date = null,
                       loading = false,
                       error = null,
                       lastUpdated = null,
                       systemHealth = 'good',
                       onRefresh = null,
                       title = 'Dashboard',
                       subtitle = '',
                       showHeader = true,
                       showFilters = true,
                       showSystemHealth = true,
                       enableAutoHide = true,
                       refreshButtonText = 'Refresh',
                       customMetricConfigs = {},
                       className,
                       ...props
                   }) => {
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [hiddenMetrics, setHiddenMetrics] = useState(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);


    // Handle refresh action
    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            try {
                await onRefresh(date);
                setShowSuccess(true);
            } catch (err) {
                console.error('Refresh failed:', err);
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    // Filter and categorize metrics
    const filteredData = useMemo(() => {
        if (!data) return null;

        const filtered = {};

        Object.entries(data).forEach(([category, metrics]) => {
            const filteredMetrics = {};

            Object.entries(metrics).forEach(([label, valueData]) => {
                const config = getMetricConfig(label);
                const value = valueData?.value || valueData;
                const numericValue = typeof value === 'string' ?
                    parseFloat(value.replace(/[^\d.]/g, '')) || 0 : value;

                // Apply priority filter
                if (filter === 'high' && config.priority !== 'high') return;
                if (filter === 'alerts' && (!config.isAlert || numericValue === 0)) return;

                // Apply category filter
                if (categoryFilter !== 'all' && config.category !== categoryFilter) return;

                // Apply visibility filter
                if (hiddenMetrics.has(label)) return;

                filteredMetrics[label] = valueData;
            });

            if (Object.keys(filteredMetrics).length > 0) {
                filtered[category] = filteredMetrics;
            }
        });

        return filtered;
    }, [data, filter, categoryFilter, hiddenMetrics]);

    const toggleMetricVisibility = (label) => {
        if (enableAutoHide) {
            setHiddenMetrics(prev => {
                const newSet = new Set(prev);
                if (newSet.has(label)) {
                    newSet.delete(label);
                } else {
                    newSet.add(label);
                }
                return newSet;
            });
        }
    };

    const totalAlerts = useMemo(() => {
        if (!data) return 0;
        let count = 0;
        Object.values(data).forEach(category => {
            Object.entries(category).forEach(([label, valueData]) => {
                const config = getMetricConfig(label);
                const value = valueData?.value || valueData;
                const numericValue = typeof value === 'string' ?
                    parseFloat(value.replace(/[^\d.]/g, '')) || 0 : value;
                if (config.isAlert && numericValue > 0) count++;
            });
        });
        return count;
    }, [data]);

    // Error state
    if (error && !data) {
        return (
            <Container maxWidth="lg" sx={{mt: 4, mb: 4}} className={className} {...props}>
                <Paper elevation={2} sx={{p: 4, textAlign: 'center', borderRadius: 3}}>
                    <ErrorIcon sx={{fontSize: 64, color: 'error.main', mb: 2}}/>
                    <Typography variant="h4" color="error" gutterBottom>
                        Unable to load dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
                        {error}
                    </Typography>
                    {onRefresh && (
                        <Button
                            variant="contained"
                            startIcon={isRefreshing ? <CircularProgress size={20}/> : <Refresh/>}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            size="large"
                        >
                            {isRefreshing ? 'Retrying...' : 'Try Again'}
                        </Button>
                    )}
                </Paper>
            </Container>
        );
    }

    const handleDateChange = (e) => {
        if (onRefresh)
            onRefresh(e.target.value)
    }
    const today = () => {
        let t = new Date();
        return t.getFullYear() + "-" + (t.getMonth() + 1) + "-" + t.getDate();
    };
    console.log(today(), date);

    return (
        <Box sx={{flexGrow: 1}} className={className} {...props}>
            {/* Header */}
            {showHeader && (
                <AppBar position="static" elevation={0}
                        sx={{bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider'}}>
                    <Toolbar>
                        <DashboardIcon sx={{color: 'primary.main', mr: 2}}/>
                        <Typography variant="h6" sx={{flexGrow: 1, color: 'text.primary'}}>
                            {title}
                        </Typography>

                        {showSystemHealth && totalAlerts > 0 && (
                            <Badge badgeContent={totalAlerts} color="error" sx={{mr: 2}}>
                                <NotificationsActive color="action"/>
                            </Badge>
                        )}

                        {showSystemHealth && (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Chip
                                    icon={<Timeline/>}
                                    label={systemHealth === 'good' ? 'All Systems Operational' : 'System Issues Detected'}
                                    color={systemHealth === 'good' ? 'success' : 'warning'}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>
            )}

            <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
                {/* Dashboard Title */}
                <Box mb={4}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{fontWeight: 'bold'}}>
                        Dashboard Overview
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                            <Typography variant="h6" color="text.secondary">
                                {subtitle}
                            </Typography>
                            {lastUpdated && (
                                <Typography variant="caption" color="text.secondary">
                                    Last updated: {new Date(lastUpdated).toLocaleString()}
                                </Typography>
                            )}
                        </Box>

                        {showFilters && (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField onChange={handleDateChange}
                                           value={date}
                                           size="small"
                                           type="date"
                                           sx={{minWidth: 120}}
                                           slotProps={{htmlInput: {max: today()}}}/>
                                <FormControl size="small" sx={{minWidth: 120}}>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={filter}
                                        label="Priority"
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Metrics</MenuItem>
                                        <MenuItem value="high">High Priority</MenuItem>
                                        <MenuItem value="alerts">Alerts Only</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{minWidth: 120}}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={categoryFilter}
                                        label="Category"
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Categories</MenuItem>
                                        <MenuItem value="operations">Operations</MenuItem>
                                        <MenuItem value="financial">Financial</MenuItem>
                                        <MenuItem value="medical">Medical</MenuItem>
                                        <MenuItem value="alerts">Alerts</MenuItem>
                                    </Select>
                                </FormControl>

                                {onRefresh && (
                                    <Button
                                        variant="outlined"
                                        startIcon={isRefreshing ? <CircularProgress size={16}/> : <Refresh/>}
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                    >
                                        {refreshButtonText}
                                    </Button>
                                )}
                            </Stack>
                        )}
                    </Stack>
                </Box>

                {/* Error banner for refresh errors */}
                {error && data && (
                    <Alert severity="warning" sx={{mb: 3, borderRadius: 2}}>
                        <AlertTitle>Failed to refresh data</AlertTitle>
                        {error} — Showing last known data.
                    </Alert>
                )}

                {/* Content */}
                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({length: 6}).map((_, index) => (
                            <Grid size={{xs: 12, sm: 6, md: 4}} key={index}>
                                <MetricSkeleton/>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Stack spacing={4}>
                        {Object.entries(filteredData || {}).map(([category, metrics], categoryIndex) => {
                            const visibleMetrics = Object.entries(metrics);
                            const totalMetrics = data ? Object.keys(data[category] || {}).length : 0;

                            return (
                                <Paper key={category} elevation={1} sx={{p: 3, borderRadius: 3}}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Typography variant="h4" component="h2" sx={{fontWeight: 'bold'}}>
                                            {category} Metrics
                                        </Typography>
                                        <Chip
                                            label={`${visibleMetrics.length} of ${totalMetrics} shown`}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Box>

                                    <Grid container spacing={3}>
                                        {visibleMetrics.map(([label, valueData], index) => (
                                            <Grid size={{xs: 12, sm: 6, md: 4}} key={label}>
                                                <MetricCard
                                                    label={label}
                                                    valueData={valueData}
                                                    date={date}
                                                    category={category}
                                                    delay={categoryIndex * 100 + index * 50}
                                                    onToggleVisibility={enableAutoHide ? toggleMetricVisibility : undefined}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Hidden metrics section */}
                                    {enableAutoHide && data && Object.keys(data[category] || {}).some(label => hiddenMetrics.has(label)) && (
                                        <Box mt={3} pt={3}>
                                            <Divider sx={{mb: 2}}/>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Hidden Metrics
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {Object.keys(data[category] || {})
                                                    .filter(label => hiddenMetrics.has(label))
                                                    .map(label => (
                                                        <Chip
                                                            key={label}
                                                            label={label}
                                                            icon={<Visibility/>}
                                                            onClick={() => toggleMetricVisibility(label)}
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{m: 0.5}}
                                                        />
                                                    ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                )}

                {/* Success snackbar */}
                <Snackbar
                    open={showSuccess}
                    autoHideDuration={3000}
                    onClose={() => setShowSuccess(false)}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                >
                    <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{width: '100%'}}>
                        Dashboard data refreshed successfully!
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

// PropTypes definition
Dashboard.propTypes = {
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.string,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    systemHealth: PropTypes.oneOf(['good', 'warning', 'error']),
    onRefresh: PropTypes.func,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    showHeader: PropTypes.bool,
    showFilters: PropTypes.bool,
    showSystemHealth: PropTypes.bool,
    enableAutoHide: PropTypes.bool,
    refreshButtonText: PropTypes.string,
    customMetricConfigs: PropTypes.object,
    className: PropTypes.string
};
export default Dashboard;
