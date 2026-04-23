import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader";

const SuppliersFilter = ({defaultFilter, onFilter}) => {
    const [values, setValues] = useState({
        search:    defaultFilter?.search ?? "",
        type:      defaultFilter?.type ?? "",
        is_active: defaultFilter?.is_active ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => { setValues({search: "", type: "", is_active: ""}); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Search name / code" value={values.search}
                    onChange={set("search")} onKeyDown={(e) => e.key === "Enter" && apply()}/>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Type" value={values.type} onChange={set("type")}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="LOCAL">Local</MenuItem>
                    <MenuItem value="INTERNATIONAL">International</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={values.is_active} onChange={set("is_active")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const SuppliersIndex = () => {
    const {suppliers, requestInputs, success, status, errors} = usePage().props;
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.suppliers.index"), {
            data: {page, filters, sort, pageSize},
            only: ["suppliers", "success", "status", "requestInputs"],
        });
    }, []);

    const handleDelete = useCallback(() => {
        if (!deleteTarget) return;
        router.delete(route("inventory.suppliers.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }, [deleteTarget]);

    const columns = useMemo(() => [
        {field: "name", headerName: "Supplier Name", flex: 1, minWidth: 180},
        {field: "code", headerName: "Code", width: 120},
        {
            field: "type",
            headerName: "Type",
            width: 130,
            renderCell: ({value}) => <Chip label={value} size="small" color={value === "International" ? "info" : "default"}/>,
        },
        {field: "country", headerName: "Country", width: 120},
        {field: "contacts_count", headerName: "Contacts", width: 90, type: "number"},
        {field: "supplier_items_count", headerName: "Items", width: 80, type: "number"},
        {
            field: "is_active",
            headerName: "Active",
            width: 80,
            renderCell: ({value}) => <Chip label={value ? "Yes" : "No"} color={value ? "success" : "default"} size="small"/>,
        },
        {
            field: "id",
            headerName: "Actions",
            type: "actions",
            width: 100,
            getActions: ({row}) => [
                <GridActionsCellItem key="view" icon={<VisibilityIcon/>} label="View" showInMenu
                    onClick={() => router.visit(route("inventory.suppliers.show", row.id))}/>,
                <GridActionsCellItem key="edit" icon={<EditIcon/>} label="Edit" showInMenu
                    onClick={() => router.visit(route("inventory.suppliers.edit", row.id))}/>,
                <GridActionsCellItem key="delete" icon={<DeleteIcon/>} label="Delete" showInMenu
                    onClick={() => setDeleteTarget(row)}/>,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Suppliers"
                actions={
                    <Button startIcon={<AddIcon/>} variant="contained" color="success"
                        onClick={() => router.visit(route("inventory.suppliers.create"))}>
                        New Supplier
                    </Button>
                }
            />
            <TableLayout
                Filter={SuppliersFilter}
                defaultValues={requestInputs} success={success} status={status}
                reload={handlePageReload} columns={columns} data={suppliers} errors={errors}
            />
            {deleteTarget && (
                <DeleteForm title={deleteTarget.name} agreeCB={handleDelete}
                    disAgreeCB={() => setDeleteTarget(null)} openDelete={!!deleteTarget}/>
            )}
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Suppliers", link: null}];

SuppliersIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default SuppliersIndex;
