import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Chip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import { formatDate, formatMoney } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import ContractFilter from './Components/Filter';

const ContractIndex = () => {
    const { contracts, employmentTypes, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);

    const Filter = useCallback(
        (props) => <ContractFilter {...props} employmentTypes={employmentTypes} />,
        [employmentTypes],
    );

    const findContract = useCallback(
        (id) => contracts.data.find((contract) => contract.id === id) ?? { id },
        [contracts.data],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedContract(findContract(id));
            setOpenDeleteForm(true);
        },
        [findContract],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedContract(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedContract?.id) return;
        return router.post(
            route('payroll.contracts.destroy', selectedContract.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedContract, handleCloseForm]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('payroll.contracts.index'), {
            data: { page, filters, sort, pageSize },
            only: ['contracts', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'user',
                headerName: 'Person',
                flex: 1,
                sortable: false,
                renderCell: (params) => (
                    <Typography sx={{ fontWeight: 500 }}>{params.value?.name}</Typography>
                ),
            },
            {
                field: 'position',
                headerName: 'Position',
                flex: 0.8,
                sortable: false,
                renderCell: (params) => params.value || '—',
            },
            {
                field: 'employment_type',
                headerName: 'Employment',
                flex: 0.6,
                sortable: false,
                renderCell: (params) => params.row.employment_type_label,
            },
            {
                field: 'base_salary',
                headerName: 'Salary',
                flex: 0.5,
                renderCell: (params) => formatMoney(params.value),
            },
            {
                field: 'start_date',
                headerName: 'Period',
                flex: 0.9,
                renderCell: (params) =>
                    // An open-ended contract has no end date to print.
                    `${formatDate(params.value)} → ${
                        params.row.end_date ? formatDate(params.row.end_date) : 'open'
                    }`,
            },
            {
                field: 'is_current',
                headerName: 'Status',
                flex: 0.4,
                sortable: false,
                renderCell: (params) =>
                    params.value ? (
                        <Chip label="Running" size="small" color="success" variant="outlined" />
                    ) : (
                        <Chip label="Not current" size="small" variant="outlined" />
                    ),
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                sortable: false,
                width: 100,
                getActions: (params) => [
                    <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={() =>
                            router.visit(route('payroll.contracts.edit', params.row.id))
                        }
                        showInMenu
                    />,
                    <GridActionsCellItem
                        key={`slip-${params.row.id}`}
                        icon={<ReceiptLongIcon />}
                        label="Salary slip"
                        onClick={() =>
                            router.visit(
                                route('payroll.salary-slips.index', {
                                    user_id: params.row.user?.id,
                                }),
                            )
                        }
                        showInMenu
                    />,
                    <GridActionsCellItem
                        key={`delete-${params.row.id}`}
                        icon={<DeleteIcon color="error" />}
                        label="Delete"
                        onClick={handleDelete(params.row.id)}
                        showInMenu
                    />,
                ],
            },
        ],
        [handleDelete],
    );

    return (
        <>
            <Head title="Contracts" />
            <PageHeader
                title="Contracts"
                subtitle="What each person is employed on — pay, period and leave allowance"
                actions={
                    <Button
                        onClick={() => router.visit(route('payroll.contracts.create'))}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                    >
                        New Contract
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={contracts}
                Filter={Filter}
                errors={errors}
                autoHeight
                disableSelectionOnClick
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete contract: ${selectedContract?.user?.name || ''}`}
                    message="The contract and its leave allowance go with it. To end a contract instead, set its end date."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Contracts', link: null, icon: null },
];

ContractIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default ContractIndex;
