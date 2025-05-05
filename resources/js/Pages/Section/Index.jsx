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
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "@/Pages/Section/Components/Filter";
import AddForm from "@/Pages/Section/Components/AddForm";

const SectionsIndex = () => {
    const {sections, status, errors, success, requestInputs} = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);

    // Memoize the findSection function to avoid recreating it on every render
    const findSection = useCallback((id) => {
        return sections.data.find((section) => section.id === id) ?? {id};
    }, [sections.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditSection = useCallback((id) => () => {
        setSelectedSection({...findSection(id), _method: "put"});
        setOpenAddForm(true);
    }, [findSection]);

    const handleDeleteSection = useCallback((id) => () => {
        setSelectedSection(findSection(id));
        setOpenDeleteForm(true);
    }, [findSection]);

    const handleCloseForm = useCallback(() => {
        setSelectedSection(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedSection?.id) return;
        return router.post(
            route('sections.destroy', selectedSection.id),
            {_method: "delete"},
            {onSuccess: handleCloseForm}
        );
    }, [selectedSection, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedSection(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('sections.index'), {
            data: {page, filters, sort, pageSize},
            only: ["sections", "status", "success", "requestInputs"]
        });
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() =>
        [
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: 200,
            flex: 1
        },
        {
            field: 'section_group_name',
            headerName: 'Category',
            type: "string",
            width: 180,
            flex: 1
        },
        {
            field: 'acceptance_item_states_count',
            headerName: 'No. of Acceptances',
            type: "number",
            width: 160,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'workflows_count',
            headerName: 'No. of Workflows',
            type: "number",
            width: 150,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'active',
            headerName: 'Status',
            type: "boolean",
            width: 100,
            align: 'center',
            headerAlign: 'center'
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
                        onClick={handleEditSection(params.row.id)}
                        showInMenu
                    />
                ];

                // Only show delete option if there are no dependencies
                if (params.row.acceptance_item_states_count < 1 && params.row.workflows_count < 1) {
                    actions.push(
                        <GridActionsCellItem
                            key={`delete-${params.row.id}`}
                            icon={<DeleteIcon/>}
                            label="Delete"
                            showInMenu
                            onClick={handleDeleteSection(params.row.id)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [handleEditSection, handleDeleteSection]);

    return (
        <>
            <PageHeader
                title="Sections List"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon/>}
                        color="success"
                        variant="contained"
                    >
                        Add New Section
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={sections}
                Filter={Filter}
                errors={errors}
            />
            {openDeleteForm && (
                <DeleteForm
                    title={`${selectedSection?.name || ''} Section`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedSection}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Sections",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
SectionsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default SectionsIndex;
