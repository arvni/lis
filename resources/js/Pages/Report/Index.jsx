import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import {useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import {RemoveRedEye} from "@mui/icons-material";
import {router, useForm, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";

const Index = ({auth, canEditAll}) => {
    const {post, setData, reset, processing, get} = useForm()
    const columns = [
        {
            field: 'acceptance_item.patient.fullName',
            headerName: 'Patient',
            type: "string",
            flex: 1,
            sortable: false,
            renderCell: ({row}) => row.acceptance_item.patients.map(item => item.fullName).join(", ")

        },
        {
            field: 'name',
            headerName: 'Test',
            type: "string",
            flex: 1,
            sortable: false,
            renderCell: ({row}) => row.acceptance_item.test.name + " >> " + row.acceptance_item.method.name

        },
        {
            field: 'reporter_name',
            headerName: 'Reporter',
            type: "string",
            flex: .6,
        },
        {
            field: 'reported_at',
            headerName: 'Reported At',
            type: "datetime",
            flex: .7,
            valueGetter: (value) => value && new Date(value),
        },
        {
            field: 'approver_name',
            headerName: 'Approver / Rejecter',
            type: "string",
            flex: .6,
        },
        {
            field: 'approved_at',
            headerName: 'Approved/Rejected At',
            type: "datetime",
            flex: .7,
            valueGetter: (value) => value && new Date(value),
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "boolean",
            flex: .2,
        },
        {
            field: 'published_at',
            headerName: 'Published At',
            type: "datetime",
            flex: .7,
            valueGetter: (value) => value && new Date(value),
        },
        {
            field: 'publisher_name',
            headerName: 'Publisher',
            type: "string",
            flex: .7,
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            flex: .1,
            getActions: (params) => {
                let cols = [<GridActionsCellItem icon={<RemoveRedEye/>} label="Show" onClick={showReport(params.row.id)}
                                                 showInMenu href={route("reports.show", params.row.id)}/>];
                if (params.row.status && ((params.row.reporter.id === auth.user.id && !params.row.approver) || canEditAll))
                    cols.push(<GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editReport(params.row.id)}
                                                   showInMenu href={route("reports.edit", params.row.id)}/>)
                return cols;
            }
        }
    ];
    const {reports, status, errors, success, requestInputs, title} = usePage().props;
    const [report, setReport] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const editReport = (id) => () => get(route("reports.edit", id));

    const showReport = (id) => (e) => get(route("reports.show", id));
    const deleteReport = (params) => () => {
        setReport(params);
        setData({_method: "delete"});
        setOpenDeleteForm(true);
    };
    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('reports.index'), {
            data: {page, filters, sort, pageSize},
            only: ["reports", "status", "requestInputs", "success"]
        });
    }
    const handleCloseDeleteForm = () => {
        setReport(null);
        reset();
        setOpenDeleteForm(false);
    };
    const handleDestroy = async () => {
        post(route('reports.destroy', report.id), {
            preserveState: true
        });
        handleCloseDeleteForm();
    };
    return (
        <>
            <PageHeader title={title || "Reports List"}/>
            <TableLayout defaultValues={requestInputs} success={success} status={status} reload={pageReload}
                         columns={columns} data={reports} processing={processing} Filter={Filter} errors={errors}/>
            <DeleteForm title={`${report?.name} Report`}
                        agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}/>
        </>);
}
const breadCrumbs = [
    {
        title: "Reports",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
