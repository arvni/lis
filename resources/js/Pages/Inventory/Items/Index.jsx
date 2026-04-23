import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader";

const DEPARTMENTS = ["LAB", "ADM", "MNT", "CLN", "IT", "FAC"];
const MATERIAL_TYPES = ["CHM", "SLD", "LQD", "ELC", "CSM", "BIO", "GLS", "PPE", "RGT", "OTH"];

const ItemsFilter = ({defaultFilter, onFilter}) => {
    const [values, setValues] = useState({
        search: defaultFilter?.search ?? "",
        department: defaultFilter?.department ?? "",
        material_type: defaultFilter?.material_type ?? "",
        is_active: defaultFilter?.is_active ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => { setValues({search: "", department: "", material_type: "", is_active: ""}); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
                <TextField fullWidth size="small" label="Search" value={values.search}
                    onChange={set("search")} onKeyDown={(e) => e.key === "Enter" && apply()}/>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Department" value={values.department} onChange={set("department")}>
                    <MenuItem value="">All Departments</MenuItem>
                    {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Material Type" value={values.material_type} onChange={set("material_type")}>
                    <MenuItem value="">All Types</MenuItem>
                    {MATERIAL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={values.is_active} onChange={set("is_active")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const ItemsIndex = () => {
    const {items, requestInputs, success, status, errors} = usePage().props;
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.items.index"), {
            data: {page, filters, sort, pageSize},
            only: ["items", "success", "status", "requestInputs"],
        });
    }, []);

    const handleDelete = useCallback(() => {
        if (!deleteTarget) return;
        router.delete(route("inventory.items.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }, [deleteTarget]);

    const columns = useMemo(() => [
        {field: "item_code", headerName: "Item Code", width: 140, flex: 0},
        {field: "name", headerName: "Name", width: 220, flex: 1},
        {
            field: "department",
            headerName: "Department",
            width: 110,
            renderCell: ({value}) => <Chip label={value} size="small" variant="outlined"/>,
        },
        {
            field: "material_type",
            headerName: "Type",
            width: 100,
            renderCell: ({value}) => <Chip label={value} size="small"/>,
        },
        {field: "storage_condition", headerName: "Storage", width: 160},
        {
            field: "is_active",
            headerName: "Active",
            width: 80,
            renderCell: ({value}) => (
                <Chip label={value ? "Yes" : "No"} color={value ? "success" : "default"} size="small"/>
            ),
        },
        {
            field: "id",
            headerName: "Actions",
            type: "actions",
            width: 100,
            getActions: ({row}) => [
                <GridActionsCellItem
                    key="view"
                    icon={<VisibilityIcon/>}
                    label="View"
                    showInMenu
                    onClick={() => router.visit(route("inventory.items.show", row.id))}
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon/>}
                    label="Edit"
                    showInMenu
                    onClick={() => router.visit(route("inventory.items.edit", row.id))}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon/>}
                    label="Delete"
                    showInMenu
                    onClick={() => setDeleteTarget(row)}
                />,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Inventory Items"
                actions={
                    <Box sx={{display: "flex", gap: 1}}>
                        <Button
                            startIcon={<UploadIcon/>}
                            variant="outlined"
                            onClick={() => router.visit(route("inventory.items.import.create"))}
                        >
                            Bulk Import
                        </Button>
                        <Button
                            startIcon={<AddIcon/>}
                            variant="contained"
                            color="success"
                            onClick={() => router.visit(route("inventory.items.create"))}
                        >
                            New Item
                        </Button>
                    </Box>
                }
            />
            <TableLayout
                Filter={ItemsFilter}
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={items}
                errors={errors}
            />
            {deleteTarget && (
                <DeleteForm
                    title={`${deleteTarget.name} (${deleteTarget.item_code})`}
                    agreeCB={handleDelete}
                    disAgreeCB={() => setDeleteTarget(null)}
                    openDelete={!!deleteTarget}
                />
            )}
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Items", link: null}];

ItemsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default ItemsIndex;
