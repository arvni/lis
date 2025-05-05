import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {useCallback, useMemo, useState} from "react";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const Index = () => {
    const {sectionGroups, status, errors, success, requestInputs} = usePage().props;
    const [sectionGroup, setSectionGroup] = useState({name: "", active: true, parent: null});
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    const findSectionGroup = (id) => sectionGroups?.data[sectionGroups?.data?.findIndex(sG => sG.id == id)];

    const editSectionGroup = useCallback((id) => () => {
        let  sG=findSectionGroup(id);
        setSectionGroup({...sG, _method: 'put'});
        setOpenAddForm(true);
    }, [findSectionGroup]);
    const deleteSectionGroup = useCallback((id) => () => {
        setSectionGroup(findSectionGroup(id));
        setOpenDeleteForm(true);
    }, [findSectionGroup]);
    const pageReload = useCallback((page=1, filters=[], sort={field: "name", order: "asc"}, pageSize=20) => router.visit(route('sectionGroups.index'), {
        data: {
            page,
            sort,
            filters,
            pageSize
        },
        only: ["sectionGroups", "status", "success", "requestInputs"],
    }), [router]);
    const handleCloseDeleteForm = useCallback(() => {
        setSectionGroup(null);
        setOpenDeleteForm(false);
        setOpenAddForm(false);
        pageReload();
    }, []);
    const handleDestroy = useCallback(() => {
        router.post(route('sectionGroups.destroy', sectionGroup.id),
            {_method: "delete"},
            {onSuccess: handleCloseDeleteForm}
        );
    }, []);

    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Title',
            type: "string",
            width: "200"
        },
        {
            field: 'parent_name',
            headerName: 'Parent',
            type: "string",
            width: "200",
        },
        {
            field: 'sections_count',
            headerName: 'No. of Sections',
            type: "string",
        },
        {
            field: 'children_count',
            headerName: 'No. of Children',
            type: "string",
        },
        {
            field: 'active',
            headerName: 'Status',
            type: "boolean",
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem icon={<EditIcon/>} label="Edit" onClick={editSectionGroup(params.row.id)}
                                         showInMenu/>
                ]
                if (params.row.children_count < 1 && params.row.sections_count < 1)
                    cols.push(<GridActionsCellItem icon={<DeleteIcon/>}
                                                   label="Delete"
                                                   showInMenu
                                                   onClick={deleteSectionGroup(params.row.id)}/>)
                return cols;
            }
        }
    ], [editSectionGroup, deleteSectionGroup]);
    const addNew = useCallback(() => setOpenAddForm(true), []);
     console.log(sectionGroup);
    return (
        <>
            <PageHeader title="Section Group List"
                        actions={<Button onClick={addNew}
                                         color="success"
                                         startIcon={<AddIcon/>}>
                            Add New Section Group
                        </Button>}/>
            <TableLayout defaultValues={requestInputs}
                         success={success}
                         status={status}
                         reload={pageReload}
                         columns={columns}
                         data={sectionGroups}
                         Filter={Filter}
                         errors={errors}/>
            {openDeleteForm && <DeleteForm title={`${sectionGroup?.name} Section Group`}
                                           agreeCB={handleDestroy}
                                           disAgreeCB={handleCloseDeleteForm}
                                           openDelete={openDeleteForm}/>}
            {openAddForm && <AddForm open={openAddForm}
                                     onClose={handleCloseDeleteForm}
                                     defaultData={sectionGroup}/>}
        </>);
}
const breadCrumbs = [
    {
        title: "Section Groups",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                            children={page}
                                            breadcrumbs={breadCrumbs}/>

export default Index;
