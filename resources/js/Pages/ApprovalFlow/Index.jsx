import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useCallback, useMemo, useState} from "react";
import {Button, Chip, Stack} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {Head, router, usePage} from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";

const Index = () => {
    const {approvalFlows, status, errors, success, requestInputs} = usePage().props;
    const [approvalFlow, setApprovalFlow] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findApprovalFlow = useCallback((id) => approvalFlows.data.find(flow => flow.id === id), [approvalFlows]);

    const editApprovalFlow = useCallback((id) => () => {
        let _flow = findApprovalFlow(id);
        setApprovalFlow({
            id: _flow.id,
            name: _flow.name,
            description: _flow.description,
            active: _flow.active,
            steps: (_flow.steps || []).map(step => ({
                id: step.id,
                name: step.name,
                role: step.role,
                user: step.user,
                allow_self_approval: step.allow_self_approval
            })),
            _method: 'put'
        });
        setOpenAddForm(true);
    }, [findApprovalFlow]);

    const deleteApprovalFlow = useCallback((id) => () => {
        setApprovalFlow({...findApprovalFlow(id), _method: "delete"});
        setOpenDeleteForm(true);
    }, [findApprovalFlow]);

    const pageReload = useCallback((page = requestInputs.page, filters = requestInputs.filters, sort = requestInputs.sort, pageSize = requestInputs.pageSize) => {
        router.visit(route('approvalFlows.index'), {
            data: {
                page, filters, pageSize, sort
            },
            only: ["approvalFlows", "status", "success", "requestInputs"],
        });
    }, [])

    const handleCloseAddForm = useCallback(() => {
        setApprovalFlow(null);
        setOpenAddForm(false);
    }, []);

    const handleCloseDeleteForm = useCallback(() => {
        setApprovalFlow(null);
        if (openDeleteForm)
            setOpenDeleteForm(false);
        if (openAddForm)
            setOpenAddForm(false);
        pageReload()
    }, [openDeleteForm, openAddForm]);

    const handleDestroy = useCallback(
        () => router.post(route('approvalFlows.destroy', approvalFlow.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}),
        [approvalFlow?.id]);

    const addNew = useCallback(() => setOpenAddForm(true), []);

    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Name',
            type: "string",
            width: 200
        },
        {
            field: 'steps',
            headerName: 'Steps',
            sortable: false,
            flex: 1,
            renderCell: ({row}) => (
                <Stack direction="row" spacing={0.5} sx={{alignItems: "center", height: "100%", flexWrap: "wrap"}}>
                    {(row.steps || []).map((step, index) => (
                        <Chip key={step.id}
                              size="small"
                              variant="outlined"
                              color={index === row.steps.length - 1 ? "primary" : "default"}
                              label={`${index + 1}. ${step.name}${step.role ? ` (${step.role.name})` : step.user ? ` (${step.user.name})` : ""}`}/>
                    ))}
                </Stack>
            )
        },
        {
            field: 'report_templates_count',
            headerName: 'No. of Templates',
            width: 130
        },
        {
            field: 'active',
            headerName: 'Active',
            width: 90,
            renderCell: ({row}) => row.active
                ? <Chip label="Active" color="success" size="small"/>
                : <Chip label="Inactive" size="small"/>
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editApprovalFlow(params.row.id)}/>,
                ]
                if (params.row.report_templates_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>} label="Delete"
                                                   onClick={deleteApprovalFlow(params.row.id)}/>)
                return cols;
            }
        }
    ], [editApprovalFlow, deleteApprovalFlow]);

    return (
        <>
            <Head title="Approval Flows"/>
            <PageHeader title="Report Approval Flows"
                        actions={<Button onClick={addNew}
                                         key="add-button"
                                         variant="contained"
                                         color="success"
                                         startIcon={<AddIcon/>}>Add Approval Flow</Button>}
            />

            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={approvalFlows}
                         Filter={Filter}
                         errors={errors}/>
            {openDeleteForm && <DeleteForm title={`${approvalFlow?.name} Approval Flow`}
                                           agreeCB={handleDestroy}
                                           disAgreeCB={handleCloseDeleteForm}
                                           openDelete={openDeleteForm}/>}
            {openAddForm && <AddForm open={openAddForm}
                                     onClose={handleCloseAddForm}
                                     defaultValue={approvalFlow}/>}
        </>);
}
const breadCrumbs = [
    {
        title: "Approval Flows",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
