import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const StoresFilter = ({defaultFilter, onFilter}) => {
    const [values, setValues] = useState({
        search:    defaultFilter?.search ?? "",
        is_active: defaultFilter?.is_active ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => { setValues({search: "", is_active: ""}); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Search name / code" value={values.search}
                    onChange={set("search")} onKeyDown={(e) => e.key === "Enter" && apply()}/>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={values.is_active} onChange={set("is_active")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const StoresIndex = () => {
    const {stores, requestInputs, success, status, errors} = usePage().props;

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.stores.index"), {
            data: {page, filters, sort, pageSize},
            only: ["stores", "success", "status", "requestInputs"],
        });
    }, []);

    const columns = useMemo(() => [
        {field: "name", headerName: "Store Name", flex: 1, minWidth: 160},
        {field: "code", headerName: "Code", width: 100},
        {field: "locations_count", headerName: "Locations", width: 100, type: "number"},
        {field: "address", headerName: "Address", width: 200},
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
                    onClick={() => router.visit(route("inventory.stores.show", row.id))}/>,
                <GridActionsCellItem key="edit" icon={<EditIcon/>} label="Edit" showInMenu
                    onClick={() => router.visit(route("inventory.stores.edit", row.id))}/>,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Stores & Warehouses"
                actions={
                    <Button startIcon={<AddIcon/>} variant="contained" color="success"
                        onClick={() => router.visit(route("inventory.stores.create"))}>
                        New Store
                    </Button>
                }
            />
            <TableLayout
                Filter={StoresFilter}
                defaultValues={requestInputs} success={success} status={status}
                reload={handlePageReload} columns={columns} data={stores} errors={errors}
            />
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Stores", link: null}];

StoresIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default StoresIndex;
