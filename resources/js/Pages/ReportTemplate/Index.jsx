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

const Index = () => {
    const {reportTemplates, status, errors, success, requestInputs} = usePage().props;
    const [reportTemplate, setReportTemplate] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findReportTemplate = useCallback((id) => reportTemplates.data.find(reportTemplate => reportTemplate.id === id), [reportTemplates]);

    const editReportTemplate = useCallback((id) => () => {
        let _report_template = findReportTemplate(id);
        setReportTemplate({
            id: _report_template.id,
            name: _report_template.name,
            template: _report_template.template ? {
                id: _report_template.template.hash,
                originalName: _report_template.template.originalName
            } : null,
            parameters: _report_template?.active_parameters || [],
            _method: 'put'
        });
        setOpenAddForm(true);
    }, [findReportTemplate]);

    const printReportTemplate = useCallback((id) => () => window.open(route("reportTemplates.show", id), "_blank"), []);

    const deleteReportTemplate = useCallback((id) => () => {
        setReportTemplate({...findReportTemplate(id), _method: "delete"});
        setOpenDeleteForm(true);
    }, [findReportTemplate]);
    const pageReload = useCallback((page = requestInputs.page, filters = requestInputs.filters, sort = requestInputs.sort, pageSize = requestInputs.pageSize) => {
        router.visit(route('reportTemplates.index'), {
            data: {
                page, filters, pageSize, sort
            },
            only: ["reportTemplates", "status", "success", "requestInputs"],
        });
    }, [])
    const handleCloseDeleteForm = useCallback(() => {
        setReportTemplate(null);
        if (openDeleteForm)
            setOpenDeleteForm(false);
        if (openAddForm)
            setOpenAddForm(false);
        pageReload()
    }, [openDeleteForm, openAddForm]);
    const handleDestroy = useCallback(
        () => router.post(route('reportTemplates.destroy', reportTemplate.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}),
        [reportTemplate?.id]);
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
                    <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editReportTemplate(params.row.id)}/>,
                    <GridActionsCellItem icon={<Print/>} label="Print" onClick={printReportTemplate(params.row.id)}/>,
                ]
                if (params.row.tests_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>} label="Delete"
                                                   onClick={deleteReportTemplate(params.row.id)}/>)
                if (params.row.active_parameters_count > 0)
                    cols.push(<GridActionsCellItem icon={<TuneIcon/>} label="Parameters"
                                                   href={route("reportTemplates.export-parameters", params.row.id)}
                                                   target="_blank"/>)
                return cols;
            }
        }
    ], [editReportTemplate, printReportTemplate, deleteReportTemplate]);
    return (
        <>
            <PageHeader title="Report Templates List"
                        actions={<Button onClick={addNew}
                                         key="add-button"
                                         variant="contained"
                                         color="success"
                                         startIcon={<AddIcon/>}>Add Report Template</Button>}
            />

            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={reportTemplates}
                         Filter={Filter}
                         errors={errors}/>
            {openDeleteForm && <DeleteForm title={`${reportTemplate?.name} ReportTemplate`}
                                           agreeCB={handleDestroy}
                                           disAgreeCB={handleCloseDeleteForm}
                                           openDelete={openDeleteForm}/>}
            {openAddForm && <AddForm open={openAddForm}
                                     onClose={handleCloseDeleteForm}
                                     defaultValue={reportTemplate}/>}
        </>);
}
const breadCrumbs = [
    {
        title: "ReportTemplates",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
