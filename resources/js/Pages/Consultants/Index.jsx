import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForm from "@/Components/DeleteForm";
import {useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader.jsx";
import Link from "@mui/material/Link";

const breadCrumbs = [
    {
        title: "Consultants",
        link: null,
        icon: null
    }
]

const Index = ({consultants, status, errors, success, requestInputs}) => {
    const {setData, data, post, processing, reset, setError} = useForm();
    const [open, setOpen] = useState(false);
    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            type: "string",
            width: 150,
            display: "flex",
            renderCell: ({row, value}) => <Link href={route("consultants.show", row.id)}>{value}</Link>
        },
        {field: 'title', headerName: 'Title', width: 150, display: "flex"},
        {field: 'speciality', headerName: 'Expertise', width: 150, display: "flex"},
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => ([
                <GridActionsCellItem icon={<EditIcon/>}
                                     label="Edit"
                                     onClick={edit(params.row.id)}/>,
                <GridActionsCellItem icon={<DeleteIcon/>}
                                     label="Delete"
                                     onClick={destroy(params.row)}/>
            ])
        }
    ];
    const [consultant, setConsultant] = useState(null);

    const edit = (id) => () => router.visit(route('consultants.edit', id));
    const destroy = (params) => () => {
        setConsultant(params);
        setData({_method: "delete"});
        setOpen(true);
    };
    const cancel = () => {
        setOpen(false);
        setConsultant(null);
        reset();
    }
    const deleteConsultant = () => {
        post(route('consultants.destroy', consultant.id), {
            onSuccess: cancel
        });
    }

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('consultants.index'), {
            data: {page, filters, sort, pageSize},
            preserveState: true,
            only: ["consultants", "status", "success", "requestInputs"]
        });
    }
    const handleAddNew = () => router.visit(route('consultants.create'));
    return (
        <>
            <PageHeader title="Consultants" actions={<Button onClick={handleAddNew}
                                                             size="small"
                                                             startIcon={<AddIcon/>}
                                                             variant="contained"
                                                             color="success">Add Consultant</Button>}/>
            <TableLayout defaultValues={requestInputs}
                         loading={processing}
                         success={success}
                         status={status}
                         errors={errors}
                         data={consultants}
                         Filter={Filter}
                         columns={columns}
                         processing={processing}
                         reload={pageReload}>
                <DeleteForm title={`${consultant?.name} Consultant`}
                            openDelete={open}
                            disAgreeCB={cancel}
                            agreeCB={deleteConsultant}/>
            </TableLayout>
        </>
    );
}

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page}
                                            breadcrumbs={breadCrumbs} title="Consultants"/>

export default Index;
