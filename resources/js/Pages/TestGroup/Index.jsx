import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useCallback, useMemo, useState} from "react";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const Index = () => {
    const {testGroups, status, errors, success, requestInputs} = usePage().props;
    const [testGroup, setTestGroup] = useState({name: ""});
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findTestGroup = useCallback((id) => testGroups?.data?.find(testGroup => testGroup.id === id) ?? {id}, [testGroups]);

    const editTestGroup = useCallback((id) => () => {
        setTestGroup({...findTestGroup(id), _method: 'put'});
        setOpenAddForm(true);
    }, [findTestGroup]);
    const deleteTestGroup = useCallback((id) => () => {
        setTestGroup(findTestGroup(id));
        setOpenDeleteForm(true);
    }, [findTestGroup]);
    const pageReload = useCallback((page, filters, sort, pageSize) => router.visit(route('testGroups.index'),
        {
            data: {
                page,
                sort,
                filters,
                pageSize
            },
            only: ["testGroups", "status", "success", "requestInputs"],
        }
    ), []);
    const handleCloseDeleteForm = () => {
        setTestGroup(null);
        setOpenDeleteForm(false);
        setOpenAddForm(false)
    };
    const handleDestroy = useCallback(() => {
        router.post(route('testGroups.destroy', testGroup.id),
            {_method: "delete"}, {onSuccess: handleCloseDeleteForm});
    }, [testGroup, handleCloseDeleteForm]);
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
            type: "number"
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>}
                                         label="Edit"
                                         onClick={editTestGroup(params.row.id)}
                                         showInMenu/>
                ]
                if (params.row.tests_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>}
                                                   label="Delete"
                                                   showInMenu
                                                   onClick={deleteTestGroup(params.row.id)}/>)
                return cols;
            }
        }
    ], [editTestGroup, deleteTestGroup]);

    return (
        <>
            <PageHeader title="Test Group List"
                        actions={<Button onClick={addNew}
                                         color="success"
                                         startIcon={<AddIcon/>}>
                            Add New Test Group
                        </Button>}/>
            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={testGroups}
                         Filter={Filter}
                         errors={errors}>
                <DeleteForm title={`${testGroup?.name} Test Group`}
                            agreeCB={handleDestroy}
                            disAgreeCB={handleCloseDeleteForm}
                            openDelete={openDeleteForm}/>
                {openAddForm && <AddForm open={openAddForm}
                                         onClose={handleCloseDeleteForm}
                                         defaultValue={testGroup}/>}
            </TableLayout>
        </>);
}
const breadCrumbs = [
    {
        title: "Test Groups",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                            children={page}
                                            breadcrumbs={breadCrumbs}/>

export default Index;
