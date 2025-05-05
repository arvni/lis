import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForm from "@/Components/DeleteForm";
import {useCallback, useMemo, useState} from "react";
import {router, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {Button} from "@mui/material";


const Index = () => {
    const {workflows, status, success, requestInputs} = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [workflow, setWorkflow] = useState()
    const editWorkflow = useCallback((id) => () => router.visit(route('workflows.edit', id)));
    const deleteWorkflow = (params) => () => {
        setWorkflow(params);
        setOpenDeleteForm(true);
    };
    const pageReload = useCallback(
        (page, filters, sort, pageSize) => router.visit(route("workflows.index"),
            {
                data: {page, filters, sort, pageSize},
                only: ["workflows", "status", "success", "requestInputs"]
            }
        ), []);
    const handleCloseDeleteForm = useCallback(
        () => {
            setWorkflow(null)
            setOpenDeleteForm(false);
        }, []);
    const handleDestroy = useCallback(
        () => router.post(route('workflows.destroy', workflow.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}), [handleCloseDeleteForm]
    );
    const addNew = useCallback(() => router.visit(route('workflows.create')),[]);

    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: 200
        },
        {
            field: 'methods_count',
            headerName: 'No. of Method',
            type: "string",
            width: 200
        },
        {
            field: 'status',
            headerName: 'Active',
            type: "boolean",
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>}
                                         label="Edit"
                                         onClick={editWorkflow(params.row.id)}
                                         showInMenu/>
                ]
                if (!params.row.methods_count)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>}
                                                   label="Delete"
                                                   showInMenu
                                                   onClick={deleteWorkflow(params.row)}/>)
                return cols;
            }
        }
    ], [editWorkflow, deleteWorkflow]);

    return <>
        <PageHeader title="Workflows"
                    actions={<Button onClick={addNew}
                                     color="success">Add Workflow</Button>}/>
        <TableLayout defaultValues={requestInputs}
                     columns={columns}
                     data={workflows}
                     reload={pageReload}
                     Filter={Filter}
                     success={success}
                     status={status}/>
        {openDeleteForm && <DeleteForm title={`${workflow?.name} Workflow`}
                                       agreeCB={handleDestroy}
                                       disAgreeCB={handleCloseDeleteForm}
                                       openDelete={openDeleteForm}/>}
    </>;
}


const breadCrumbs = [
    {
        title: "Workflows",
        link: null,
        icon: null
    }
]

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
