import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Chip, Stack, Typography } from '@mui/material';
import { RemoveRedEye, PauseCircle } from '@mui/icons-material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import QueueFilter from './Components/QueueFilter';
import { OWNER_LABEL, ageColor, daysSince, ownerColor, patientName } from './Components/stage';

const Index = () => {
    const { preOrders, stages = [], requestInputs, status, success } = usePage().props;
    const [loading, setLoading] = useState(false);
    const stageLabel = Object.fromEntries(stages.map((s) => [s.value, s.label]));
    const open = (id) => router.visit(route('pre-orders.show', id));

    const columns = [
        {
            field: 'code',
            headerName: 'Pre-order',
            width: 130,
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" fontWeight={600}>
                        {row.code}
                    </Typography>
                    {row.exception && (
                        <PauseCircle fontSize="small" color="warning" titleAccess="On hold" />
                    )}
                </Stack>
            ),
        },
        {
            field: 'patient',
            headerName: 'Patient',
            flex: 1,
            sortable: false,
            valueGetter: (_, row) => patientName(row, row.main_patient_ref),
        },
        {
            field: 'referrer',
            headerName: 'Center',
            flex: 1,
            sortable: false,
            valueGetter: (_, row) => row.referrer?.fullName ?? '—',
        },
        {
            field: 'main_test',
            headerName: 'Main test',
            flex: 0.8,
            sortable: false,
            valueGetter: (_, row) => row.main_test?.name ?? 'Not chosen',
        },
        {
            field: 'stage',
            headerName: 'Stage',
            flex: 1.2,
            renderCell: ({ row }) => (
                <Chip size="small" variant="outlined" label={stageLabel[row.stage] ?? row.stage} />
            ),
        },
        {
            field: 'action_owner',
            headerName: 'Waiting on',
            width: 110,
            renderCell: ({ row }) => (
                <Chip
                    size="small"
                    color={ownerColor(row.action_owner)}
                    label={OWNER_LABEL[row.action_owner]}
                />
            ),
        },
        {
            field: 'assignee',
            headerName: 'Counsellor',
            flex: 0.8,
            sortable: false,
            valueGetter: (_, row) => row.assignee?.name ?? 'Unassigned',
        },
        {
            field: 'stage_entered_at',
            headerName: 'Days in stage',
            width: 120,
            renderCell: ({ row }) => {
                const days = daysSince(row.stage_entered_at);
                return <Chip size="small" color={ageColor(days)} label={days ?? '—'} />;
            },
        },
        {
            field: 'id',
            headerName: '',
            type: 'actions',
            width: 60,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="open"
                    icon={<RemoveRedEye />}
                    label="Open"
                    onClick={() => open(row.id)}
                />,
            ],
        },
    ];

    const reload = (page, filters, sort, pageSize) => {
        setLoading(true);
        router.visit(route('pre-orders.index'), {
            data: { page, filters, sort, pageSize },
            only: ['preOrders', 'requestInputs', 'status', 'success'],
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Pre-orders" />
            <TableLayout
                title="Pre-orders"
                defaultValues={requestInputs}
                columns={columns}
                data={preOrders}
                reload={reload}
                Filter={QueueFilter}
                loading={loading}
                status={status}
                success={success}
                onRowDoubleClick={({ row }) => open(row.id)}
            />
        </>
    );
};

const breadCrumbs = [{ title: 'Pre-orders', link: null, icon: null }];

Index.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Index;
