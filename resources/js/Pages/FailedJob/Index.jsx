import React, { useState, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Stack } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteForm from '@/Components/DeleteForm';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled';

import ExceptionDialog from './Index/ExceptionDialog';
import TypeSummaryBar from './Index/TypeSummaryBar';
import BulkConfirmDialog from './Index/BulkConfirmDialog';
import { FailedJobFilter } from './Index/FailedJobFilter';
import { buildColumns } from './Index/columns';

// Re-exported for backward compatibility (named export).
export { FailedJobFilter };

// ─── Main page ────────────────────────────────────────────────────────────────
const FailedJobsIndex = () => {
    const { failedJobs, typeSummary, queues, requestInputs, canDelete, canRetry, success, status } =
        usePage().props;

    const [detailJob, setDetailJob] = useState(null);
    const [deleteJob, setDeleteJob] = useState(null);
    const [selectedUuids, setSelectedUuids] = useState([]);
    const [bulkRetryOpen, setBulkRetryOpen] = useState(false);
    const [bulkFlushOpen, setBulkFlushOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('system.failed-jobs'), {
            data: { page, filters, sort, pageSize },
            only: ['failedJobs', 'requestInputs', 'typeSummary'],
        });
    }, []);

    const handleRetry = useCallback(
        (uuid) => () => {
            router.post(
                route('system.failed-jobs.retry', uuid),
                {},
                {
                    onSuccess: () => router.reload({ only: ['failedJobs', 'typeSummary'] }),
                },
            );
        },
        [],
    );

    const handleDelete = useCallback(() => {
        if (!deleteJob) return;
        router.delete(route('system.failed-jobs.destroy', deleteJob.uuid), {
            onSuccess: () => {
                setDeleteJob(null);
                router.reload({ only: ['failedJobs', 'typeSummary'] });
            },
        });
    }, [deleteJob]);

    const handleBulkRetry = useCallback(() => {
        setProcessing(true);
        router.post(
            route('system.failed-jobs.retryAll'),
            { uuids: selectedUuids },
            {
                onFinish: () => {
                    setProcessing(false);
                    setBulkRetryOpen(false);
                    setSelectedUuids([]);
                    router.reload({ only: ['failedJobs', 'typeSummary'] });
                },
            },
        );
    }, [selectedUuids]);

    const handleBulkFlush = useCallback(() => {
        setProcessing(true);
        router.post(
            route('system.failed-jobs.flush'),
            { uuids: selectedUuids },
            {
                onFinish: () => {
                    setProcessing(false);
                    setBulkFlushOpen(false);
                    setSelectedUuids([]);
                    router.reload({ only: ['failedJobs', 'typeSummary'] });
                },
            },
        );
    }, [selectedUuids]);

    const columns = useMemo(
        () =>
            buildColumns({
                canRetry,
                canDelete,
                handleRetry,
                onDetail: setDetailJob,
                onDelete: setDeleteJob,
            }),
        [canRetry, canDelete, handleRetry],
    );

    const bulkLabel =
        selectedUuids.length > 0
            ? `${selectedUuids.length} selected`
            : `All (${failedJobs?.total ?? 0})`;

    return (
        <>
            <Head title="Failed Jobs" />
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Failed Jobs
                        {failedJobs?.total > 0 && (
                            <Chip label={failedJobs.total} color="error" size="small" />
                        )}
                    </Box>
                }
                actions={
                    <Stack direction="row" spacing={1}>
                        {canRetry && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<ReplayCircleFilledIcon />}
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
                                startIcon={<DeleteSweepIcon />}
                                onClick={() => setBulkFlushOpen(true)}
                                disabled={failedJobs?.total === 0}
                            >
                                Delete {bulkLabel}
                            </Button>
                        )}
                    </Stack>
                }
            />

            <Box sx={{ px: 2, pb: 1 }}>
                <TypeSummaryBar typeSummary={typeSummary} />
            </Box>

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={failedJobs}
                reload={pageReload}
                Filter={(props) => <FailedJobFilter {...props} queues={queues} />}
                success={success}
                status={status}
                checkboxSelection
                onRowSelectionModelChange={(ids) => {
                    // ids are row IDs — map to UUIDs
                    const items = failedJobs?.data ?? [];
                    setSelectedUuids(items.filter((j) => ids.includes(j.id)).map((j) => j.uuid));
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
            { title: 'System', link: null, icon: null },
            { title: 'Failed Jobs', link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default FailedJobsIndex;
