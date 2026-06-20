import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Box,
    Typography,
    Paper,
    Container,
    Snackbar,
    Alert,
    Tooltip,
    IconButton,
    Grid as Grid,
    Chip,
    Stack,
    Divider,
    FormGroup,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import JsBarcode from 'jsbarcode';
import {
    Print as PrintIcon,
    LocalHospital as LocalHospitalIcon,
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

// Selectable fields for the barcode-view label. Defaults match what prints today.
const FIELDS = [
    { key: 'barcodeImage', label: 'Barcode' },
    { key: 'barcodeNumber', label: 'Barcode number' },
    { key: 'expireDate', label: 'Expire date' },
    { key: 'sampleType', label: 'Sample type' },
    { key: 'manufacturedDate', label: 'Manufactured date' },
    { key: 'tubeSeries', label: 'Tube series' },
    { key: 'packingSeries', label: 'Packing series' },
];

const DEFAULT_FIELDS = {
    barcodeImage: true,
    barcodeNumber: true,
    expireDate: true,
    sampleType: true,
    manufacturedDate: false,
    tubeSeries: false,
    packingSeries: false,
};

// Font-size presets multiply the base label text size. 'md' = current default.
const FONT_SCALES = {
    sm: 0.85,
    md: 1,
    lg: 1.2,
    xl: 1.4,
};

// Persist the user's print preferences across visits.
const STORAGE_KEY = 'materials.barcodes.printPrefs';

const loadPrefs = () => {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
        return {
            // Merge over defaults so newly-added fields keep their default visibility.
            fields: { ...DEFAULT_FIELDS, ...(saved.fields || {}) },
            fontSize: saved.fontSize in FONT_SCALES ? saved.fontSize : 'md',
        };
    } catch (_) {
        return { fields: DEFAULT_FIELDS, fontSize: 'md' };
    }
};

const savePrefs = (prefs) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_) {
        /* ignore storage write errors (private mode, quota) */
    }
};

// Styled components with enhanced styling
const BarcodeContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    margin: '0 auto',
    '@media print': {
        padding: 0,
    },
}));

const BarcodeItem = styled(Paper)(({ theme, printOnlyBarcode }) => ({
    paddingTop: '0mm',
    textAlign: 'center',
    margin: theme.spacing(1),
    display: printOnlyBarcode ? 'block' : 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    pageBreakAfter: 'always',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    width: '36mm',
    height: '24mm',
    border: '1px dashed #ddd',
    position: 'relative',
    overflow: 'hidden',
    '@media print': {
        margin: printOnlyBarcode ? 'auto' : 0,
        boxShadow: 'none',
        border: 'none',
        width: '100%',
        height: '100%',
    },
}));

const BarcodeText = styled(Typography)(({ printOnlyBarcode = false, scale = 1 }) => ({
    margin: '0.5px',
    lineHeight: printOnlyBarcode ? '3.5mm' : '2.5mm',
    fontWeight: 'bold',
    fontSize: printOnlyBarcode ? '3.5mm' : `${2.5 * scale}mm`,
    fontFamily: 'monospace',
    letterSpacing: '.15mm',
    textTransform: 'uppercase',
    zIndex: 1,
    background: '#fff',
    padding: printOnlyBarcode ? 'unset' : '0 1mm',
    width: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '@media print': {
        fontSize: printOnlyBarcode ? '3.5mm' : `${2.5 * scale}mm`,
    },
}));

const PrintButton = styled(IconButton)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
    '@media print': {
        display: 'none',
    },
}));

const BackButton = styled(IconButton)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    left: theme.spacing(3),
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: theme.palette.grey[300],
    },
    '@media print': {
        display: 'none',
    },
}));

const HeaderBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '@media print': {
        display: 'none',
    },
}));

const BarcodeComponent = ({ materials }) => {
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [printOnlyBarcode, setPrintOnlyBarcode] = useState(false);
    const [fields, setFields] = useState(() => loadPrefs().fields);
    const [fontSize, setFontSize] = useState(() => loadPrefs().fontSize);
    const scale = FONT_SCALES[fontSize] ?? 1;

    const handleChange = (e) => setPrintOnlyBarcode(e.target.checked);
    const toggleField = (key) => setFields((prev) => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        savePrefs({ fields, fontSize });
    }, [fields, fontSize]);

    useEffect(() => {
        // Initialize barcodes after component mounts (barcode view only).
        if (!printOnlyBarcode && fields.barcodeImage) {
            materials.forEach((material) => {
                JsBarcode(`#barcode-${material.barcode}`, material.barcode, {
                    format: 'CODE128',
                    width: 1,
                    height: 35,
                    displayValue: false,
                    background: '#ffffff',
                    lineColor: '#000000',
                });
            });
        }
        // Trigger print when component is loaded
        const printTimeout = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(printTimeout);
    }, [materials, printOnlyBarcode, fields.barcodeImage]);

    // Format date function with enhanced formatting
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.history.back();
    };

    const handleSnackbarClose = () => {
        setShowSnackbar(false);
    };

    return (
        <>
            <HeaderBar>
                <Typography variant="h6">
                    <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Barcode Labels Packing Series (
                    {materials.length ? materials[0].packing_series : ''})
                </Typography>
                <Box>
                    <FormControlLabel
                        sx={{ mt: 1 }}
                        label="Print Series & Dates"
                        control={
                            <Checkbox
                                checked={printOnlyBarcode}
                                name="printBarcode"
                                onChange={handleChange}
                            />
                        }
                    />
                </Box>
                <Chip
                    icon={<PrintIcon fontSize="small" />}
                    label="Ready for Printing"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ display: 'flex' }}
                />
            </HeaderBar>

            <Paper
                variant="outlined"
                sx={{
                    mx: 2,
                    mb: 2,
                    p: 2,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    alignItems: 'center',
                    '@media print': { display: 'none' },
                }}
            >
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Show on label
                    </Typography>
                    <FormGroup row>
                        {FIELDS.map((f) => (
                            <FormControlLabel
                                key={f.key}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={fields[f.key]}
                                        onChange={() => toggleField(f.key)}
                                    />
                                }
                                label={f.label}
                            />
                        ))}
                    </FormGroup>
                    {printOnlyBarcode && (
                        <Typography variant="caption" color="text.secondary">
                            Field selection applies to the barcode view (turn off “Print Series &
                            Dates”).
                        </Typography>
                    )}
                </Box>

                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: 'none', md: 'block' } }}
                />

                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Font size
                    </Typography>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={fontSize}
                        onChange={(_, value) => value && setFontSize(value)}
                    >
                        <ToggleButton value="sm">Small</ToggleButton>
                        <ToggleButton value="md">Medium</ToggleButton>
                        <ToggleButton value="lg">Large</ToggleButton>
                        <ToggleButton value="xl">X-Large</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            <BarcodeContainer>
                <Grid container spacing={0} sx={{ justifyContent: 'center', gap: 0 }}>
                    {materials.map((material) => (
                        <Grid
                            key={material.id}
                            size={12}
                            sx={{
                                display: printOnlyBarcode ? 'block' : 'flex',
                                justifyContent: 'center',
                                gap: '0',
                            }}
                            className="page-break"
                        >
                            <BarcodeItem printOnlyBarcode={printOnlyBarcode}>
                                {printOnlyBarcode ? (
                                    <Stack
                                        direction="column"
                                        sx={{ height: '100%', justifyContent: 'space-around' }}
                                    >
                                        <BarcodeText printOnlyBarcode>
                                            {material.tube_series}
                                        </BarcodeText>
                                        <Divider />
                                        <BarcodeText printOnlyBarcode>
                                            {formatDate(material.manufactured_date)}
                                        </BarcodeText>
                                        <Divider />
                                        <BarcodeText printOnlyBarcode>
                                            {formatDate(material.expire_date)}
                                        </BarcodeText>
                                    </Stack>
                                ) : (
                                    <>
                                        {fields.barcodeImage && (
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    pt: '0mm',
                                                    display: 'flex',
                                                    '& svg ': { width: '100% !important' },
                                                }}
                                            >
                                                <svg
                                                    id={`barcode-${material.barcode}`}
                                                    style={{ width: '100% !important' }}
                                                ></svg>
                                            </Box>
                                        )}
                                        <Stack spacing={0.5} sx={{ mt: '-3mm', zIndex: 1 }}>
                                            {fields.barcodeNumber && (
                                                <BarcodeText scale={scale}>
                                                    {material.barcode}
                                                </BarcodeText>
                                            )}
                                            {fields.expireDate && (
                                                <BarcodeText scale={scale}>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            mr: 0.5,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            material.expire_date ||
                                                                material.created_at,
                                                        )}
                                                    </Box>
                                                </BarcodeText>
                                            )}
                                            {fields.sampleType && (
                                                <BarcodeText
                                                    scale={scale}
                                                    title={material.sample_type_name}
                                                >
                                                    {material.sample_type_name}
                                                </BarcodeText>
                                            )}
                                            {fields.manufacturedDate && (
                                                <BarcodeText scale={scale}>
                                                    {formatDate(material.manufactured_date)}
                                                </BarcodeText>
                                            )}
                                            {fields.tubeSeries && (
                                                <BarcodeText scale={scale}>
                                                    {material.tube_series}
                                                </BarcodeText>
                                            )}
                                            {fields.packingSeries && (
                                                <BarcodeText scale={scale}>
                                                    {material.packing_series}
                                                </BarcodeText>
                                            )}
                                        </Stack>
                                    </>
                                )}
                            </BarcodeItem>
                        </Grid>
                    ))}
                </Grid>
            </BarcodeContainer>

            <Tooltip title="Print Barcodes">
                <PrintButton size="large" onClick={handlePrint}>
                    <PrintIcon />
                </PrintButton>
            </Tooltip>

            <Tooltip title="Go Back">
                <BackButton size="large" onClick={handleBack}>
                    <ArrowBackIcon />
                </BackButton>
            </Tooltip>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity="success"
                    sx={{ width: '100%' }}
                    action={
                        <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    Barcodes ready! Printing will start automatically...
                </Alert>
            </Snackbar>
        </>
    );
};

// Define custom print styles globally
const GlobalStyles = () => {
    useEffect(() => {
        // Create a style element
        const style = document.createElement('style');
        style.innerHTML = `
      @page {
        margin: 0;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .MuiGrid-container {
          display: block !important;
        }
        .MuiGrid-item {
          display: block !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          break-before: page;   /* or 'auto', 'avoid', etc. */
          break-after: page;
          break-inside: avoid;
        }
      }
    `;
        document.head.appendChild(style);

        // Clean up
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return null;
};

const BarcodePageComponent = ({ materials }) => {
    return (
        <>
            <Head title="Material Barcodes" />
            <GlobalStyles />
            <BarcodeComponent materials={materials} />
        </>
    );
};

export default BarcodePageComponent;
