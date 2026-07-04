import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

const TYPE_COLORS = ['error', 'warning', 'info', 'secondary'];

function TypeSummaryBar({ typeSummary }) {
    if (!typeSummary?.length) return null;
    return (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            {typeSummary.map((t, i) => {
                const shortName = t.job_type?.split('\\').pop() ?? t.job_type;
                return (
                    <Card key={t.job_type} variant="outlined" sx={{ minWidth: 140 }}>
                        <CardContent sx={{ p: '10px 14px!important' }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                title={t.job_type}
                            >
                                {shortName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <ErrorOutlineIcon
                                    fontSize="small"
                                    color={TYPE_COLORS[i % TYPE_COLORS.length]}
                                />
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color={`${TYPE_COLORS[i % TYPE_COLORS.length]}.main`}
                                >
                                    {t.count}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
}

export default TypeSummaryBar;
