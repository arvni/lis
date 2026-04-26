import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch.jsx';
import axios from 'axios';
import {
    Box, Card, CardContent, Chip, FormControl, Grid2 as Grid,
    InputLabel, MenuItem, Paper, Select, Skeleton, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, alpha, useTheme, Button, Divider, CircularProgress, Tooltip,
} from '@mui/material';
import {
    TrendingUp, Payments, AccountBalance, Receipt,
    FilterList, Refresh as RefreshIcon, BarChart as BarChartIcon,
    DonutSmall, ShowChart,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    Tooltip as ReTooltip, ResponsiveContainer, Legend,
    PieChart, Pie,
    ComposedChart, Line, Area,
} from 'recharts';

// ── Currency formatter ────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}).format(n ?? 0);

// ── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({title, value, icon: Icon, color, subtitle}) => {
    const theme = useTheme();
    return (
        <Card elevation={2} sx={{borderRadius: 2, borderTop: `4px solid ${theme.palette[color]?.main ?? theme.palette.grey[400]}`, height: '100%'}}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
                        <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>{value}</Typography>
                        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                    </Box>
                    <Box sx={{p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette[color]?.main ?? '#ccc', 0.12)}}>
                        <Icon sx={{color: `${color}.main`, fontSize: 28}}/>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

// ── Date presets ──────────────────────────────────────────────────────────────
const PRESETS = [
    {key: 'today',         label: 'Today'},
    {key: 'this_week',     label: 'This Week'},
    {key: 'last_week',     label: 'Last Week'},
    {key: 'this_month',    label: 'This Month'},
    {key: 'last_month',    label: 'Last Month'},
    {key: 'last_7_days',   label: 'Last 7 Days'},
    {key: 'last_30_days',  label: 'Last 30 Days'},
    {key: 'last_3_months', label: 'Last 3 Months'},
    {key: 'this_year',     label: 'This Year'},
];

const METHOD_COLORS = {card: '#4f46e5', cash: '#16a34a', credit: '#dc2626', transfer: '#d97706'};
const METHOD_LABELS = {card: 'Card', cash: 'Cash', credit: 'Credit', transfer: 'Transfer'};

// ── Custom bar tooltip ────────────────────────────────────────────────────────
const BarTooltip = ({active, payload}) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const total = (d.invoiced_income ?? 0) + (d.non_invoiced_income ?? 0);
    return (
        <Paper elevation={3} sx={{p: 1.5, minWidth: 190}}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>{d.name}</Typography>
            <Typography variant="caption" display="block" color="primary.main">
                Invoiced: <b>OMR {fmt(d.invoiced_income)}</b>
            </Typography>
            <Typography variant="caption" display="block" color="warning.main">
                Not invoiced: <b>OMR {fmt(d.non_invoiced_income)}</b>
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
                Total: OMR {fmt(total)}
            </Typography>
            {d.count != null && <Typography variant="caption" display="block">Items: {d.count}</Typography>}
            {d.acceptance_count != null && <Typography variant="caption" display="block">Acceptances: {d.acceptance_count}</Typography>}
        </Paper>
    );
};

// ── Custom pie label ──────────────────────────────────────────────────────────
const PieLabel = ({cx, cy, midAngle, innerRadius, outerRadius, percent, name}) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    );
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const ChartSection = ({title, icon: Icon, loading, children}) => {
    const theme = useTheme();
    return (
        <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden', mb: 3}}>
            <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1}}>
                <Icon fontSize="small" color="primary"/>
                <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
                {loading && <CircularProgress size={16} sx={{ml: 1}}/>}
            </Box>
            <Box sx={{p: 2}}>
                {loading
                    ? <Skeleton variant="rectangular" height={280} sx={{borderRadius: 1}}/>
                    : children
                }
            </Box>
        </Paper>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const {summary, filters: serverFilters} = usePage().props;
    const theme = useTheme();

    const [filters, setFilters] = useState({
        preset: serverFilters?.preset ?? 'last_30_days',
        from: serverFilters?.from ?? '',
        to: serverFilters?.to ?? '',
        referrer_id: serverFilters?.referrer_id ?? '',
        test_ids: [],
    });
    const [referrerObj, setReferrerObj] = useState(null);
    const [testObjs, setTestObjs] = useState([]);

    const [chartsData, setChartsData] = useState(null);
    const [chartsLoading, setChartsLoading] = useState(true);
    const abortRef = useRef(null);

    // Remove empty / empty-array params before sending
    const cleanParams = (obj) => {
        const p = {...obj};
        Object.keys(p).forEach(k => {
            if (p[k] === '' || p[k] == null) delete p[k];
            if (Array.isArray(p[k]) && p[k].length === 0) delete p[k];
        });
        return p;
    };

    const fetchCharts = useCallback((f = filters) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setChartsLoading(true);
        axios.get(route('api.billing.dashboard.data'), {params: cleanParams(f), signal: abortRef.current.signal})
            .then(r => { setChartsData(r.data); setChartsLoading(false); })
            .catch(e => { if (!axios.isCancel(e)) setChartsLoading(false); });
    }, []);

    useEffect(() => { fetchCharts(); }, []);

    const applyFilters = (patch) => {
        const f = {...filters, ...patch};
        setFilters(f);
        router.get(route('billing.dashboard'), f, {
            preserveState: true, replace: true, only: ['summary', 'filters'],
        });
        fetchCharts(f);
    };

    // ── Trend chart state ──────────────────────────────────────────────────────
    const [trendFilters, setTrendFilters] = useState({
        t_referrer_id: '',
        t_test_id: [],
        t_months: '12',
    });
    const [trendReferrerObj, setTrendReferrerObj] = useState(null);
    const [trendTestObjs, setTrendTestObjs] = useState([]);  // array of {id,name}
    const [trendData, setTrendData] = useState([]);
    const [trendLoading, setTrendLoading] = useState(true);
    const trendAbortRef = useRef(null);

    const fetchTrend = useCallback((f = trendFilters) => {
        trendAbortRef.current?.abort();
        trendAbortRef.current = new AbortController();
        setTrendLoading(true);
        axios.get(route('api.billing.dashboard.trend'), {params: cleanParams(f), signal: trendAbortRef.current.signal})
            .then(r => { setTrendData(r.data); setTrendLoading(false); })
            .catch(e => { if (!axios.isCancel(e)) setTrendLoading(false); });
    }, []);

    useEffect(() => { fetchTrend(); }, []);

    const applyTrendFilters = (patch) => {
        const f = {...trendFilters, ...patch};
        setTrendFilters(f);
        fetchTrend(f);
    };

    const byTest     = chartsData?.by_test ?? [];
    const byReferrer = chartsData?.by_referrer ?? [];
    const byMethod   = chartsData?.by_payment_method ?? [];

    return (
        <>
            <Head title="Billing Dashboard"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="Billing Dashboard"
                    subtitle={summary ? `${summary.from} → ${summary.to}` : ''}
                />

                {/* ── Summary cards ─────────────────────────────────────────── */}
                <Grid container spacing={2} sx={{mb: 3}}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="Total Revenue" value={`OMR ${fmt(summary?.revenue)}`} icon={TrendingUp} color="primary" subtitle="Price − discount"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="Collected" value={`OMR ${fmt(summary?.collected)}`} icon={Payments} color="success" subtitle="Sum of payments"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="Outstanding" value={`OMR ${fmt(summary?.outstanding)}`} icon={AccountBalance} color={summary?.outstanding > 0 ? 'warning' : 'success'} subtitle="Revenue − collected"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="Invoices" value={summary?.invoice_count ?? '—'} icon={Receipt} color="info" subtitle={`${summary?.acceptance_count ?? '—'} acceptances`}/>
                    </Grid>
                </Grid>

                {/* ── Filter panel ──────────────────────────────────────────── */}
                <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <FilterList fontSize="small" color="action"/>
                        <Typography variant="subtitle2" color="text.secondary">Filters</Typography>
                        <Box sx={{ml: 'auto'}}>
                            <Button size="small" startIcon={<RefreshIcon/>} onClick={() => fetchCharts(filters)} disabled={chartsLoading}>
                                Refresh
                            </Button>
                        </Box>
                    </Stack>

                    {/* Date presets */}
                    <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                        {PRESETS.map(p => (
                            <Button key={p.key} size="small"
                                variant={filters.preset === p.key ? 'contained' : 'outlined'}
                                onClick={() => applyFilters({preset: p.key, from: '', to: ''})}>
                                {p.label}
                            </Button>
                        ))}
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField label="Custom From" type="date" size="small" fullWidth
                                InputLabelProps={{shrink: true}} value={filters.from}
                                onChange={(e) => applyFilters({from: e.target.value, preset: ''})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField label="Custom To" type="date" size="small" fullWidth
                                InputLabelProps={{shrink: true}} value={filters.to}
                                onChange={(e) => applyFilters({to: e.target.value, preset: ''})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <SelectSearch
                                value={referrerObj}
                                onChange={(e) => {
                                    const obj = e.target.value;
                                    setReferrerObj(obj ?? null);
                                    applyFilters({referrer_id: obj?.id ?? ''});
                                }}
                                name="referrer"
                                label="Referrer"
                                url={route('api.referrers.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 6}}>
                            <SelectSearch
                                value={testObjs}
                                multiple
                                onChange={(e) => {
                                    const objs = e.target.value ?? [];
                                    setTestObjs(objs);
                                    applyFilters({test_ids: objs.map(o => o.id)});
                                }}
                                name="test_ids"
                                label="Tests (leave empty for all)"
                                url={route('api.tests.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                <Divider sx={{mb: 3}}/>

                {/* ── Income by test ────────────────────────────────────────── */}
                <ChartSection title="Income by Test" icon={BarChartIcon} loading={chartsLoading}>
                    {byTest.length === 0
                        ? <Typography color="text.secondary" textAlign="center" py={4}>No data</Typography>
                        : (
                            <>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={byTest} margin={{top: 8, right: 16, left: 8, bottom: 80}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{fontSize: 11}} interval={0}/>
                                        <YAxis tick={{fontSize: 11}}/>
                                        <ReTooltip content={<BarTooltip/>}/>
                                        <Legend verticalAlign="top"/>
                                        <Bar dataKey="invoiced_income" name="Invoiced" stackId="a" radius={[0,0,0,0]} fill={theme.palette.primary.main}/>
                                        <Bar dataKey="non_invoiced_income" name="Not Invoiced" stackId="a" radius={[4,4,0,0]} fill={theme.palette.warning.main}/>
                                    </BarChart>
                                </ResponsiveContainer>
                                <TableContainer sx={{maxHeight: 260, mt: 2}}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Test</TableCell>
                                                <TableCell align="right">Items</TableCell>
                                                <TableCell align="right" sx={{color: 'primary.main'}}>Invoiced</TableCell>
                                                <TableCell align="right" sx={{color: 'warning.main'}}>Not Invoiced</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {byTest.map((r, i) => (
                                                <TableRow key={i} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.04)}}}>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>{r.name}</TableCell>
                                                    <TableCell align="right">{r.count}</TableCell>
                                                    <TableCell align="right">{fmt(r.invoiced_income)}</TableCell>
                                                    <TableCell align="right">{fmt(r.non_invoiced_income)}</TableCell>
                                                    <TableCell align="right"><b>{fmt(r.invoiced_income + r.non_invoiced_income)}</b></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )
                    }
                </ChartSection>

                {/* ── Income by referrer ────────────────────────────────────── */}
                <ChartSection title="Income by Referrer" icon={BarChartIcon} loading={chartsLoading}>
                    {byReferrer.length === 0
                        ? <Typography color="text.secondary" textAlign="center" py={4}>No data</Typography>
                        : (
                            <>
                                <ResponsiveContainer width="100%" height={Math.max(260, byReferrer.length * 40)}>
                                    <BarChart data={byReferrer} layout="vertical" margin={{top: 4, right: 100, left: 120, bottom: 4}}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                        <XAxis type="number" tick={{fontSize: 11}}/>
                                        <YAxis type="category" dataKey="name" tick={{fontSize: 11}} width={115}/>
                                        <ReTooltip content={<BarTooltip/>}/>
                                        <Legend verticalAlign="top"/>
                                        <Bar dataKey="invoiced_income" name="Invoiced" stackId="a" fill={theme.palette.secondary.main} radius={[0,0,0,0]}/>
                                        <Bar dataKey="non_invoiced_income" name="Not Invoiced" stackId="a" fill={theme.palette.warning.main} radius={[0,4,4,0]}/>
                                    </BarChart>
                                </ResponsiveContainer>
                                <TableContainer sx={{maxHeight: 220, mt: 2}}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Referrer</TableCell>
                                                <TableCell align="right">Acceptances</TableCell>
                                                <TableCell align="right" sx={{color: 'secondary.main'}}>Invoiced</TableCell>
                                                <TableCell align="right" sx={{color: 'warning.main'}}>Not Invoiced</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {byReferrer.map((r, i) => (
                                                <TableRow key={i} sx={{'&:hover': {bgcolor: alpha(theme.palette.secondary.main, 0.04)}}}>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>{r.name}</TableCell>
                                                    <TableCell align="right">{r.acceptance_count}</TableCell>
                                                    <TableCell align="right">{fmt(r.invoiced_income)}</TableCell>
                                                    <TableCell align="right">{fmt(r.non_invoiced_income)}</TableCell>
                                                    <TableCell align="right"><b>{fmt(r.invoiced_income + r.non_invoiced_income)}</b></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )
                    }
                </ChartSection>

                {/* ── Payment method breakdown ──────────────────────────────── */}
                <ChartSection title="Payments by Method" icon={DonutSmall} loading={chartsLoading}>
                    {byMethod.length === 0
                        ? <Typography color="text.secondary" textAlign="center" py={4}>No payments</Typography>
                        : (
                            <Grid container spacing={3} alignItems="center">
                                <Grid size={{xs: 12, md: 5}}>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={byMethod} dataKey="total" nameKey="method"
                                                cx="50%" cy="50%" outerRadius={110} innerRadius={50}
                                                labelLine={false} label={<PieLabel/>}>
                                                {byMethod.map((entry, i) => (
                                                    <Cell key={i} fill={METHOD_COLORS[entry.method] ?? theme.palette.grey[400]}/>
                                                ))}
                                            </Pie>
                                            <ReTooltip formatter={(v, n) => [`OMR ${fmt(v)}`, METHOD_LABELS[n] ?? n]}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Grid>
                                <Grid size={{xs: 12, md: 7}}>
                                    <Stack spacing={1.5}>
                                        {byMethod.map((r, i) => (
                                            <Box key={i}>
                                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box sx={{width: 12, height: 12, borderRadius: '50%', bgcolor: METHOD_COLORS[r.method] ?? theme.palette.grey[400]}}/>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {METHOD_LABELS[r.method] ?? r.method}
                                                        </Typography>
                                                        <Chip label={`${r.count} txn`} size="small" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
                                                    </Stack>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Typography variant="body2" color="text.secondary">{r.percent}%</Typography>
                                                        <Typography variant="body2" fontWeight="bold">OMR {fmt(r.total)}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Box sx={{height: 6, borderRadius: 3, bgcolor: alpha(METHOD_COLORS[r.method] ?? theme.palette.grey[400], 0.15)}}>
                                                    <Box sx={{height: '100%', borderRadius: 3, width: `${r.percent}%`, bgcolor: METHOD_COLORS[r.method] ?? theme.palette.grey[400], transition: 'width 0.6s ease'}}/>
                                                </Box>
                                            </Box>
                                        ))}
                                        <Divider/>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Total collected</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                OMR {fmt(byMethod.reduce((s, r) => s + r.total, 0))}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                        )
                    }
                </ChartSection>

                {/* ── Monthly income trend ──────────────────────────────────── */}
                <Divider sx={{mb: 3}}/>
                <ChartSection title="Income Trend (by Month)" icon={ShowChart} loading={trendLoading}>
                    <Paper variant="outlined" sx={{p: 2, mb: 2, borderRadius: 2}}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                            Invoiced series uses invoice date · Not invoiced series uses acceptance date
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <SelectSearch
                                    value={trendReferrerObj}
                                    onChange={(e) => {
                                        const obj = e.target.value;
                                        setTrendReferrerObj(obj ?? null);
                                        applyTrendFilters({t_referrer_id: obj?.id ?? ''});
                                    }}
                                    name="t_referrer"
                                    label="Referrer"
                                    url={route('api.referrers.list')}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 6}}>
                                <SelectSearch
                                    value={trendTestObjs}
                                    multiple
                                    onChange={(e) => {
                                        const objs = e.target.value ?? [];
                                        setTrendTestObjs(objs);
                                        applyTrendFilters({t_test_id: objs.map(o => o.id)});
                                    }}
                                    name="t_test"
                                    label="Tests (leave empty for all)"
                                    url={route('api.tests.list')}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Period</InputLabel>
                                    <Select label="Period" value={trendFilters.t_months}
                                        onChange={(e) => applyTrendFilters({t_months: e.target.value})}>
                                        <MenuItem value="6">Last 6 months</MenuItem>
                                        <MenuItem value="12">Last 12 months</MenuItem>
                                        <MenuItem value="24">Last 24 months</MenuItem>
                                        <MenuItem value="36">Last 36 months</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {trendData.length === 0
                        ? <Typography color="text.secondary" textAlign="center" py={4}>No data</Typography>
                        : (
                            <>
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart data={trendData} margin={{top: 8, right: 24, left: 8, bottom: 60}}>
                                        <defs>
                                            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="nonInvGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="label" angle={-40} textAnchor="end" tick={{fontSize: 11}} interval={0}/>
                                        <YAxis tick={{fontSize: 11}} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                                            label={{value: 'OMR', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11}}/>
                                        <ReTooltip formatter={(v, n) => [`OMR ${fmt(v)}`, n]} labelFormatter={l => l}/>
                                        <Legend verticalAlign="top"/>
                                        <Area type="monotone" dataKey="invoiced_income" name="Invoiced"
                                            stroke={theme.palette.primary.main} strokeWidth={2}
                                            fill="url(#invGrad)" dot={{r: 3}} activeDot={{r: 5}}/>
                                        <Area type="monotone" dataKey="non_invoiced_income" name="Not Invoiced"
                                            stroke={theme.palette.warning.main} strokeWidth={2}
                                            fill="url(#nonInvGrad)" dot={{r: 3}} activeDot={{r: 5}}/>
                                    </ComposedChart>
                                </ResponsiveContainer>
                                <Stack direction="row" flexWrap="wrap" gap={3} mt={2} justifyContent="center">
                                    <Typography variant="caption" color="primary.main">
                                        Invoiced total: <b>OMR {fmt(trendData.reduce((s,r) => s + r.invoiced_income, 0))}</b>
                                    </Typography>
                                    <Typography variant="caption" color="warning.main">
                                        Not invoiced total: <b>OMR {fmt(trendData.reduce((s,r) => s + r.non_invoiced_income, 0))}</b>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Grand total: <b>OMR {fmt(trendData.reduce((s,r) => s + r.invoiced_income + r.non_invoiced_income, 0))}</b>
                                    </Typography>
                                </Stack>
                            </>
                        )
                    }
                </ChartSection>
            </Box>
        </>
    );
};

Dashboard.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {title: 'Billing', link: route('invoices.index'), icon: null},
            {title: 'Dashboard', link: '', icon: null},
        ]}
    />
);

export default Dashboard;
