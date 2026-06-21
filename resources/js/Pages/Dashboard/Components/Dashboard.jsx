import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Container,
    Alert,
    AlertTitle,
    Button,
    Paper,
    Stack,
    CircularProgress,
    Snackbar,
} from '@mui/material';
import { Refresh, Error as ErrorIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { getMetricConfig, getNumericValue } from './Dashboard/metricConfig';
import MetricSkeleton from './Dashboard/MetricSkeleton';
import DashboardHeader from './Dashboard/DashboardHeader';
import DashboardControls from './Dashboard/DashboardControls';
import CategorySection from './Dashboard/CategorySection';

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
                const numericValue = getNumericValue(valueData);

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
            setHiddenMetrics((prev) => {
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
        Object.values(data).forEach((category) => {
            Object.entries(category).forEach(([label, valueData]) => {
                const config = getMetricConfig(label);
                if (config.isAlert && getNumericValue(valueData) > 0) count++;
            });
        });
        return count;
    }, [data]);

    // Error state
    if (error && !data) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className={className} {...props}>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                    <Typography variant="h4" color="error" gutterBottom>
                        Unable to load dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {error}
                    </Typography>
                    {onRefresh && (
                        <Button
                            variant="contained"
                            startIcon={isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
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
        if (onRefresh) onRefresh(e.target.value);
    };
    const today = () => {
        let t = new Date();
        return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
    };

    return (
        <Box sx={{ flexGrow: 1 }} className={className} {...props}>
            {/* Header */}
            {showHeader && (
                <DashboardHeader
                    title={title}
                    showSystemHealth={showSystemHealth}
                    totalAlerts={totalAlerts}
                    systemHealth={systemHealth}
                />
            )}

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Dashboard Title */}
                <Box mb={4}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Dashboard Overview
                    </Typography>

                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
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
                            <DashboardControls
                                date={date}
                                maxDate={today()}
                                onDateChange={handleDateChange}
                                filter={filter}
                                onFilterChange={(e) => setFilter(e.target.value)}
                                categoryFilter={categoryFilter}
                                onCategoryFilterChange={(e) => setCategoryFilter(e.target.value)}
                                onRefresh={onRefresh}
                                isRefreshing={isRefreshing}
                                onRefreshClick={handleRefresh}
                                refreshButtonText={refreshButtonText}
                            />
                        )}
                    </Stack>
                </Box>

                {/* Error banner for refresh errors */}
                {error && data && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                        <AlertTitle>Failed to refresh data</AlertTitle>
                        {error} — Showing last known data.
                    </Alert>
                )}

                {/* Content */}
                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <MetricSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Stack spacing={4}>
                        {Object.entries(filteredData || {}).map(([category, metrics], categoryIndex) => (
                            <CategorySection
                                key={category}
                                category={category}
                                metrics={metrics}
                                data={data}
                                date={date}
                                categoryIndex={categoryIndex}
                                enableAutoHide={enableAutoHide}
                                hiddenMetrics={hiddenMetrics}
                                onToggleVisibility={toggleMetricVisibility}
                            />
                        ))}
                    </Stack>
                )}

                {/* Success snackbar */}
                <Snackbar
                    open={showSuccess}
                    autoHideDuration={3000}
                    onClose={() => setShowSuccess(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setShowSuccess(false)}
                        severity="success"
                        sx={{ width: '100%' }}
                    >
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
    className: PropTypes.string,
};
export default Dashboard;
