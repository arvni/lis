import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Tab, Tabs, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import LeaveRequestForm from './Components/LeaveRequestForm';
import LeaveRequestDetails from './Components/LeaveRequestDetails';
import { LEAVE_STATUS_COLORS, currentStepLabel, formatLeavePeriod } from './leaveFormat';

const SCOPES = [
    { value: 'mine', label: 'My requests' },
    { value: 'approvals', label: 'Awaiting my approval' },
    { value: 'all', label: 'All requests', managersOnly: true },
];

const LeaveRequestIndex = () => {
    const { requests, kinds, canManage, status, errors, success, requestInputs } = usePage().props;

    const scopes = SCOPES.filter((scope) => !scope.managersOnly || canManage);
    const requestedScope = requestInputs?.filters?.scope ?? 'mine';
    const scope = scopes.some((option) => option.value === requestedScope) ? requestedScope : 'mine';

    const [openForm, setOpenForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    // Read from the latest props, so the details dialog shows a decision as soon as the page reloads.
    const selected = useMemo(
        () => requests.data.find((leave) => leave.id === selectedId) ?? null,
        [requests.data, selectedId],
    );

    const handleScopeChange = useCallback((_, value) => {
        router.visit(route('attendance.leave-requests.index'), { data: { filters: { scope: value } } });
    }, []);

    const handlePageReload = useCallback(
        (page, filters, sort, pageSize) => {
            router.visit(route('attendance.leave-requests.index'), {
                data: { page, filters: { ...filters, scope }, sort, pageSize },
                only: ['requests', 'status', 'success', 'requestInputs'],
            });
        },
        [scope],
    );

    const columns = useMemo(
        () => [
            {
                field: 'user',
                headerName: 'Person',
                flex: 0.9,
                sortable: false,
                renderCell: (params) => (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {params.value?.name}
                        </Typography>
                        {params.row.requested_by &&
                            params.row.requested_by.id !== params.value?.id && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Entered by {params.row.requested_by.name}
                                </Typography>
                            )}
                    </Box>
                ),
            },
            {
                field: 'kind',
                headerName: 'Kind',
                flex: 0.5,
                sortable: false,
                renderCell: (params) => params.value?.name,
            },
            {
                field: 'start_date',
                headerName: 'When',
                flex: 1,
                renderCell: (params) => (
                    <Box>
                        <Typography variant="body2">{formatLeavePeriod(params.row)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {params.row.type_label}
                        </Typography>
                    </Box>
                ),
            },
            {
                field: 'status',
                headerName: 'Status',
                flex: 1,
                sortable: false,
                renderCell: (params) => (
                    <Box>
                        <Chip
                            size="small"
                            color={LEAVE_STATUS_COLORS[params.value] ?? 'default'}
                            label={params.row.status_label}
                        />
                        {params.value === 'PENDING' && (
                            <Typography
                                variant="caption"
                                sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}
                            >
                                {currentStepLabel(params.row)}
                            </Typography>
                        )}
                    </Box>
                ),
            },
            {
                field: 'created_at',
                headerName: 'Requested',
                flex: 0.6,
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                width: 90,
                getActions: (params) => [
                    <GridActionsCellItem
                        key={`view-${params.row.id}`}
                        icon={<VisibilityIcon />}
                        label="View"
                        onClick={() => setSelectedId(params.row.id)}
                    />,
                ],
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Leave Requests" />
            <PageHeader
                title="Leave Requests"
                subtitle="Full days or hours off, approved step by step"
                actions={
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        color="success"
                        onClick={() => setOpenForm(true)}
                    >
                        Request leave
                    </Button>
                }
            />

            <Tabs value={scope} onChange={handleScopeChange} sx={{ mb: 2 }}>
                {scopes.map((option) => (
                    <Tab key={option.value} value={option.value} label={option.label} />
                ))}
            </Tabs>

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={requests}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
            />

            {openForm && (
                <LeaveRequestForm
                    open={openForm}
                    kinds={kinds}
                    canManage={canManage}
                    onClose={() => setOpenForm(false)}
                />
            )}

            {selected && (
                <LeaveRequestDetails leave={selected} onClose={() => setSelectedId(null)} />
            )}
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Leave Requests',
        link: null,
        icon: null,
    },
];

LeaveRequestIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default LeaveRequestIndex;
