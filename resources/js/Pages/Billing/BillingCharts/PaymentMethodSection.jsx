import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { alpha, Box, Chip, Divider, Grid as Grid, Stack, Typography, useTheme } from '@mui/material';
import { DonutSmall } from '@mui/icons-material';
import ChartSection from './ChartSection';
import PieLabel from './PieLabel';
import { fmt, METHOD_COLORS, METHOD_LABELS } from './constants';

const PaymentMethodSection = ({ byMethod, loading }) => {
    const theme = useTheme();

    return (
        <ChartSection title="Payments by Method" icon={DonutSmall} loading={loading}>
            {byMethod.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No payments
                </Typography>
            ) : (
                <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={byMethod}
                                    dataKey="total"
                                    nameKey="method"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={110}
                                    innerRadius={50}
                                    labelLine={false}
                                    label={<PieLabel />}
                                >
                                    {byMethod.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                METHOD_COLORS[entry.method] ??
                                                theme.palette.grey[400]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <ReTooltip
                                    formatter={(v, n) => [`OMR ${fmt(v)}`, METHOD_LABELS[n] ?? n]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={1.5}>
                            {byMethod.map((r, i) => (
                                <Box key={i}>
                                    <Stack
                                        direction="row"
                                        sx={{ justifyContent: 'space-between', mb: 0.5 }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ alignItems: 'center' }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    bgcolor:
                                                        METHOD_COLORS[r.method] ??
                                                        theme.palette.grey[400],
                                                }}
                                            />
                                            <Typography variant="body2" fontWeight="medium">
                                                {METHOD_LABELS[r.method] ?? r.method}
                                            </Typography>
                                            <Chip
                                                label={`${r.count} txn`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                            />
                                        </Stack>
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            sx={{ alignItems: 'center' }}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                {r.percent}%
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                OMR {fmt(r.total)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    <Box
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: alpha(
                                                METHOD_COLORS[r.method] ?? theme.palette.grey[400],
                                                0.15,
                                            ),
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                height: '100%',
                                                borderRadius: 3,
                                                width: `${r.percent}%`,
                                                bgcolor:
                                                    METHOD_COLORS[r.method] ??
                                                    theme.palette.grey[400],
                                                transition: 'width 0.6s ease',
                                            }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                            <Divider />
                            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total collected
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    OMR {fmt(byMethod.reduce((s, r) => s + r.total, 0))}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </ChartSection>
    );
};

export default PaymentMethodSection;
