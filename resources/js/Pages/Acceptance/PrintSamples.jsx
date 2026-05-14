import React, {useEffect, useMemo} from 'react';
import {Head, Link} from '@inertiajs/react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Button,
    Chip,
    styled,
} from '@mui/material';
import {
    Print as PrintIcon,
    ArrowBack,
    Biotech,
} from '@mui/icons-material';

// ─── Preview dimensions ─────────────────────────────────────────
const A5_WIDTH = '148mm';
const A5_HEIGHT = '210mm';

// ─── Print-specific CSS ─────────────────────────────────────────
const printStyles = `
  @media print {
    @page {
      size: auto !important;
      margin: 0 !important;
    }
    html, body {
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .hidden-print {
      display: none !important;
    }
    .print-container {
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    #root, main, div[role="main"] {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 0 !important;
      overflow: visible !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

// ─── Styled components ──────────────────────────────────────────
const PageContainer = styled(Paper)(({theme}) => ({
    width: A5_WIDTH,
    minHeight: A5_HEIGHT,
    margin: 'auto',
    padding: '6mm',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    fontSize: '9pt',
    lineHeight: 1.3,
    '@media print': {
        boxShadow: 'none',
        margin: 0,
        width: '100%',
        maxWidth: 'none',
        minHeight: 'auto',
    }
}));

const HeaderBar = styled(Box)(({theme}) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
}));

const SectionHeading = styled(Box)(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(0.75),
    fontSize: '0.75rem',
}));

const StyledTable = styled(Table)(({theme}) => ({
    width: '100%',
    tableLayout: 'fixed',
    '& .MuiTableCell-root': {
        padding: '3px 6px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.72rem',
        lineHeight: 1.3,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        verticalAlign: 'top',
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
        backgroundColor: theme.palette.grey[100],
        fontWeight: 'bold',
        padding: '4px 6px',
        whiteSpace: 'normal',
    },
    '& .MuiChip-root': {
        maxWidth: '100%',
        height: 'auto',
        minHeight: 18,
        alignItems: 'flex-start',
    },
    '& .MuiChip-label': {
        display: 'block',
        whiteSpace: 'normal',
        overflow: 'visible',
        textOverflow: 'clip',
        overflowWrap: 'anywhere',
        lineHeight: 1.2,
    },
}));

const InfoLabel = styled(Typography)({
    fontWeight: 'bold',
    display: 'inline',
    fontSize: '0.72rem',
    color: '#555',
});

const InfoValue = styled(Typography)({
    display: 'inline',
    fontSize: '0.72rem',
});

const FooterBox = styled(Box)(({theme}) => ({
    marginTop: theme.spacing(1.5),
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.5),
    fontSize: '0.6rem',
    color: theme.palette.text.secondary,
}));

// ─── Helpers ────────────────────────────────────────────────────
const InfoItem = ({label, value}) => (
    <Box sx={{display: 'inline-flex', mr: 2, mb: 0.3}}>
        <InfoLabel component="span">{label}:&nbsp;</InfoLabel>
        <InfoValue component="span">{value || 'N/A'}</InfoValue>
    </Box>
);

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const buildSampleRows = (samples, acceptance) => {
    if (!samples || !Array.isArray(samples)) return [];

    return samples.map((sample, index) => {
        // Collect all test names for this sample from its active acceptanceItems
        const testNames = (sample.acceptance_items || [])
            .map(item => item?.method?.test?.name || item?.test?.name || 'Unknown')
            .filter(Boolean)
            .join(', ');

        const patient = sample.patient || acceptance?.patient;

        return {
            sampleIndex: index + 1,
            barcode: sample.barcode,
            sampleType: sample.sample_type?.name || 'N/A',
            testName: testNames || 'N/A',
            patientName: patient?.fullName || 'N/A',
            gender: patient?.gender || 'N/A',
            age: patient?.age ?? 'N/A',
        };
    });
};

// ─── Main Component ─────────────────────────────────────────────
const PrintSamples = ({acceptance, samples}) => {
    const rows = useMemo(() => buildSampleRows(samples, acceptance), [samples, acceptance]);

    const handlePrint = () => window.print();

    // Auto-print on load
    useEffect(() => {
        const t = setTimeout(() => window.print(), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <Head title={`Samples - Acceptance #${acceptance?.id}`}>
                <style>{printStyles}</style>
            </Head>

            {/* ── Toolbar (hidden on print) ────────────────────── */}
            <Box className="hidden-print" sx={{
                maxWidth: 600,
                mx: 'auto',
                mb: 2,
                p: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack/>}
                    component={Link}
                    href={route('acceptances.show', acceptance?.id)}
                    size="small"
                >
                    Back
                </Button>

                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                    Samples — Acceptance #{acceptance?.id}
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<PrintIcon/>}
                    onClick={handlePrint}
                    size="small"
                >
                    Print
                </Button>
            </Box>

            {/* ── Printable A5 page ────────────────────────────── */}
            <Box className="print-container" sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
            }}>
                <PageContainer elevation={3}>
                    {/* Header */}
                    <HeaderBar>
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            <Box
                                component="img"
                                src="https://biongenetic.com/wp-content/uploads/2021/11/mmclogo-1.png"
                                sx={{height: '20px', mr: 1}}
                                alt="Logo"
                            />
                            <Box>
                                <Typography variant="body1"
                                            sx={{fontWeight: 'bold', color: 'primary.main', fontSize: '0.85rem'}}>
                                    Muscat Medical Center
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{fontSize: '0.6rem'}}>
                                    Healthcare Excellence
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{textAlign: 'right'}}>
                            <Typography variant="subtitle2"
                                        sx={{color: 'secondary.main', fontSize: '0.75rem'}}>
                                Acceptance #{acceptance?.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{fontSize: '0.6rem'}}>
                                {formatDate(acceptance?.created_at)}
                            </Typography>
                        </Box>
                    </HeaderBar>

                    <Divider sx={{mb: 1}}/>

                    {/* Samples Table */}
                    <SectionHeading>
                        <Biotech sx={{mr: 0.5, fontSize: '0.75rem'}}/>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', fontSize: '0.75rem'}}>
                            Samples &amp; Tests
                        </Typography>
                    </SectionHeading>

                    <TableContainer component={Box}>
                        <StyledTable size="small" padding="none">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" sx={{width: '7%'}}>#</TableCell>
                                    <TableCell sx={{width: '18%'}}>Barcode</TableCell>
                                    <TableCell sx={{width: '18%'}}>Sample Type</TableCell>
                                    <TableCell sx={{width: '29%'}}>Test</TableCell>
                                    <TableCell sx={{width: '18%'}}>Patient</TableCell>
                                    <TableCell align="center" sx={{width: '5%'}}>Gender</TableCell>
                                    <TableCell align="center" sx={{width: '5%'}}>Age</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length > 0 ? rows.map((row, idx) => (
                                    <TableRow key={idx} sx={{
                                        '&:nth-of-type(even)': {backgroundColor: 'grey.50'},
                                    }}>
                                        <TableCell align="center">{row.sampleIndex}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            {row.barcode}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.sampleType}
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.62rem',
                                                    '& .MuiChip-label': {px: '5px'},
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{
                                            overflowWrap: 'anywhere',
                                            whiteSpace: 'normal',
                                        }}>
                                            {row.testName}
                                        </TableCell>
                                        <TableCell sx={{
                                            overflowWrap: 'anywhere',
                                            whiteSpace: 'normal',
                                        }}>
                                            {row.patientName}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.gender ? row.gender.charAt(0).toUpperCase() : '-'}
                                        </TableCell>
                                        <TableCell align="center">{row.age}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{py: 2, color: 'text.secondary'}}>
                                            No samples found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </StyledTable>
                    </TableContainer>

                    {/* Summary */}
                    <Box sx={{
                        mt: 1,
                        p: 0.75,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Typography variant="caption" sx={{fontWeight: 'bold', fontSize: '0.7rem'}}>
                            Total Tests: {rows.length}
                        </Typography>
                        <Typography variant="caption" sx={{fontSize: '0.65rem', color: 'text.secondary'}}>
                            Sampler: {acceptance?.sampler?.name || '_______________'}
                        </Typography>
                    </Box>

                    {/* Signature line */}
                    <Box sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 2,
                    }}>
                        <Box sx={{textAlign: 'center'}}>
                            <Box sx={{
                                width: 120,
                                borderBottom: '1px solid #999',
                                mb: 0.5,
                                height: 20,
                            }}/>
                            <Typography variant="caption" sx={{fontSize: '0.6rem', color: 'text.secondary'}}>
                                Sampler Signature
                            </Typography>
                        </Box>
                        <Box sx={{textAlign: 'center'}}>
                            <Box sx={{
                                width: 120,
                                borderBottom: '1px solid #999',
                                mb: 0.5,
                                height: 20,
                            }}/>
                            <Typography variant="caption" sx={{fontSize: '0.6rem', color: 'text.secondary'}}>
                                Date &amp; Time
                            </Typography>
                        </Box>
                    </Box>

                    {/* Footer */}
                    <FooterBox>
                        <Typography variant="caption" sx={{fontSize: '0.6rem'}}>
                            Thank you for choosing Bion Genetic Laboratory.
                        </Typography>
                    </FooterBox>
                </PageContainer>
            </Box>
        </>
    );
};

export default PrintSamples;
