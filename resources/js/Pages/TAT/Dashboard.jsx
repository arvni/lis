import React, {useState, useMemo} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControl,
    Grid2 as Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    AccessTime,
    CheckCircle,
    FlashOn,
    Speed,
    Warning,
    ErrorOutline,
    FilterList,
} from '@mui/icons-material';

// ── Summary card ─────────────────────────────────────────────────────────────
const SummaryCard = ({title, value, icon: Icon, color, subtitle}) => {
    const theme = useTheme();
    return (
        <Card elevation={2} sx={{
            borderRadius: 2,
            borderTop: `4px solid ${theme.palette[color]?.main ?? theme.palette.grey[400]}`,
            height: '100%',
        }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>
                            {value ?? '—'}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette[color]?.main ?? '#ccc', 0.12),
                    }}>
                        <Icon sx={{color: `${color}.main`, fontSize: 28}}/>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

// ── Priority chip ─────────────────────────────────────────────────────────────
const PriorityChip = ({priority}) => {
    const map = {
        stat: {label: 'STAT', color: 'error'},
        urgent: {label: 'Urgent', color: 'warning'},
        routine: {label: 'Routine', color: 'default'},
    };
    const cfg = map[priority] ?? map.routine;
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="filled"/>;
};

// ── Status chip ───────────────────────────────────────────────────────────────
const StatusChip = ({status}) => {
    const map = {
        waiting: {label: 'Waiting', color: 'default'},
        processing: {label: 'Processing', color: 'info'},
        finished: {label: 'Finished', color: 'success'},
        rejected: {label: 'Rejected', color: 'error'},
    };
    const cfg = map[status] ?? {label: status ?? 'Unknown', color: 'default'};
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined"/>;
};

// ── TAT progress bar ──────────────────────────────────────────────────────────
const TATBar = ({pct, isBreached}) => {
    const color = isBreached ? 'error' : pct >= 70 ? 'warning' : 'success';
    return (
        <Box sx={{minWidth: 80}}>
            <LinearProgress
                variant="determinate"
                value={Math.min(pct ?? 0, 100)}
                color={color}
                sx={{height: 8, borderRadius: 4}}
            />
            <Typography variant="caption" color="text.secondary">
                {pct != null ? `${pct}%` : '—'}
            </Typography>
        </Box>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
    const {summary, items, sections, filters: serverFilters} = usePage().props;
    const theme = useTheme();

    const [filters, setFilters] = useState({
        priority: serverFilters?.priority ?? '',
        section_id: serverFilters?.section_id ?? '',
        date_from: serverFilters?.date_from ?? '',
        date_to: serverFilters?.date_to ?? '',
    });

    const applyFilters = (newFilters) => {
        const f = {...filters, ...newFilters};
        setFilters(f);
        router.get(route('tat.dashboard'), f, {preserveState: true, replace: true});
    };

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            const priorityOrder = {stat: 0, urgent: 1, routine: 2};
            if (a.is_breached !== b.is_breached) return a.is_breached ? -1 : 1;
            if (priorityOrder[a.priority] !== priorityOrder[b.priority])
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            return (b.progress_pct ?? 0) - (a.progress_pct ?? 0);
        });
    }, [items]);

    return (
        <AuthenticatedLayout>
            <Head title="TAT Dashboard"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="TAT Dashboard"
                    subtitle="Turnaround time monitoring for active lab items"
                />

                {/* Summary cards */}
                <Grid container spacing={2} sx={{mb: 3}}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="Overdue Items"
                            value={summary.breached}
                            icon={ErrorOutline}
                            color="error"
                            subtitle="Past deadline, not reported"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="At Risk"
                            value={summary.at_risk}
                            icon={Warning}
                            color="warning"
                            subtitle="≥70% of TAT elapsed"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="STAT Active"
                            value={summary.stat_active}
                            icon={FlashOn}
                            color="error"
                            subtitle="STAT items in progress"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="On-Time Rate (30d)"
                            value={summary.on_time_pct != null ? `${summary.on_time_pct}%` : '—'}
                            icon={CheckCircle}
                            color="success"
                            subtitle="Reported within TAT"
                        />
                    </Grid>
                </Grid>

                {/* Section breakdown */}
                {summary.by_section?.length > 0 && (
                    <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            By Section
                        </Typography>
                        <Grid container spacing={1}>
                            {summary.by_section.map((s) => (
                                <Grid key={s.section} size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        bgcolor: s.breached > 0
                                            ? alpha(theme.palette.error.main, 0.06)
                                            : 'background.paper',
                                    }}>
                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                            {s.section}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={0.5}>
                                            <Typography variant="caption" color="text.secondary">
                                                {s.count} active
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">·</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                avg {s.avg_elapsed}d elapsed
                                            </Typography>
                                            {s.breached > 0 && (
                                                <>
                                                    <Typography variant="caption" color="text.secondary">·</Typography>
                                                    <Typography variant="caption" color="error.main" fontWeight="bold">
                                                        {s.breached} overdue
                                                    </Typography>
                                                </>
                                            )}
                                        </Stack>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Filters */}
                <Paper elevation={1} sx={{p: 2, mb: 2, borderRadius: 2}}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <FilterList fontSize="small" color="action"/>
                        <Typography variant="subtitle2" color="text.secondary">
                            Filters
                        </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    label="Priority"
                                    value={filters.priority}
                                    onChange={(e) => applyFilters({priority: e.target.value})}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="stat">STAT</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                    <MenuItem value="routine">Routine</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Section</InputLabel>
                                <Select
                                    label="Section"
                                    value={filters.section_id}
                                    onChange={(e) => applyFilters({section_id: e.target.value})}
                                >
                                    <MenuItem value="">All sections</MenuItem>
                                    {sections.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField
                                label="From"
                                type="date"
                                size="small"
                                fullWidth
                                InputLabelProps={{shrink: true}}
                                value={filters.date_from}
                                onChange={(e) => applyFilters({date_from: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <TextField
                                label="To"
                                type="date"
                                size="small"
                                fullWidth
                                InputLabelProps={{shrink: true}}
                                value={filters.date_to}
                                onChange={(e) => applyFilters({date_to: e.target.value})}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Items table */}
                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`}}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Active Items ({sortedItems.length})
                        </Typography>
                    </Box>
                    <TableContainer sx={{maxHeight: 600}}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ref / Patient</TableCell>
                                    <TableCell>Test</TableCell>
                                    <TableCell>Section</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Deadline</TableCell>
                                    <TableCell>TAT Progress</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{py: 4}}>
                                            <Typography color="text.secondary">No active items</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sortedItems.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        sx={{
                                            bgcolor: item.is_breached
                                                ? alpha(theme.palette.error.main, 0.06)
                                                : item.is_at_risk
                                                    ? alpha(theme.palette.warning.main, 0.06)
                                                    : undefined,
                                            '&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.04)},
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {item.reference_code ?? `#${item.acceptance_id}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.patient_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.test_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.method_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item.section ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <PriorityChip priority={item.priority}/>
                                        </TableCell>
                                        <TableCell>
                                            <StatusChip status={item.item_status}/>
                                        </TableCell>
                                        <TableCell>
                                            {item.deadline ? (
                                                <Tooltip title={`${item.elapsed_working_days}d elapsed / ${item.turnaround_time}d TAT`}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        {item.is_breached && (
                                                            <ErrorOutline fontSize="small" color="error"/>
                                                        )}
                                                        <Typography
                                                            variant="body2"
                                                            color={item.is_breached ? 'error.main' : 'text.primary'}
                                                            fontWeight={item.is_breached ? 'bold' : 'normal'}
                                                        >
                                                            {new Date(item.deadline).toLocaleDateString()}
                                                        </Typography>
                                                    </Stack>
                                                </Tooltip>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell sx={{minWidth: 120}}>
                                            {item.turnaround_time > 0
                                                ? <TATBar pct={item.progress_pct} isBreached={item.is_breached}/>
                                                : <Typography variant="caption" color="text.secondary">No TAT set</Typography>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </AuthenticatedLayout>
    );
};

export default Dashboard;
