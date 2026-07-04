import React, { useState, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteForm from '@/Components/DeleteForm';
import Filter from './Components/Filter';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarView from './Index/CalendarView';
import { buildColumns } from './Index/columns';

const CollectRequestsIndex = () => {
    const { collectRequests, status, success, requestInputs, calendarEvents, calendarMonth } =
        usePage().props;

    const [collectRequest, setCollectRequest] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    const showCollectRequest = useCallback(
        (id) => (e) => {
            e.preventDefault();
            e.stopPropagation();
            router.visit(route('collect-requests.show', id));
        },
        [],
    );

    const editCollectRequest = useCallback(
        (id) => (e) => {
            e.preventDefault();
            e.stopPropagation();
            router.visit(route('collect-requests.edit', id));
        },
        [],
    );

    const deleteCollectRequest = useCallback(
        (params) => () => {
            setCollectRequest(params);
            setOpenDeleteForm(true);
        },
        [],
    );

    const addCollectRequest = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('collect-requests.create'));
    }, []);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('collect-requests.index'), {
            data: { page, filters, sort, pageSize },
            only: ['collectRequests', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const handleMonthChange = useCallback(
        (month) => {
            router.visit(route('collect-requests.index'), {
                data: { ...requestInputs, calendar_month: month },
                only: ['calendarEvents', 'calendarMonth'],
                preserveState: true,
            });
        },
        [requestInputs],
    );

    const handleCloseDeleteForm = useCallback(() => {
        setCollectRequest(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(async () => {
        if (collectRequest) {
            router.post(
                route('collect-requests.destroy', collectRequest.id),
                { _method: 'delete' },
                { onSuccess: handleCloseDeleteForm },
            );
        }
    }, [collectRequest, handleCloseDeleteForm]);

    const columns = useMemo(
        () => buildColumns({ showCollectRequest, editCollectRequest, deleteCollectRequest }),
        [showCollectRequest, editCollectRequest, deleteCollectRequest],
    );

    return (
        <>
            <Head title="Collect Requests" />
            <PageHeader
                title="Collect Requests"
                actions={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, v) => v && setViewMode(v)}
                            size="small"
                        >
                            <ToggleButton value="list">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="calendar">
                                <CalendarMonthIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <Button
                            color="success"
                            href={route('collect-requests.create')}
                            onClick={addCollectRequest}
                            variant="contained"
                            startIcon={<AddIcon />}
                        >
                            Add Collect Request
                        </Button>
                    </Box>
                }
            />

            {viewMode === 'calendar' ? (
                <Box sx={{ px: 2, pb: 2 }}>
                    <CalendarView
                        calendarEvents={calendarEvents}
                        calendarMonth={calendarMonth}
                        onMonthChange={handleMonthChange}
                    />
                </Box>
            ) : (
                <TableLayout
                    defaultValues={requestInputs}
                    columns={columns}
                    data={collectRequests}
                    reload={pageReload}
                    Filter={Filter}
                    success={success}
                    status={status}
                >
                    <DeleteForm
                        title={`Collect Request #${collectRequest?.id ?? ''}`}
                        agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}
                    />
                </TableLayout>
            )}
        </>
    );
};

CollectRequestsIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[{ title: 'Collect Requests', link: null, icon: null }]}
    >
        {page}
    </AuthenticatedLayout>
);

export default CollectRequestsIndex;
