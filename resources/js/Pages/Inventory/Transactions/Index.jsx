import {useState, useCallback, useMemo} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Grid, MenuItem, TextField} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const TX_TYPES = ["ENTRY", "EXPORT", "ADJUST", "TRANSFER", "RETURN", "EXPIRED_REMOVAL"];
const TX_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "CANCELLED"];

const STATUS_COLORS = {
    DRAFT: "default",
    PENDING_APPROVAL: "warning",
    APPROVED: "success",
    CANCELLED: "error",
};

const TransactionsFilter = ({defaultFilter, onFilter, stores}) => {
    const [values, setValues] = useState({
        transaction_type: defaultFilter?.transaction_type ?? "",
        status:           defaultFilter?.status ?? "",
        store_id:         defaultFilter?.store_id ?? "",
        date_from:        defaultFilter?.date_from ?? "",
        date_to:          defaultFilter?.date_to ?? "",
    });
    const set = (field) => (e) => setValues((p) => ({...p, [field]: e.target.value}));
    const apply = () => onFilter(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")))();
    const reset = () => {
        setValues({transaction_type: "", status: "", store_id: "", date_from: "", date_to: ""});
        onFilter({})();
    };
    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Type" value={values.transaction_type} onChange={set("transaction_type")}>
                    <MenuItem value="">All Types</MenuItem>
                    {TX_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={values.status} onChange={set("status")}>
                    <MenuItem value="">All Statuses</MenuItem>
                    {TX_STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Store" value={values.store_id} onChange={set("store_id")}>
                    <MenuItem value="">All Stores</MenuItem>
                    {(stores ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField fullWidth size="small" type="date" label="From Date" value={values.date_from}
                    onChange={set("date_from")} InputLabelProps={{shrink: true}}/>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField fullWidth size="small" type="date" label="To Date" value={values.date_to}
                    onChange={set("date_to")} InputLabelProps={{shrink: true}}/>
            </Grid>
            <Grid item xs={12} md={2}>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                </Box>
            </Grid>
        </Grid>
    );
};

const TransactionsIndex = () => {
    const {transactions, requestInputs, stores, success, status, errors} = usePage().props;

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("inventory.transactions.index"), {
            data: {page, filters, sort, pageSize},
            only: ["transactions", "success", "status", "requestInputs"],
        });
    }, []);

    const Filter = useCallback(
        (props) => <TransactionsFilter {...props} stores={stores}/>,
        [stores]
    );

    const columns = useMemo(() => [
        {field: "reference_number", headerName: "Reference", width: 160},
        {
            field: "transaction_type",
            headerName: "Type",
            width: 140,
            renderCell: ({value}) => <Chip label={value} size="small" variant="outlined"/>,
        },
        {field: "transaction_date", headerName: "Date", width: 110},
        {field: "store", headerName: "Store", width: 140, valueGetter: (_, row) => row.store?.name},
        {field: "lines_count", headerName: "Lines", width: 70, type: "number"},
        {field: "total_value", headerName: "Value", width: 110, type: "number"},
        {
            field: "status",
            headerName: "Status",
            width: 150,
            renderCell: ({value}) => (
                <Chip label={value?.replace("_", " ")} color={STATUS_COLORS[value] || "default"} size="small"/>
            ),
        },
        {
            field: "id",
            headerName: "Actions",
            type: "actions",
            width: 80,
            getActions: ({row}) => [
                <GridActionsCellItem key="view" icon={<VisibilityIcon/>} label="View" showInMenu
                    onClick={() => router.visit(route("inventory.transactions.show", row.id))}/>,
            ],
        },
    ], []);

    return (
        <>
            <PageHeader
                title="Stock Transactions"
                actions={
                    <Button startIcon={<AddIcon/>} variant="contained" color="success"
                        onClick={() => router.visit(route("inventory.transactions.create"))}>
                        New Transaction
                    </Button>
                }
            />
            <TableLayout
                Filter={Filter}
                defaultValues={requestInputs} success={success} status={status}
                reload={handlePageReload} columns={columns} data={transactions} errors={errors}
            />
        </>
    );
};

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Transactions", link: null}];

TransactionsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default TransactionsIndex;
