import {useState} from "react";
import {usePage} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Grid,
    MenuItem, TextField, Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const REPORTS = [
    {value: "current_stock",        label: "Current Stock",        desc: "Stock on hand per item with low-stock flag."},
    {value: "transaction_history",  label: "Transaction History",  desc: "All approved transaction lines within a date range."},
    {value: "expiry",               label: "Expiry Report",        desc: "Lots that are expired or expiring within a window."},
];

const ReportCard = ({report, stores}) => {
    const [storeId,    setStoreId]    = useState("");
    const [dateFrom,   setDateFrom]   = useState("");
    const [dateTo,     setDateTo]     = useState("");
    const [txType,     setTxType]     = useState("");
    const [days,       setDays]       = useState("90");

    const buildUrl = () => {
        const params = new URLSearchParams({type: report.value});
        if (storeId)  params.set("store_id", storeId);
        if (dateFrom && report.value === "transaction_history") params.set("date_from", dateFrom);
        if (dateTo   && report.value === "transaction_history") params.set("date_to", dateTo);
        if (txType   && report.value === "transaction_history") params.set("transaction_type", txType);
        if (report.value === "expiry") params.set("days", days);
        return route("inventory.reports.export") + "?" + params.toString();
    };

    return (
        <Card>
            <CardHeader title={report.label} subheader={report.desc}/>
            <CardContent>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Store" value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}>
                            <MenuItem value="">All Stores</MenuItem>
                            {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                        </TextField>
                    </Grid>

                    {report.value === "transaction_history" && (
                        <>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth size="small" type="date" label="From"
                                    value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                    InputLabelProps={{shrink: true}}/>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth size="small" type="date" label="To"
                                    value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                    InputLabelProps={{shrink: true}}/>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select fullWidth size="small" label="Type" value={txType}
                                    onChange={(e) => setTxType(e.target.value)}>
                                    <MenuItem value="">All Types</MenuItem>
                                    {["ENTRY","EXPORT","ADJUST","TRANSFER","RETURN","EXPIRED_REMOVAL"].map((t) => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </>
                    )}

                    {report.value === "expiry" && (
                        <Grid item xs={12} sm={4}>
                            <TextField select fullWidth size="small" label="Window" value={days}
                                onChange={(e) => setDays(e.target.value)}>
                                {["30","60","90","180"].map((d) => (
                                    <MenuItem key={d} value={d}>Next {d} days</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}

                    <Grid item xs={12} sm="auto">
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon/>}
                            component="a"
                            href={buildUrl()}
                            download
                        >
                            Download Excel
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

const ReportsIndex = () => {
    const {stores} = usePage().props;

    return (
        <>
            <PageHeader title="Inventory Reports"/>
            <Box sx={{display: "flex", flexDirection: "column", gap: 3}}>
                {REPORTS.map((r) => (
                    <ReportCard key={r.value} report={r} stores={stores}/>
                ))}
            </Box>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Reports", link: null},
];

ReportsIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default ReportsIndex;
