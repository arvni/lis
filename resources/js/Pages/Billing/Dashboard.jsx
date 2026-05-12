import React, {useState, useEffect, useRef, useCallback, lazy, Suspense} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch.jsx';
import axios from 'axios';
import {
    Box, Card, CardContent, Grid as Grid,
    Paper, Skeleton, Stack,
    TextField, Typography, alpha, useTheme, Button,
} from '@mui/material';
import {
    TrendingUp, Payments, AccountBalance, Receipt,
    FilterList, Refresh as RefreshIcon,
} from '@mui/icons-material';

const BillingCharts = lazy(() => import('./BillingCharts'));

// ── Currency formatter ────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}).format(n ?? 0);

// ── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({title, value, icon: Icon, color, subtitle}) => {
    const theme = useTheme();
    return (
        <Card elevation={2} sx={{borderRadius: 2, borderTop: `4px solid ${theme.palette[color]?.main ?? theme.palette.grey[400]}`, height: '100%'}}>
            <CardContent>
  <Stack direction="row" sx={{justifyContent: "space-between", alignItems: "flex-start"}}>
                    <Box sx={{minWidth: 0, flex: 1}}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
                        <Typography variant="h5" fontWeight="bold" color={`${color}.main`} sx={{lineHeight: 1.2}}>{value}</Typography>
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

// ── Main ──────────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const {summary, filters: serverFilters} = usePage().props;

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
    const [trendTestObjs, setTrendTestObjs] = useState([]);
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
                    <Grid size={{xs: 12, sm: 6, lg: 3}}>
                        <SummaryCard title="Total Revenue" value={`OMR ${fmt(summary?.revenue)}`} icon={TrendingUp} color="primary" subtitle="Price − discount"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, lg: 3}}>
                        <SummaryCard title="Collected" value={`OMR ${fmt(summary?.collected)}`} icon={Payments} color="success" subtitle="Sum of payments"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, lg: 3}}>
                        <SummaryCard title="Outstanding" value={`OMR ${fmt(summary?.outstanding)}`} icon={AccountBalance} color={summary?.outstanding > 0 ? 'warning' : 'success'} subtitle="Revenue − collected"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, lg: 3}}>
                        <SummaryCard title="Invoices" value={summary?.invoice_count ?? '—'} icon={Receipt} color="info" subtitle={`${summary?.acceptance_count ?? '—'} acceptances`}/>
                    </Grid>
                </Grid>

                {/* ── Filter panel ──────────────────────────────────────────── */}
                <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
  <Stack direction="row" spacing={1} sx={{alignItems: "center", mb: 2}}>
                        <FilterList fontSize="small" color="action"/>
                        <Typography variant="subtitle2" color="text.secondary">Filters</Typography>
                        <Box sx={{ml: 'auto'}}>
                            <Button size="small" startIcon={<RefreshIcon/>} onClick={() => fetchCharts(filters)} disabled={chartsLoading}>
                                Refresh
                            </Button>
                        </Box>
                    </Stack>

                    {/* Date presets */}
                    <Stack direction="row" sx={{flexWrap: 'wrap', mb: 4, gap: 1}}>
                        {PRESETS.map(p => (
                            <Button key={p.key} size="small"
                                variant={filters.preset === p.key ? 'contained' : 'outlined'}
                                onClick={() => applyFilters({preset: p.key, from: '', to: ''})}>
                                {p.label}
                            </Button>
                        ))}
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6, lg: 3}}>
                            <TextField label="Custom From" type="date" size="small" fullWidth
                                slotProps={{ inputLabel: {shrink: true} }} value={filters.from}
                                onChange={(e) => applyFilters({from: e.target.value, preset: ''})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, lg: 3}}>
                            <TextField label="Custom To" type="date" size="small" fullWidth
                                slotProps={{ inputLabel: {shrink: true} }} value={filters.to}
                                onChange={(e) => applyFilters({to: e.target.value, preset: ''})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, lg: 3}}>
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

                {/* ── Charts (lazy-loaded) ──────────────────────────────────── */}
                <Suspense fallback={<Skeleton variant="rectangular" height={600} sx={{borderRadius: 1}}/>}>
                    <BillingCharts
                        byTest={byTest}
                        byReferrer={byReferrer}
                        byMethod={byMethod}
                        chartsLoading={chartsLoading}
                        trendData={trendData}
                        trendLoading={trendLoading}
                        trendFilters={trendFilters}
                        applyTrendFilters={applyTrendFilters}
                        trendReferrerObj={trendReferrerObj}
                        setTrendReferrerObj={setTrendReferrerObj}
                        trendTestObjs={trendTestObjs}
                        setTrendTestObjs={setTrendTestObjs}
                    />
                </Suspense>
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
