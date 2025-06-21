import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useCallback, useMemo, useState} from "react";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {router, usePage} from "@inertiajs/react";
import {Print} from "@mui/icons-material";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";
import TuneIcon from '@mui/icons-material/Tune';
import {DownloadIcon} from "lucide-react";

const Index = () => {
    const {requestForms, status, errors, success, requestInputs} = usePage().props;
    const [requestForm, setRequestForm] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findRequestForm = useCallback((id) => requestForms.data.find(requestForm => requestForm.id === id), [requestForms]);

    const editRequestForm = useCallback((id) => () => {
        let _request_form = findRequestForm(id);

        setRequestForm({
            id: _request_form.id,
            name: _request_form.name,
            document: _request_form.document ? {
                id: _request_form.document.hash,
                originalName: _request_form.document.originalName
            } : null,
            form_data: _request_form?.form_data || [],
            _method: 'put'
        });
        setOpenAddForm(true);
    }, [findRequestForm]);

    const printRequestForm = useCallback((id) => () => window.open(route("requestForms.show", id), "_blank"), []);

    const deleteRequestForm = useCallback((id) => () => {
        setRequestForm({...findRequestForm(id), _method: "delete"});
        setOpenDeleteForm(true);
    }, [findRequestForm]);
    const pageReload = useCallback((page = requestInputs.page, filters = requestInputs.filters, sort = requestInputs.sort, pageSize = requestInputs.pageSize) => {
        router.visit(route('requestForms.index'), {
            data: {
                page, filters, pageSize, sort
            },
            only: ["requestForms", "status", "success", "requestInputs"],
        });
    }, [])
    const handleCloseDeleteForm = useCallback(() => {
        setRequestForm(null);
        if (openDeleteForm)
            setOpenDeleteForm(false);
        if (openAddForm)
            setOpenAddForm(false);
        pageReload()
    }, [openDeleteForm, openAddForm]);
    const handleDestroy = useCallback(
        () => router.post(route('requestForms.destroy', requestForm.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}),
        [requestForm?.id]);
    const addNew = useCallback(() => setOpenAddForm(true), []);

    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: "200"
        },
        {
            field: 'tests_count',
            headerName: 'No. of Tests',
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 120,
            sortable: false,
            getActions: ({row}) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editRequestForm(row.id)}/>,]
                if (row?.document?.id || row?.document?.hash)
                    cols.push(<GridActionsCellItem icon={<DownloadIcon/>}
                                                   target="_blank"
                                                   label="Download"
                                                   href={route("documents.show", row?.document?.id || row?.document?.hash)}/>)
                if (row.tests_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>} label="Delete"
                                                   onClick={deleteRequestForm(row.id)}/>)
                return cols;
            }
        }
    ], [editRequestForm, printRequestForm, deleteRequestForm]);
    return (
        <>
            <PageHeader title="Request Forms List"
                        actions={<Button onClick={addNew}
                                         key="add-button"
                                         variant="contained"
                                         color="success"
                                         startIcon={<AddIcon/>}>Add Request Form</Button>}
            />

            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={requestForms}
                         Filter={Filter}
                         errors={errors}/>
            {openDeleteForm && <DeleteForm title={`${requestForm?.name} RequestForm`}
                                           agreeCB={handleDestroy}
                                           disAgreeCB={handleCloseDeleteForm}
                                           openDelete={openDeleteForm}/>}
            {openAddForm && <AddForm open={openAddForm}
                                     onClose={handleCloseDeleteForm}
                                     defaultValue={requestForm}/>}
        </>);
}
const breadCrumbs = [
    {
        title: "Request Forms",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
