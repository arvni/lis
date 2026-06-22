import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    FormControl,
    Grid as Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import { ShowChart } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch.jsx';
import ChartSection from './ChartSection';
import { fmt } from './constants';

const IncomeTrendSection = ({
    trendData,
    trendLoading,
    trendFilters,
    applyTrendFilters,
    trendReferrerObj,
    setTrendReferrerObj,
    trendTestObjs,
    setTrendTestObjs,
}) => {
    const theme = useTheme();

    return (
        <ChartSection title="Income Trend (by Month)" icon={ShowChart} loading={trendLoading}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1.5 }}
                >
                    Invoiced series uses invoice date · Not invoiced series uses acceptance date
                </Typography>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <SelectSearch
                            value={trendReferrerObj}
                            onChange={(e) => {
                                const obj = e.target.value;
                                setTrendReferrerObj(obj ?? null);
                                applyTrendFilters({ t_referrer_id: obj?.id ?? '' });
                            }}
                            name="t_referrer"
                            label="Referrer"
                            url={route('api.referrers.list')}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                        <SelectSearch
                            value={trendTestObjs}
                            multiple
                            onChange={(e) => {
                                const objs = e.target.value ?? [];
                                setTrendTestObjs(objs);
                                applyTrendFilters({ t_test_id: objs.map((o) => o.id) });
                            }}
                            name="t_test"
                            label="Tests (leave empty for all)"
                            url={route('api.tests.list')}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Period</InputLabel>
                            <Select
                                label="Period"
                                value={trendFilters.t_months}
                                onChange={(e) => applyTrendFilters({ t_months: e.target.value })}
                            >
                                <MenuItem value="6">Last 6 months</MenuItem>
                                <MenuItem value="12">Last 12 months</MenuItem>
                                <MenuItem value="24">Last 24 months</MenuItem>
                                <MenuItem value="36">Last 36 months</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {trendData.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No data
                </Typography>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart
                            data={trendData}
                            margin={{ top: 8, right: 24, left: 8, bottom: 60 }}
                        >
                            <defs>
                                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={theme.palette.primary.main}
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={theme.palette.primary.main}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient id="nonInvGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={theme.palette.warning.main}
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={theme.palette.warning.main}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                angle={-40}
                                textAnchor="end"
                                tick={{ fontSize: 11 }}
                                interval={0}
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                                label={{
                                    value: 'OMR',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 10,
                                    fontSize: 11,
                                }}
                            />
                            <ReTooltip
                                formatter={(v, n) => [`OMR ${fmt(v)}`, n]}
                                labelFormatter={(l) => l}
                            />
                            <Legend verticalAlign="top" />
                            <Area
                                type="monotone"
                                dataKey="invoiced_income"
                                name="Invoiced"
                                stroke={theme.palette.primary.main}
                                strokeWidth={2}
                                fill="url(#invGrad)"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="non_invoiced_income"
                                name="Not Invoiced"
                                stroke={theme.palette.warning.main}
                                strokeWidth={2}
                                fill="url(#nonInvGrad)"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <Stack
                        direction="row"
                        sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 3, mt: 2 }}
                    >
                        <Typography variant="caption" color="primary.main">
                            Invoiced total:{' '}
                            <b>OMR {fmt(trendData.reduce((s, r) => s + r.invoiced_income, 0))}</b>
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                            Not invoiced total:{' '}
                            <b>OMR {fmt(trendData.reduce((s, r) => s + r.non_invoiced_income, 0))}</b>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Grand total:{' '}
                            <b>
                                OMR{' '}
                                {fmt(
                                    trendData.reduce(
                                        (s, r) => s + r.invoiced_income + r.non_invoiced_income,
                                        0,
                                    ),
                                )}
                            </b>
                        </Typography>
                    </Stack>
                </>
            )}
        </ChartSection>
    );
};

export default IncomeTrendSection;
