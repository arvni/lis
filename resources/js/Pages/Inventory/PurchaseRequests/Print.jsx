import { Head, Link, usePage } from '@inertiajs/react';
import { Box, Button, GlobalStyles, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import OrderHeader from './Print/OrderHeader';
import PartiesSection, { SectionTitle } from './Print/PartiesSection';
import OrderLinesTable from './Print/OrderLinesTable';
import SignatoryBlock from './Print/SignatoryBlock';
import { BRAND, DEFAULT_CURRENCY } from './Print/company';
import { formatDate } from './Print/format';

const pageStyles = {
    '@page': { size: 'A4', margin: '12mm' },
    body: {
        backgroundColor: '#E9EDF2',
        // Keep the brand fills (table header, total) when printing.
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
    },
    '@media print': { body: { backgroundColor: '#fff' } },
};

// An A4 sheet on screen; on paper the @page margins take its place.
const sheet = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    width: '210mm',
    maxWidth: '100%',
    minHeight: '297mm',
    mx: 'auto',
    mb: 4,
    p: '14mm',
    overflow: 'hidden',
    bgcolor: '#fff',
    color: BRAND.ink,
    // The print page has no app layout, so it doesn't inherit a font.
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.12)',
    '@media print': { width: 'auto', minHeight: 'auto', m: 0, p: 0, boxShadow: 'none' },
};

const watermark = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    '& span': {
        transform: 'rotate(-30deg)',
        fontSize: '84pt',
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(220, 38, 38, 0.13)',
    },
};

const Print = () => {
    const { purchaseRequest: pr, approvedAt } = usePage().props;
    const currency = pr.currency || DEFAULT_CURRENCY;

    return (
        <>
            <Head title={`Purchase Order ${pr.po_number}`} />
            <GlobalStyles styles={pageStyles} />

            <Stack
                direction="row"
                sx={{
                    justifyContent: 'space-between',
                    width: '210mm',
                    maxWidth: '100%',
                    mx: 'auto',
                    py: 2,
                    '@media print': { display: 'none' },
                }}
            >
                <Button
                    component={Link}
                    href={route('inventory.purchase-requests.show', pr.id)}
                    startIcon={<ArrowBackIcon />}
                >
                    Back to request
                </Button>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                >
                    Print
                </Button>
            </Stack>

            <Box component="article" sx={sheet}>
                {pr.status === 'CANCELLED' && (
                    <Box sx={watermark}>
                        <span>Cancelled</span>
                    </Box>
                )}

                <OrderHeader pr={pr} approvedAt={approvedAt} />
                <PartiesSection pr={pr} currency={currency} />
                <OrderLinesTable lines={pr.lines} currency={currency} />

                {/* The note to the supplier from Issue PO — the request's own notes are internal. */}
                {pr.po_notes && (
                    <Box sx={{ mt: '6mm', breakInside: 'avoid' }}>
                        <SectionTitle>Notes</SectionTitle>
                        <Box sx={{ fontSize: '8.5pt', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {pr.po_notes}
                        </Box>
                    </Box>
                )}

                <SignatoryBlock signer={pr.signer} />

                <Box
                    component="footer"
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '6mm',
                        mt: 'auto',
                        pt: '2.5mm',
                        borderTop: `1px solid ${BRAND.rule}`,
                        fontSize: '7.5pt',
                        color: BRAND.muted,
                        '@media print': { mt: '10mm' },
                    }}
                >
                    <span>
                        Please quote <strong>{pr.po_number}</strong> on all invoices, delivery notes
                        and correspondence.
                    </span>
                    <span>Printed {formatDate(new Date())}</span>
                </Box>
            </Box>
        </>
    );
};

export default Print;
