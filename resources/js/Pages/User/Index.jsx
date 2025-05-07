import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForm from "@/Components/DeleteForm";
import {useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {Password} from "@mui/icons-material";
import ChangePassword from "@/Pages/User/Components/ChangePassword";
import {router, useForm} from "@inertiajs/react";
import {Button, Card, IconButton, Paper, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader.jsx";

const breadCrumbs = [
    {
        title: "Users",
        link: null,
        icon: null
    }
]

const Index = ({users, status, errors, success, requestInputs}) => {
    const {setData, data, post, processing, reset, setError} = useForm();
    const [open, setOpen] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const columns = [
        {field: 'id', headerName: 'ID', type: "string", width: 70},
        {field: 'name', headerName: 'Name', type: "string", width: 150},
        {field: 'username', headerName: 'Username', type: "string", width: 150},
        {field: 'email', headerName: 'Email', type: "email", width: 200},
        {field: 'mobile', headerName: 'Mobile', type: "mobile", width: 150},
        {field: 'title', headerName: 'Title', width: 150},
        {
            field: 'roles',
            headerName: 'Roles',
            type: "string",
            sortable: false,
            width: 150,
            renderCell: (params) => params.row.roles.map(item => item.name).join(", ")
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => ([
                <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={edit(params.row.id)} showInMenu/>,
                <GridActionsCellItem icon={<Password/>} label="Change Password" onClick={editPassword(params.row.id)}
                                     showInMenu/>,
                <GridActionsCellItem icon={<DeleteIcon/>} label="Delete" showInMenu
                                     onClick={destroy(params.row)}/>
            ])
        }
    ];
    const [user, setUser] = useState(null);

    const edit = (id) => () => router.visit(route('users.edit', id));
    const destroy = (params) => () => {
        setUser(params);
        setData({_method: "delete"});
        setOpen(true);
    };
    const cancel = () => {
        setOpen(false);
        setUser(null);
        setOpenChangePassword(false);
        reset();
    }
    const deleteUser = () => {
        post(route('users.destroy', user.id), {
            onSuccess: cancel
        });
    }

    const editPassword = (id) => () => {
        setUser(users.data.find(item => item.id == id));
        setOpenChangePassword(true);
    }

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('users.index'), {
            data: {page, filters, sort, pageSize},
            preserveState: true,
            only: ["users", "status", "success", "requestInputs"]
        });
    }
    const handleAddNew = () => router.visit(route('users.create'));
    return (
        <>
            <PageHeader title="Users" actions={<Button onClick={handleAddNew}
                                                       size="small"
                                                       startIcon={<AddIcon/>}
                                                       variant="contained"
                                                       color="success">
                Add User
            </Button>}/>
            <TableLayout defaultValues={requestInputs}
                         loading={processing}
                         success={success}
                         status={status}
                         errors={errors}
                         data={users}
                         only={["users", "requestInputs", "status", "success", "errors"]}
                         Filter={Filter}
                         url={route("users.index")}
                         columns={columns}
                         processing={processing}
                         reload={pageReload}>
                <DeleteForm title={`${user?.name} User`} openDelete={open} disAgreeCB={cancel}
                            agreeCB={deleteUser}/>
                {user && openChangePassword && <ChangePassword onClose={cancel}
                                                               open={openChangePassword && !processing}
                                                               userId={user.id}
                                                               currentNeeded={false}/>}
            </TableLayout>
        </>
    );
}

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page}
                                            breadcrumbs={breadCrumbs} title="Users"/>

export default Index;
