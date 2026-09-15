import { useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Chip, Tooltip, Typography } from '@mui/material';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';

export const UserCell = ({ user }) =>
    user ? (
        <Typography variant="body2">{user.name}</Typography>
    ) : (
        <Tooltip title="No user has this attendance number. Set it on the person's user page.">
            <Chip size="small" color="warning" variant="outlined" label="Unmatched" />
        </Tooltip>
    );

const TransactionIndex = () => {
    const { transactions, status, errors, success, requestInputs } = usePage().props;

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.transactions.index'), {
            data: { page, filters, sort, pageSize },
            only: ['transactions', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'access_date_and_time',
                headerName: 'Punched At',
                type: 'string',
                flex: 0.7,
                renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'attendance_id',
                headerName: 'Employee ID',
                type: 'string',
                flex: 0.5,
                sortable: false,
                renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'user',
                headerName: 'User',
                flex: 1,
                sortable: false,
                renderCell: (params) => <UserCell user={params.value} />,
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Punches" />
            <PageHeader
                title="Punches"
                subtitle="Door punches written by HikCentral. First and last punch of a day become check-in and check-out."
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={transactions}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="compact"
                disableSelectionOnClick
            />
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
        title: 'Punches',
        link: null,
        icon: null,
    },
];

TransactionIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default TransactionIndex;
