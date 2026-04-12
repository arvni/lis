import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {usePage} from "@inertiajs/react";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, Grid2 as Grid, Chip, Button,
} from "@mui/material";
import {
    Print as PrintIcon,
    ImportExport as ExportIcon,
    PictureAsPdf as PdfIcon,
    TableChart as TableIcon,
    ArrowBack as BackIcon,
} from "@mui/icons-material";
import {router} from "@inertiajs/react";
import {useRef} from "react";
import generatePDF, {Resolution, Margin} from "react-to-pdf";

const COMPANY_NAME    = "Muscat Medical Center";
const COMPANY_ADDRESS = "Muscat, Sultanate of Oman";
const COMPANY_PHONE   = "+968 2207 3671";
const CURRENCY        = "OMR";

const fmt = (num) => parseFloat(num || 0).toFixed(3);

const pdfOptions = {
    resolution: Resolution.HIGH,
    page: {margin: Margin.MEDIUM, format: "a4", orientation: "landscape"},
    canvas: {mimeType: "image/jpeg", qualityRatio: 1},
    overrides: {pdf: {compress: true}},
};

const StatementShow = () => {
    const {statement, invoices, totals} = usePage().props;

    const pdfRef = useRef();

    const handleTableExcel = () => {
        const filename = `statement_${statement.no?.replace(/\//g, '-')}`;
        // Columns: 0=# 1=InvoiceNo 2=RegDate 3=Patient 4=Codes 5=Names 6=Gross 7=Discounts 8=Net 9=ReportDate
        // Meta: Customer+StatNo span cols 0-5 | Statement Date above col 8 | Total Samples above col 9
        // Summary: below cols 7-9 (label | value | currency)
        const COLS = 10;
        const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; }
  h2   { color: #2E5090; text-align: center; margin: 4px 0; }
  .center { text-align: center; color: #555; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th { background: #2E5090; color: #fff; font-weight: bold; padding: 6px 8px; border: 1px solid #2E5090; text-align: center; }
  td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: middle; }
  .meta td { border: none; padding: 2px 6px; }
  .data-row-even td { background: #fff; }
  .data-row-odd  td { background: #F8F9FA; }
  .summary-hdr td { background: #E8F0FE; color: #2E5090; font-weight: bold; font-size: 11pt; border: 1px solid #2E5090; }
  .summary-row td { border: 1px solid #ccc; }
  .total-row td   { font-weight: bold; border-top: 2px solid #2E5090; border-bottom: 2px solid #2E5090; }
  .empty td       { border: none; background: transparent; }
  .footer { text-align: center; color: #aaa; font-size: 9pt; margin-top: 20px; }
  .red { color: #d32f2f; }
  .blue { color: #2E5090; font-weight: bold; }
</style>
</head>
<body>
  <h2>MONTHLY BILLING STATEMENT</h2>
  <p class="center"><strong>${COMPANY_NAME}</strong></p>
  <p class="center">${COMPANY_ADDRESS} | Tel: ${COMPANY_PHONE}</p>
  <hr/>
  <table>
    <!-- Meta row 1: Customer Name (left) | Statement Date (last col) -->
    <tr class="meta">
      <td colspan="2"><strong>Customer Name:</strong> ${statement.customer_name || ''}</td>
      <td colspan="7"></td>
      <td style="color:#2E5090"><strong>Statement Date:</strong> ${statement.issue_date || ''}</td>
    </tr>
    <!-- Meta row 2: Statement Number (left) | Total Samples (last col) -->
    <tr class="meta">
      <td colspan="2"><strong>Statement Number:</strong> ${statement.no || ''}</td>
      <td colspan="7"></td>
      <td><strong>Total Samples:</strong> ${statement.total_samples || ''}</td>
    </tr>
    <!-- Header -->
    <tr>
      <th>#</th>
      <th>Invoice No.</th>
      <th>Registration Date</th>
      <th>Patient Name</th>
      <th>Test Codes</th>
      <th>Test Names</th>
      <th>Gross (${CURRENCY})</th>
      <th>Discounts (${CURRENCY})</th>
      <th>Net (${CURRENCY})</th>
      <th>Report Date</th>
    </tr>
    <!-- Data rows -->
    ${invoices.map((row, idx) => `
    <tr class="${idx % 2 === 0 ? 'data-row-even' : 'data-row-odd'}">
      <td style="text-align:center;color:#888">${idx + 1}</td>
      <td class="blue">${row.invoice_no || '—'}</td>
      <td style="white-space:nowrap">${row.acceptance_date || ''}</td>
      <td>${row.patient_name || ''}</td>
      <td style="font-size:10pt">${row.test_codes || ''}</td>
      <td style="font-size:10pt">${row.test_names || ''}</td>
      <td style="text-align:right">${fmt(row.gross_amount)}</td>
      <td style="text-align:right" class="red">${fmt(row.item_discounts + row.invoice_discount)}</td>
      <td style="text-align:right;font-weight:bold">${fmt(row.net_amount)}</td>
      <td style="white-space:nowrap">${row.reported_at || ''}</td>
    </tr>`).join('')}
    <!-- Summary header: spans cols 7-9 -->
    <tr class="summary-hdr">
      <td colspan="7" style="border:none;background:transparent"></td>
      <td colspan="3">BILLING SUMMARY</td>
    </tr>
    <!-- Summary rows -->
    <tr class="summary-row">
      <td colspan="7" style="border:none;background:transparent"></td>
      <td>Total Gross Amount</td>
      <td style="text-align:right">${fmt(totals.gross_amount)}</td>
      <td>${CURRENCY}</td>
    </tr>
    <tr class="summary-row">
      <td colspan="7" style="border:none;background:transparent"></td>
      <td class="red">Total Discounts</td>
      <td style="text-align:right" class="red">${fmt(totals.discounts)}</td>
      <td>${CURRENCY}</td>
    </tr>
    <tr class="total-row">
      <td colspan="7" style="border:none;background:transparent"></td>
      <td>Total Net Amount</td>
      <td style="text-align:right">${fmt(totals.net_amount)}</td>
      <td>${CURRENCY}</td>
    </tr>
  </table>
  <p class="footer">Generated on: ${statement.generated_at} | Statement: ${statement.no}</p>
</body>
</html>`;
        const blob = new Blob(['\ufeff', html], {type: 'application/vnd.ms-excel'});
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${filename}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => window.print();

    const printStyles = `
        @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body * { visibility: hidden !important; }
            #statement-print-area,
            #statement-print-area * { visibility: visible !important; }
            #statement-print-area {
                position: fixed;
                inset: 0;
                font-size: 14pt;
                background: #fff;
                padding: 10mm;
                box-shadow: none;
            }
        }
    `;

    const handlePdf = () =>
        generatePDF(pdfRef, {
            ...pdfOptions,
            filename: `statement_${statement.no?.replace(/\//g, "-")}.pdf`,
        });

    return (
        <Box sx={{p: {xs: 2, md: 3}}}>
            <style>{printStyles}</style>
            {/* ── Toolbar (hidden when printing) ── */}
            <Box sx={{display: "flex", justifyContent: "space-between", mb: 2, "@media print": {display: "none"}}}>
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

                    {/* Client-side table → Excel */}
                    <Button startIcon={<TableIcon/>} onClick={handleTableExcel} variant="outlined" size="small" color="secondary">
                        Download Table
                    </Button>

                    {/* PDF */}
                    <Button
                        startIcon={<PdfIcon/>}
                        onClick={handlePdf}
                        variant="outlined"
                        size="small"
                        color="error"
                    >
                        Save PDF
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

            {/* ── Printable / PDF content ── */}
            <Paper ref={pdfRef} id="statement-print-area" elevation={2} sx={{p: {xs: 2, md: 4}}}>
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
                    <Grid size={{xs: 12, sm: 6}} sx={{display: "flex", flexDirection: "column", alignItems: {sm: "flex-end"}}}>
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
                                <TableRow key={idx} sx={{bgcolor: idx % 2 === 0 ? "#fff" : "#F8F9FA"}}>
                                    <TableCell sx={{color: "text.secondary"}}>{idx + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium" sx={{color: "#2E5090"}}>
                                            {row.invoice_no || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: "nowrap"}}>{row.acceptance_date}</TableCell>
                                    <TableCell>{row.patient_name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{fontSize: "0.75rem"}}>{row.test_codes}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{fontSize: "0.75rem"}}>{row.test_names}</Typography>
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
                    <Paper variant="outlined" sx={{p: 2, minWidth: 300, borderColor: "#2E5090", borderWidth: 2}}>
                        <Typography
                            variant="subtitle1" fontWeight="bold"
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
    <Box sx={{display: "flex", gap: 1, mb: 0.5}}>
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
    <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
);

export default StatementShow;
