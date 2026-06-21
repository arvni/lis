import React, { useState } from 'react';
import {
    Badge,
    Box,
    CardContent,
    Chip,
    Collapse,
    Fade,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Info, VisibilityOff, ExpandMore, ExpandLess, NotificationsActive } from '@mui/icons-material';
import { Link } from '@inertiajs/react';
import { StyledCard, MetricValue, IconContainer } from './styled';
import { getMetricConfig } from './metricConfig';

// Enhanced metric card component
const MetricCard = React.memo(
    ({ label, valueData, category, delay = 0, onToggleVisibility, isVisible = true, date }) => {
        const [showDetails, setShowDetails] = useState(false);
        const config = getMetricConfig(label);
        const Icon = config.icon;
        const url = route(
            config.route,
            config.filter ? { filters: { ...config.filters, date } } : null,
        );

        const value = valueData?.value || valueData;
        const trend = valueData?.trend || 0;
        const previousValue = valueData?.previousValue;

        const numericValue =
            typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) || 0 : value;

        const formatValue = (val) => {
            if (typeof val === 'string' && val.includes('OMR')) {
                return val;
            }
            return typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
        };

        const getTrendColor = (t) => {
            if (t > 0) return config.isAlert ? 'error' : 'success';
            if (t < 0) return config.isAlert ? 'success' : 'error';
            return 'text.secondary';
        };

        const getTrendIcon = (t) => {
            if (t > 0) return '↗';
            if (t < 0) return '↘';
            return '→';
        };

        return (
            <Fade in={isVisible} timeout={500} style={{ transitionDelay: `${delay}ms` }}>
                <StyledCard priority={config.priority} isAlert={config.isAlert && numericValue > 0}>
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
                                zIndex: 1,
                            }}
                        >
                            <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: '50%' }} />
                        </Box>
                    )}

                    {config.isAlert && numericValue > 0 && (
                        <Badge
                            badgeContent={<NotificationsActive sx={{ fontSize: 12 }} />}
                            color="error"
                            sx={{ position: 'absolute', top: 16, right: 16 }}
                        />
                    )}

                    <CardContent sx={{ p: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        {label}
                                    </Typography>
                                    <Tooltip title={config.description} arrow>
                                        <IconButton size="small" sx={{ p: 0 }}>
                                            <Info sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <MetricValue
                                    variant="h3"
                                    component="div"
                                    isAlert={config.isAlert && numericValue > 0}
                                    sx={{ mb: 1 }}
                                >
                                    {formatValue(value)}
                                </MetricValue>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <Chip
                                            label={category}
                                            size="small"
                                            color={config.color}
                                            variant="outlined"
                                            sx={{ fontSize: '0.75rem' }}
                                        />

                                        {trend !== 0 && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: getTrendColor(trend),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontWeight: 'bold',
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
                                            sx={{ animation: 'pulse 2s infinite' }}
                                        />
                                    )}
                                </Box>

                                <Collapse in={showDetails}>
                                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Category: {config.category} • Unit: {config.unit}
                                        </Typography>
                                        {previousValue && (
                                            <Typography
                                                variant="caption"
                                                display="block"
                                                color="text.secondary"
                                            >
                                                Previous: {formatValue(previousValue)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Collapse>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowDetails(!showDetails)}
                                        sx={{ opacity: 0.7 }}
                                    >
                                        {showDetails ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>

                                    {onToggleVisibility && (
                                        <IconButton
                                            size="small"
                                            onClick={() => onToggleVisibility(label)}
                                            sx={{ opacity: 0.7 }}
                                        >
                                            <VisibilityOff />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>

                            <IconContainer color={config.color}>
                                <Link href={url}>
                                    <Icon sx={{ fontSize: 28 }} />
                                </Link>
                            </IconContainer>
                        </Box>
                    </CardContent>
                </StyledCard>
            </Fade>
        );
    },
);
MetricCard.displayName = 'MetricCard';

export default MetricCard;
