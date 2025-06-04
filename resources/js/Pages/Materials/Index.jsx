import {useCallback, useMemo, useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {Button,} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";

const MaterialsIndex = () => {
    const {materials, status, errors, success, requestInputs} = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Memoize the findMaterial function to avoid recreating it on every render
    const findMaterial = useCallback((id) => {
        return materials.data.find((material) => material.id === id) ?? {id};
    }, [materials.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditMaterial = useCallback((id) => () => {
        setSelectedMaterial({...findMaterial(id), _method: "put"});
        setOpenAddForm(true);
    }, [findMaterial]);

    const handleDeleteMaterial = useCallback((id) => () => {
        setSelectedMaterial(findMaterial(id));
        setOpenDeleteForm(true);
    }, [findMaterial]);

    const handleCloseForm = useCallback(() => {
        setSelectedMaterial(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedMaterial?.id) return;
        return router.post(
            route('materials.destroy', selectedMaterial.id),
            {_method: "delete"},
            {onSuccess: handleCloseForm}
        );
    }, [selectedMaterial, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedMaterial(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('materials.index'), {
            data: {page, filters, sort, pageSize},
            only: ["materials", "status", "success", "requestInputs"]
        });
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() => [
        {
            field: 'sample_type_name',
            headerName: 'Kit Type',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'barcode',
            headerName: 'Barcode',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'packing_series',
            headerName: 'Packing Series',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'tube_barcode',
            headerName: 'Tube Barcode',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'expire_date',
            headerName: 'Tube Expire Date',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'referrerـfullname',
            headerName: 'Assigned to',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'assigned_at',
            headerName: 'Assigned At',
            type: "string",
            width: 200,
            flex: 1,
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            width: 100,
            getActions: (params) => {
                return [
                    <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon/>}
                        label="Edit"
                        onClick={handleEditMaterial(params.row.id)}
                        showInMenu
                    />
                ];
            }
        }
    ], [
        handleEditMaterial,
        handleDeleteMaterial,
    ]);

    return (
        <>
            <PageHeader
                title="Materials Management"
                subtitle="Create and manage discount materials for tests and referrals"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon/>}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Create New Material
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={materials}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{
                    '& .MuiDataGrid-cell': {
                        py: 1.5
                    }
                }}
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete Material: ${selectedMaterial?.name || ''}`}
                    message="Are you sure you want to delete this material? This action cannot be undone."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedMaterial}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Dashboard",
        link: route("dashboard"),
        icon: null
    },
    {
        title: "Materials",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
MaterialsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default MaterialsIndex;
