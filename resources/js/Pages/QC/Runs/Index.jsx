import React, {useState, useMemo} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, FormControl, Grid2 as Grid, InputLabel, MenuItem, Paper,
    Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, Tooltip, Typography, alpha, useTheme,
} from '@mui/material';
import {Add, CheckCircle, Warning, Error as ErrorIcon} from '@mui/icons-material';
import {
    ComposedChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, ResponsiveContainer, Legend, Scatter,
} from 'recharts';
import {formatDate} from '@/Services/helper.js';

const STATUS_CONFIG = {
    pass:    {label: 'Pass',    color: 'success', icon: <CheckCircle fontSize="small"/>},
    warning: {label: 'Warning', color: 'warning', icon: <Warning fontSize="small"/>},
    fail:    {label: 'Fail',    color: 'error',   icon: <ErrorIcon fontSize="small"/>},
};

const StatusChip = ({status}) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pass;
    return <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small"/>;
};

// Custom dot colored by status
const RunDot = (props) => {
    const {cx, cy, payload} = props;
    const color = {pass: '#16a34a', warning: '#d97706', fail: '#dc2626'}[payload.status] ?? '#6b7280';
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1.5}/>;
};

const LeveyJennings = ({runs, target}) => {
    const theme = useTheme();
    if (!target || runs.length === 0) return (
        <Box sx={{py: 6, textAlign: 'center'}}>
            <Typography color="text.secondary">Select a target to view the Levey-Jennings chart</Typography>
        </Box>
    );

    const {mean, sd} = target;
    const data = [...runs].reverse().map((r, i) => ({
        index: i + 1,
        label: new Date(r.run_at).toLocaleDateString(),
        value: r.value,
        status: r.status,
        z: ((r.value - mean) / sd).toFixed(2),
    }));

    return (
        <>
            <Stack direction="row" spacing={2} mb={1} alignItems="center">
                <Typography variant="subtitle2">
                    Mean: <b>{mean}</b> &nbsp;·&nbsp; SD: <b>{sd}</b> &nbsp;·&nbsp; CV%: <b>{target.cv_percent}%</b>
                </Typography>
            </Stack>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{top: 8, right: 24, left: 8, bottom: 8}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize: 11}} interval="preserveStartEnd"/>
                    <YAxis tick={{fontSize: 11}} domain={['auto', 'auto']}
                        label={{value: target.unit || 'Value', angle: -90, position: 'insideLeft', fontSize: 11}}/>
                    <ReTooltip formatter={(v, n, p) => [`${v} (z=${p.payload.z})`, 'Value']} labelFormatter={l => l}/>
                    <Legend verticalAlign="top"/>

                    {/* ±3SD reject lines */}
                    <ReferenceLine y={mean + 3*sd} stroke={theme.palette.error.main} strokeDasharray="6 3" label={{value: '+3SD', fill: theme.palette.error.main, fontSize: 10}}/>
                    <ReferenceLine y={mean - 3*sd} stroke={theme.palette.error.main} strokeDasharray="6 3" label={{value: '-3SD', fill: theme.palette.error.main, fontSize: 10}}/>
                    {/* ±2SD warning lines */}
                    <ReferenceLine y={mean + 2*sd} stroke={theme.palette.warning.main} strokeDasharray="4 3" label={{value: '+2SD', fill: theme.palette.warning.main, fontSize: 10}}/>
                    <ReferenceLine y={mean - 2*sd} stroke={theme.palette.warning.main} strokeDasharray="4 3" label={{value: '-2SD', fill: theme.palette.warning.main, fontSize: 10}}/>
                    {/* Mean */}
                    <ReferenceLine y={mean} stroke={theme.palette.success.main} strokeWidth={1.5} label={{value: 'Mean', fill: theme.palette.success.main, fontSize: 10}}/>

                    <Line type="linear" dataKey="value" name="QC Value"
                        stroke={theme.palette.primary.main} strokeWidth={1.5}
                        dot={<RunDot/>} activeDot={{r: 7}}/>
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};

const SubmitRunDialog = ({open, onClose, targets}) => {
    const [form, setForm] = useState({qc_target_id: '', value: '', run_at: new Date().toISOString().slice(0, 16), notes: ''});
    const set = (k, v) => setForm(f => ({...f, [k]: v}));

    const selectedTarget = targets.find(t => t.id === parseInt(form.qc_target_id));

    const submit = (e) => {
        e.preventDefault();
        router.post(route('qc.runs.store'), form, {onSuccess: onClose});
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={submit}>
                <DialogTitle>Submit QC Run</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{mt: 0.5}}>
                        <Grid size={{xs: 12}}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Material / Test</InputLabel>
                                <Select label="Material / Test" value={form.qc_target_id}
                                    onChange={e => set('qc_target_id', e.target.value)}>
                                    {targets.map(t => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.material?.name} — {t.method_test?.test?.name}
                                            {' '}({t.material?.level})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {selectedTarget && (
                            <Grid size={{xs: 12}}>
                                <Typography variant="caption" color="text.secondary">
                                    Target: mean={selectedTarget.mean} ± SD={selectedTarget.sd} {selectedTarget.unit}
                                    &nbsp;·&nbsp; ±2SD: [{(selectedTarget.mean - 2*selectedTarget.sd).toFixed(3)}, {(selectedTarget.mean + 2*selectedTarget.sd).toFixed(3)}]
                                </Typography>
                            </Grid>
                        )}
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Result Value" required fullWidth size="small"
                                type="number" inputProps={{step: 'any'}}
                                value={form.value} onChange={e => set('value', e.target.value)}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Run Date/Time" required fullWidth size="small"
                                type="datetime-local" InputLabelProps={{shrink: true}}
                                value={form.run_at} onChange={e => set('run_at', e.target.value)}/>
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <TextField label="Notes" fullWidth size="small" multiline rows={2}
                                value={form.notes} onChange={e => set('notes', e.target.value)}/>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained"
                        disabled={!form.qc_target_id || !form.value}>
                        Submit Run
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const RunsIndex = () => {
    const {runs, targets, target_id} = usePage().props;
    const theme = useTheme();
    const [submitOpen, setSubmitOpen] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState(target_id ?? '');

    const selectedTarget = targets.find(t => t.id === parseInt(selectedTargetId));
    const filteredRuns = selectedTargetId
        ? runs.filter(r => r.qc_target_id === parseInt(selectedTargetId))
        : runs;

    const applyFilter = (tid) => {
        setSelectedTargetId(tid);
        router.get(route('qc.runs.index'), tid ? {target_id: tid} : {}, {preserveState: true, replace: true});
    };

    return (
        <>
            <Head title="QC Runs"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="QC Runs"
                    subtitle="Levey-Jennings chart and run history"
                    actions={[
                        <Button key="submit" variant="contained" startIcon={<Add/>}
                            onClick={() => setSubmitOpen(true)}>
                            Submit Run
                        </Button>
                    ]}
                />

                {/* Target selector */}
                <Paper elevation={1} sx={{p: 2, mb: 2, borderRadius: 2}}>
                    <FormControl size="small" sx={{minWidth: 320}}>
                        <InputLabel>Filter by Material / Test</InputLabel>
                        <Select label="Filter by Material / Test"
                            value={selectedTargetId}
                            onChange={e => applyFilter(e.target.value)}>
                            <MenuItem value="">All</MenuItem>
                            {targets.map(t => (
                                <MenuItem key={t.id} value={t.id}>
                                    {t.material?.name} — {t.method_test?.test?.name} ({t.material?.level})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Paper>

                {/* Levey-Jennings */}
                <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Levey-Jennings Chart
                    </Typography>
                    <LeveyJennings runs={filteredRuns} target={selectedTarget}/>
                </Paper>

                {/* Run history table */}
                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`}}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Run History ({filteredRuns.length})
                        </Typography>
                    </Box>
                    <TableContainer sx={{maxHeight: 400}}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date/Time</TableCell>
                                    <TableCell>Material</TableCell>
                                    <TableCell>Test</TableCell>
                                    <TableCell align="right">Value</TableCell>
                                    <TableCell align="right">z-score</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Violations</TableCell>
                                    <TableCell>Analyst</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRuns.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{py: 4}}>
                                            <Typography color="text.secondary">No runs recorded</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredRuns.map(r => {
                                    const zScore = r.target?.mean != null && r.target?.sd > 0
                                        ? ((r.value - r.target.mean) / r.target.sd).toFixed(2)
                                        : '—';
                                    const zNum = parseFloat(zScore);
                                    const zColor = Math.abs(zNum) > 3 ? 'error.main'
                                        : Math.abs(zNum) > 2 ? 'warning.main' : 'text.primary';
                                    return (
                                        <TableRow key={r.id} sx={{
                                            bgcolor: r.status === 'fail' ? alpha(theme.palette.error.main, 0.05)
                                                : r.status === 'warning' ? alpha(theme.palette.warning.main, 0.05) : undefined,
                                        }}>
                                            <TableCell><Typography variant="caption">{formatDate(r.run_at)}</Typography></TableCell>
                                            <TableCell>{r.target?.material?.name}</TableCell>
                                            <TableCell>{r.target?.method_test?.test?.name}</TableCell>
                                            <TableCell align="right"><b>{r.value}</b> {r.target?.unit}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color={zColor} fontWeight="medium">
                                                    {zScore}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><StatusChip status={r.status}/></TableCell>
                                            <TableCell>
                                                {(r.violations ?? []).length > 0
                                                    ? <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {r.violations.map(v => (
                                                            <Chip key={v} label={v} size="small" color="error" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
                                                        ))}
                                                      </Stack>
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>{r.analyst?.name}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <SubmitRunDialog open={submitOpen} onClose={() => setSubmitOpen(false)} targets={targets}/>
            </Box>
        </>
    );
};

RunsIndex.layout = page => (
    <AuthenticatedLayout auth={page.props.auth} children={page}
        breadcrumbs={[{title: 'Quality Control', link: '', icon: null}, {title: 'QC Runs', link: '', icon: null}]}/>
);

export default RunsIndex;
