import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import { RemoveRedEye } from '@mui/icons-material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import FinanceFilter from './Components/FinanceFilter';
import { FINANCE_COLOR } from './Components/FinanceTab';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

/** The finance desk: every quotation, open ones first, with the center's decision. */
const Finance = () => {
    const { quotations, requestInputs, status, success } = usePage().props;
    const [loading, setLoading] = useState(false);
    const open = (row) => router.visit(route('pre-orders.show', row.pre_order_id));

    const columns = [
        { field: 'number', headerName: 'Quotation', width: 150 },
        {
            field: 'pre_order',
            headerName: 'Pre-order',
            width: 130,
            sortable: false,
            valueGetter: (_, row) => row.pre_order?.code,
        },
        {
            field: 'center',
            headerName: 'Center',
            flex: 1,
            sortable: false,
            valueGetter: (_, row) => row.pre_order?.referrer?.fullName ?? '—',
        },
        {
            field: 'main_test',
            headerName: 'Main test',
            flex: 0.8,
            sortable: false,
            valueGetter: (_, row) =>
                row.request
                    ? `Request R${row.request.number}`
                    : (row.pre_order?.main_test?.name ?? '—'),
        },
        { field: 'total', headerName: 'Total', width: 110, align: 'right', headerAlign: 'right' },
        {
            field: 'approved_amount',
            headerName: 'Approved',
            width: 110,
            align: 'right',
            headerAlign: 'right',
            valueGetter: (_, row) => row.approved_amount ?? '—',
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 170,
            renderCell: ({ row }) => (
                <Chip
                    size="small"
                    color={FINANCE_COLOR[row.status] ?? 'default'}
                    label={row.status.replaceAll('_', ' ')}
                />
            ),
        },
        {
            field: 'expires_at',
            headerName: 'Valid until',
            width: 110,
            valueGetter: (_, row) => fmt(row.expires_at),
        },
        {
            field: 'decided_at',
            headerName: 'Decided',
            width: 110,
            valueGetter: (_, row) => fmt(row.decided_at),
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
                    onClick={() => open(row)}
                />,
            ],
        },
    ];

    const reload = (page, filters, sort, pageSize) => {
        setLoading(true);
        router.visit(route('pre-orders.finance'), {
            data: { page, filters, sort, pageSize },
            only: ['quotations', 'requestInputs', 'status', 'success'],
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Finance desk" />
            <TableLayout
                title="Finance desk"
                defaultValues={requestInputs}
                columns={columns}
                data={quotations}
                reload={reload}
                Filter={FinanceFilter}
                loading={loading}
                status={status}
                success={success}
                onRowDoubleClick={({ row }) => open(row)}
            />
        </>
    );
};

Finance.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Pre-orders', link: route('pre-orders.index'), icon: null },
            { title: 'Finance desk', link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Finance;
