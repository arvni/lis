import { useState, useCallback, useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "@/Pages/SampleType/Components/Filter";
import AddForm from "@/Pages/SampleType/Components/AddForm";

const SampleTypesIndex = () => {
    const { sampleTypes, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedSampleType, setSelectedSampleType] = useState(null);

    // Memoize the findSampleType function to avoid recreating it on every render
    const findSampleType = useCallback((id) => {
        return sampleTypes.data.find((sampleType) => sampleType.id === id) ?? { id };
    }, [sampleTypes.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditSampleType = useCallback((id) => () => {
        setSelectedSampleType({ ...findSampleType(id), _method: 'put' });
        setOpenAddForm(true);
    }, [findSampleType]);

    const handleDeleteSampleType = useCallback((id) => () => {
        setSelectedSampleType(findSampleType(id));
        setOpenDeleteForm(true);
    }, [findSampleType]);

    const handleCloseForm = useCallback(() => {
        setSelectedSampleType(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedSampleType) return;

        router.post(
            route('sampleTypes.destroy', selectedSampleType.id),
            { _method: "delete" },
            { onSuccess: handleCloseForm }
        );
    }, [selectedSampleType, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedSampleType(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('sampleTypes.index'), {
            data: { page, filters, sort, pageSize },
            only: ["sampleTypes", "status", "success", "requestInputs"]
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
            field: 'description',
            headerName: 'Description',
            type: "string",
            width: 300,
            flex: 2
        },
        {
            field: 'samples_count',
            headerName: 'No. Sample',
            type: "number",
            width: 120,
            align: 'right',
            headerAlign: 'right'
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
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleEditSampleType(params.row.id)}
                        showInMenu
                    />
                ];

                if (params.row.samples_count < 1) {
                    actions.push(
                        <GridActionsCellItem
                            key={`delete-${params.row.id}`}
                            icon={<DeleteIcon />}
                            label="Delete"
                            showInMenu
                            onClick={handleDeleteSampleType(params.row.id)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [handleEditSampleType, handleDeleteSampleType]);

    return (
        <>
            <PageHeader
                title="Sample Types List"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                    >
                        Add New Sample Type
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={sampleTypes}
                Filter={Filter}
                errors={errors}
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`${selectedSampleType?.name || ''} Sample Type`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedSampleType}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Sample Types",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
SampleTypesIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default SampleTypesIndex;
