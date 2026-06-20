import { useEffect, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import JsBarcode from 'jsbarcode';

// Selectable label fields. All on by default = current print behaviour.
const FIELDS = [
    { key: 'itemName', label: 'Item name' },
    { key: 'itemCode', label: 'Item code' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'lotNumber', label: 'Lot #' },
    { key: 'brand', label: 'Brand' },
    { key: 'expiry', label: 'Expiry' },
    { key: 'store', label: 'Store' },
    { key: 'location', label: 'Location' },
    { key: 'qty', label: 'Quantity' },
];

const DEFAULT_FIELDS = Object.fromEntries(FIELDS.map((f) => [f.key, true]));

// Font-size presets multiply the base label point sizes. 'md' = current default.
const FONT_SCALES = {
    sm: 0.85,
    md: 1,
    lg: 1.2,
    xl: 1.4,
};

// Persist the user's print preferences across visits.
const STORAGE_KEY = 'inventory.lotLabels.printPrefs';

const loadPrefs = () => {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
        return {
            // Merge over defaults so newly-added fields stay visible by default.
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

const LabelCard = styled(Paper)({
    width: '90mm',
    minHeight: '50mm',
    padding: '4mm',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px dashed #bbb',
    boxSizing: 'border-box',
    pageBreakAfter: 'always',
    '@media print': {
        border: 'none',
        boxShadow: 'none',
        margin: 0,
        pageBreakAfter: 'always',
    },
});

const LotLabel = ({ lot, fields, scale }) => {
    const svgRef = useRef(null);
    const barcodeValue = lot.barcode || lot.lot_number;
    const showBarcode = fields.barcode && barcodeValue;

    useEffect(() => {
        if (showBarcode && svgRef.current) {
            try {
                JsBarcode(svgRef.current, barcodeValue, {
                    format: 'CODE128',
                    width: 1.5,
                    height: 35,
                    displayValue: true,
                    fontSize: 9,
                    margin: 0,
                });
            } catch (_) {
                /* ignore label render errors */
            }
        }
    }, [barcodeValue, showBarcode]);

    const row = (label, value) =>
        value ? (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 60, fontWeight: 600, fontSize: `${8 * scale}pt` }}
                >
                    {label}:
                </Typography>
                <Typography variant="caption" sx={{ fontSize: `${8 * scale}pt` }}>
                    {value}
                </Typography>
            </Box>
        ) : null;

    return (
        <LabelCard elevation={1}>
            <Box>
                {fields.itemName && (
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ fontSize: `${10 * scale}pt`, lineHeight: 1.2 }}
                    >
                        {lot.item?.name}
                    </Typography>
                )}
                {fields.itemCode && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: `${7 * scale}pt` }}
                    >
                        {lot.item?.item_code}
                    </Typography>
                )}
            </Box>

            {showBarcode && (
                <Box sx={{ my: 0.5, textAlign: 'center' }}>
                    <svg ref={svgRef} />
                </Box>
            )}

            <Stack spacing={0.2}>
                {fields.lotNumber && row('Lot #', lot.lot_number)}
                {fields.brand && row('Brand', lot.brand)}
                {fields.expiry && row('Expiry', lot.expiry_date)}
                {fields.store && row('Store', lot.store?.name)}
                {fields.location && row('Location', lot.location?.label)}
                {fields.qty &&
                    row(
                        'Qty',
                        lot.quantity_base_units
                            ? `${parseFloat(lot.quantity_base_units)} (base units)`
                            : null,
                    )}
            </Stack>
        </LabelCard>
    );
};

const Labels = () => {
    const { lots, reference } = usePage().props;

    const [fields, setFields] = useState(() => loadPrefs().fields);
    const [fontSize, setFontSize] = useState(() => loadPrefs().fontSize);
    const scale = FONT_SCALES[fontSize] ?? 1;

    useEffect(() => {
        savePrefs({ fields, fontSize });
    }, [fields, fontSize]);

    const toggleField = (key) => setFields((prev) => ({ ...prev, [key]: !prev[key] }));

    const handlePrint = () => window.print();
    const handleBack = () => window.history.back();

    return (
        <>
            <Head title={`Lot Labels — ${reference}`} />
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                    @page { margin: 5mm; }
                }
            `}</style>

            <Box className="no-print" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Go back">
                    <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={handleBack}>
                        Back
                    </Button>
                </Tooltip>
                <Typography variant="h6" sx={{ flex: 1 }}>
                    Lot Labels — {reference}
                </Typography>
                <Button startIcon={<PrintIcon />} variant="contained" onClick={handlePrint}>
                    Print Labels
                </Button>
            </Box>

            <Paper
                className="no-print"
                variant="outlined"
                sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}
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
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

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

            <Grid container spacing={2}>
                {lots.map((lot, idx) => (
                    <Grid key={lot.id ?? idx}>
                        <LotLabel lot={lot} fields={fields} scale={scale} />
                    </Grid>
                ))}
            </Grid>

            {lots.length === 0 && (
                <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                    No lots found for this transaction.
                </Typography>
            )}
        </>
    );
};

Labels.layout = (page) => page;

export default Labels;
