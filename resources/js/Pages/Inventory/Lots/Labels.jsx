import {useEffect, useRef} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Grid, Paper, Stack, Tooltip, Typography} from "@mui/material";
import {styled} from "@mui/material/styles";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import JsBarcode from "jsbarcode";

const LabelCard = styled(Paper)({
    width: "90mm",
    minHeight: "50mm",
    padding: "4mm",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px dashed #bbb",
    boxSizing: "border-box",
    pageBreakAfter: "always",
    "@media print": {
        border: "none",
        boxShadow: "none",
        margin: 0,
        pageBreakAfter: "always",
    },
});

const LotLabel = ({lot}) => {
    const svgRef = useRef(null);
    const barcodeValue = lot.barcode || lot.lot_number;

    useEffect(() => {
        if (svgRef.current && barcodeValue) {
            try {
                JsBarcode(svgRef.current, barcodeValue, {
                    format: "CODE128",
                    width: 1.5,
                    height: 35,
                    displayValue: true,
                    fontSize: 9,
                    margin: 0,
                });
            } catch (_) {}
        }
    }, [barcodeValue]);

    const row = (label, value) =>
        value ? (
            <Box sx={{display: "flex", gap: 0.5}}>
                <Typography variant="caption" color="text.secondary" sx={{minWidth: 60, fontWeight: 600}}>
                    {label}:
                </Typography>
                <Typography variant="caption">{value}</Typography>
            </Box>
        ) : null;

    return (
        <LabelCard elevation={1}>
            <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{fontSize: "10pt", lineHeight: 1.2}}>
                    {lot.item?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{fontSize: "7pt"}}>
                    {lot.item?.item_code}
                </Typography>
            </Box>

            {barcodeValue && (
                <Box sx={{my: 0.5, textAlign: "center"}}>
                    <svg ref={svgRef}/>
                </Box>
            )}

            <Stack spacing={0.2}>
                {row("Lot #",    lot.lot_number)}
                {row("Brand",   lot.brand)}
                {row("Expiry",  lot.expiry_date)}
                {row("Store",   lot.store?.name)}
                {row("Location", lot.location?.label)}
                {row("Qty",     lot.quantity_base_units ? `${parseFloat(lot.quantity_base_units)} (base units)` : null)}
            </Stack>
        </LabelCard>
    );
};

const Labels = () => {
    const {lots, reference} = usePage().props;

    const handlePrint = () => window.print();
    const handleBack  = () => window.history.back();

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                    @page { margin: 5mm; }
                }
            `}</style>

            <Box className="no-print" sx={{mb: 2, display: "flex", alignItems: "center", gap: 1}}>
                <Tooltip title="Go back">
                    <Button startIcon={<ArrowBackIcon/>} variant="outlined" onClick={handleBack}>Back</Button>
                </Tooltip>
                <Typography variant="h6" sx={{flex: 1}}>
                    Lot Labels — {reference}
                </Typography>
                <Button startIcon={<PrintIcon/>} variant="contained" onClick={handlePrint}>
                    Print Labels
                </Button>
            </Box>

            <Grid container spacing={2}>
                {lots.map((lot, idx) => (
                    <Grid item key={lot.id ?? idx}>
                        <LotLabel lot={lot}/>
                    </Grid>
                ))}
            </Grid>

            {lots.length === 0 && (
                <Typography color="text.secondary" sx={{mt: 4, textAlign: "center"}}>
                    No lots found for this transaction.
                </Typography>
            )}
        </>
    );
};

Labels.layout = (page) => page;

export default Labels;
