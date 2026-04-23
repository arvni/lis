import {useState, useCallback} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const STATUS_COLORS = {OPEN: "error", ACKNOWLEDGED: "warning", RESOLVED: "success"};

const ReorderAlertsFilter = ({defaultFilter, onFilter, stores}) => {
    const [values, setValues] = useState({
        status:   defaultFilter?.status ?? "",
        store_id: defaultFilter?.store_id ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => { setValues({status: "", store_id: ""}); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Status" value={values.status} onChange={set("status")}>
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="ACKNOWLEDGED">Acknowledged</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Store" value={values.store_id} onChange={set("store_id")}>
                    <MenuItem value="">All Stores</MenuItem>
                    {(stores ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
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

const ReorderAlertsIndex = () => {
    const {alerts, stores, requestInputs, success, status, errors} = usePage().props;

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.reorder-alerts.index"), {
            data: {page, filters, sort, pageSize},
            only: ["alerts", "success", "status", "requestInputs"],
        });
    }, []);

    const Filter = useCallback(
        (props) => <ReorderAlertsFilter {...props} stores={stores}/>,
        [stores]
    );

    const columns = [
        {field: "id", headerName: "ID", width: 60},
        {field: "item", headerName: "Item", flex: 1, valueGetter: (_, row) => row.item?.name},
        {field: "item_code", headerName: "Code", width: 130, valueGetter: (_, row) => row.item?.item_code},
        {field: "store", headerName: "Store", width: 140, valueGetter: (_, row) => row.store?.name},
        {field: "current_qty_base", headerName: "Current Qty", width: 120, type: "number"},
        {field: "minimum_stock_level", headerName: "Min Level", width: 100, type: "number"},
        {
            field: "status",
            headerName: "Status",
            width: 130,
            renderCell: ({value}) => <Chip label={value} color={STATUS_COLORS[value] || "default"} size="small"/>,
        },
        {field: "created_at", headerName: "Created", width: 110},
        {
            field: "actions_col",
            headerName: "Actions",
            type: "actions",
            width: 80,
            getActions: ({row}) => row.status !== "RESOLVED" ? [
                <GridActionsCellItem
                    key="resolve"
                    icon={<CheckCircleIcon/>}
                    label="Resolve"
                    showInMenu
                    onClick={() => router.post(route("inventory.reorder-alerts.resolve", row.id))}
                />,
            ] : [],
        },
    ];

    return (
        <>
            <PageHeader title="Reorder Alerts"/>
            <TableLayout
                Filter={Filter}
                defaultValues={requestInputs ?? {}} success={success} status={status}
                reload={handlePageReload} columns={columns} data={alerts} errors={errors}
            />
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Reorder Alerts", link: null}];

ReorderAlertsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default ReorderAlertsIndex;
