import React, { useEffect, useMemo, useState } from 'react';
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
import { loadPrefs, savePrefs } from './Barcodes/constants';
import { BarcodeContainer, PrintButton, BackButton, HeaderBar } from './Barcodes/styled';
import GlobalStyles from './Barcodes/GlobalStyles';
import PrintControls from './Barcodes/PrintControls';
import SelectionControls from './Barcodes/SelectionControls';
import BarcodeLabel from './Barcodes/BarcodeLabel';

const BarcodeComponent = ({ materials }) => {
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [printOnlyBarcode, setPrintOnlyBarcode] = useState(false);
    const [fields, setFields] = useState(() => loadPrefs().fields);

    // Per-material selection & copy count. Default: every material selected, one copy each.
    const [selection, setSelection] = useState(() =>
        Object.fromEntries(materials.map((m) => [m.id, { selected: true, copies: 1 }])),
    );

    const handleChange = (e) => setPrintOnlyBarcode(e.target.checked);
    const toggleField = (key) =>
        setFields((prev) => ({ ...prev, [key]: { ...prev[key], show: !prev[key].show } }));
    const setFieldRepeat = (key, repeat) =>
        setFields((prev) => ({ ...prev, [key]: { ...prev[key], repeat } }));
    const setFieldSize = (key, size) =>
        setFields((prev) => ({ ...prev, [key]: { ...prev[key], size } }));

    const toggleMaterial = (id) =>
        setSelection((prev) => ({
            ...prev,
            [id]: { ...prev[id], selected: !prev[id].selected },
        }));
    const setCopies = (id, copies) =>
        setSelection((prev) => ({ ...prev, [id]: { ...prev[id], copies } }));
    const selectAll = (selected) =>
        setSelection((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([id, entry]) => [id, { ...entry, selected }]),
            ),
        );
    const setAllCopies = (copies) =>
        setSelection((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([id, entry]) => [id, { ...entry, copies }]),
            ),
        );

    const selectedCount = materials.filter((m) => selection[m.id]?.selected).length;

    // Expand each selected material into one print item per requested copy.
    const printItems = useMemo(
        () =>
            materials
                .filter((m) => selection[m.id]?.selected)
                .flatMap((material) => {
                    const copies = selection[material.id]?.copies ?? 1;
                    return Array.from({ length: copies }, (_, copyIndex) => ({
                        material,
                        key: `${material.id}-${copyIndex}`,
                    }));
                }),
        [materials, selection],
    );

    useEffect(() => {
        savePrefs({ fields });
    }, [fields]);

    // (Re)draw every rendered barcode SVG whenever the visible labels or field settings change.
    // The barcode image can repeat, so we target elements directly rather than by unique id.
    useEffect(() => {
        if (printOnlyBarcode) return;
        document.querySelectorAll('svg.barcode-svg').forEach((el) => {
            JsBarcode(el, el.dataset.barcodeValue, {
                format: 'CODE128',
                width: 1,
                height: 35,
                displayValue: false,
                background: '#ffffff',
                lineColor: '#000000',
            });
        });
    }, [printItems, printOnlyBarcode, fields]);

    // Auto-print once shortly after the page loads (unchanged behavior).
    useEffect(() => {
        const printTimeout = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(printTimeout);
    }, []);

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
                onSetFieldRepeat={setFieldRepeat}
                onSetFieldSize={setFieldSize}
                printOnlyBarcode={printOnlyBarcode}
            />

            <SelectionControls
                materials={materials}
                selection={selection}
                onToggle={toggleMaterial}
                onSetCopies={setCopies}
                onSelectAll={selectAll}
                onSetAllCopies={setAllCopies}
                totalLabels={printItems.length}
                selectedCount={selectedCount}
            />

            <BarcodeContainer data-testid="barcode-labels">
                <Grid container spacing={0} sx={{ justifyContent: 'center', gap: 0 }}>
                    {printItems.map(({ material, key }) => (
                        <BarcodeLabel
                            key={key}
                            material={material}
                            printOnlyBarcode={printOnlyBarcode}
                            fields={fields}
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
