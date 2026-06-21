import React from 'react';
import { Box, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import MetricCard from './MetricCard';

const CategorySection = ({
    category,
    metrics,
    data,
    date,
    categoryIndex,
    enableAutoHide,
    hiddenMetrics,
    onToggleVisibility,
}) => {
    const visibleMetrics = Object.entries(metrics);
    const totalMetrics = data ? Object.keys(data[category] || {}).length : 0;
    const hiddenLabels = data
        ? Object.keys(data[category] || {}).filter((label) => hiddenMetrics.has(label))
        : [];

    return (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                        <MetricCard
                            label={label}
                            valueData={valueData}
                            date={date}
                            category={category}
                            delay={categoryIndex * 100 + index * 50}
                            onToggleVisibility={enableAutoHide ? onToggleVisibility : undefined}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Hidden metrics section */}
            {enableAutoHide && hiddenLabels.length > 0 && (
                <Box sx={{ mt: 3, pt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Hidden Metrics
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {hiddenLabels.map((label) => (
                            <Chip
                                key={label}
                                label={label}
                                icon={<Visibility />}
                                onClick={() => onToggleVisibility(label)}
                                variant="outlined"
                                size="small"
                                sx={{ m: 0.5 }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};

export default CategorySection;
