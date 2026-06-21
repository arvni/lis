import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

const StatBox = ({ value, label, color }) => (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="h5" fontWeight="bold" color={color}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Box>
    </Grid>
);

const SummaryStats = ({ stats }) => (
    <Box sx={{ mb: 4 }}>
        <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
                <Grid container spacing={3}>
                    <StatBox
                        value={stats.total.subGroups}
                        label="Total Sub-groups"
                        color="primary.main"
                    />
                    <StatBox
                        value={stats.total.activeSubGroups}
                        label="Active Sub-groups"
                        color="success.main"
                    />
                    <StatBox
                        value={stats.total.sections}
                        label="Total Sections"
                        color="secondary.main"
                    />
                    <StatBox
                        value={stats.total.activeSections}
                        label="Active Sections"
                        color="success.main"
                    />
                </Grid>
            </CardContent>
        </Card>
    </Box>
);

export default SummaryStats;
