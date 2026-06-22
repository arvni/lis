import {
    Alert,
    Box,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';
import UnitSelect from '@/Pages/Inventory/Components/UnitSelect';
import LocationSelect from '@/Pages/Inventory/Components/LocationSelect';
import LotSelect from '@/Pages/Inventory/Components/LotSelect';
import BarcodeInput from '@/Pages/Inventory/Components/BarcodeInput';
import BrandInput from '@/Pages/Inventory/Components/BrandInput';

const LineItemsTable = ({
    lineItems,
    errors,
    storeId,
    txType,
    isEntry,
    usesExistingLots,
    showExpiry,
    onUpdate,
    onSetItem,
    onSetUnit,
    onSetLot,
    onSetLocation,
    onBarcodeFound,
    onBarcodeNotFound,
    onUnlock,
    onRemove,
}) => {
    if (lineItems.length === 0) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                Click &quot;Add Line&quot; to add items.
            </Alert>
        );
    }

    return (
        <>
            <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: 170 }}>Barcode</TableCell>
                        <TableCell sx={{ minWidth: 230 }}>Item</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>Unit</TableCell>
                        <TableCell sx={{ width: 85 }}>Qty</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Location</TableCell>
                        <TableCell sx={{ width: 110 }}>Lot #</TableCell>
                        {showExpiry && <TableCell sx={{ width: 120 }}>Brand</TableCell>}
                        {showExpiry && <TableCell sx={{ width: 100 }}>Cat No</TableCell>}
                        {showExpiry && <TableCell sx={{ width: 130 }}>Expiry</TableCell>}
                        {isEntry && <TableCell sx={{ width: 100 }}>Unit Price</TableCell>}
                        <TableCell sx={{ width: 48 }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lineItems.map((line, idx) => (
                        <TableRow
                            key={idx}
                            sx={line._barcode_locked ? { bgcolor: 'action.hover' } : {}}
                        >
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <BarcodeInput
                                        value={line.barcode}
                                        onChange={(val) => onUpdate(idx, 'barcode', val)}
                                        onFound={(d) => onBarcodeFound(idx, d)}
                                        onNotFound={(bc) => onBarcodeNotFound(idx, bc)}
                                    />
                                    {line._barcode_locked && (
                                        <IconButton
                                            size="small"
                                            title="Unlock"
                                            onClick={() => onUnlock(idx)}
                                        >
                                            <LockOpenIcon fontSize="small" color="warning" />
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <ItemSelect
                                    size="small"
                                    value={line._item}
                                    onChange={(item) => onSetItem(idx, item)}
                                    required
                                    disabled={line._barcode_locked}
                                    error={!!errors[`lines.${idx}.item_id`]}
                                />
                            </TableCell>
                            <TableCell>
                                <UnitSelect
                                    size="small"
                                    itemId={line._item?.id}
                                    allUnits={[]}
                                    value={line._unit}
                                    onChange={(u) => onSetUnit(idx, u)}
                                    required
                                    disabled={line._barcode_locked}
                                    error={!!errors[`lines.${idx}.unit_id`]}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small"
                                    type="number"
                                    fullWidth
                                    value={line.quantity}
                                    onChange={(e) => onUpdate(idx, 'quantity', e.target.value)}
                                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                                    error={!!errors[`lines.${idx}.quantity`]}
                                    autoFocus={line._barcode_locked}
                                />
                            </TableCell>
                            <TableCell>
                                <LocationSelect
                                    size="small"
                                    storeId={storeId}
                                    itemId={line._item?.id}
                                    transactionType={txType}
                                    value={line._location}
                                    onChange={(loc) => onSetLocation(idx, loc)}
                                    label="Location"
                                />
                            </TableCell>
                            <TableCell>
                                {usesExistingLots ? (
                                    <LotSelect
                                        size="small"
                                        itemId={line._item?.id}
                                        storeId={storeId}
                                        value={line._lot}
                                        onChange={(lot) => onSetLot(idx, lot)}
                                        disabled={line._barcode_locked}
                                    />
                                ) : (
                                    // Entry: lot number always editable
                                    <TextField
                                        size="small"
                                        fullWidth
                                        label="Lot #"
                                        value={line.lot_number}
                                        onChange={(e) =>
                                            onUpdate(idx, 'lot_number', e.target.value)
                                        }
                                    />
                                )}
                            </TableCell>
                            {showExpiry && (
                                <TableCell>
                                    <BrandInput
                                        value={line.brand}
                                        itemId={line._item?.id}
                                        onChange={(v) => onUpdate(idx, 'brand', v)}
                                    />
                                </TableCell>
                            )}
                            {showExpiry && (
                                <TableCell>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        label="Cat No"
                                        value={line.cat_no}
                                        onChange={(e) => onUpdate(idx, 'cat_no', e.target.value)}
                                    />
                                </TableCell>
                            )}
                            {showExpiry && (
                                <TableCell>
                                    <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        label="Expiry"
                                        value={line.expiry_date}
                                        onChange={(e) =>
                                            onUpdate(idx, 'expiry_date', e.target.value)
                                        }
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </TableCell>
                            )}
                            {isEntry && (
                                <TableCell>
                                    <TextField
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={line.unit_price}
                                        onChange={(e) =>
                                            onUpdate(idx, 'unit_price', e.target.value)
                                        }
                                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                                    />
                                </TableCell>
                            )}
                            <TableCell>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onRemove(idx)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {errors.lines && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.lines}
                </Alert>
            )}
        </>
    );
};

export default LineItemsTable;
