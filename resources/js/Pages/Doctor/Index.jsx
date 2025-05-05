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
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";

const DoctorsIndex = () => {
    const {doctors, status, errors, success, requestInputs} = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // Memoize the findDoctor function to avoid recreating it on every render
    const findDoctor = useCallback((id) => {
        return doctors.data.find((group) => group.id === id) ?? {id};
    }, [doctors.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditDoctor = useCallback((id) => () => {
        setSelectedDoctor({...findDoctor(id), _method: 'put'});
        setOpenAddForm(true);
    }, [findDoctor]);

    const handleDeleteDoctor = useCallback((id) => () => {
        setSelectedDoctor(findDoctor(id));
        setOpenDeleteForm(true);
    }, [findDoctor]);

    const handleCloseForm = useCallback(() => {
        setSelectedDoctor(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedDoctor) return;

        router.post(
            route('doctors.destroy', selectedDoctor.id),
            {_method: "delete"},
            {onSuccess: handleCloseForm}
        );
    }, [selectedDoctor, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedDoctor(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('doctors.index'), {
            data: {page, filters, sort, pageSize},
            only: ["doctors", "status", "success", "requestInputs"]
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
            field: 'expertise',
            headerName: 'Specialty',
            type: "string",
            width: 150
        },
        {
            field: 'phone',
            headerName: 'Phone',
            type: "string",
            width: 150
        },
        {
            field: 'license_no',
            headerName: 'License No',
            type: "string",
            width: 150
        },
        {
            field: 'acceptances_count',
            headerName: 'No. Acceptances',
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
                        onClick={handleEditDoctor(params.row.id)}
                        showInMenu
                    />
                ];

                if (params.row.acceptances_count < 1) {
                    actions.push(
                        <GridActionsCellItem
                            key={`delete-${params.row.id}`}
                            icon={<DeleteIcon/>}
                            label="Delete"
                            showInMenu
                            onClick={handleDeleteDoctor(params.row.id)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [handleEditDoctor, handleDeleteDoctor]);

    return (
        <>
            <PageHeader
                title="Doctors List"
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
                data={doctors}
                Filter={Filter}
                errors={errors}
            />
            {openDeleteForm && <DeleteForm
                title={`${selectedDoctor.name || ''} Doctor`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseForm}
                openDelete={openDeleteForm}
            />}
            {openAddForm && <AddForm
                open={openAddForm}
                defaultValue={selectedDoctor}
                onClose={handleCloseForm}
            />}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Doctors",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
DoctorsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default DoctorsIndex;
