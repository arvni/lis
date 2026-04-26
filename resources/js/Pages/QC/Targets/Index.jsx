import React, {useState} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch.jsx';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Grid2 as Grid, IconButton, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
    alpha, useTheme,
} from '@mui/material';
import {Add, Delete} from '@mui/icons-material';

const LEVEL_COLOR = {low: 'info', normal: 'success', high: 'warning'};

const AddTargetDialog = ({open, onClose, materialId}) => {
    const [methodTestObj, setMethodTestObj] = useState(null);
    const [form, setForm] = useState({method_test_id: '', mean: '', sd: '', unit: ''});

    const submit = (e) => {
        e.preventDefault();
        router.post(route('qc.targets.store', materialId), form, {onSuccess: onClose});
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={submit}>
                <DialogTitle>Add Test Target</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{mt: 0.5}}>
                        <Grid size={{xs: 12}}>
                            <SelectSearch
                                value={methodTestObj}
                                onChange={(e) => {
                                    const obj = e.target.value;
                                    setMethodTestObj(obj ?? null);
                                    setForm(f => ({...f, method_test_id: obj?.id ?? ''}));
                                }}
                                name="method_test"
                                label="Test / Method"
                                url={route('api.tests.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Mean" required fullWidth size="small" type="number"
                                inputProps={{step: 'any'}}
                                value={form.mean} onChange={e => setForm(f => ({...f, mean: e.target.value}))}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="SD" required fullWidth size="small" type="number"
                                inputProps={{step: 'any', min: 0.0001}}
                                value={form.sd} onChange={e => setForm(f => ({...f, sd: e.target.value}))}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Unit" fullWidth size="small"
                                value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}/>
                        </Grid>
                        {form.mean && form.sd && (
                            <Grid size={{xs: 12}}>
                                <Typography variant="caption" color="text.secondary">
                                    CV% = {Math.abs(parseFloat(form.sd) / parseFloat(form.mean) * 100).toFixed(2)}%
                                    &nbsp;·&nbsp; ±2SD: [{(parseFloat(form.mean) - 2*parseFloat(form.sd)).toFixed(3)}, {(parseFloat(form.mean) + 2*parseFloat(form.sd)).toFixed(3)}]
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={!form.method_test_id || !form.mean || !form.sd}>
                        Add Target
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const TargetsIndex = () => {
    const {material} = usePage().props;
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    const del = (t) => {
        if (confirm('Remove this target?'))
            router.delete(route('qc.targets.destroy', [material.id, t.id]));
    };

    return (
        <>
            <Head title={`Targets — ${material.name}`}/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title={`${material.name} — Targets`}
                    subtitle={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={material.level} color={LEVEL_COLOR[material.level] ?? 'default'} size="small"/>
                            {material.section && <Chip label={material.section.name} size="small" variant="outlined"/>}
                        </Stack>
                    }
                    actions={[
                        <Button key="add" variant="contained" startIcon={<Add/>} onClick={() => setOpen(true)}>
                            Add Target
                        </Button>
                    ]}
                />

                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Test</TableCell>
                                    <TableCell>Method</TableCell>
                                    <TableCell align="right">Mean</TableCell>
                                    <TableCell align="right">SD</TableCell>
                                    <TableCell align="right">CV%</TableCell>
                                    <TableCell align="right">±2SD Range</TableCell>
                                    <TableCell align="right">±3SD Range</TableCell>
                                    <TableCell>Unit</TableCell>
                                    <TableCell/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {material.targets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{py: 4}}>
                                            <Typography color="text.secondary">No targets yet — add one above</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {material.targets.map(t => (
                                    <TableRow key={t.id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.03)}}}>
                                        <TableCell><Typography variant="body2">{t.method_test?.test?.name}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{t.method_test?.method?.name}</Typography></TableCell>
                                        <TableCell align="right"><b>{t.mean}</b></TableCell>
                                        <TableCell align="right">{t.sd}</TableCell>
                                        <TableCell align="right">{t.cv_percent}%</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="caption">
                                                [{(t.mean - 2*t.sd).toFixed(3)}, {(t.mean + 2*t.sd).toFixed(3)}]
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="caption">
                                                [{(t.mean - 3*t.sd).toFixed(3)}, {(t.mean + 3*t.sd).toFixed(3)}]
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{t.unit || '—'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Remove">
                                                <IconButton size="small" color="error" onClick={() => del(t)}>
                                                    <Delete fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <AddTargetDialog open={open} onClose={() => setOpen(false)} materialId={material.id}/>
            </Box>
        </>
    );
};

TargetsIndex.layout = page => (
    <AuthenticatedLayout auth={page.props.auth} children={page}
        breadcrumbs={[
            {title: 'Control Materials', link: route('qc.materials.index'), icon: null},
            {title: page.props.material?.name, link: '', icon: null},
        ]}/>
);

export default TargetsIndex;
