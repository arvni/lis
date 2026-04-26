import React, {useState} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, Grid2 as Grid, IconButton, InputLabel, MenuItem,
    Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Tooltip, Typography, alpha, useTheme,
} from '@mui/material';
import {Add, Edit, Delete, Science, Settings} from '@mui/icons-material';
import {Link} from '@inertiajs/react';

const LEVEL_COLOR = {low: 'info', normal: 'success', high: 'warning'};

const MaterialForm = ({open, onClose, material, sections, levels}) => {
    const [form, setForm] = useState(material ?? {
        name: '', level: 'normal', lot_number: '', expiry_date: '', section_id: '', notes: '',
    });

    const set = (k, v) => setForm(f => ({...f, [k]: v}));
    const isEdit = !!material?.id;

    const submit = (e) => {
        e.preventDefault();
        const action = isEdit
            ? router.put(route('qc.materials.update', material.id), form, {onSuccess: onClose})
            : router.post(route('qc.materials.store'), form, {onSuccess: onClose});
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={submit}>
                <DialogTitle>{isEdit ? 'Edit Material' : 'New Control Material'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{mt: 0.5}}>
                        <Grid size={{xs: 12}}>
                            <TextField label="Name" required fullWidth size="small"
                                value={form.name} onChange={e => set('name', e.target.value)}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Level</InputLabel>
                                <Select label="Level" value={form.level} onChange={e => set('level', e.target.value)}>
                                    {levels.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Section</InputLabel>
                                <Select label="Section" value={form.section_id} onChange={e => set('section_id', e.target.value)}>
                                    <MenuItem value="">All sections</MenuItem>
                                    {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Lot Number" fullWidth size="small"
                                value={form.lot_number} onChange={e => set('lot_number', e.target.value)}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Expiry Date" type="date" fullWidth size="small"
                                InputLabelProps={{shrink: true}}
                                value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}/>
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <TextField label="Notes" fullWidth size="small" multiline rows={2}
                                value={form.notes} onChange={e => set('notes', e.target.value)}/>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">{isEdit ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const Index = () => {
    const {materials, sections, levels} = usePage().props;
    const theme = useTheme();
    const [dialog, setDialog] = useState(null); // null | {material: null | obj}

    const del = (m) => {
        if (confirm(`Delete "${m.name}"?`))
            router.delete(route('qc.materials.destroy', m.id));
    };

    return (
        <>
            <Head title="QC Control Materials"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="Control Materials"
                    subtitle="Manage QC control materials and their target ranges"
                    actions={[
                        <Button key="add" variant="contained" startIcon={<Add/>}
                            onClick={() => setDialog({material: null})}>
                            Add Material
                        </Button>
                    ]}
                />

                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Level</TableCell>
                                    <TableCell>Section</TableCell>
                                    <TableCell>Lot Number</TableCell>
                                    <TableCell>Expiry</TableCell>
                                    <TableCell align="center">Targets</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {materials.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{py: 4}}>
                                            <Typography color="text.secondary">No materials yet</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {materials.map(m => {
                                    const expired = m.expiry_date && new Date(m.expiry_date) < new Date();
                                    return (
                                        <TableRow key={m.id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.03)}}}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">{m.name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={m.level} color={LEVEL_COLOR[m.level] ?? 'default'} size="small"/>
                                            </TableCell>
                                            <TableCell>{m.section?.name ?? '—'}</TableCell>
                                            <TableCell>{m.lot_number || '—'}</TableCell>
                                            <TableCell>
                                                {m.expiry_date
                                                    ? <Typography variant="caption" color={expired ? 'error.main' : 'text.secondary'}>
                                                        {m.expiry_date}{expired ? ' (expired)' : ''}
                                                      </Typography>
                                                    : '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={m.targets_count} size="small" variant="outlined"/>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Manage targets">
                                                        <IconButton size="small" color="info"
                                                            component={Link}
                                                            href={route('qc.targets.index', m.id)}>
                                                            <Settings fontSize="small"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" color="primary"
                                                            onClick={() => setDialog({material: m})}>
                                                            <Edit fontSize="small"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => del(m)}>
                                                            <Delete fontSize="small"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {dialog !== null && (
                    <MaterialForm
                        open
                        onClose={() => setDialog(null)}
                        material={dialog.material}
                        sections={sections}
                        levels={levels}
                    />
                )}
            </Box>
        </>
    );
};

Index.layout = page => (
    <AuthenticatedLayout auth={page.props.auth} children={page}
        breadcrumbs={[{title: 'Quality Control', link: '', icon: null}, {title: 'Control Materials', link: '', icon: null}]}/>
);

export default Index;
