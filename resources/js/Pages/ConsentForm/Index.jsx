import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useCallback, useMemo, useState} from "react";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {router, usePage} from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";
import {DownloadIcon} from "lucide-react";

const Index = () => {
    const {consentForms, status, errors, success, requestInputs} = usePage().props;
    console.log(consentForms);
    const [consentForm, setConsentForm] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findConsentForm = useCallback((id) => consentForms.data.find(consentForm => consentForm.id === id), [consentForms]);

    const editConsentForm = useCallback((id) => () => {
        let _report_template = findConsentForm(id);
        setConsentForm({
            id: _report_template.id,
            name: _report_template.name,
            document: _report_template.document ? {
                id: _report_template.document.hash,
                originalName: _report_template.document.originalName,
                tag:_report_template.document.tag
            } : null,
            _method: 'put'
        });
        setOpenAddForm(true);
    }, [findConsentForm]);

    const deleteConsentForm = useCallback((id) => () => {
        setConsentForm({...findConsentForm(id), _method: "delete"});
        setOpenDeleteForm(true);
    }, [findConsentForm]);
    const pageReload = useCallback((page = requestInputs.page, filters = requestInputs.filters, sort = requestInputs.sort, pageSize = requestInputs.pageSize) => {
        router.visit(route('consentForms.index'), {
            data: {
                page, filters, pageSize, sort
            },
            only: ["consentForms", "status", "success", "requestInputs"],
        });
    }, [])
    const handleCloseDeleteForm = useCallback(() => {
        setConsentForm(null);
        if (openDeleteForm)
            setOpenDeleteForm(false);
        if (openAddForm)
            setOpenAddForm(false);
        pageReload()
    }, [openDeleteForm, openAddForm]);
    const handleDestroy = useCallback(
        () => router.post(route('consentForms.destroy', consentForm.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}),
        [consentForm?.id]);
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
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>}
                                         label="Edit"
                                         onClick={editConsentForm(params.row.id)}/>,
                    <GridActionsCellItem icon={<DownloadIcon/>}
                                         label="Download"
                                         target="_blank"
                                         href={route("documents.show",params?.row?.document?.id||params?.row?.document?.hash)}/>,
                ]
                if (params.row.tests_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>} label="Delete"
                                                   onClick={deleteConsentForm(params.row.id)}/>)
                return cols;
            }
        }
    ], [editConsentForm, deleteConsentForm]);
    return (
        <>
            <PageHeader title="Consent Forms List"
                        actions={<Button onClick={addNew}
                                         key="add-button"
                                         variant="contained"
                                         color="success"
                                         startIcon={<AddIcon/>}>Add Consent Form</Button>}
            />

            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={consentForms}
                         Filter={Filter}
                         errors={errors}/>
            {openDeleteForm && <DeleteForm title={`${consentForm?.name} Consent Form`}
                                           agreeCB={handleDestroy}
                                           disAgreeCB={handleCloseDeleteForm}
                                           openDelete={openDeleteForm}/>}
            {openAddForm && <AddForm open={openAddForm}
                                     onClose={handleCloseDeleteForm}
                                     defaultValue={consentForm}/>}
        </>);
}
const breadCrumbs = [
    {
        title: "Consent Forms",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
