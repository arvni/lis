import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Button} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader";
import Filter from "@/Pages/BarcodeGroup/Components/Filter";
import AddForm from "@/Pages/BarcodeGroup/Components/AddForm";

const BarcodeGroupsIndex = () => {
    const {barcodeGroups, status, errors, success, requestInputs} = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedBarcodeGroup, setSelectedBarcodeGroup] = useState(null);

    // Memoize the findBarcodeGroup function to avoid recreating it on every render
    const findBarcodeGroup = useCallback((id) => {
        return barcodeGroups.data.find((group) => group.id === id) ?? {id};
    }, [barcodeGroups.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditBarcodeGroup = useCallback((id) => () => {
        setSelectedBarcodeGroup({...findBarcodeGroup(id), _method: 'put'});
        setOpenAddForm(true);
    }, [findBarcodeGroup]);

    const handleDeleteBarcodeGroup = useCallback((id) => () => {
        setSelectedBarcodeGroup(findBarcodeGroup(id));
        setOpenDeleteForm(true);
    }, [findBarcodeGroup]);

    const handleCloseForm = useCallback(() => {
        setSelectedBarcodeGroup(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedBarcodeGroup) return;

        router.post(
            route('barcodeGroups.destroy', selectedBarcodeGroup.id),
            {_method: "delete"},
            {onSuccess: handleCloseForm}
        );
    }, [selectedBarcodeGroup, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedBarcodeGroup(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('barcodeGroups.index'), {
            data: {page, filters, sort, pageSize},
            only: ["barcodeGroups", "status", "success", "requestInputs"]
        });
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: 200,
            flex: 1
        },
        {
            field: 'abbr',
            headerName: 'Abbreviation',
            type: "string",
            width: 150
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            width: 100,
            getActions: (params) => {
                const actions = [
                    <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon/>}
                        label="Edit"
                        onClick={handleEditBarcodeGroup(params.row.id)}
                        showInMenu
                    />
                ];

                if (params.row.methods_count < 1) {
                    actions.push(
                        <GridActionsCellItem
                            key={`delete-${params.row.id}`}
                            icon={<DeleteIcon/>}
                            label="Delete"
                            showInMenu
                            onClick={handleDeleteBarcodeGroup(params.row.id)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [handleEditBarcodeGroup, handleDeleteBarcodeGroup]);

    return (
        <>
            <PageHeader
                title="Barcode Groups List"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon/>}
                        variant="contained"
                        color="success"
                    >
                        Add New
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={barcodeGroups}
                Filter={Filter}
                errors={errors}
            />
            {openDeleteForm && <DeleteForm
                title={`${selectedBarcodeGroup.name || ''} Barcode Group`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseForm}
                openDelete={openDeleteForm}
            />}
            {openAddForm && <AddForm
                open={openAddForm}
                defaultValue={selectedBarcodeGroup}
                onClose={handleCloseForm}
            />}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Barcode Groups",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
BarcodeGroupsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default BarcodeGroupsIndex;
