import {useState} from "react";
import {Head, router, usePage, useForm} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
    Divider, Grid, IconButton, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import ItemSelect from "@/Pages/Inventory/Components/ItemSelect";
import UnitSelect from "@/Pages/Inventory/Components/UnitSelect";
import LocationSelect from "@/Pages/Inventory/Components/LocationSelect";
import LotSelect from "@/Pages/Inventory/Components/LotSelect";
import BarcodeInput from "@/Pages/Inventory/Components/BarcodeInput";
import SupplierSelect from "@/Pages/Inventory/Components/SupplierSelect";
import BrandInput from "@/Pages/Inventory/Components/BrandInput";
import FifoPreview from "@/Pages/Inventory/Components/FifoPreview";
import LotPickerDialog from "@/Pages/Inventory/Components/LotPickerDialog";

const USES_EXISTING_LOTS = ["EXPORT", "RETURN", "EXPIRED_REMOVAL", "TRANSFER"];

const emptyLine = () => ({
    _item: null,
    _unit: null,
    _location: null,
    _lot: null,
    _barcode_locked: false,
    _lots_from_scan: [],
    item_id: null,
    unit_id: null,
    quantity: "",
    barcode: "",
    lot_number: "",
    brand: "",
    cat_no: "",
    expiry_date: "",
    unit_price: "",
    store_location_id: null,
    notes: "",
});

const toPayloadLine = ({_item, _unit, _location, _lot, _barcode_locked, _lots_from_scan, ...rest}) => rest;

const lineFromSource = (line) => ({
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _location: null,
    _lot: null,
    _barcode_locked: false,
    _lots_from_scan: [],
    item_id: line.item_id,
    unit_id: line.unit_id,
    quantity: line.quantity ?? "",
    barcode: "",
    lot_number: line.lot_number ?? "",
    brand: line.brand ?? "",
    cat_no: line.cat_no ?? "",
    expiry_date: line.expiry_date ?? "",
    unit_price: line.unit_price ?? "",
    store_location_id: null,
    notes: line.notes ?? "",
});

const payloadFromSource = (line) => toPayloadLine(lineFromSource(line));

const TransactionAdd = () => {
    const {transactionTypes, stores, defaults} = usePage().props;

    const {data, setData, post, processing, errors} = useForm({
        transaction_type: defaults?.transaction_type ?? "",
        transaction_date: new Date().toISOString().split("T")[0],
        store_id: defaults?.store_id ?? "",
        destination_store_id: defaults?.destination_store_id ?? "",
        supplier_id: defaults?.supplier_id ?? "",
        notes: defaults?.notes ?? "",
        lines: defaults?.lines?.map(payloadFromSource) ?? [],
    });

    const [lineItems,     setLineItems]     = useState(() => defaults?.lines?.map(lineFromSource) ?? []);
    const [supplierObj,   setSupplierObj]   = useState(defaults?.supplier ?? null);
    const [lotPickerLine, setLotPickerLine] = useState(null); // index of line with open lot picker

    const syncLines = (updated) => {
        setLineItems(updated);
        setData("lines", updated.map(toPayloadLine));
    };

    const addLine    = () => syncLines([...lineItems, emptyLine()]);
    const removeLine = (idx) => syncLines(lineItems.filter((_, i) => i !== idx));

    const updateLine = (idx, field, value) => {
        syncLines(lineItems.map((l, i) => i === idx ? {...l, [field]: value} : l));
    };

    const setLineItem = (idx, item) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _item: item, item_id: item?.id ?? null, _unit: null, unit_id: null}
            : l
        ));
    };

    const setLineUnit = (idx, unit) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _unit: unit, unit_id: unit?.id ?? null}
            : l
        ));
    };

    const setLineLot = (idx, lot) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _lot: lot, lot_number: lot?.lot_number ?? "", brand: lot?.brand ?? ""}
            : l
        ));
    };

    const setLineLocation = (idx, location) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _location: location, store_location_id: location?.id ?? null}
            : l
        ));
    };

    const isEntry        = ["ENTRY", "RETURN"].includes(data.transaction_type);
    const usesExistingLots = USES_EXISTING_LOTS.includes(data.transaction_type);
    const showExpiry     = !usesExistingLots;
    const showFifo       = ["EXPORT", "TRANSFER"].includes(data.transaction_type);
    const isTransfer     = data.transaction_type === "TRANSFER";

    const handleBarcodeFound = (idx, scanData) => {
        const item = scanData.item ?? null;
        const unit = scanData.unit ?? null;
        const lots = scanData.lots ?? [];

        if (isEntry) {
            // Entry: lock item/unit, prefill lot details if available but keep them editable
            const hint = lots.length === 1 ? lots[0] : null;
            syncLines(lineItems.map((l, i) => i === idx ? {
                ...l,
                _barcode_locked: true,
                _item: item,
                _unit: unit,
                item_id: item?.id ?? null,
                unit_id: unit?.id ?? null,
                barcode: scanData.barcode ?? l.barcode,
                lot_number: hint?.lot_number ?? "",
                brand: hint?.brand ?? "",
                expiry_date: hint?.expiry_date ?? "",
            } : l));
            return;
        }

        // Exit types (EXPORT, TRANSFER, RETURN, EXPIRED_REMOVAL)
        if (lots.length === 1) {
            const lot = lots[0];
            syncLines(lineItems.map((l, i) => i === idx ? {
                ...l,
                _barcode_locked: true,
                _item: item,
                _unit: unit,
                _lot: lot,
                item_id: item?.id ?? null,
                unit_id: unit?.id ?? null,
                lot_number: lot.lot_number ?? "",
                brand: lot.brand ?? "",
                expiry_date: lot.expiry_date ?? "",
                barcode: scanData.barcode ?? l.barcode,
            } : l));
            return;
        }

        if (lots.length > 1) {
            // Multiple lots — store them and open the picker
            syncLines(lineItems.map((l, i) => i === idx ? {
                ...l,
                _barcode_locked: false,
                _item: item,
                _unit: unit,
                _lot: null,
                _lots_from_scan: lots,
                item_id: item?.id ?? null,
                unit_id: unit?.id ?? null,
                barcode: scanData.barcode ?? l.barcode,
                lot_number: "",
                brand: "",
                expiry_date: "",
            } : l));
            setLotPickerLine(idx);
            return;
        }

        // No active lots — item identified but no stock; lock item only
        syncLines(lineItems.map((l, i) => i === idx ? {
            ...l,
            _barcode_locked: true,
            _item: item,
            _unit: unit,
            item_id: item?.id ?? null,
            unit_id: unit?.id ?? null,
            barcode: scanData.barcode ?? l.barcode,
        } : l));
    };

    const handleBarcodeNotFound = (idx, barcode) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, barcode, _barcode_locked: false}
            : l
        ));
    };

    const unlockLine = (idx) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...emptyLine(), barcode: l.barcode}
            : l
        ));
    };

    const handleLotPicked = (lot) => {
        if (lotPickerLine === null) return;
        syncLines(lineItems.map((l, i) => i === lotPickerLine ? {
            ...l,
            _barcode_locked: true,
            _lot: lot,
            lot_number: lot.lot_number ?? "",
            brand: lot.brand ?? "",
            expiry_date: lot.expiry_date ?? "",
        } : l));
        setLotPickerLine(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventory.transactions.store"));
    };

    return (
        <>
            <Head title="New Stock Transaction"/>
            <PageHeader title="New Stock Transaction"/>
            <Box component="form" onSubmit={handleSubmit}>
                <Card sx={{mb: 3}}>
                    <CardHeader title="Transaction Details"/>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }} >
                                <TextField
                                    select fullWidth required label="Transaction Type"
                                    value={data.transaction_type}
                                    onChange={(e) => setData("transaction_type", e.target.value)}
                                    error={!!errors.transaction_type}
                                >
                                    {transactionTypes.map((t) => (
                                        <MenuItem key={t.value} value={t.value}>{t.name ?? t.value}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }} >
                                <TextField
                                    fullWidth required type="date" label="Transaction Date"
                                    value={data.transaction_date}
                                    onChange={(e) => setData("transaction_date", e.target.value)}
                                    slotProps={{ inputLabel: {shrink: true} }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }} >
                                <TextField
                                    select fullWidth required label="Source Store"
                                    value={data.store_id}
                                    onChange={(e) => setData("store_id", e.target.value)}
                                    error={!!errors.store_id}
                                >
                                    {stores.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {isTransfer && (
                                <Grid size={{ xs: 12, md: 4 }} >
                                    <TextField
                                        select fullWidth required label="Destination Store"
                                        value={data.destination_store_id}
                                        onChange={(e) => setData("destination_store_id", e.target.value)}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}
                            {isEntry && (
                                <Grid size={{ xs: 12, md: 4 }} >
                                    <SupplierSelect
                                        label="Supplier (optional)"
                                        value={supplierObj}
                                        onChange={(s) => { setSupplierObj(s); setData("supplier_id", s?.id ?? ""); }}
                                    />
                                </Grid>
                            )}
                            <Grid size={12} >
                                <TextField
                                    fullWidth multiline rows={2} label="Notes"
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{mb: 3}}>
                    <CardHeader
                        title="Line Items"
                        action={
                            <Button startIcon={<AddIcon/>} size="small" variant="outlined" onClick={addLine}>
                                Add Line
                            </Button>
                        }
                    />
                    <CardContent>
                        {lineItems.length === 0 ? (
                            <Alert severity="info">Click "Add Line" to add items. You can scan the barcode on each item to auto-fill details.</Alert>
                        ) : (
                            <Stack spacing={2}>
                                {lineItems.map((line, idx) => (
                                    <Card key={idx} variant="outlined"
                                        sx={{bgcolor: line._barcode_locked ? "action.hover" : "background.paper"}}>
                                        <Stack direction="row" spacing={1}
                                            sx={{alignItems: "center", justifyContent: "space-between", px: 2, py: 1, bgcolor: "action.selected"}}>
                                            <Stack direction="row" spacing={1} sx={{alignItems: "center"}}>
                                                <Typography variant="subtitle2">Line {idx + 1}</Typography>
                                                {line._barcode_locked && (
                                                    <Chip size="small" color="warning" variant="outlined"
                                                        icon={<LockOpenIcon fontSize="small"/>}
                                                        label="Auto-filled — click Unlock to edit"/>
                                                )}
                                            </Stack>
                                            <Stack direction="row" spacing={1} sx={{alignItems: "center"}}>
                                                {line._barcode_locked && (
                                                    <Button size="small" color="warning"
                                                        startIcon={<LockOpenIcon fontSize="small"/>}
                                                        onClick={() => unlockLine(idx)}>
                                                        Unlock
                                                    </Button>
                                                )}
                                                <IconButton size="small" color="error"
                                                    title="Remove line"
                                                    onClick={() => removeLine(idx)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Stack>
                                        </Stack>
                                        <Divider/>
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid size={{xs: 12, md: 4}}>
                                                    <BarcodeInput
                                                        size="small"
                                                        value={line.barcode}
                                                        onChange={(val) => updateLine(idx, "barcode", val)}
                                                        onFound={(scanData) => handleBarcodeFound(idx, scanData)}
                                                        onNotFound={(bc) => handleBarcodeNotFound(idx, bc)}
                                                    />
                                                </Grid>
                                                <Grid size={{xs: 12, md: 5}}>
                                                    <ItemSelect
                                                        size="small"
                                                        value={line._item}
                                                        onChange={(item) => setLineItem(idx, item)}
                                                        required
                                                        disabled={line._barcode_locked}
                                                        error={!!errors[`lines.${idx}.item_id`]}
                                                    />
                                                </Grid>
                                                <Grid size={{xs: 6, md: 3}}>
                                                    <UnitSelect
                                                        size="small"
                                                        itemId={line._item?.id}
                                                        allUnits={[]}
                                                        value={line._unit}
                                                        onChange={(unit) => setLineUnit(idx, unit)}
                                                        required
                                                        disabled={line._barcode_locked}
                                                        error={!!errors[`lines.${idx}.unit_id`]}
                                                    />
                                                </Grid>
                                                <Grid size={{xs: 6, md: 2}}>
                                                    <TextField size="small" type="number" fullWidth required
                                                        label="Quantity"
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                                                        slotProps={{ htmlInput: {min: 0, step: "any"} }}
                                                        error={!!errors[`lines.${idx}.quantity`]}
                                                        autoFocus={line._barcode_locked}
                                                    />
                                                </Grid>
                                                <Grid size={{xs: 12, md: 5}}>
                                                    <LocationSelect
                                                        size="small"
                                                        storeId={data.store_id}
                                                        itemId={line._item?.id}
                                                        transactionType={data.transaction_type}
                                                        value={line._location}
                                                        onChange={(loc) => setLineLocation(idx, loc)}
                                                        label="Location"
                                                    />
                                                </Grid>
                                                <Grid size={{xs: 12, md: 5}}>
                                                    {usesExistingLots ? (
                                                        <LotSelect
                                                            size="small"
                                                            itemId={line._item?.id}
                                                            storeId={data.store_id}
                                                            value={line._lot}
                                                            onChange={(lot) => setLineLot(idx, lot)}
                                                            disabled={line._barcode_locked}
                                                        />
                                                    ) : (
                                                        // Entry: lot number is always free-text, never locked
                                                        <TextField size="small" fullWidth label="Lot #"
                                                            value={line.lot_number}
                                                            onChange={(e) => updateLine(idx, "lot_number", e.target.value)}
                                                        />
                                                    )}
                                                </Grid>
                                                {isEntry && (
                                                    <Grid size={{xs: 6, md: 2}}>
                                                        <TextField size="small" type="number" fullWidth
                                                            label="Unit Price"
                                                            value={line.unit_price}
                                                            onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                                                            slotProps={{ htmlInput: {min: 0, step: "any"} }}
                                                        />
                                                    </Grid>
                                                )}
                                                {showExpiry && (<>
                                                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                                                        <BrandInput
                                                            size="small"
                                                            value={line.brand}
                                                            itemId={line._item?.id}
                                                            onChange={(v) => updateLine(idx, "brand", v)}
                                                        />
                                                    </Grid>
                                                    <Grid size={{xs: 6, sm: 3, md: 4}}>
                                                        <TextField size="small" fullWidth label="Catalog No"
                                                            value={line.cat_no}
                                                            onChange={(e) => updateLine(idx, "cat_no", e.target.value)}
                                                        />
                                                    </Grid>
                                                    <Grid size={{xs: 6, sm: 3, md: 4}}>
                                                        <TextField size="small" type="date" fullWidth
                                                            label="Expiry Date"
                                                            value={line.expiry_date}
                                                            onChange={(e) => updateLine(idx, "expiry_date", e.target.value)}
                                                            slotProps={{ inputLabel: {shrink: true} }}
                                                        />
                                                    </Grid>
                                                </>)}
                                            </Grid>
                                            {showFifo && line._item && line.quantity && (
                                                <Box sx={{mt: 2, pt: 2, borderTop: "1px dashed", borderColor: "divider"}}>
                                                    <FifoPreview
                                                        itemId={line._item?.id}
                                                        storeId={data.store_id}
                                                        quantityBaseUnits={line._unit?.conversion_to_base
                                                            ? parseFloat(line.quantity) * parseFloat(line._unit.conversion_to_base)
                                                            : null}
                                                    />
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                        {errors.lines && (
                            <Alert severity="error" sx={{mt: 2}}>{errors.lines}</Alert>
                        )}
                    </CardContent>
                </Card>

                <Box sx={{display: "flex", gap: 2}}>
                    <Button onClick={() => router.visit(route("inventory.transactions.index"))} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="success"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16}/>}>
                        Save Transaction
                    </Button>
                </Box>
            </Box>

            <LotPickerDialog
                open={lotPickerLine !== null}
                lots={lotPickerLine !== null ? (lineItems[lotPickerLine]?._lots_from_scan ?? []) : []}
                onSelect={handleLotPicked}
                onClose={() => setLotPickerLine(null)}
            />
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Transactions", link: route("inventory.transactions.index")},
    {title: "New", link: null},
];

TransactionAdd.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default TransactionAdd;
