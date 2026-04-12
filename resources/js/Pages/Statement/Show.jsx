import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {usePage} from "@inertiajs/react";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, Grid2 as Grid, Chip, Button,
} from "@mui/material";
import {
    Print as PrintIcon,
    ImportExport as ExportIcon,
    ArrowBack as BackIcon,
} from "@mui/icons-material";
import {router} from "@inertiajs/react";

const COMPANY_NAME    = "Muscat Medical Center";
const COMPANY_ADDRESS = "Muscat, Sultanate of Oman";
const COMPANY_PHONE   = "+968 2207 3671";
const CURRENCY        = "OMR";

const fmt = (num) => parseFloat(num || 0).toFixed(3);

const StatementShow = () => {
    const {statement, invoices, totals} = usePage().props;

    const handlePrint = () => window.print();

    return (
        <Box sx={{p: {xs: 2, md: 3}}}>
            {/* ── Toolbar (hidden when printing) ── */}
            <Box
                sx={{display: "flex", justifyContent: "space-between", mb: 2, "@media print": {display: "none"}}}
            >
                <Button
                    startIcon={<BackIcon/>}
                    onClick={() => router.visit(route("statements.index"))}
                    variant="outlined"
                    size="small"
                >
                    Back
                </Button>
                <Box sx={{display: "flex", gap: 1}}>
                    <Button
                        startIcon={<ExportIcon/>}
                        href={route("statements.export", statement.id)}
                        target="_blank"
                        variant="outlined"
                        size="small"
                        color="success"
                    >
                        Export Excel
                    </Button>
                    <Button
                        startIcon={<PrintIcon/>}
                        onClick={handlePrint}
                        variant="contained"
                        size="small"
                    >
                        Print
                    </Button>
                </Box>
            </Box>

            <Paper elevation={2} sx={{p: {xs: 2, md: 4}}}>
                {/* ── Company header ── */}
                <Box sx={{textAlign: "center", mb: 3}}>
                    <Typography variant="h4" fontWeight="bold" sx={{color: "#2E5090", letterSpacing: 1}}>
                        MONTHLY BILLING STATEMENT
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" sx={{mt: 0.5}}>
                        {COMPANY_NAME}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {COMPANY_ADDRESS} &nbsp;|&nbsp; Tel: {COMPANY_PHONE}
                    </Typography>
                </Box>

                <Divider sx={{mb: 3}}/>

                {/* ── Statement meta ── */}
                <Grid container spacing={2} sx={{mb: 3}}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <MetaRow label="Customer Name" value={statement.customer_name} bold />
                        <MetaRow label="Statement Number" value={statement.no} />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}} sx={{textAlign: {sm: "right"}}}>
                        <MetaRow label="Statement Date" value={statement.issue_date} />
                        <MetaRow label="Total Samples" value={statement.total_samples} />
                    </Grid>
                </Grid>

                <Divider sx={{mb: 2}}/>

                {/* ── Data table ── */}
                <TableContainer component={Paper} variant="outlined" sx={{mb: 4}}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{"& th": {bgcolor: "#2E5090", color: "#fff", fontWeight: "bold", whiteSpace: "nowrap"}}}>
                                <TableCell>#</TableCell>
                                <TableCell>Invoice No.</TableCell>
                                <TableCell>Registration Date</TableCell>
                                <TableCell>Patient Name</TableCell>
                                <TableCell>Test Codes</TableCell>
                                <TableCell>Test Names</TableCell>
                                <TableCell align="right">Gross ({CURRENCY})</TableCell>
                                <TableCell align="right">Discounts ({CURRENCY})</TableCell>
                                <TableCell align="right">Net ({CURRENCY})</TableCell>
                                <TableCell>Report Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.map((row, idx) => (
                                <TableRow
                                    key={idx}
                                    sx={{bgcolor: idx % 2 === 0 ? "#fff" : "#F8F9FA"}}
                                >
                                    <TableCell sx={{color: "text.secondary"}}>{idx + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium" sx={{color: "#2E5090"}}>
                                            {row.invoice_no || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: "nowrap"}}>{row.acceptance_date}</TableCell>
                                    <TableCell>{row.patient_name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{fontSize: "0.75rem"}}>
                                            {row.test_codes}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{fontSize: "0.75rem"}}>
                                            {row.test_names}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{fontVariantNumeric: "tabular-nums"}}>
                                        {fmt(row.gross_amount)}
                                    </TableCell>
                                    <TableCell align="right" sx={{fontVariantNumeric: "tabular-nums", color: "error.main"}}>
                                        {fmt(row.item_discounts + row.invoice_discount)}
                                    </TableCell>
                                    <TableCell align="right" sx={{fontVariantNumeric: "tabular-nums", fontWeight: "bold"}}>
                                        {fmt(row.net_amount)}
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: "nowrap"}}>
                                        <Chip
                                            label={row.reported_at}
                                            size="small"
                                            color={row.reported_at === "Pending" ? "warning" : "success"}
                                            variant="outlined"
                                            sx={{fontSize: "0.7rem"}}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Summary ── */}
                <Box sx={{display: "flex", justifyContent: "flex-end"}}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            minWidth: 300,
                            borderColor: "#2E5090",
                            borderWidth: 2,
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{color: "#2E5090", bgcolor: "#E8F0FE", px: 1, py: 0.5, borderRadius: 1, mb: 1.5}}
                        >
                            BILLING SUMMARY
                        </Typography>
                        <SummaryRow label="Total Gross Amount" value={fmt(totals.gross_amount)} />
                        <SummaryRow label="Total Discounts" value={fmt(totals.discounts)} color="error.main" />
                        <Divider sx={{my: 0.5}}/>
                        <SummaryRow label="Total Net Amount" value={fmt(totals.net_amount)} bold />
                    </Paper>
                </Box>

                {/* ── Footer ── */}
                <Box sx={{mt: 4, textAlign: "center"}}>
                    <Typography variant="caption" color="text.disabled">
                        Generated on: {statement.generated_at} &nbsp;|&nbsp; Statement: {statement.no}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

const MetaRow = ({label, value, bold}) => (
    <Box sx={{display: "flex", gap: 1, mb: 0.5, justifyContent: "inherit"}}>
        <Typography variant="body2" color="text.secondary" sx={{minWidth: 130}}>{label}:</Typography>
        <Typography variant="body2" fontWeight={bold ? "bold" : "medium"}>{value}</Typography>
    </Box>
);

const SummaryRow = ({label, value, bold, color}) => (
    <Box sx={{display: "flex", justifyContent: "space-between", py: 0.5}}>
        <Typography variant="body2" fontWeight={bold ? "bold" : "normal"}>{label}</Typography>
        <Typography variant="body2" fontWeight={bold ? "bold" : "normal"} color={color || "text.primary"}
                    sx={{fontVariantNumeric: "tabular-nums"}}>
            {value} {CURRENCY}
        </Typography>
    </Box>
);

const breadCrumbs = [
    {title: "Statements", link: null, icon: null},
    {title: "View Statement", link: null, icon: null},
];

StatementShow.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default StatementShow;
