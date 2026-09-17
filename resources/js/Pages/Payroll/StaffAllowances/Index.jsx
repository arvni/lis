import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Chip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import { formatDate, formatMoney } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import StaffAllowanceFilter from './Components/Filter';
import StaffAllowanceForm from './Components/StaffAllowanceForm';

/** What the item is worth, said the way its own shape is written. */
const describeAmount = (row) => {
    if (row.calculation === 'FIXED') return `${formatMoney(row.amount)} / month`;
    if (row.calculation === 'PERCENTAGE') return `${parseFloat(row.percentage)}% of basic`;

    return `${formatMoney(row.total_amount)} over ${row.installments}`;
};

const StaffAllowanceIndex = () => {
    const { items, itemTypes, calculations, status, errors, success, requestInputs } =
        usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openItemForm, setOpenItemForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const Filter = useCallback(
        (props) => (
            <StaffAllowanceFilter {...props} calculations={calculations} itemTypes={itemTypes} />
        ),
        [calculations, itemTypes],
    );

    const findItem = useCallback(
        (id) => items.data.find((item) => item.id === id) ?? { id },
        [items.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedItem({ ...findItem(id), _method: 'put' });
            setOpenItemForm(true);
        },
        [findItem],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedItem(findItem(id));
            setOpenDeleteForm(true);
        },
        [findItem],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedItem(null);
        setOpenItemForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedItem?.id) return;
        return router.post(
            route('payroll.staff-allowances.destroy', selectedItem.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedItem, handleCloseForm]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('payroll.staff-allowances.index'), {
            data: { page, filters, sort, pageSize },
            only: ['items', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'user',
                headerName: 'Person',
                flex: 0.8,
                sortable: false,
                renderCell: (params) => (
                    <Typography sx={{ fontWeight: 500 }}>{params.value?.name}</Typography>
                ),
            },
            {
                field: 'type',
                headerName: 'Item',
                flex: 0.8,
                sortable: false,
                renderCell: (params) => (
                    <>
                        {params.value}{' '}
                        <Chip
                            label={params.row.kind_label}
                            size="small"
                            color={params.row.kind === 'DEDUCTION' ? 'warning' : 'info'}
                            variant="outlined"
                            sx={{ ml: 1 }}
                        />
                    </>
                ),
            },
            {
                field: 'calculation',
                headerName: 'Worked out',
                flex: 0.6,
                renderCell: (params) => params.row.calculation_label,
            },
            {
                field: 'amount',
                headerName: 'Amount',
                flex: 0.7,
                sortable: false,
                renderCell: (params) => describeAmount(params.row),
            },
            {
                field: 'start_date',
                headerName: 'Period',
                flex: 0.8,
                renderCell: (params) =>
                    // An instalment plan ends when it is paid off, so it prints no end date.
                    `${formatDate(params.value)} → ${
                        params.row.calculation === 'INSTALLMENTS'
                            ? 'until paid off'
                            : (params.row.end_date && formatDate(params.row.end_date)) || 'open'
                    }`,
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
                        onClick={handleEdit(params.row.id)}
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
        [handleEdit, handleDelete],
    );

    return (
        <>
            <Head title="Staff Allowances" />
            <PageHeader
                title="Staff Allowances"
                subtitle="What each person is paid or owes month after month — kept with the person, not the contract"
                actions={
                    <Button
                        onClick={() => {
                            setSelectedItem(null);
                            setOpenItemForm(true);
                        }}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                    >
                        Add
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={items}
                Filter={Filter}
                errors={errors}
                autoHeight
                disableSelectionOnClick
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Remove: ${selectedItem?.type || ''}`}
                    message="It stops appearing on future salary slips. Slips already printed are unaffected."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openItemForm && (
                <StaffAllowanceForm
                    open={openItemForm}
                    defaultValue={selectedItem}
                    itemTypes={itemTypes}
                    calculations={calculations}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Staff Allowances', link: null, icon: null },
];

StaffAllowanceIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default StaffAllowanceIndex;
