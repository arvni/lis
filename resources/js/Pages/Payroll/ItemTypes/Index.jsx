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
import { formatMoney } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import ItemTypeFilter from './Components/Filter';
import ItemTypeForm from './Components/ItemTypeForm';

const ItemTypeIndex = () => {
    const { types, kinds, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openTypeForm, setOpenTypeForm] = useState(false);
    const [selectedType, setSelectedType] = useState(null);

    const Filter = useCallback((props) => <ItemTypeFilter {...props} kinds={kinds} />, [kinds]);

    const findType = useCallback(
        (id) => types.data.find((type) => type.id === id) ?? { id },
        [types.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedType({ ...findType(id), _method: 'put' });
            setOpenTypeForm(true);
        },
        [findType],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedType(findType(id));
            setOpenDeleteForm(true);
        },
        [findType],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedType(null);
        setOpenTypeForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedType?.id) return;
        return router.post(
            route('payroll.item-types.destroy', selectedType.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedType, handleCloseForm]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('payroll.item-types.index'), {
            data: { page, filters, sort, pageSize },
            only: ['types', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'name',
                headerName: 'Name',
                flex: 1,
                renderCell: (params) => (
                    <Typography sx={{ fontWeight: 500 }}>{params.value}</Typography>
                ),
            },
            {
                field: 'kind',
                headerName: 'Kind',
                flex: 0.5,
                renderCell: (params) => (
                    <Chip
                        label={params.row.kind_label}
                        size="small"
                        color={params.value === 'DEDUCTION' ? 'warning' : 'info'}
                        variant="outlined"
                    />
                ),
            },
            {
                field: 'default_amount',
                headerName: 'Default amount',
                flex: 0.5,
                sortable: true,
                // Blank when an item is worth something different for everyone.
                renderCell: (params) => (params.value === null ? '—' : formatMoney(params.value)),
            },
            {
                field: 'is_active',
                headerName: 'Status',
                flex: 0.4,
                renderCell: (params) =>
                    params.value ? (
                        <Chip label="Active" size="small" color="success" variant="outlined" />
                    ) : (
                        <Chip label="Inactive" size="small" variant="outlined" />
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
            <Head title="Allowances & Deductions" />
            <PageHeader
                title="Allowances & Deductions"
                subtitle="Defined once here, then added to the contracts that have them"
                actions={
                    <Button
                        onClick={() => {
                            setSelectedType(null);
                            setOpenTypeForm(true);
                        }}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                    >
                        Add Item
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={types}
                Filter={Filter}
                errors={errors}
                autoHeight
                disableSelectionOnClick
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete: ${selectedType?.name || ''}`}
                    message="An item already on a contract can only be marked inactive."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openTypeForm && (
                <ItemTypeForm
                    open={openTypeForm}
                    defaultValue={selectedType}
                    kinds={kinds}
                    onClose={handleCloseForm}
                />
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
        title: 'Allowances & Deductions',
        link: null,
        icon: null,
    },
];

ItemTypeIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default ItemTypeIndex;
