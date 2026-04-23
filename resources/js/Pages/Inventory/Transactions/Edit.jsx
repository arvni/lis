import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, CircularProgress,
    Grid, IconButton, MenuItem, Table, TableBody, TableCell, TableHead,
    TableRow, TextField, Alert,
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

const USES_EXISTING_LOTS = ["EXPORT", "RETURN", "EXPIRED_REMOVAL", "TRANSFER"];

const toPayloadLine = ({_item, _unit, _location, _lot, _barcode_locked, ...rest}) => rest;

// Build a line state object from an existing transaction line (loaded from server)
const lineFromExisting = (line) => ({
    _item:           line.item ?? null,
    _unit:           line.unit ?? null,
    _location:       line.location ?? null,
    _lot:            null,
    _barcode_locked: false,
    item_id:         line.item_id,
    unit_id:         line.unit_id,
    quantity:        line.quantity,
    barcode:         line.barcode ?? "",
    lot_number:      line.lot_number ?? "",
    brand:           line.brand ?? "",
    cat_no:          line.cat_no ?? "",
    expiry_date:     line.expiry_date ?? "",
    unit_price:      line.unit_price ?? "",
    store_location_id: line.store_location_id ?? null,
    notes:           line.notes ?? "",
});

const emptyLine = () => ({
    _item: null, _unit: null, _location: null, _lot: null, _barcode_locked: false,
    item_id: null, unit_id: null, quantity: "", barcode: "", lot_number: "",
    brand: "", cat_no: "", expiry_date: "", unit_price: "", store_location_id: null, notes: "",
});

const TransactionEdit = () => {
    const {transaction, transactionTypes, stores, success, status} = usePage().props;

    const {data, setData, put, processing, errors} = useForm({
        transaction_date:     transaction.transaction_date ?? "",
        store_id:             transaction.store_id ?? "",
        destination_store_id: transaction.destination_store_id ?? "",
        supplier_id:          transaction.supplier_id ?? "",
        notes:                transaction.notes ?? "",
        lines:                (transaction.lines ?? []).map(toPayloadLine.bind(null, {})) // placeholder; overwritten below
            .map(() => ({})), // will be set by lineItems sync
    });

    const [lineItems,   setLineItems]   = useState(() => (transaction.lines ?? []).map(lineFromExisting));
    const [supplierObj, setSupplierObj] = useState(transaction.supplier ?? null);

    const syncLines = (updated) => {
        setLineItems(updated);
        setData("lines", updated.map(toPayloadLine));
    };

    // Initialise form lines from loaded transaction on first render
    useState(() => {
        setData("lines", lineItems.map(toPayloadLine));
    });

    const addLine = () => syncLines([...lineItems, emptyLine()]);
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

    const handleBarcodeFound = (idx, scanData) => {
        const item = scanData.item ?? null;
        const unit = scanData.unit ?? null;
        syncLines(lineItems.map((l, i) => i === idx ? {
            ...l, _barcode_locked: true, _item: item, _unit: unit,
            item_id: item?.id ?? null, unit_id: unit?.id ?? null,
            barcode: scanData.barcode ?? l.barcode,
            lot_number: scanData.lot_number ?? "",
            brand: scanData.brand ?? "",
            expiry_date: scanData.expiry_date ?? "",
        } : l));
    };

    const handleBarcodeNotFound = (idx, barcode) => {
        syncLines(lineItems.map((l, i) => i === idx ? {...l, barcode, _barcode_locked: false} : l));
    };

    const unlockLine = (idx) => {
        syncLines(lineItems.map((l, i) => i === idx ? {...emptyLine(), barcode: l.barcode} : l));
    };

    const txType = transaction.transaction_type;
    const isTransfer = txType === "TRANSFER";
    const isEntry = ["ENTRY", "RETURN"].includes(txType);
    const usesExistingLots = USES_EXISTING_LOTS.includes(txType);
    const showExpiry = !usesExistingLots;

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("inventory.transactions.update", transaction.id));
    };

    return (
        <>
            <PageHeader title={`Edit Transaction: ${transaction.reference_number}`}/>

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2, whiteSpace: "pre-line"}}>
                    {status}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Card sx={{mb: 3}}>
                    <CardHeader title="Transaction Details"/>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth disabled label="Transaction Type" value={txType}/>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth required type="date" label="Transaction Date"
                                    value={data.transaction_date}
                                    onChange={(e) => setData("transaction_date", e.target.value)}
                                    InputLabelProps={{shrink: true}}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
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
                                <Grid item xs={12} md={4}>
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
                                <Grid item xs={12} md={4}>
                                    <SupplierSelect
                                        label="Supplier (optional)"
                                        value={supplierObj}
                                        onChange={(s) => { setSupplierObj(s); setData("supplier_id", s?.id ?? ""); }}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12}>
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
                    <CardContent sx={{p: lineItems.length ? 0 : undefined, overflowX: "auto"}}>
                        {lineItems.length === 0 ? (
                            <Alert severity="info" sx={{m: 2}}>Click "Add Line" to add items.</Alert>
                        ) : (
                            <Table size="small" sx={{minWidth: 900}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{width: 170}}>Barcode</TableCell>
                                        <TableCell sx={{minWidth: 230}}>Item</TableCell>
                                        <TableCell sx={{minWidth: 140}}>Unit</TableCell>
                                        <TableCell sx={{width: 85}}>Qty</TableCell>
                                        <TableCell sx={{minWidth: 160}}>Location</TableCell>
                                        <TableCell sx={{width: 110}}>Lot #</TableCell>
                                        {showExpiry && <TableCell sx={{width: 120}}>Brand</TableCell>}
                                        {showExpiry && <TableCell sx={{width: 100}}>Cat No</TableCell>}
                                        {showExpiry && <TableCell sx={{width: 130}}>Expiry</TableCell>}
                                        {isEntry && <TableCell sx={{width: 100}}>Unit Price</TableCell>}
                                        <TableCell sx={{width: 48}}/>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lineItems.map((line, idx) => (
                                        <TableRow key={idx} sx={line._barcode_locked ? {bgcolor: "action.hover"} : {}}>
                                            <TableCell>
                                                <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                                    <BarcodeInput
                                                        value={line.barcode}
                                                        onChange={(val) => updateLine(idx, "barcode", val)}
                                                        onFound={(d) => handleBarcodeFound(idx, d)}
                                                        onNotFound={(bc) => handleBarcodeNotFound(idx, bc)}
                                                    />
                                                    {line._barcode_locked && (
                                                        <IconButton size="small" title="Unlock" onClick={() => unlockLine(idx)}>
                                                            <LockOpenIcon fontSize="small" color="warning"/>
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <ItemSelect size="small" value={line._item}
                                                    onChange={(item) => setLineItem(idx, item)}
                                                    required disabled={line._barcode_locked}
                                                    error={!!errors[`lines.${idx}.item_id`]}/>
                                            </TableCell>
                                            <TableCell>
                                                <UnitSelect size="small" itemId={line._item?.id} allUnits={[]}
                                                    value={line._unit} onChange={(u) => setLineUnit(idx, u)}
                                                    required disabled={line._barcode_locked}
                                                    error={!!errors[`lines.${idx}.unit_id`]}/>
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" fullWidth
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                                                    inputProps={{min: 0, step: "any"}}
                                                    error={!!errors[`lines.${idx}.quantity`]}
                                                    autoFocus={line._barcode_locked}/>
                                            </TableCell>
                                            <TableCell>
                                                <LocationSelect size="small" storeId={data.store_id}
                                                    itemId={line._item?.id} transactionType={txType}
                                                    value={line._location} onChange={(loc) => setLineLocation(idx, loc)}
                                                    label="Location"/>
                                            </TableCell>
                                            <TableCell>
                                                {usesExistingLots ? (
                                                    <LotSelect size="small" itemId={line._item?.id}
                                                        storeId={data.store_id} value={line._lot}
                                                        onChange={(lot) => setLineLot(idx, lot)}
                                                        disabled={line._barcode_locked}/>
                                                ) : (
                                                    <TextField size="small" fullWidth label="Lot #"
                                                        value={line.lot_number} disabled={line._barcode_locked}
                                                        onChange={(e) => updateLine(idx, "lot_number", e.target.value)}/>
                                                )}
                                            </TableCell>
                                            {showExpiry && (
                                                <TableCell>
                                                    <BrandInput
                                                        value={line.brand}
                                                        itemId={line._item?.id}
                                                        disabled={line._barcode_locked}
                                                        onChange={(v) => updateLine(idx, "brand", v)}
                                                    />
                                                </TableCell>
                                            )}
                                            {showExpiry && (
                                                <TableCell>
                                                    <TextField size="small" fullWidth label="Cat No"
                                                        value={line.cat_no} disabled={line._barcode_locked}
                                                        onChange={(e) => updateLine(idx, "cat_no", e.target.value)}/>
                                                </TableCell>
                                            )}
                                            {showExpiry && (
                                                <TableCell>
                                                    <TextField size="small" type="date" fullWidth
                                                        label="Expiry"
                                                        value={line.expiry_date} disabled={line._barcode_locked}
                                                        onChange={(e) => updateLine(idx, "expiry_date", e.target.value)}
                                                        InputLabelProps={{shrink: true}}/>
                                                </TableCell>
                                            )}
                                            {isEntry && (
                                                <TableCell>
                                                    <TextField size="small" type="number" fullWidth
                                                        value={line.unit_price}
                                                        onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                                                        inputProps={{min: 0, step: "any"}}/>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {errors.lines && <Alert severity="error" sx={{mt: 1}}>{errors.lines}</Alert>}
                    </CardContent>
                </Card>

                <Box sx={{display: "flex", gap: 2}}>
                    <Button onClick={() => router.visit(route("inventory.transactions.show", transaction.id))} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16}/>}>
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = (tx) => [
    {title: "Inventory", link: null},
    {title: "Transactions", link: route("inventory.transactions.index")},
    {title: tx?.reference_number || "Transaction", link: route("inventory.transactions.show", tx?.id)},
    {title: "Edit", link: null},
];

TransactionEdit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.transaction)}>
        {page}
    </AuthenticatedLayout>
);

export default TransactionEdit;
