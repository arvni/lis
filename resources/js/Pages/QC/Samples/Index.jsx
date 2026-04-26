import React from 'react';
import {Head, router, usePage} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import {
    Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, alpha, useTheme,
    Tooltip, Pagination,
} from '@mui/material';
import {CheckCircle, Cancel, QrCode, Science} from '@mui/icons-material';
import {formatDate} from '@/Services/helper.js';

const SamplesIndex = () => {
    const {samples} = usePage().props;
    const theme = useTheme();

    const approve = (id) => router.post(route('qc.samples.approve', id), {}, {preserveState: false});
    const reject  = (id) => router.post(route('qc.samples.reject',  id), {}, {preserveState: false});

    return (
        <>
            <Head title="Sample QC"/>
            <Box sx={{p: {xs: 1, sm: 2, md: 3}}}>
                <PageHeader
                    title="Sample QC"
                    subtitle={`${samples.total} sample${samples.total !== 1 ? 's' : ''} pending QC approval`}
                />

                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Barcode</TableCell>
                                    <TableCell>Sample Type</TableCell>
                                    <TableCell>Patient</TableCell>
                                    <TableCell>Acceptance</TableCell>
                                    <TableCell>Tests</TableCell>
                                    <TableCell>Collected By</TableCell>
                                    <TableCell>Collected At</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {samples.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{py: 6}}>
                                            <Stack alignItems="center" spacing={1}>
                                                <Science sx={{fontSize: 40, color: 'text.disabled'}}/>
                                                <Typography color="text.secondary">
                                                    No samples pending QC
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {samples.data.map(sample => {
                                    const items = sample.active_acceptance_items ?? [];
                                    const patient = items[0]?.acceptance?.patient;
                                    const acceptance = items[0]?.acceptance;
                                    const tests = [...new Set(items.map(i => i.test?.name).filter(Boolean))];

                                    return (
                                        <TableRow key={sample.id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.03)}}}>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <QrCode fontSize="small" color="action"/>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {sample.barcode}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {sample.sample_type?.name ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {patient?.full_name ?? '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {patient?.id_no}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {acceptance?.reference_code ?? `#${acceptance?.id ?? '—'}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{maxWidth: 200}}>
                                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                    {tests.map((t, i) => (
                                                        <Chip key={i} label={t} size="small" variant="outlined"
                                                            sx={{fontSize: '0.65rem', height: 20}}/>
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {sample.sampler?.name ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {sample.collection_date ? formatDate(sample.collection_date) : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Approve QC">
                                                        <Button size="small" variant="contained" color="success"
                                                            startIcon={<CheckCircle fontSize="small"/>}
                                                            onClick={() => approve(sample.id)}>
                                                            Approve
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip title="Reject — sample must be re-collected">
                                                        <Button size="small" variant="outlined" color="error"
                                                            startIcon={<Cancel fontSize="small"/>}
                                                            onClick={() => reject(sample.id)}>
                                                            Reject
                                                        </Button>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {samples.last_page > 1 && (
                        <Box sx={{display: 'flex', justifyContent: 'center', p: 2,
                            borderTop: `1px solid ${theme.palette.divider}`}}>
                            <Pagination
                                count={samples.last_page}
                                page={samples.current_page}
                                onChange={(_, p) => router.get(route('qc.samples.index'), {page: p})}
                                color="primary" showFirstButton showLastButton
                            />
                        </Box>
                    )}
                </Paper>
            </Box>
        </>
    );
};

SamplesIndex.layout = page => (
    <AuthenticatedLayout auth={page.props.auth} children={page}
        breadcrumbs={[
            {title: 'Quality Control', link: '', icon: null},
            {title: 'Sample QC', link: '', icon: null},
        ]}/>
);

export default SamplesIndex;
