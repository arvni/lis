import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Box,
    Typography,
    Snackbar,
    Alert,
    Tooltip,
    IconButton,
    Grid as Grid,
    Chip,
} from '@mui/material';
import JsBarcode from 'jsbarcode';
import {
    Print as PrintIcon,
    LocalHospital as LocalHospitalIcon,
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FONT_SCALES, loadPrefs, savePrefs } from './Barcodes/constants';
import { BarcodeContainer, PrintButton, BackButton, HeaderBar } from './Barcodes/styled';
import GlobalStyles from './Barcodes/GlobalStyles';
import PrintControls from './Barcodes/PrintControls';
import BarcodeLabel from './Barcodes/BarcodeLabel';

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

            <PrintControls
                fields={fields}
                onToggleField={toggleField}
                printOnlyBarcode={printOnlyBarcode}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
            />

            <BarcodeContainer>
                <Grid container spacing={0} sx={{ justifyContent: 'center', gap: 0 }}>
                    {materials.map((material) => (
                        <BarcodeLabel
                            key={material.id}
                            material={material}
                            printOnlyBarcode={printOnlyBarcode}
                            fields={fields}
                            scale={scale}
                        />
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
