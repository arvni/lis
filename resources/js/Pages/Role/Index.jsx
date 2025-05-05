import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForm from "@/Components/DeleteForm";
import {useState} from "react";
import {router, useForm, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import AddIcon from "@mui/icons-material/Add";
import {Button} from "@mui/material";


const Index = () => {
    const {post, setData, data, reset, processing} = useForm()
    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            type: "number",
            width: 70
        },
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: 200
        },
        {
            field: 'users_count',
            headerName: 'No. User',
            type: "string",
            width: 200
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editRole(params.row.id)} showInMenu/>
                ]
                if (params.row.users_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>} label="Delete" showInMenu
                                                   onClick={deleteRole(params.row)}/>)
                return cols;
            }
        }
    ];
    const {roles, status, success, requestInputs} = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const editRole = (id) => () => router.visit(route('roles.edit', id));
    const deleteRole = (params) => () => {
        setData(params);
        setData({_method: "delete"});
        setOpenDeleteForm(true);
    };
    const pageReload = (page, filters, sort, pageSize) => {
        router.visit('/roles', {
            data: {
                page,
                filters,
                sort,
                pageSize
            },
            only: ["roles", "status", "success", "requestInputs,"],
            preserveState: true
        });
    };
    const handleCloseDeleteForm = () => {
        setOpenDeleteForm(false);
        reset();
    };
    const handleDestroy = async () => {
        post(route('roles.destroy', data.id), {
            onSuccess: handleCloseDeleteForm
        });
    };
    const addRole = () => router.visit(route('roles.create'));
    return <>
        <PageHeader title="Roles"
                    actions={<Button onClick={addRole}
                                     size="small"
                                     startIcon={<AddIcon/>}
                                     variant="contained"
                                     color="success">
                        Add Role
                    </Button>}/>
        <TableLayout defaultValues={requestInputs}
                     columns={columns}
                     data={roles}
                     reload={pageReload}
                     Filter={Filter}
                     loading={processing}
                     success={success}
                     status={status}>
            <DeleteForm title={`${data?.name} Role`}
                        agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}/>
        </TableLayout>
    </>;
}


const breadCrumbs = [
    {
        title: "Roles",
        link: null,
        icon: null
    }
]

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
