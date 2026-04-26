import React, {useState} from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch.jsx';
import {
    Box, Chip, FormControl, Grid2 as Grid, InputLabel, MenuItem,
    Paper, Select, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
    alpha, useTheme, Tooltip, IconButton, Collapse,
    Pagination,
} from '@mui/material';
import {
    FilterList, ExpandMore, ExpandLess,
    Create as CreateIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    HelpOutline,
} from '@mui/icons-material';
import {formatDate} from '@/Services/helper.js';

const TYPE_CONFIG = {
    Create:  {label: 'Create',  color: 'success', icon: <CreateIcon fontSize="small"/>},
    Update:  {label: 'Update',  color: 'warning', icon: <EditIcon fontSize="small"/>},
    Delete:  {label: 'Delete',  color: 'error',   icon: <DeleteIcon fontSize="small"/>},
    Login:   {label: 'Login',   color: 'info',    icon: <LoginIcon fontSize="small"/>},
    Logout:  {label: 'Logout',  color: 'default', icon: <LogoutIcon fontSize="small"/>},
};

const ActivityChip = ({type}) => {
    const cfg = TYPE_CONFIG[type] ?? {label: type, color: 'default', icon: <HelpOutline fontSize="small"/>};
    return <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small" variant="filled"/>;
};

const shortModelType = (type) => type?.split('\\').pop() ?? '—';

const PayloadRow = ({payload}) => {
    const [open, setOpen] = useState(false);
    if (!payload) return <Typography variant="caption" color="text.secondary">—</Typography>;
    return (
        <>
            <IconButton size="small" onClick={() => setOpen(o => !o)}>
                {open ? <ExpandLess fontSize="small"/> : <ExpandMore fontSize="small"/>}
            </IconButton>
            <Collapse in={open}>
                <Box sx={{
                    mt: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50',
                    fontFamily: 'monospace', fontSize: '0.7rem',
                    maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                }}>
                    {JSON.stringify(payload?.value ?? payload, null, 2)}
                </Box>
            </Collapse>
        </>
    );
};

const Index = () => {
    const {activities, activity_types, filters: serverFilters} = usePage().props;
    const theme = useTheme();

    const [filters, setFilters] = useState({
        user_id: serverFilters?.user_id ?? '',
        activity_type: serverFilters?.activity_type ?? '',
        related_type: serverFilters?.related_type ?? '',
        from: serverFilters?.from ?? '',
        to: serverFilters?.to ?? '',
    });
    const [userObj, setUserObj] = useState(null);

    const apply = (patch) => {
        const f = {...filters, ...patch};
        setFilters(f);
        const p = {...f};
        Object.keys(p).forEach(k => !p[k] && delete p[k]);
        router.get(route('system.auditLog'), p, {preserveState: true, replace: true});
    };

    return (
        <>
            <Head title="Audit Log"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="Audit Log"
                    subtitle={`${activities.total.toLocaleString()} records`}
                />

                {/* Filters */}
                <Paper elevation={1} sx={{p: 2, mb: 2, borderRadius: 2}}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <FilterList fontSize="small" color="action"/>
                        <Typography variant="subtitle2" color="text.secondary">Filters</Typography>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <SelectSearch
                                value={userObj}
                                onChange={(e) => {
                                    const obj = e.target.value;
                                    setUserObj(obj ?? null);
                                    apply({user_id: obj?.id ?? ''});
                                }}
                                name="user"
                                label="User"
                                url={route('api.users.list')}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Activity Type</InputLabel>
                                <Select label="Activity Type" value={filters.activity_type}
                                    onChange={(e) => apply({activity_type: e.target.value})}>
                                    <MenuItem value="">All</MenuItem>
                                    {activity_types.map(t => (
                                        <MenuItem key={t.value} value={t.value}>{t.value}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 2}}>
                            <TextField
                                label="Model"
                                size="small"
                                fullWidth
                                placeholder="e.g. Acceptance"
                                value={filters.related_type}
                                onChange={(e) => apply({related_type: e.target.value})}
                            />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 2}}>
                            <TextField label="From" type="date" size="small" fullWidth
                                InputLabelProps={{shrink: true}} value={filters.from}
                                onChange={(e) => apply({from: e.target.value})}/>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 2}}>
                            <TextField label="To" type="date" size="small" fullWidth
                                InputLabelProps={{shrink: true}} value={filters.to}
                                onChange={(e) => apply({to: e.target.value})}/>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Table */}
                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <TableContainer sx={{maxHeight: 620}}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{minWidth: 150}}>Timestamp</TableCell>
                                    <TableCell sx={{minWidth: 140}}>User</TableCell>
                                    <TableCell sx={{minWidth: 100}}>Action</TableCell>
                                    <TableCell sx={{minWidth: 120}}>Model</TableCell>
                                    <TableCell sx={{minWidth: 80}}>Record ID</TableCell>
                                    <TableCell sx={{minWidth: 120}}>IP Address</TableCell>
                                    <TableCell>Changes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activities.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{py: 4}}>
                                            <Typography color="text.secondary">No records found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {activities.data.map((row) => (
                                    <TableRow key={row.id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.03)}}}>
                                        <TableCell>
                                            <Typography variant="caption">{formatDate(row.created_at)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {row.user?.name ?? <em>System</em>}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <ActivityChip type={row.activity_type}/>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={row.related_type ?? ''}>
                                                <Typography variant="body2">
                                                    {shortModelType(row.related_type)}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {row.related_id ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {row.ip_address ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <PayloadRow payload={row.payload}/>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {activities.last_page > 1 && (
                        <Box sx={{display: 'flex', justifyContent: 'center', p: 2,
                            borderTop: `1px solid ${theme.palette.divider}`}}>
                            <Pagination
                                count={activities.last_page}
                                page={activities.current_page}
                                onChange={(_, p) => apply({page: p})}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Paper>
            </Box>
        </>
    );
};

Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {title: 'System', link: route('system.failed-jobs'), icon: null},
            {title: 'Audit Log', link: '', icon: null},
        ]}
    />
);

export default Index;
