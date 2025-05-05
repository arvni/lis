import TableLayout from "@/Layouts/TableLayout";
import {Head, usePage} from "@inertiajs/inertia-react";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import {Inertia} from "@inertiajs/inertia";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import {RemoveRedEye} from "@mui/icons-material";

const Approving = ({auth}) => {
    const columns = [
        {
            field: 'acceptance_item.acceptance.patient.fullName',
            headerName: 'Patient',
            type: "string",
            flex: 1,
            sortable: false,
            renderCell: ({row}) => row.acceptance_item.acceptance.patient.fullName

        },
        {
            field: 'tests.name',
            headerName: 'Test',
            type: "string",
            flex: 1,
            sortable: false,
            renderCell: ({row}) => row.acceptance_item.method.test.name + " >> " + row.acceptance_item.method.name

        },
        {
            field: 'reporter.name',
            headerName: 'Reporter',
            type: "string",
            flex: .7,
            sortable: false,
            renderCell: ({row}) => row.reporter.name
        },
        {
            field: 'reportedAt',
            headerName: 'Reported At',
            type: "date",
            flex: .7,
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            flex: .2,
            getActions: (params) => {
                let cols = [<GridActionsCellItem key={"show-" + params.row.id} icon={<RemoveRedEye/>} label="Show"
                                                 onClick={showReport(params.row.id)}
                                                 showInMenu href={route("reports.show", params.row.id)}/>];
                if (auth.permissions.includes("Report.Update") && params.row.status && params.row.reporter.id === auth.user.id)
                    cols.push(<GridActionsCellItem key={"edit-" + params.row.id} icon={<EditIcon/>} label="Edit"
                                                   onClick={editReport(params.row.id)}
                                                   showInMenu href={route("reports.edit", params.row.id)}/>)
                return cols;
            }
        }
    ];
    const {reports, status, errors, success, requestInputs} = usePage().props;
    const editReport = (id) => () => {
        Inertia.visit(route("reports.edit", id));
    };
    const showReport = (id) => () => {
        Inertia.visit(route("reports.show", id));
    };
    const pageReload = (page, filters, sort, pageSize) => {
        Inertia.visit(route('reports.approving'), {
            data: {page, filters, sort, pageSize},
            only: ["reports", "status", "success", "requestInputs"],
            preserveState: true
        });
    }
    return (
        <>
            <Head title={"Reports List"}/>
            <TableLayout defaultValues={requestInputs} success={success} status={status} reload={pageReload}
                         columns={columns} data={reports} Filter={Filter} errors={errors}>
            </TableLayout>
        </>);
}
const breadCrumbs = [
    {
        title: "Reports",
        link: null,
        icon: null
    }
]
Approving.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Approving;
