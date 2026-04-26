import React, {useState, useMemo, useEffect, useCallback, useRef} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch.jsx';
import axios from 'axios';
import {
    Box, Card, CardContent, Chip, FormControl, Grid2 as Grid,
    InputLabel, LinearProgress, MenuItem, Paper, Select, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography, alpha, useTheme, Button, Divider,
    Pagination, Skeleton, CircularProgress,
} from '@mui/material';
import {
    CheckCircle, FlashOn, Warning, ErrorOutline, FilterList,
    BarChart as BarChartIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';

// ── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({title, value, icon: Icon, color, subtitle}) => {
    const theme = useTheme();
    return (
        <Card elevation={2} sx={{borderRadius: 2, borderTop: `4px solid ${theme.palette[color]?.main ?? theme.palette.grey[400]}`, height: '100%'}}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
                        <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>{value ?? '—'}</Typography>
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

const PriorityChip = ({priority}) => {
    const map = {stat: {label: 'STAT', color: 'error'}, urgent: {label: 'Urgent', color: 'warning'}, routine: {label: 'Routine', color: 'default'}};
    const cfg = map[priority] ?? map.routine;
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="filled"/>;
};

const StatusChip = ({status}) => {
    const map = {waiting: {label: 'Waiting', color: 'default'}, processing: {label: 'Processing', color: 'info'}, finished: {label: 'Finished', color: 'success'}, rejected: {label: 'Rejected', color: 'error'}};
    const cfg = map[status] ?? {label: status ?? 'Unknown', color: 'default'};
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined"/>;
};

const TATBar = ({pct, isBreached}) => {
    const color = isBreached ? 'error' : pct >= 70 ? 'warning' : 'success';
    return (
        <Box sx={{minWidth: 80}}>
            <LinearProgress variant="determinate" value={Math.min(pct ?? 0, 100)} color={color} sx={{height: 8, borderRadius: 4}}/>
            <Typography variant="caption" color="text.secondary">{pct != null ? `${pct}%` : '—'}</Typography>
        </Box>
    );
};

const PRESETS = [
    {key: 'today', label: 'Today'},
    {key: 'this_week', label: 'This Week'},
    {key: 'last_week', label: 'Last Week'},
    {key: 'this_month', label: 'This Month'},
    {key: 'last_month', label: 'Last Month'},
    {key: 'last_7_days', label: 'Last 7 Days'},
    {key: 'last_30_days', label: 'Last 30 Days'},
    {key: 'last_3_months', label: 'Last 3 Months'},
];

const AnalyticsTooltip = ({active, payload}) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <Paper elevation={3} sx={{p: 1.5, minWidth: 200}}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>{d.test_name}</Typography>
            <Typography variant="caption" display="block">Avg: <b>{d.avg_hours}h ({d.avg_days}d)</b></Typography>
            <Typography variant="caption" display="block">Min: {d.min_hours}h — Max: {d.max_hours}h</Typography>
            <Typography variant="caption" display="block">Count: {d.count} reports</Typography>
            {d.target_hours != null && (
                <Typography variant="caption" display="block" color={d.on_target ? 'success.main' : 'error.main'}>
                    Target: {d.target_hours}h — {d.on_target ? '✓ On target' : '✗ Over target'}
                </Typography>
            )}
        </Paper>
    );
};

// ── Row skeleton ──────────────────────────────────────────────────────────────
const SkeletonRows = ({count = 5, cols = 7}) => (
    <>
        {Array.from({length: count}).map((_, i) => (
            <TableRow key={i}>
                {Array.from({length: cols}).map((__, j) => (
                    <TableCell key={j}><Skeleton variant="text" width="80%"/></TableCell>
                ))}
            </TableRow>
        ))}
    </>
);

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
    const {summary, items_count, filters: serverFilters} = usePage().props;
    const theme = useTheme();

    // ── Active items state ────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        priority: serverFilters?.priority ?? '',
        section_id: serverFilters?.section_id ?? '',
        date_from: serverFilters?.date_from ?? '',
        date_to: serverFilters?.date_to ?? '',
    });
    // SelectSearch display object for section (holds {id, name})
    const [sectionObj, setSectionObj] = useState(null);

    const [itemsData, setItemsData] = useState({data: [], meta: {total: items_count, per_page: 20, current_page: 1, last_page: 1}});
    const [itemsLoading, setItemsLoading] = useState(true);

    // ── Analytics state ───────────────────────────────────────────────────────
    const [af, setAf] = useState({a_preset: 'last_30_days', a_from: '', a_to: '', a_test_id: ''});
    // SelectSearch display object for test (holds {id, name})
    const [testObj, setTestObj] = useState(null);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsDates, setAnalyticsDates] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // abort controllers
    const itemsAbort = useRef(null);
    const analyticsAbort = useRef(null);

    // ── Fetch items ───────────────────────────────────────────────────────────
    const fetchItems = useCallback((f = filters, page = 1) => {
        itemsAbort.current?.abort();
        itemsAbort.current = new AbortController();
        setItemsLoading(true);
        const params = {...f, page, per_page: 20};
        Object.keys(params).forEach(k => !params[k] && delete params[k]);
        axios.get(route('api.tat.items'), {params, signal: itemsAbort.current.signal})
            .then(r => { setItemsData(r.data); setItemsLoading(false); })
            .catch(e => { if (!axios.isCancel(e)) setItemsLoading(false); });
    }, [filters]);

    // ── Fetch analytics ───────────────────────────────────────────────────────
    const fetchAnalytics = useCallback((a = af) => {
        analyticsAbort.current?.abort();
        analyticsAbort.current = new AbortController();
        setAnalyticsLoading(true);
        const params = {...a};
        Object.keys(params).forEach(k => !params[k] && delete params[k]);
        axios.get(route('api.tat.analytics'), {params, signal: analyticsAbort.current.signal})
            .then(r => { setAnalyticsData(r.data.data); setAnalyticsDates(r.data.dates); setAnalyticsLoading(false); })
            .catch(e => { if (!axios.isCancel(e)) setAnalyticsLoading(false); });
    }, [af]);

    // initial load
    useEffect(() => { fetchItems(); fetchAnalytics(); }, []);

    const applyFilters = (newFilters) => {
        const f = {...filters, ...newFilters};
        setFilters(f);
        // Also update URL params for summary refresh (Inertia)
        router.get(route('tat.dashboard'), f, {preserveState: true, replace: true, only: ['summary', 'items_count', 'filters']});
        fetchItems(f, 1);
    };

    const applyAnalytics = (newAf) => {
        const a = {...af, ...newAf};
        setAf(a);
        fetchAnalytics(a);
    };

    const handlePageChange = (_, page) => fetchItems(filters, page);

    const chartData = useMemo(() =>
        analyticsData.map(d => ({...d, short_name: d.test_name.length > 18 ? d.test_name.slice(0, 16) + '…' : d.test_name}))
    , [analyticsData]);

    return (
        <>
            <Head title="TAT Dashboard"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader title="TAT Dashboard" subtitle="Turnaround time monitoring for active lab items"/>

                {/* ── Summary cards ─────────────────────────────────────────── */}
                <Grid container spacing={2} sx={{mb: 3}}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="Overdue Items" value={summary.breached} icon={ErrorOutline} color="error" subtitle="Past deadline, not reported"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="At Risk" value={summary.at_risk} icon={Warning} color="warning" subtitle="≥70% of TAT elapsed"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="STAT Active" value={summary.stat_active} icon={FlashOn} color="error" subtitle="STAT items in progress"/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard title="On-Time Rate (30d)" value={summary.on_time_pct != null ? `${summary.on_time_pct}%` : '—'} icon={CheckCircle} color="success" subtitle="Reported within TAT"/>
                    </Grid>
                </Grid>

                {/* ── Section breakdown ─────────────────────────────────────── */}
                {summary.by_section?.length > 0 && (
                    <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>By Section</Typography>
                        <Grid container spacing={1}>
                            {summary.by_section.map((s) => (
                                <Grid key={s.section} size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                                    <Box sx={{p: 1.5, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: s.breached > 0 ? alpha(theme.palette.error.main, 0.06) : 'background.paper'}}>
                                        <Typography variant="body2" fontWeight="medium" noWrap>{s.section}</Typography>
                                        <Stack direction="row" spacing={1} mt={0.5}>
                                            <Typography variant="caption" color="text.secondary">{s.count} active</Typography>
                                            <Typography variant="caption" color="text.secondary">·</Typography>
                                            <Typography variant="caption" color="text.secondary">avg {s.avg_elapsed}d elapsed</Typography>
                                            {s.breached > 0 && (<><Typography variant="caption" color="text.secondary">·</Typography><Typography variant="caption" color="error.main" fontWeight="bold">{s.breached} overdue</Typography></>)}
                                        </Stack>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* ── Active items filters ──────────────────────────────────── */}
                <Paper elevation={1} sx={{p: 2, mb: 2, borderRadius: 2}}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <FilterList fontSize="small" color="action"/>
                        <Typography variant="subtitle2" color="text.secondary">Active Items Filters</Typography>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Priority</InputLabel>
                                <Select label="Priority" value={filters.priority} onChange={(e) => applyFilters({priority: e.target.value})}>
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="stat">STAT</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                    <MenuItem value="routine">Routine</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <SelectSearch
                                value={sectionObj}
                                onChange={(e) => {
                                    const obj = e.target.value;
                                    setSectionObj(obj ?? null);
                                    applyFilters({section_id: obj?.id ?? ''});
                                }}
                                name="section"
                                label="Section"
                                url={route('api.sections.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField label="From" type="date" size="small" fullWidth InputLabelProps={{shrink: true}} value={filters.date_from} onChange={(e) => applyFilters({date_from: e.target.value})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField label="To" type="date" size="small" fullWidth InputLabelProps={{shrink: true}} value={filters.date_to} onChange={(e) => applyFilters({date_to: e.target.value})}/>
                        </Grid>
                    </Grid>
                </Paper>

                {/* ── Active items table ────────────────────────────────────── */}
                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden', mb: 4}}>
                    <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1}}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Active Items
                        </Typography>
                        <Chip
                            label={itemsLoading ? '…' : itemsData.meta.total}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        {itemsLoading && <CircularProgress size={16} sx={{ml: 'auto'}}/>}
                    </Box>
                    <TableContainer sx={{maxHeight: 500}}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ref / Patient</TableCell>
                                    <TableCell>Tests</TableCell>
                                    <TableCell>Sections</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Last Added</TableCell>
                                    <TableCell>Deadline</TableCell>
                                    <TableCell>TAT Progress</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemsLoading && itemsData.data.length === 0
                                    ? <SkeletonRows count={8} cols={7}/>
                                    : itemsData.data.length === 0
                                        ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{py: 4}}>
                                                    <Typography color="text.secondary">No active acceptances</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )
                                        : itemsData.data.map((row) => (
                                            <TableRow key={row.id} sx={{
                                                bgcolor: row.is_breached ? alpha(theme.palette.error.main, 0.06) : row.is_at_risk ? alpha(theme.palette.warning.main, 0.06) : undefined,
                                                '&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.04)},
                                                opacity: itemsLoading ? 0.5 : 1,
                                            }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {row.reference_code ?? `#${row.id}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.patient_name}</Typography>
                                                </TableCell>
                                                <TableCell sx={{maxWidth: 180}}>
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {(row.tests ?? []).map((t, i) => (
                                                            <Chip key={i} label={t} size="small" variant="outlined" sx={{fontSize: '0.65rem', height: 20}}/>
                                                        ))}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {(row.sections ?? []).join(', ') || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell><PriorityChip priority={row.priority}/></TableCell>
                                                <TableCell>
                                                    <Tooltip title="TAT clock starts from when the last test was added">
                                                        <Typography variant="body2" color="text.secondary">
                                                            {row.start_time ? new Date(row.start_time).toLocaleDateString() : '—'}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    {row.deadline ? (
                                                        <Tooltip title={`${row.elapsed_working_days}d elapsed / ${row.max_tat}d TAT · ${row.active_items_count} pending test(s)`}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                {row.is_breached && <ErrorOutline fontSize="small" color="error"/>}
                                                                <Typography variant="body2" color={row.is_breached ? 'error.main' : 'text.primary'} fontWeight={row.is_breached ? 'bold' : 'normal'}>
                                                                    {new Date(row.deadline).toLocaleDateString()}
                                                                </Typography>
                                                            </Stack>
                                                        </Tooltip>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell sx={{minWidth: 120}}>
                                                    {row.max_tat > 0
                                                        ? <TATBar pct={row.progress_pct} isBreached={row.is_breached}/>
                                                        : <Typography variant="caption" color="text.secondary">No TAT set</Typography>
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {itemsData.meta.last_page > 1 && (
                        <Box sx={{display: 'flex', justifyContent: 'center', p: 2, borderTop: `1px solid ${theme.palette.divider}`}}>
                            <Pagination
                                count={itemsData.meta.last_page}
                                page={itemsData.meta.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                disabled={itemsLoading}
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Paper>

                <Divider sx={{mb: 4}}/>

                {/* ── Analytics section ─────────────────────────────────────── */}
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <BarChartIcon color="primary"/>
                    <Typography variant="h6" fontWeight="bold">Avg TAT by Test</Typography>
                    {analyticsDates && !analyticsLoading && (
                        <Typography variant="caption" color="text.secondary">
                            ({analyticsDates.from} → {analyticsDates.to})
                        </Typography>
                    )}
                    {analyticsLoading && <CircularProgress size={16}/>}
                    <Box sx={{ml: 'auto'}}>
                        <Tooltip title="Refresh">
                            <span>
                                <Button size="small" startIcon={<RefreshIcon/>} onClick={() => fetchAnalytics(af)} disabled={analyticsLoading}>
                                    Refresh
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                </Stack>

                {/* Date presets + filters */}
                <Paper elevation={1} sx={{p: 2, mb: 2, borderRadius: 2}}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{xs: 12}}>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {PRESETS.map(p => (
                                    <Button key={p.key} size="small"
                                        variant={af.a_preset === p.key ? 'contained' : 'outlined'}
                                        onClick={() => applyAnalytics({a_preset: p.key, a_from: '', a_to: ''})}>
                                        {p.label}
                                    </Button>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4, md: 3}}>
                            <SelectSearch
                                value={testObj}
                                onChange={(e) => {
                                    const obj = e.target.value;
                                    setTestObj(obj ?? null);
                                    applyAnalytics({a_test_id: obj?.id ?? ''});
                                }}
                                name="test"
                                label="Test"
                                url={route('api.tests.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4, md: 3}}>
                            <TextField label="Custom From" type="date" size="small" fullWidth InputLabelProps={{shrink: true}} value={af.a_from}
                                onChange={(e) => applyAnalytics({a_from: e.target.value, a_preset: ''})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4, md: 3}}>
                            <TextField label="Custom To" type="date" size="small" fullWidth InputLabelProps={{shrink: true}} value={af.a_to}
                                onChange={(e) => applyAnalytics({a_to: e.target.value, a_preset: ''})}/>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Bar chart */}
                <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                    {analyticsLoading ? (
                        <Box>
                            <Skeleton variant="rectangular" height={320} sx={{borderRadius: 1}}/>
                        </Box>
                    ) : chartData.length === 0 ? (
                        <Box sx={{py: 6, textAlign: 'center'}}>
                            <Typography color="text.secondary">No published reports in this period.</Typography>
                        </Box>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={chartData} margin={{top: 8, right: 24, left: 0, bottom: 60}}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="short_name" angle={-35} textAnchor="end" tick={{fontSize: 12}} interval={0}/>
                                    <YAxis unit="h" tick={{fontSize: 12}} label={{value: 'Hours', angle: -90, position: 'insideLeft', offset: 10}}/>
                                    <ReTooltip content={<AnalyticsTooltip/>}/>
                                    <Legend verticalAlign="top"/>
                                    <Bar dataKey="avg_hours" name="Avg TAT (hours)" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={
                                                entry.on_target === false ? theme.palette.error.main
                                                : entry.on_target === true ? theme.palette.success.main
                                                : theme.palette.primary.main
                                            }/>
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'success.main'}}/><Typography variant="caption">On target</Typography></Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'error.main'}}/><Typography variant="caption">Over target</Typography></Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'primary.main'}}/><Typography variant="caption">No target set</Typography></Stack>
                            </Stack>
                        </>
                    )}
                </Paper>

                {/* Analytics table */}
                {!analyticsLoading && analyticsData.length > 0 && (
                    <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                        <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`}}>
                            <Typography variant="subtitle1" fontWeight="bold">Details ({analyticsData.length} tests)</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Test</TableCell>
                                        <TableCell align="right">Reports</TableCell>
                                        <TableCell align="right">Avg (h)</TableCell>
                                        <TableCell align="right">Avg (d)</TableCell>
                                        <TableCell align="right">Min (h)</TableCell>
                                        <TableCell align="right">Max (h)</TableCell>
                                        <TableCell align="right">Target (h)</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analyticsData.map((row) => (
                                        <TableRow key={row.test_id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.04)}}}>
                                            <TableCell><Typography variant="body2">{row.test_name}</Typography></TableCell>
                                            <TableCell align="right">{row.count}</TableCell>
                                            <TableCell align="right"><Typography variant="body2" fontWeight="medium">{row.avg_hours}</Typography></TableCell>
                                            <TableCell align="right">{row.avg_days}</TableCell>
                                            <TableCell align="right" sx={{color: 'text.secondary'}}>{row.min_hours}</TableCell>
                                            <TableCell align="right" sx={{color: 'text.secondary'}}>{row.max_hours}</TableCell>
                                            <TableCell align="right">{row.target_hours ?? '—'}</TableCell>
                                            <TableCell align="center">
                                                {row.on_target === null
                                                    ? <Chip label="No target" size="small" variant="outlined"/>
                                                    : row.on_target
                                                        ? <Chip label="On target" size="small" color="success" variant="filled"/>
                                                        : <Chip label="Over target" size="small" color="error" variant="filled"/>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>
        </>
    );
};

Dashboard.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {title: 'Reception', link: route('acceptances.index'), icon: null},
            {title: 'TAT Dashboard', link: '', icon: null},
        ]}
    />
);

export default Dashboard;
