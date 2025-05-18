import React, { useState } from 'react';
import { Head,Link } from '@inertiajs/react';
import OptimizedInvoiceReceipt from './Components/InvoiceReceipt';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    FormControlLabel,
    Checkbox,
    Divider,
    Card,
    CardContent,
    CardActions,
    Tooltip,
    Fade,
    Alert,
    useTheme
} from '@mui/material';
import {
    Print as PrintIcon,
    ArrowBack,
    FileDownload as PdfIcon,
    ContentCopy as CopyIcon,
    Check
} from '@mui/icons-material';
// Global print styles using CSS-in-JS - Optimized for A5 paper
const printStyles = `
  @media print {
    @page {
      size: 148mm 210mm !important; /* A5 size */
      margin: 0 !important;
      padding: 0 !important;
    }

    html, body {
      width: 148mm !important;
      height: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .hidden-print, .MuiAppBar-root, header, footer, nav, .MuiContainer-root {
      display: none !important;
    }

    /* Override any other elements that might affect printing */
    #root, main, div[role="main"] {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
    }

    /* Ensure background colors print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Only show the receipt in print mode */
    .print-container {
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 148mm !important;
      height: 210mm !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }
`;

const OptimizedPrint = ({ acceptance }) => {
    const theme = useTheme();
    const [shouldPrint, setShouldPrint] = useState(false);
    const [showLogo, setShowLogo] = useState(true);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    // Handle print button click
    const handlePrint = () => {
        setShouldPrint(true);
        setTimeout(() => {
            setShouldPrint(false);
        }, 100);
    };

    // Handle logo toggle
    const handleLogoToggle = (event) => {
        setShowLogo(event.target.checked);
        // Find and update the actual logo checkbox in the InvoiceReceipt component
        const logoCheckbox = document.getElementById('print-logo');
        if (logoCheckbox) {
            logoCheckbox.checked = event.target.checked;
            logoCheckbox.dispatchEvent(new Event('change'));
        }
    };

    // Handle save as PDF action - This uses the print dialog
    const handleSaveAsPdf = () => {
        setShouldPrint(true);
        setTimeout(() => {
            window.print();
            setShouldPrint(false);
        }, 100);
    };

    // Handle copy receipt number to clipboard
    const handleCopyReceiptNumber = () => {
        navigator.clipboard.writeText(`Receipt #${acceptance.id}`);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    // Calculate totals for the alert box
    const subtotal = (acceptance?.acceptanceItems?.tests?.reduce(
        (sum, item) => sum + parseFloat(item.price || 0), 0
    ) || 0) + (acceptance?.acceptanceItems?.panels?.reduce(
        (sum, item) => sum + parseFloat(item.price || 0), 0
    ) || 0);

    const totalDiscount = (acceptance?.acceptanceItems?.tests?.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0), 0
    ) || 0) + (acceptance?.acceptanceItems?.panels?.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0), 0
    ) || 0);

    const totalPayment = acceptance?.invoice?.payments?.reduce(
        (sum, payment) => sum + parseFloat(payment.price || 0), 0
    ) || 0;

    const finalTotal = subtotal - totalPayment - totalDiscount;

    return (
        <>
            <Head title={`Receipt - Acceptance #${acceptance.id}`}>
                <style>{printStyles}</style>
            </Head>

            <Container maxWidth="md" className="hidden-print" sx={{ mb: 3 }}>
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        bgcolor: 'background.paper',
                        mb: 2
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            Receipt #{acceptance.id}
                        </Typography>

                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            color="primary"
                            href={route('acceptances.show', acceptance.id)}
                            size="small"
                            component={Link}
                        >
                            Back
                        </Button>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Alert
                        severity="info"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    >
                        <Typography variant="body2">
                            Receipt for patient <strong>{acceptance.patient?.fullName}</strong>
                            <br />
                            Total: <strong>OMR {subtotal.toFixed(2)}</strong>
                            {totalDiscount > 0 && (<>, Discount: <strong>OMR {totalDiscount.toFixed(2)}</strong></>)}
                            {totalPayment > 0 && (<>, Paid: <strong>OMR {totalPayment.toFixed(2)}</strong></>)}
                            {finalTotal > 0 && (<>, Balance: <strong>OMR {finalTotal.toFixed(2)}</strong></>)}
                        </Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Card sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                            <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    Print Options
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={showLogo}
                                            onChange={handleLogoToggle}
                                            size="small"
                                        />
                                    }
                                    label="Show Logo"
                                />
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={handlePrint}
                                    fullWidth
                                    size="small"
                                >
                                    Print Receipt
                                </Button>
                            </CardActions>
                        </Card>

                        <Card sx={{ flex: '1 1 auto', minWidth: '200px' }}>
                            <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    Other Actions
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ pt: 0 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<PdfIcon />}
                                    onClick={handleSaveAsPdf}
                                    size="small"
                                >
                                    Save as PDF
                                </Button>

                                <Tooltip
                                    title={showCopySuccess ? "Copied!" : "Copy receipt #"}
                                    slots={{
                                        Transition:Fade
                                    }}

                                    slotProps={{Transition:{ timeout: 600 }}}
                                >
                                    <Button
                                        startIcon={showCopySuccess ? <Check /> : <CopyIcon />}
                                        onClick={handleCopyReceiptNumber}
                                        color={showCopySuccess ? "success" : "inherit"}
                                        variant="text"
                                        size="small"
                                    >
                                        {showCopySuccess ? "Copied" : "Copy #"}
                                    </Button>
                                </Tooltip>
                            </CardActions>
                        </Card>
                    </Box>
                </Paper>
            </Container>

            {/* This div ensures proper printing dimensions */}
            <Box className="print-container" sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
            }}>
                <OptimizedInvoiceReceipt
                    acceptance={acceptance}
                    onPrint={shouldPrint}
                    showLogo={showLogo}
                />
            </Box>
        </>
    );
};
export default OptimizedPrint;
