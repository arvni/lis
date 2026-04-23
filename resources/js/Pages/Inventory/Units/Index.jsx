import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Grid, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader";
import AddForm from "./Components/AddForm";

const UnitsFilter = ({defaultFilter, onFilter}) => {
    const [search, setSearch] = useState(defaultFilter?.search ?? "");
    const apply = () => onFilter(search ? {search} : {})();
    const reset = () => { setSearch(""); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Search name / abbreviation" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && apply()}/>
            </Grid>
            <Grid item xs={12} md={8}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const UnitsIndex = () => {
    const {units, requestInputs, success, status, errors} = usePage().props;
    const [openAddForm, setOpenAddForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.units.index"), {
            data: {page, filters, sort, pageSize},
            only: ["units", "success", "status", "requestInputs"],
        });
    }, []);

    const handleDelete = useCallback(() => {
        if (!deleteTarget) return;
        router.delete(route("inventory.units.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }, [deleteTarget]);

    const columns = useMemo(() => [
        {field: "name", headerName: "Unit Name", flex: 1},
        {field: "abbreviation", headerName: "Abbreviation", width: 130},
        {field: "description", headerName: "Description", flex: 1},
        {field: "item_conversions_count", headerName: "Items Using", width: 110, type: "number"},
        {
            field: "id",
            headerName: "Actions",
            type: "actions",
            width: 100,
            getActions: ({row}) => [
                <GridActionsCellItem key="edit" icon={<EditIcon/>} label="Edit" showInMenu
                    onClick={() => { setSelectedUnit({...row, _method: "put"}); setOpenAddForm(true); }}/>,
                <GridActionsCellItem key="delete" icon={<DeleteIcon/>} label="Delete" showInMenu
                    onClick={() => setDeleteTarget(row)}/>,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Units of Measure"
                actions={
                    <Button startIcon={<AddIcon/>} variant="contained" color="success"
                        onClick={() => { setSelectedUnit(null); setOpenAddForm(true); }}>
                        New Unit
                    </Button>
                }
            />
            <TableLayout
                Filter={UnitsFilter}
                defaultValues={requestInputs} success={success} status={status}
                reload={handlePageReload} columns={columns} data={units} errors={errors}
            />
            {deleteTarget && (
                <DeleteForm title={deleteTarget.name} agreeCB={handleDelete}
                    disAgreeCB={() => setDeleteTarget(null)} openDelete={!!deleteTarget}/>
            )}
            {openAddForm && (
                <AddForm open={openAddForm} defaultValue={selectedUnit}
                    onClose={() => { setOpenAddForm(false); setSelectedUnit(null); }}/>
            )}
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Units", link: null}];

UnitsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default UnitsIndex;
