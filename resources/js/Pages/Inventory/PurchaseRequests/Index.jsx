import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const PR_STATUSES = [
    "DRAFT", "SUBMITTED", "APPROVED", "ORDERED", "PAID",
    "SHIPPED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED",
];

const STATUS_COLORS = {
    DRAFT: "default", SUBMITTED: "info", APPROVED: "success",
    ORDERED: "warning", PAID: "secondary", SHIPPED: "primary",
    PARTIALLY_RECEIVED: "warning", RECEIVED: "success", CANCELLED: "error",
};

const PRFilter = ({defaultFilter, onFilter}) => {
    const [values, setValues] = useState({
        status:  defaultFilter?.status ?? "",
        urgency: defaultFilter?.urgency ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => { setValues({status: "", urgency: ""}); onFilter({})(); };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Status" value={values.status} onChange={set("status")}>
                    <MenuItem value="">All Statuses</MenuItem>
                    {PR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Urgency" value={values.urgency} onChange={set("urgency")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={7}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const PurchaseRequestsIndex = () => {
    const {requests, requestInputs, success, status, errors} = usePage().props;

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.purchase-requests.index"), {
            data: {page, filters, sort, pageSize},
            only: ["requests", "success", "status", "requestInputs"],
        });
    }, []);

    const columns = useMemo(() => [
        {field: "id", headerName: "ID", width: 70},
        {field: "requested_by", headerName: "Requested By", width: 150, valueGetter: (_, row) => row.requested_by?.name},
        {field: "urgency", headerName: "Urgency", width: 100,
            renderCell: ({value}) => <Chip label={value} size="small" color={value === "URGENT" ? "error" : "default"}/>},
        {field: "lines_count", headerName: "Items", width: 70},
        {field: "status", headerName: "Status", width: 160,
            renderCell: ({value}) => <Chip label={value?.replace("_", " ")} color={STATUS_COLORS[value] || "default"} size="small"/>},
        {field: "created_at", headerName: "Created", width: 110},
        {
            field: "id_actions",
            headerName: "Actions",
            type: "actions",
            width: 80,
            getActions: ({row}) => [
                <GridActionsCellItem key="view" icon={<VisibilityIcon/>} label="View" showInMenu
                    onClick={() => router.visit(route("inventory.purchase-requests.show", row.id))}/>,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Purchase Requests"
                actions={
                    <Button startIcon={<AddIcon/>} variant="contained" color="success"
                        onClick={() => router.visit(route("inventory.purchase-requests.create"))}>
                        New Request
                    </Button>
                }
            />
            <TableLayout
                Filter={PRFilter}
                defaultValues={requestInputs ?? {}} success={success} status={status}
                reload={handlePageReload} columns={columns} data={requests} errors={errors}
            />
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Purchase Requests", link: null}];

PurchaseRequestsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default PurchaseRequestsIndex;
