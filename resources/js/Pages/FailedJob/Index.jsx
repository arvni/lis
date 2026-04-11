import React, {useState, useCallback, useMemo} from 'react';
import {router, usePage} from '@inertiajs/react';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Paper, Stack, Tooltip, Typography, Alert, Collapse,
    Divider, LinearProgress, TextField, MenuItem, Select, FormControl,
    InputLabel, Grid2 as Grid, Card, CardContent,
} from '@mui/material';
import {GridActionsCellItem} from '@mui/x-data-grid';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteForm from '@/Components/DeleteForm';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {formatDate} from '@/Services/helper.js';

// ─── Exception detail dialog ──────────────────────────────────────────────────
function ExceptionDialog({open, onClose, job}) {
    if (!job) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <ErrorOutlineIcon color="error"/>
                    <Box>
                        <Typography variant="h6">{job.display_name?.split('\\').pop()}</Typography>
                        <Typography variant="caption" color="text.secondary">{job.display_name}</Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Job Details</Typography>
                        <Grid container spacing={1}>
                            {[
                                ['UUID',       job.uuid],
                                ['Queue',      job.queue],
                                ['Connection', job.connection],
                                ['Max Tries',  job.max_tries ?? '—'],
                                ['Backoff',    job.backoff ?? '—'],
                                ['Failed At',  job.failed_at],
                            ].map(([label, value]) => (
                                <React.Fragment key={label}>
                                    <Grid size={3}><Typography variant="caption" color="text.secondary">{label}</Typography></Grid>
                                    <Grid size={9}><Typography variant="caption">{value}</Typography></Grid>
                                </React.Fragment>
                            ))}
                        </Grid>
                    </Box>
                    <Divider/>
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Full Exception</Typography>
                        <Box
                            component="pre"
                            sx={{
                                fontSize: '0.72rem',
                                bgcolor: 'grey.900',
                                color: 'grey.100',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: 400,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {job.full_exception}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Type summary cards ───────────────────────────────────────────────────────
const TYPE_COLORS = ['error', 'warning', 'info', 'secondary'];
function TypeSummaryBar({typeSummary}) {
    if (!typeSummary?.length) return null;
    return (
        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2}}>
            {typeSummary.map((t, i) => {
                const shortName = t.job_type?.split('\\').pop() ?? t.job_type;
                return (
                    <Card key={t.job_type} variant="outlined" sx={{minWidth: 140}}>
                        <CardContent sx={{p: '10px 14px!important'}}>
                            <Typography variant="caption" color="text.secondary" noWrap title={t.job_type}>
                                {shortName}
                            </Typography>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5}}>
                                <ErrorOutlineIcon fontSize="small" color={TYPE_COLORS[i % TYPE_COLORS.length]}/>
                                <Typography variant="h6" fontWeight="bold" color={`${TYPE_COLORS[i % TYPE_COLORS.length]}.main`}>
                                    {t.count}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
}

// ─── Bulk-action confirm dialog ───────────────────────────────────────────────
function BulkConfirmDialog({open, onClose, onConfirm, title, message, confirmColor = 'error', processing}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent><Typography>{message}</Typography></DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={processing}>
                    {processing ? <LinearProgress size={16}/> : 'Confirm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Filter component ─────────────────────────────────────────────────────────
export function FailedJobFilter({filters, setFilters, queues}) {
    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{p: 2}}>
            <TextField
                size="small"
                label="Search"
                value={filters.search ?? ''}
                onChange={e => setFilters({...filters, search: e.target.value})}
                sx={{minWidth: 200}}
            />
            <FormControl size="small" sx={{minWidth: 180}}>
                <InputLabel>Queue</InputLabel>
                <Select
                    value={filters.queue ?? ''}
                    label="Queue"
                    onChange={e => setFilters({...filters, queue: e.target.value})}
                >
                    <MenuItem value="">All Queues</MenuItem>
                    {(queues || []).map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </Select>
            </FormControl>
        </Stack>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const FailedJobsIndex = () => {
    const {failedJobs, typeSummary, queues, requestInputs, canDelete, canRetry, success, status} = usePage().props;

    const [detailJob, setDetailJob]       = useState(null);
    const [deleteJob, setDeleteJob]       = useState(null);
    const [selectedUuids, setSelectedUuids] = useState([]);
    const [bulkRetryOpen, setBulkRetryOpen] = useState(false);
    const [bulkFlushOpen, setBulkFlushOpen] = useState(false);
    const [processing, setProcessing]     = useState(false);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('system.failed-jobs'), {
            data: {page, filters, sort, pageSize},
            only: ['failedJobs', 'requestInputs', 'typeSummary'],
        });
    }, []);

    const handleRetry = useCallback((uuid) => () => {
        router.post(route('system.failed-jobs.retry', uuid), {}, {
            onSuccess: () => router.reload({only: ['failedJobs', 'typeSummary']}),
        });
    }, []);

    const handleDelete = useCallback(() => {
        if (!deleteJob) return;
        router.delete(route('system.failed-jobs.destroy', deleteJob.uuid), {
            onSuccess: () => {
                setDeleteJob(null);
                router.reload({only: ['failedJobs', 'typeSummary']});
            },
        });
    }, [deleteJob]);

    const handleBulkRetry = useCallback(() => {
        setProcessing(true);
        router.post(route('system.failed-jobs.retryAll'), {uuids: selectedUuids}, {
            onFinish: () => {
                setProcessing(false);
                setBulkRetryOpen(false);
                setSelectedUuids([]);
                router.reload({only: ['failedJobs', 'typeSummary']});
            },
        });
    }, [selectedUuids]);

    const handleBulkFlush = useCallback(() => {
        setProcessing(true);
        router.post(route('system.failed-jobs.flush'), {uuids: selectedUuids}, {
            onFinish: () => {
                setProcessing(false);
                setBulkFlushOpen(false);
                setSelectedUuids([]);
                router.reload({only: ['failedJobs', 'typeSummary']});
            },
        });
    }, [selectedUuids]);

    const columns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            width: 70,
            type: 'number',
        },
        {
            field: 'display_name',
            headerName: 'Job Type',
            width: 280,
            renderCell: ({value}) => {
                const short = value?.split('\\').pop() ?? value;
                return (
                    <Tooltip title={value} arrow>
                        <Chip label={short} size="small" color="error" variant="outlined" sx={{maxWidth: 260}}/>
                    </Tooltip>
                );
            },
        },
        {
            field: 'queue',
            headerName: 'Queue',
            width: 110,
            renderCell: ({value}) => <Chip label={value} size="small" variant="outlined"/>,
        },
        {
            field: 'exception',
            headerName: 'Error',
            flex: 1,
            minWidth: 260,
            renderCell: ({value}) => (
                <Typography variant="caption" color="error.main" noWrap title={value}>{value}</Typography>
            ),
        },
        {
            field: 'failed_at',
            headerName: 'Failed At',
            width: 165,
            renderCell: ({value}) => formatDate(value),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: 110,
            sortable: false,
            getActions: (params) => {
                const actions = [
                    <GridActionsCellItem
                        key="detail"
                        icon={<InfoOutlinedIcon/>}
                        label="View Details"
                        onClick={() => setDetailJob(params.row)}
                        showInMenu={false}
                    />,
                ];
                if (canRetry) {
                    actions.push(
                        <GridActionsCellItem
                            key="retry"
                            icon={<ReplayIcon color="primary"/>}
                            label="Retry"
                            onClick={handleRetry(params.row.uuid)}
                            showInMenu={false}
                        />
                    );
                }
                if (canDelete) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon color="error"/>}
                            label="Delete"
                            onClick={() => setDeleteJob(params.row)}
                            showInMenu={false}
                        />
                    );
                }
                return actions;
            },
        },
    ], [canRetry, canDelete, handleRetry]);

    const bulkLabel = selectedUuids.length > 0 ? `${selectedUuids.length} selected` : `All (${failedJobs?.total ?? 0})`;

    return (
        <>
            <PageHeader
                title={
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        Failed Jobs
                        {failedJobs?.total > 0 && (
                            <Chip label={failedJobs.total} color="error" size="small"/>
                        )}
                    </Box>
                }
                actions={
                    <Stack direction="row" spacing={1}>
                        {canRetry && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<ReplayCircleFilledIcon/>}
                                onClick={() => setBulkRetryOpen(true)}
                                disabled={failedJobs?.total === 0}
                            >
                                Retry {bulkLabel}
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteSweepIcon/>}
                                onClick={() => setBulkFlushOpen(true)}
                                disabled={failedJobs?.total === 0}
                            >
                                Delete {bulkLabel}
                            </Button>
                        )}
                    </Stack>
                }
            />

            <Box sx={{px: 2, pb: 1}}>
                <TypeSummaryBar typeSummary={typeSummary}/>
            </Box>

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={failedJobs}
                reload={pageReload}
                Filter={(props) => <FailedJobFilter {...props} queues={queues}/>}
                success={success}
                status={status}
                checkboxSelection
                onRowSelectionModelChange={(ids) => {
                    // ids are row IDs — map to UUIDs
                    const items = failedJobs?.data ?? [];
                    setSelectedUuids(items.filter(j => ids.includes(j.id)).map(j => j.uuid));
                }}
            />

            {/* Detail dialog */}
            <ExceptionDialog
                open={Boolean(detailJob)}
                onClose={() => setDetailJob(null)}
                job={detailJob}
            />

            {/* Single delete confirm */}
            <DeleteForm
                title={`Failed Job #${deleteJob?.id ?? ''}`}
                agreeCB={handleDelete}
                disAgreeCB={() => setDeleteJob(null)}
                openDelete={Boolean(deleteJob)}
            />

            {/* Bulk retry */}
            <BulkConfirmDialog
                open={bulkRetryOpen}
                onClose={() => setBulkRetryOpen(false)}
                onConfirm={handleBulkRetry}
                title="Retry Failed Jobs"
                message={`Re-queue ${bulkLabel} for retry?`}
                confirmColor="primary"
                processing={processing}
            />

            {/* Bulk delete */}
            <BulkConfirmDialog
                open={bulkFlushOpen}
                onClose={() => setBulkFlushOpen(false)}
                onConfirm={handleBulkFlush}
                title="Delete Failed Jobs"
                message={`Permanently delete ${bulkLabel}? This cannot be undone.`}
                confirmColor="error"
                processing={processing}
            />
        </>
    );
};

FailedJobsIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {title: 'System', link: null, icon: null},
            {title: 'Failed Jobs', link: null, icon: null},
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default FailedJobsIndex;
