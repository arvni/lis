import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Chip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import { formatDate, formatMoney } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import SlipFilter from './Components/Filter';
import GenerateSlipForm from './Components/GenerateSlipForm';

const monthLabel = (from) =>
    new Date(from).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const SalarySlipIndex = () => {
    const { slips, statuses, canViewAll, canManage, status, errors, success, requestInputs } =
        usePage().props;

    const [openGenerate, setOpenGenerate] = useState(false);

    const Filter = useCallback(
        (props) => <SlipFilter {...props} statuses={statuses} canViewAll={canViewAll} />,
        [statuses, canViewAll],
    );

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('payroll.salary-slips.index'), {
            data: { page, filters, sort, pageSize },
            only: ['slips', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () =>
            [
                canViewAll && {
                    field: 'person',
                    headerName: 'Person',
                    flex: 0.8,
                    sortable: false,
                    renderCell: (params) => (
                        <Typography sx={{ fontWeight: 500 }}>{params.value?.name}</Typography>
                    ),
                },
                {
                    field: 'from',
                    headerName: 'Month',
                    flex: 0.7,
                    renderCell: (params) => monthLabel(params.value),
                },
                {
                    field: 'number',
                    headerName: 'Number',
                    flex: 0.6,
                    sortable: false,
                    // A draft has no number yet: one is given out when the slip is issued.
                    renderCell: (params) => params.value || '—',
                },
                {
                    field: 'status',
                    headerName: 'Status',
                    flex: 0.5,
                    renderCell: (params) => (
                        <Chip
                            label={params.row.status_label}
                            size="small"
                            color={params.value === 'ISSUED' ? 'success' : 'default'}
                            variant="outlined"
                        />
                    ),
                },
                {
                    field: 'net',
                    headerName: 'Net (OMR)',
                    flex: 0.6,
                    renderCell: (params) => formatMoney(params.value),
                },
                {
                    field: 'issued_at',
                    headerName: 'Issued',
                    flex: 0.6,
                    sortable: false,
                    renderCell: (params) => (params.value ? formatDate(params.value) : '—'),
                },
                {
                    field: 'id',
                    headerName: 'Actions',
                    type: 'actions',
                    sortable: false,
                    width: 80,
                    getActions: (params) => [
                        <GridActionsCellItem
                            key={`open-${params.row.id}`}
                            icon={<VisibilityIcon />}
                            label="Open"
                            onClick={() =>
                                router.visit(route('payroll.salary-slips.show', params.row.id))
                            }
                            showInMenu
                        />,
                    ],
                },
            ].filter(Boolean),
        [canViewAll],
    );

    return (
        <>
            <Head title="Salary Slips" />
            <PageHeader
                title="Salary Slips"
                subtitle={
                    canViewAll
                        ? 'Prepared from the contract and the month’s attendance, then issued'
                        : 'The salary slips issued to you'
                }
                actions={
                    canManage && (
                        <Button
                            onClick={() => setOpenGenerate(true)}
                            startIcon={<AddIcon />}
                            color="success"
                            variant="contained"
                        >
                            Generate
                        </Button>
                    )
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={slips}
                Filter={Filter}
                errors={errors}
                autoHeight
                disableSelectionOnClick
            />

            {openGenerate && (
                <GenerateSlipForm open={openGenerate} onClose={() => setOpenGenerate(false)} />
            )}
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Salary Slips', link: null, icon: null },
];

SalarySlipIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default SalarySlipIndex;
