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
import ActiveFilter from '@/Pages/Attendance/Shifts/Components/Filter';
import LeaveKindForm from './Components/LeaveKindForm';

const Filter = (props) => <ActiveFilter {...props} searchHelp="Leave kind name" />;

const LeaveKindIndex = () => {
    const { kinds, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openKindForm, setOpenKindForm] = useState(false);
    const [selectedKind, setSelectedKind] = useState(null);

    const findKind = useCallback(
        (id) => kinds.data.find((kind) => kind.id === id) ?? { id },
        [kinds.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedKind({ ...findKind(id), _method: 'put' });
            setOpenKindForm(true);
        },
        [findKind],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedKind(findKind(id));
            setOpenDeleteForm(true);
        },
        [findKind],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedKind(null);
        setOpenKindForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedKind?.id) return;
        return router.post(
            route('attendance.leave-kinds.destroy', selectedKind.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedKind, handleCloseForm]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.leave-kinds.index'), {
            data: { page, filters, sort, pageSize },
            only: ['kinds', 'status', 'success', 'requestInputs'],
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
            <Head title="Leave Kinds" />
            <PageHeader
                title="Leave Kinds"
                subtitle="The kinds of leave people can ask for"
                actions={
                    <Button
                        onClick={() => {
                            setSelectedKind(null);
                            setOpenKindForm(true);
                        }}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                    >
                        Add Leave Kind
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={kinds}
                Filter={Filter}
                errors={errors}
                autoHeight
                disableSelectionOnClick
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete leave kind: ${selectedKind?.name || ''}`}
                    message="A kind already used by leave requests can only be marked inactive."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openKindForm && (
                <LeaveKindForm
                    open={openKindForm}
                    defaultValue={selectedKind}
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
        title: 'Leave Kinds',
        link: null,
        icon: null,
    },
];

LeaveKindIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default LeaveKindIndex;
